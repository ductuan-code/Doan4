"""Account administration tests in the disposable DB made by run_admin_tests.py."""
import concurrent.futures
import datetime as dt
import json
import os
import re
import subprocess
import urllib.error
import urllib.parse
import urllib.request
import uuid

BASE = os.environ['PARKING_TEST_API']
DATABASE = os.environ['PARKING_TEST_DATABASE']
assert re.fullmatch(r'ParkingAdminVerify_[a-f0-9]{12}', DATABASE), 'Use run_admin_tests.py'
assert BASE.startswith('http://127.0.0.1:')
passed = 0
PASSWORD = 'AccountTest123!'
TAG = uuid.uuid4().hex[:10]
SETTINGS = ('SET NOCOUNT ON; SET QUOTED_IDENTIFIER ON; SET ANSI_NULLS ON; SET ANSI_PADDING ON; '
            'SET ANSI_WARNINGS ON; SET ARITHABORT ON; SET CONCAT_NULL_YIELDS_NULL ON; SET NUMERIC_ROUNDABORT OFF; SET XACT_ABORT ON; ')
def sql(statement):
    result = subprocess.run([os.environ.get('PARKING_TEST_SQLCMD', 'sqlcmd'), '-S', 'localhost', '-E', '-C', '-d', DATABASE, '-b', '-h', '-1', '-W', '-Q', SETTINGS + statement], capture_output=True, text=True, timeout=30)
    assert result.returncode == 0, result.stdout + result.stderr
    return result.stdout.strip()
def check(condition, label):
    global passed
    assert condition, label
    passed += 1
def key(): return str(uuid.uuid4())
def call(method, route, body=None, token=None, k=None, status=200):
    headers = {'Content-Type': 'application/json'}
    if token: headers['Authorization'] = 'Bearer ' + token
    if k: headers['Idempotency-Key'] = k
    req = urllib.request.Request(BASE + route, method=method, headers=headers, data=None if body is None else json.dumps(body).encode())
    try:
        with urllib.request.urlopen(req, timeout=20) as r: actual, raw, hs = r.status, r.read(), r.headers
    except urllib.error.HTTPError as r: actual, raw, hs = r.code, r.read(), r.headers
    check(actual == status, (method, route, actual, status, raw.decode()[:800]))
    return json.loads(raw) if raw else None, hs
def login(email, password='123456'):
    return call('POST', '/auth/login', {'email': email, 'password': password})[0]
def payload(user, **changes):
    return {k:user.get(k) for k in ['name', 'email', 'phone', 'role', 'assignedParkingLotId', 'isActive']} | {'reason': 'Account test'} | changes
admin_auth = login('admin@parking.test')
admin, admin_id = admin_auth['token'], admin_auth['user']['id']
staff, customer = login('staff1@parking.test')['token'], login('customer1@parking.test')['token']
users = call('GET', '/admin/users', token=admin)[0]
check(all(set(u) == {'id','name','email','phone','role','assignedParkingLotId','isActive','createdAt'} for u in users), 'Credentials/internal data exposed')
original_admin = next(u for u in users if u['id'] == admin_id)
lots = call('GET', '/admin/parking-lots', token=admin)[0]
lot_a, lot_b = lots[0]['id'], lots[1]['id']
record = {'name': 'New test staff', 'email': f'users-{TAG}@parking.test', 'phone': '0901234567', 'password': PASSWORD,
          'role': 'Staff', 'assignedParkingLotId': lot_a, 'isActive': True, 'reason': 'Create fixture staff'}
for method, route, body in [('GET','/admin/users',None), ('POST','/admin/users',record), ('PUT',f'/admin/users/{admin_id}',payload(original_admin))]:
    call(method, route, body, status=401)
    for token in [staff, customer]: call(method, route, body, token, key(), 403)
for query in ['page=0', 'page=1000001', 'pageSize=201', 'role=Root', 'isActive=bad', 'query=' + 'x'*257]:
    call('GET', '/admin/users?' + query, token=admin, status=400)
call('POST', '/admin/users', record, admin, status=400)
call('POST', '/admin/users', record, admin, 'bad key', 400)
for change in [{'role':'Root'}, {'assignedParkingLotId':None}, {'assignedParkingLotId':0}, {'role':'Admin'}, {'isActive':None},
               {'email':'not-email'}, {'password':'short'}, {'password':'x'*129}, {'phone':'bad-phone'}, {'reason':' '}, {'name':' '}, {'passwordHash':'client-hash'}]:
    call('POST', '/admin/users', record | change, admin, key(), 400)
for field in ['password', 'isActive', 'role', 'name']:
    call('POST', '/admin/users', {k:v for k,v in record.items() if k != field}, admin, key(), 400)
call('POST', '/admin/users', record | {'assignedParkingLotId':2147483647}, admin, key(), 409)

# A lone active admin cannot lock or demote itself, including concurrent attempts.
admin_target = f'/admin/users/{admin_id}'
call('PUT', admin_target, payload(original_admin, isActive=False), admin, key(), 409)
call('PUT', admin_target, payload(original_admin, role='Customer'), admin, key(), 409)
call('PUT', admin_target, payload(original_admin) | {'password': 'NotSupported123'}, admin, key(), 400)

# Independent password hashes on concurrent requests must still yield one account.
request_key = key()
with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:
    results = list(pool.map(lambda _: call('POST', '/admin/users', record, admin, request_key, 201), range(2)))
created = results[0][0]
uid = created['id']
check(results[0][0] == results[1][0] and any(r[1].get('Idempotency-Replayed') == 'true' for r in results), 'Concurrent create did not replay')
for change in [{'password':'DifferentPassword123!'}, {'reason':'Changed reason'}, {'name':'Changed name'}, {'assignedParkingLotId':lot_b}]:
    call('POST', '/admin/users', record | change, admin, request_key, 409)
call('POST', '/admin/users', record, admin, key(), 409)
check(sql(f"SELECT COUNT(*) FROM dbo.Users WHERE normalized_email=N'{record['email']}'") == '1', 'Duplicate account')
check(sql(f"SELECT COUNT(*) FROM dbo.AuditLog WHERE request_id='{request_key}' AND action='USER_ROLE_ASSIGNMENT_SAVED' AND reason=N'Create fixture staff'") == '1', 'Audit missing/duplicated')
check(sql(f"SELECT COUNT(*) FROM dbo.Users WHERE id={uid} AND password_hash NOT LIKE '%{PASSWORD}%' AND LEN(password_hash)>50") == '1', 'Password not hashed')
check(sql(f"SELECT COUNT(*) FROM dbo.AuditLog WHERE request_id='{request_key}' AND (details_json LIKE '%password%' OR details_json LIKE '%{PASSWORD}%')") == '0', 'Credential in audit')
new_auth = login(record['email'], PASSWORD)
new_token = new_auth['token']
check(new_auth['user']['role'] == 'Staff' and new_auth['user']['assignedParkingLotId'] == lot_a, 'Cannot login created staff')
me = call('GET', '/auth/me', token=new_token)[0]
updated = payload(me, name='Updated account', phone='0912345678', assignedParkingLotId=lot_b)
uk = key()
call('PUT', f'/admin/users/{uid}', updated, admin, uk)
_, headers = call('PUT', f'/admin/users/{uid}', updated, admin, uk)
check(headers.get('Idempotency-Replayed') == 'true', 'Update replay missing')
me = call('GET', '/auth/me', token=new_token)[0]
check(me['assignedParkingLotId'] == lot_b and me['name'] == updated['name'], 'Existing JWT retained old assignment')
ops = call('GET', '/staff/operations', token=new_token)[0]
check(ops and all(s['parkingLotName'] == lots[1]['name'] for s in ops), 'Reassigned staff still sees old lot')
call('PUT', f'/admin/users/{uid}', updated | {'isActive':False}, admin, key())
call('GET', '/auth/me', token=new_token, status=401)
call('GET', '/staff/operations', token=new_token, status=401)
call('POST', '/auth/login', {'email': record['email'], 'password': PASSWORD}, status=403)
call('PUT', f'/admin/users/{uid}', updated, admin, key())
call('GET', '/staff/operations', token=new_token)
demoted = updated | {'role':'Customer', 'assignedParkingLotId':None}
call('PUT', f'/admin/users/{uid}', demoted, admin, key())
call('GET', '/staff/operations', token=new_token, status=403)
check(call('GET', '/auth/me', token=new_token)[0]['role'] == 'Customer', 'Existing JWT kept old role')

query = urllib.parse.urlencode({'query':record['email'], 'role':'Customer', 'isActive':'true'})
found = call('GET', '/admin/users?' + query, token=admin)[0]
check(len(found) == 1 and found[0]['id'] == uid and found[0]['phone'] == updated['phone'], 'Combined filters/persistence failed')
check(call('GET', '/admin/users?query=%25', token=admin)[0] == [], 'Search treated percent as wildcard')
check(len(call('GET', '/admin/users?page=1&pageSize=1', token=admin)[0]) == 1, 'Pagination failed')
check(call('GET', '/admin/users?page=1000000', token=admin)[0] == [], 'Empty page failed')
call('PUT', '/admin/users/2147483647', demoted, admin, key(), 404)
forbidden_lot = call('POST', '/admin/parking-lots', {'name':'Inactive assignment', 'address':'Test', 'isActive':False, 'reason':'Assignment test'}, admin, key(), 201)[0]['id']
call('PUT', f'/admin/users/{uid}', updated | {'assignedParkingLotId':forbidden_lot}, admin, key(), 409)
temporary_lot = call('POST', '/admin/parking-lots', {'name':'Staff closure','address':'Test','isActive':True,'reason':'Closure test'}, admin, key(), 201)[0]['id']
temporary_assignment = updated | {'assignedParkingLotId':temporary_lot}
call('PUT', f'/admin/users/{uid}', temporary_assignment, admin, key())
call('PUT', f'/admin/parking-lots/{temporary_lot}', {'name':'Staff closure','address':'Test','isActive':False,'reason':'Close lot'}, admin, key())
call('PUT', f'/admin/users/{uid}', temporary_assignment | {'isActive':False}, admin, key())
call('PUT', f'/admin/users/{uid}', temporary_assignment, admin, key(), 409)
call('PUT', f'/admin/users/{uid}', updated, admin, key())

# Use a fresh lot so this suite can also run after the parking suite's open sessions.
business_lot = call('POST', '/admin/parking-lots', {'name':'Account workflow', 'address':'Test', 'isActive':True, 'reason':'Workflow test'}, admin, key(), 201)[0]['id']
z = call('POST', '/admin/zones', {'parkingLotId':business_lot,'name':'Cars','vehicleType':'CAR','isActive':True,'reason':'Workflow test'}, admin, key(), 201)[0]['id']
s = call('POST', '/admin/slots', {'zoneId':z,'code':'U_R1','acceptsReservations':True,'isActive':True,'reason':'Workflow test'}, admin, key(), 201)[0]['id']
call('PUT', f'/admin/users/{uid}', updated | {'assignedParkingLotId':business_lot}, admin, key())
customer_record = record | {'name':'Fixture customer','email':f'users-customer-{TAG}@parking.test','role':'Customer','assignedParkingLotId':None}
customer_id = call('POST','/admin/users',customer_record,admin,key(),201)[0]['id']
customer_auth = login(customer_record['email'], PASSWORD)
customer_token = customer_auth['token']
v = call('POST','/vehicles',{'plateNumber':f'UA{TAG.upper()}','vehicleType':'CAR'},customer_token,key(),201)[0]['id']
start = dt.datetime.now(dt.timezone.utc).replace(microsecond=0) + dt.timedelta(minutes=5)
r = call('POST','/reservations',{'vehicleId':v,'slotId':s,'startTime':start.isoformat(),'endTime':(start+dt.timedelta(hours=1)).isoformat()},customer_token,key(),201)[0]
customer_edit = payload(customer_auth['user'])
call('PUT',f'/admin/users/{customer_id}',customer_edit | {'role':'Admin'},admin,key(),409)
session = call('POST','/sessions/checkin',{'slotId':s,'reservationCode':r['reservationCode']},new_token,key(),201)[0]
call('PUT',f'/admin/users/{customer_id}',customer_edit | {'role':'Admin'},admin,key(),409)
call('PUT',f'/admin/users/{customer_id}',customer_edit | {'isActive':False},admin,key())
check(sql(f"SELECT status FROM dbo.ParkingSession WHERE id={session['id']}") == 'OPEN', 'Lock changed open session')
fee = call('GET',f"/sessions/{session['id']}/fee",token=new_token)[0]
call('POST',f"/sessions/{session['id']}/checkout",{'paymentMethod':'CASH','confirmedAmount':fee['amount']},new_token,key())
call('PUT',f'/admin/users/{customer_id}',customer_edit,admin,key())
check(call('GET',f"/sessions/{session['id']}",token=customer_token)[0]['paymentId'] is not None, 'Customer history lost after lock')
call('PUT',f'/admin/users/{customer_id}',customer_edit | {'role':'Staff','assignedParkingLotId':business_lot},admin,key())
call('GET','/vehicles',token=customer_token,status=403)
check(call('GET','/auth/me',token=customer_token)[0]['role'] == 'Staff', 'Customer JWT retained role')

# Concurrent demotions must preserve one active admin under the SQL business lock.
second_record = record | {'name':'Second admin','email':f'users-admin-{TAG}@parking.test','role':'Admin','assignedParkingLotId':None}
second_id = call('POST','/admin/users',second_record,admin,key(),201)[0]['id']
second_token = login(second_record['email'], PASSWORD)['token']
with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:
    actions = [lambda: call('PUT',admin_target,payload(original_admin,isActive=False),admin,key()),
               lambda: call('PUT',f'/admin/users/{second_id}',payload(second_record,isActive=False),admin,key())]
    # Return statuses without assuming which request gets the global lock first.
    def attempt(action):
        try: return action()
        except AssertionError as e:
            # The losing request is either rejected by SQL or denied after its actor was locked.
            detail = e.args[0]
            assert isinstance(detail, tuple) and detail[2] in [401,403,409], e
            return None
    list(pool.map(attempt, actions))
check(sql("SELECT COUNT(*) FROM dbo.Users WHERE role='Admin' AND is_active=1") == '1', 'Concurrent writes removed every active admin')
# Restore original admin using the surviving admin, keeping browser fixtures usable.
surviving_token = admin if sql(f'SELECT is_active FROM dbo.Users WHERE id={admin_id}') == '1' else second_token
call('PUT',admin_target,payload(original_admin),surviving_token,key())
call('PUT',f'/admin/users/{second_id}',payload(second_record,isActive=False),admin,key())

# A principal in parking_backend can list through the procedure but not read Users directly.
sql(f"CREATE USER users_verify_role WITHOUT LOGIN; ALTER ROLE parking_backend ADD MEMBER users_verify_role; EXECUTE AS USER='users_verify_role'; EXEC dbo.usp_AdminListUsers @ActorId={admin_id},@PageSize=1; REVERT;")
check(sql("EXECUTE AS USER='users_verify_role'; SELECT HAS_PERMS_BY_NAME('dbo.Users','OBJECT','SELECT'); REVERT;") == '0', 'Backend role unexpectedly reads credentials')
print(f'PASS {passed} user API/data checks', flush=True)
