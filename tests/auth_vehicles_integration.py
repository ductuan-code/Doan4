"""HTTP + SQL integration checks. API must run locally against ParkingLotOnline.
Creates uniquely tagged test accounts and removes only those accounts in finally.
Usage: python tests/auth_vehicles_integration.py
"""
import json
import subprocess
import uuid
import urllib.error
import urllib.request

BASE = 'http://localhost:5143/api'
TAG = uuid.uuid4().hex[:12]
PASSWORD = 'ParkingTest123!'
emails = [f'api-check-{TAG}-{n}@parking.test' for n in (1, 2)]
account_ids = []
passed = 0

def sql(statement):
    result = subprocess.run(['sqlcmd', '-S', 'localhost', '-E', '-C', '-d', 'ParkingLotOnline',
                             '-b', '-l', '5', '-Q', 'SET NOCOUNT ON; ' + statement],
                            capture_output=True, text=True, timeout=30)
    if result.returncode:
        raise AssertionError('SQL fixture operation failed: ' + result.stdout + result.stderr)

def check(condition, label):
    global passed
    assert condition, label
    passed += 1

def call(method, route, body=None, token=None, key=None, expected=200):
    headers = {'Content-Type': 'application/json'}
    if token: headers['Authorization'] = 'Bearer ' + token
    if key: headers['Idempotency-Key'] = key
    request = urllib.request.Request(BASE + route, method=method, headers=headers,
                                    data=None if body is None else json.dumps(body).encode())
    try:
        with urllib.request.urlopen(request, timeout=30) as response:
            status, raw, response_headers = response.status, response.read(), response.headers
    except urllib.error.HTTPError as response:
        status, raw, response_headers = response.code, response.read(), response.headers
    assert status == expected, (method, route, status, expected, raw.decode()[:700])
    parsed = json.loads(raw) if raw else None
    check('passwordHash' not in (raw.decode() if route != '/auth/login' else json.dumps(parsed.get('user', {}))), 'Password hash leaked')
    return parsed, response_headers

def login(email, password='123456'):
    result, _ = call('POST', '/auth/login', {'email': email, 'password': password})
    check(result['user']['isActive'], 'Inactive account logged in')
    return result['token']

try:
    health, _ = call('GET', '/health')
    check(health['status'] == 'ready', 'Health did not check database')
    call('GET', '/auth/me', expected=401)
    call('POST', '/auth/login', {'email': 'customer1@parking.test', 'password': 'wrong'}, expected=401)
    call('POST', '/auth/login', {'email': 'not-an-email', 'password': 'wrong'}, expected=400)
    customer = login('CUSTOMER1@PARKING.TEST')
    me, _ = call('GET', '/auth/me', token=customer)
    check(me['email'] == 'customer1@parking.test' and me['role'] == 'Customer', 'Wrong normalized account')
    vehicles, _ = call('GET', '/vehicles', token=customer)
    check(len(vehicles) == 2 and all(v['userId'] == me['id'] for v in vehicles), 'Wrong customer vehicles')
    staff = login('staff1@parking.test')
    admin = login('admin@parking.test')
    call('GET', '/vehicles', token=staff, expected=403)
    call('GET', '/vehicles', token=admin, expected=403)
    call('GET', '/auth/me', token=customer[:-8] + 'tampered', expected=401)
    call('POST', '/auth/register', {'name': 'test', 'email': emails[0], 'password': PASSWORD, 'role': 'Admin'}, expected=400)
    for email in emails:
        result, _ = call('POST', '/auth/register', {'name': 'API verification', 'email': email,
                                                  'password': PASSWORD, 'phone': '0900000010'}, expected=201)
        check(result['role'] == 'Customer', 'Registration selected elevated role')
        account_ids.append(int(result['id']))
    call('POST', '/auth/register', {'name': 'test', 'email': emails[0], 'password': PASSWORD}, expected=409)
    first, second = (login(e, PASSWORD) for e in emails)
    rows, _ = call('GET', '/vehicles', token=first)
    check(rows == [], 'New account has unrelated vehicles')
    data = {'plateNumber': 'API-' + TAG.upper(), 'vehicleType': 'CAR', 'isActive': True}
    key = str(uuid.uuid4())
    call('POST', '/vehicles', data, first, expected=400)
    call('POST', '/vehicles', {**data, 'plateNumber': 'Đ/123'}, first, str(uuid.uuid4()), expected=400)
    created, _ = call('POST', '/vehicles', data, first, key, expected=201)
    vehicle_id = created['id']
    replay, headers = call('POST', '/vehicles', data, first, key, expected=201)
    check(replay == created and headers.get('Idempotency-Replayed') == 'true', 'Replay changed result')
    call('POST', '/vehicles', {**data, 'plateNumber': 'OTHER-' + TAG.upper()}, first, key, expected=409)
    call('POST', '/vehicles', data, second, str(uuid.uuid4()), expected=409)
    call('PATCH', f'/vehicles/{vehicle_id}', data, second, str(uuid.uuid4()), expected=404)
    call('PATCH', f'/vehicles/{vehicle_id}', data, staff, str(uuid.uuid4()), expected=403)
    updated = {**data, 'plateNumber': 'EDIT-' + TAG.upper()}
    call('PATCH', f'/vehicles/{vehicle_id}', updated, first, str(uuid.uuid4()))
    rows, _ = call('GET', '/vehicles', token=first)
    check(len(rows) == 1 and rows[0]['normalizedPlateNumber'] == 'EDIT' + TAG.upper(), 'Update not persisted')
    call('PATCH', f'/vehicles/{vehicle_id}', {**updated, 'isActive': False}, first, str(uuid.uuid4()))
    rows, _ = call('GET', '/vehicles', token=first)
    check(len(rows) == 1 and rows[0]['isActive'] is False, 'Soft deactivation deleted history')
    sql(f"UPDATE dbo.Users SET role='Staff',assigned_parking_lot_id=(SELECT MIN(id) FROM dbo.ParkingLot) WHERE id={account_ids[0]};")
    call('GET', '/vehicles', token=first, expected=403)
    fresh, _ = call('GET', '/auth/me', token=first)
    check(fresh['role'] == 'Staff', 'JWT retained stale role')
    sql(f"UPDATE dbo.Users SET role='Customer',assigned_parking_lot_id=NULL,is_active=0 WHERE id={account_ids[0]};")
    call('GET', '/auth/me', token=first, expected=401)
    call('POST', '/auth/login', {'email': emails[0], 'password': PASSWORD}, expected=403)
    print(f'PASS: {passed} HTTP/status/data checks (registration, login, scope, replay, persistence, role change, account lock).')
finally:
    if account_ids:
        ids = ','.join(str(i) for i in account_ids)
        owned_emails = ','.join("N'" + email + "'" for email in emails)
        sql(f"""
SET QUOTED_IDENTIFIER ON; SET ANSI_NULLS ON; SET ANSI_PADDING ON; SET ANSI_WARNINGS ON;
SET ARITHABORT ON; SET CONCAT_NULL_YIELDS_NULL ON; SET NUMERIC_ROUNDABORT OFF; SET XACT_ABORT ON;
IF (SELECT COUNT(*) FROM dbo.Users WHERE id IN ({ids}) AND normalized_email IN ({owned_emails})) <> {len(account_ids)}
    THROW 51999, 'Test identity mismatch; refusing cleanup.', 1;
BEGIN TRANSACTION;
DELETE dbo.RequestRecord WHERE actor_user_id IN ({ids});
DELETE dbo.AuditLog WHERE actor_user_id IN ({ids});
DELETE dbo.Vehicle WHERE user_id IN ({ids});
DELETE dbo.Users WHERE id IN ({ids}) AND normalized_email IN ({owned_emails});
COMMIT;
""")
        print('Removed only uniquely tagged verification accounts and their vehicles.')
