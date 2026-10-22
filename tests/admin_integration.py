"""Admin HTTP/SQL checks. Refuse to run against the application's database."""
import concurrent.futures
import datetime as dt
import json
import os
import re
import subprocess
import urllib.error
import urllib.request
import uuid

BASE = os.environ['PARKING_TEST_API']
DATABASE = os.environ['PARKING_TEST_DATABASE']
assert re.fullmatch(r'ParkingAdminVerify_[a-f0-9]{12}', DATABASE), 'Use run_admin_tests.py'
assert BASE.startswith('http://127.0.0.1:')
passed = 0
SETTINGS = ('SET NOCOUNT ON; SET QUOTED_IDENTIFIER ON; SET ANSI_NULLS ON; SET ANSI_PADDING ON; '
            'SET ANSI_WARNINGS ON; SET ARITHABORT ON; SET CONCAT_NULL_YIELDS_NULL ON; SET NUMERIC_ROUNDABORT OFF; SET XACT_ABORT ON; ')
def sql(statement):
    r = subprocess.run([os.environ.get('PARKING_TEST_SQLCMD', 'sqlcmd'), '-S', 'localhost', '-E', '-C', '-d', DATABASE, '-b', '-h', '-1', '-W', '-Q', SETTINGS + statement], capture_output=True, text=True, timeout=30)
    assert r.returncode == 0, r.stdout + r.stderr
    return r.stdout.strip()
def check(condition, label):
    global passed
    assert condition, label
    passed += 1
def key(): return str(uuid.uuid4())
def call(method, route, body=None, token=None, request_key=None, expected=200):
    headers = {'Content-Type': 'application/json'}
    if token: headers['Authorization'] = 'Bearer ' + token
    if request_key: headers['Idempotency-Key'] = request_key
    request = urllib.request.Request(BASE + route, method=method, headers=headers, data=None if body is None else json.dumps(body).encode())
    try:
        with urllib.request.urlopen(request, timeout=20) as r: status, raw, response_headers = r.status, r.read(), r.headers
    except urllib.error.HTTPError as r: status, raw, response_headers = r.code, r.read(), r.headers
    check(status == expected, (method, route, status, expected, raw.decode()[:800]))
    return json.loads(raw) if raw else None, response_headers
def login(email): return call('POST', '/auth/login', {'email': email, 'password': '123456'})[0]['token']
admin, staff, customer = [login(e) for e in ['admin@parking.test', 'staff1@parking.test', 'customer1@parking.test']]
lots = call('GET', '/admin/parking-lots', token=admin)[0]
lot_a, lot_b = lots[0]['id'], lots[1]['id']
zones = call('GET', f'/admin/parking-lots/{lot_a}/zones', token=admin)[0]
zone = next(z for z in zones if z['vehicleType'] == 'CAR')
slots = call('GET', f"/admin/zones/{zone['id']}/slots", token=admin)[0]
reserved = next(s for s in slots if s['acceptsReservations'])
walks = [s for s in slots if not s['acceptsReservations']]

lot_data = {'name': 'Admin API fixture', 'address': 'Test address', 'isActive': True, 'reason': 'Create fixture'}
for method, route, data in [('GET', '/admin/parking-lots', None), ('GET', f'/admin/parking-lots/{lot_a}/zones', None), ('GET', f"/admin/zones/{zone['id']}/slots", None), ('GET', '/admin/pricing', None), ('POST', '/admin/parking-lots', lot_data), ('PUT', f'/admin/parking-lots/{lot_a}', lot_data), ('POST', '/admin/zones', {}), ('PUT', f"/admin/zones/{zone['id']}", {}), ('POST', '/admin/slots', {}), ('PUT', f"/admin/slots/{reserved['id']}", {}), ('PUT', f"/admin/slots/{reserved['id']}/maintenance", {}), ('PUT', '/admin/pricing/CAR', {'pricePerHour': 1, 'reason': 'Unauthorized'})]:
    call(method, route, data, expected=401)
    for token in [staff, customer]: call(method, route, data, token, key(), 403)
call('POST', '/admin/parking-lots', lot_data, admin, expected=400)
for invalid in [{**lot_data, 'reason': ' '}, {**lot_data, 'isActive': None}, {k:v for k,v in lot_data.items() if k != 'isActive'}, {**lot_data, 'extra': 1}, {**lot_data, 'name': 'x' * 151}]:
    call('POST', '/admin/parking-lots', invalid, admin, key(), 400)

k = key()
with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:
    results = list(pool.map(lambda _: call('POST', '/admin/parking-lots', lot_data, admin, k, 201), range(2)))
new_lot = results[0][0]['id']
check(results[0][0] == results[1][0] and any(r[1].get('Idempotency-Replayed') == 'true' for r in results), 'Duplicate concurrent lot')
call('POST', '/admin/parking-lots', {**lot_data, 'name': 'Changed'}, admin, k, 409)
check(sql(f"SELECT COUNT(*) FROM dbo.AuditLog WHERE action='PARKING_CONFIG_SAVED' AND request_id='{k}' AND reason=N'Create fixture'") == '1', 'Audit duplicated/missing reason')
lot_data.update(name='Admin API updated', address='Updated address')
call('PUT', f'/admin/parking-lots/{new_lot}', lot_data, admin, key())
check(any(l['name'] == lot_data['name'] and l['address'] == lot_data['address'] for l in call('GET', '/admin/parking-lots', token=admin)[0]), 'Lot not persisted')
zone_data = {'parkingLotId': new_lot, 'name': 'API zone', 'floorLabel': 'B1', 'vehicleType': 'CAR', 'isActive': True, 'reason': 'Create zone'}
new_zone = call('POST', '/admin/zones', zone_data, admin, key(), 201)[0]['id']
call('POST', '/admin/zones', zone_data, admin, key(), 409)
call('PUT', f'/admin/zones/{new_zone}', {**zone_data, 'parkingLotId': lot_b}, admin, key(), 409)
zone_data['floorLabel'] = 'B2'
call('PUT', f'/admin/zones/{new_zone}', zone_data, admin, key())
check(call('GET', f'/admin/parking-lots/{new_lot}/zones', token=admin)[0][0]['floorLabel'] == 'B2', 'Zone not persisted')
slot_data = {'zoneId': new_zone, 'code': 'API_1', 'acceptsReservations': False, 'isActive': True, 'reason': 'Create slot'}
new_slot = call('POST', '/admin/slots', slot_data, admin, key(), 201)[0]['id']
call('POST', '/admin/slots', slot_data, admin, key(), 409)
call('POST', '/admin/slots', {**slot_data, 'code': 'Sai mã'}, admin, key(), 400)
call('PUT', f'/admin/slots/{new_slot}', {**slot_data, 'zoneId': zone['id']}, admin, key(), 409)
call('PUT', f'/admin/slots/{new_slot}', {**slot_data, 'operationalStatus': 'AVAILABLE'}, admin, key(), 400)
call('PUT', f'/admin/slots/{new_slot}', {**slot_data, 'isActive': False}, admin, key())
check(not call('GET', f'/admin/zones/{new_zone}/slots', token=admin)[0][0]['isActive'], 'Inactive slot hidden from admin')
call('PUT', f'/admin/slots/{new_slot}', slot_data, admin, key())
call('PUT', f'/admin/parking-lots/{new_lot}', {**lot_data, 'isActive': False}, admin, key())
check(new_lot not in [l['id'] for l in call('GET', '/parking-lots', token=customer)[0]], 'Inactive lot public')
call('PUT', f'/admin/zones/{new_zone}', zone_data, admin, key(), 409)
call('PUT', f'/admin/parking-lots/{new_lot}', lot_data, admin, key())
call('PUT', f'/admin/zones/{new_zone}', {**zone_data, 'isActive': False}, admin, key())
call('PUT', f'/admin/slots/{new_slot}', slot_data, admin, key(), 409)
call('PUT', f'/admin/zones/{new_zone}', zone_data, admin, key())
for route in ['/admin/parking-lots/2147483647/zones', '/admin/zones/2147483647/slots']:
    call('GET', route, token=admin, expected=404)
for query in ['page=0', 'pageSize=201', 'page=1000001']:
    call('GET', '/admin/pricing?' + query, token=admin, expected=400)

vehicle = next(v for v in call('GET', '/vehicles', token=customer)[0] if v['vehicleType'] == 'CAR')
start = dt.datetime.now(dt.timezone.utc).replace(microsecond=0) + dt.timedelta(minutes=5)
window = {'vehicleId': vehicle['id'], 'slotId': reserved['id'], 'startTime': start.isoformat(), 'endTime': (start + dt.timedelta(hours=1)).isoformat()}
reservation = call('POST', '/reservations', window, customer, key(), 201)[0]
current_lot = next(l for l in lots if l['id'] == lot_a)
live_lot_data = {k:current_lot[k] for k in ['name', 'address', 'isActive']} | {'reason': 'Blocked test'}
live_zone_data = {k:zone[k] for k in ['parkingLotId', 'name', 'floorLabel', 'vehicleType', 'isActive']} | {'reason': 'Blocked test'}
live_slot_data = {k:reserved[k] for k in ['zoneId', 'code', 'acceptsReservations', 'isActive']} | {'reason': 'Blocked test'}
for route, data in [(f'/admin/parking-lots/{lot_a}', {**live_lot_data, 'isActive': False}), (f"/admin/zones/{zone['id']}", {**live_zone_data, 'isActive': False}), (f"/admin/slots/{reserved['id']}", {**live_slot_data, 'isActive': False}), (f"/admin/zones/{zone['id']}", {**live_zone_data, 'vehicleType': 'MOTORBIKE'}), (f"/admin/slots/{reserved['id']}", {**live_slot_data, 'acceptsReservations': False})]:
    call('PUT', route, data, admin, key(), 409)
maintenance = {'isMaintenance': True, 'reason': 'Repair lighting'}
mk = key()
call('PUT', f"/admin/slots/{reserved['id']}/maintenance", maintenance, admin, mk)
replay, headers = call('PUT', f"/admin/slots/{reserved['id']}/maintenance", maintenance, admin, mk)
check(headers.get('Idempotency-Replayed') == 'true', 'Maintenance replay failed')
check(sql(f"SELECT status FROM dbo.Reservation WHERE id={reservation['id']}") == 'CONFIRMED', 'Maintenance destroyed reservation')
query = f"?vehicleId={vehicle['id']}&startTime={start.isoformat().replace('+', '%2B')}&endTime={(start+dt.timedelta(hours=1)).isoformat().replace('+', '%2B')}"
available = call('GET', f'/parking-lots/{lot_a}/availability' + query, token=customer)[0]
check(reserved['id'] not in [s['id'] for s in available], 'Maintenance slot available')
call('POST', '/sessions/checkin', {'slotId': reserved['id'], 'reservationCode': reservation['reservationCode']}, staff, key(), 409)
call('PUT', f"/admin/slots/{reserved['id']}/maintenance", {**maintenance, 'isMaintenance': False}, admin, key())
call('POST', f"/reservations/{reservation['id']}/cancel", token=customer, request_key=key())

old_prices = call('GET', '/admin/pricing', token=admin)[0]
old_price = next(p for p in old_prices if p['vehicleType'] == 'CAR')
old_session = call('POST', '/sessions/checkin', {'slotId': walks[0]['id'], 'plateNumber': 'ADMINTEST01', 'vehicleType': 'CAR'}, staff, key(), 201)[0]
call('PUT', f"/admin/slots/{walks[0]['id']}/maintenance", maintenance, admin, key(), 409)
call('PUT', f'/admin/parking-lots/{lot_a}', {**live_lot_data, 'isActive': False}, admin, key(), 409)
for invalid in [0, -1, 1.5, 1000000001, None]:
    call('PUT', '/admin/pricing/CAR', {'pricePerHour': invalid, 'reason': 'Invalid rate'}, admin, key(), 400)
call('PUT', '/admin/pricing/CAR', {'pricePerHour': 25000, 'reason': ' '}, admin, key(), 400)
pk = key()
price_data = {'pricePerHour': 25000, 'reason': 'Test new price'}
new_price = call('PUT', '/admin/pricing/CAR', price_data, admin, pk)[0]
repeat, headers = call('PUT', '/admin/pricing/CAR', price_data, admin, pk)
check(repeat == new_price and headers.get('Idempotency-Replayed') == 'true', 'Price replay incorrect')
call('PUT', '/admin/pricing/CAR', {**price_data, 'pricePerHour': 30000}, admin, pk, 409)
history = call('GET', '/admin/pricing?includeHistory=true', token=admin)[0]
check(sum(p['vehicleType'] == 'CAR' and p['isActive'] for p in history) == 1, 'Multiple active prices')
check(any(p['id'] == old_price['id'] and not p['isActive'] for p in history), 'Old price removed')
check(sql(f"SELECT COUNT(*) FROM dbo.AuditLog WHERE action='PRICE_CHANGED' AND request_id='{pk}' AND reason=N'Test new price'") == '1', 'Price audit missing/duplicated')
old_fee = call('GET', f"/sessions/{old_session['id']}/fee", token=staff)[0]
check(old_fee['appliedPricePerHour'] == old_price['pricePerHour'], 'Open session price changed')
new_session = call('POST', '/sessions/checkin', {'slotId': walks[1]['id'], 'plateNumber': 'ADMINTEST02', 'vehicleType': 'CAR'}, staff, key(), 201)[0]
check(new_session['appliedPricePerHour'] == 25000, 'New session ignored active price')
paid = call('POST', f"/sessions/{old_session['id']}/checkout", {'paymentMethod': 'CASH', 'confirmedAmount': old_fee['amount']}, staff, key())[0]
check(paid['amount'] == old_fee['amount'], 'Payment failed old-price snapshot')
buffer_before = sql(f"SELECT CONVERT(varchar(40),buffer_until,126) FROM dbo.ParkingSlot WHERE id={walks[0]['id']}")
for flag in [True, False]:
    call('PUT', f"/admin/slots/{walks[0]['id']}/maintenance", {**maintenance, 'isMaintenance': flag}, admin, key())
check(sql(f"SELECT CONVERT(varchar(40),buffer_until,126) FROM dbo.ParkingSlot WHERE id={walks[0]['id']}") == buffer_before, 'Maintenance erased checkout buffer')
call('POST', '/sessions/checkin', {'slotId': walks[0]['id'], 'plateNumber': 'ADMINTEST03', 'vehicleType': 'CAR'}, staff, key(), 409)
print(f'PASS {passed} admin API/data checks', flush=True)
