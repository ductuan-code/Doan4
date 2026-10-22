"""Real HTTP/SQL reservation checks; uses a separate tagged lot and accounts.
Run with the API on localhost:5143. Cleanup refuses identities it does not own.
"""
import concurrent.futures
import datetime as dt
import json
import subprocess
import threading
import time
import urllib.error
import urllib.parse
import urllib.request
import uuid

BASE = 'http://localhost:5143/api'
TAG = uuid.uuid4().hex[:10]
LOT = 'reservation-check-' + TAG
PASSWORD = 'ReservationTest123!'
accounts = []
passed = 0
SETTINGS = ('SET NOCOUNT ON; SET QUOTED_IDENTIFIER ON; SET ANSI_NULLS ON; SET ANSI_PADDING ON; '
            'SET ANSI_WARNINGS ON; SET ARITHABORT ON; SET CONCAT_NULL_YIELDS_NULL ON; '
            'SET NUMERIC_ROUNDABORT OFF; SET XACT_ABORT ON; ')

def sql(statement):
    result = subprocess.run(['sqlcmd', '-S', 'localhost', '-E', '-C', '-d', 'ParkingLotOnline',
                             '-b', '-l', '5', '-h', '-1', '-W', '-Q', SETTINGS + statement],
                            capture_output=True, text=True, timeout=30)
    assert result.returncode == 0, result.stdout + result.stderr
    return result.stdout.strip()

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
    if expected is not None: check(status == expected, (method, route, status, expected, raw.decode()[:500]))
    return status, json.loads(raw) if raw else None, response_headers

def uid(): return str(uuid.uuid4())
def stamp(value): return value.isoformat(timespec='seconds')
def parallel(actions):
    barrier = threading.Barrier(len(actions))
    def run(action):
        barrier.wait(timeout=10)
        return action()
    with concurrent.futures.ThreadPoolExecutor(max_workers=len(actions)) as pool:
        return list(pool.map(run, actions))

try:
    sql(f"""BEGIN TRANSACTION;
INSERT dbo.ParkingLot(name,address) VALUES(N'{LOT}',N'Test fixture');
DECLARE @lot int=SCOPE_IDENTITY();
INSERT dbo.Zone(parking_lot_id,name,vehicle_type) VALUES(@lot,N'Test cars','CAR');
DECLARE @zone int=SCOPE_IDENTITY();
INSERT dbo.ParkingSlot(zone_id,code,accepts_reservations) VALUES(@zone,'R1',1),(@zone,'R2',1),(@zone,'W1',0);
COMMIT;""")
    for n in range(2):
        email = f'reservation-check-{TAG}-{n}@parking.test'
        _, user, _ = call('POST', '/auth/register', {'name': 'Reservation test', 'email': email, 'password': PASSWORD}, expected=201)
        accounts.append(user['id'])
    tokens, vehicles = [], []
    for n, account in enumerate(accounts):
        _, auth, _ = call('POST', '/auth/login', {'email': f'reservation-check-{TAG}-{n}@parking.test', 'password': PASSWORD})
        tokens.append(auth['token'])
        _, vehicle, _ = call('POST', '/vehicles', {'plateNumber': f'RS{TAG.upper()}{n}', 'vehicleType': 'CAR'}, tokens[n], uid(), 201)
        vehicles.append(vehicle['id'])
    _, lots, _ = call('GET', '/parking-lots', token=tokens[0])
    lot = next(l['id'] for l in lots if l['name'] == LOT)
    start = dt.datetime.now(dt.timezone.utc).replace(microsecond=0) + dt.timedelta(hours=2)
    window = {'vehicleId': vehicles[0], 'startTime': stamp(start), 'endTime': stamp(start + dt.timedelta(hours=1))}
    def availability(data=window, token=tokens[0], expected=200):
        return call('GET', f'/parking-lots/{lot}/availability?' + urllib.parse.urlencode(data), token=token, expected=expected)[1]
    slots = availability()
    check(len(slots) == 2 and all(s['vehicleType'] == 'CAR' for s in slots), 'Walk-in slot offered for reservation')
    call('GET', '/parking-lots', expected=401)
    _, staff, _ = call('POST', '/auth/login', {'email': 'staff1@parking.test', 'password': '123456'})
    call('GET', '/parking-lots', token=staff['token'], expected=403)
    availability({**window, 'vehicleId': vehicles[1]}, expected=404)
    availability({**window, 'startTime': '2026-10-23T12:00:00'}, expected=400)
    availability({**window, 'startTime': 'broken'}, expected=400)
    availability({**window, 'startTime': None}, expected=400)
    availability({**window, 'endTime': stamp(start + dt.timedelta(minutes=29))}, expected=400)
    availability({**window, 'endTime': stamp(start + dt.timedelta(hours=25))}, expected=400)
    availability({**window, 'startTime': stamp(start + dt.timedelta(days=8)), 'endTime': stamp(start + dt.timedelta(days=8, hours=1))}, expected=400)
    local = {**window, 'startTime': stamp(start.astimezone(dt.timezone(dt.timedelta(hours=7)))),
             'endTime': stamp((start + dt.timedelta(hours=1)).astimezone(dt.timezone(dt.timedelta(hours=7))))}
    check(availability(local) == slots, 'UTC+7 and UTC do not select same window')
    data = {**window, 'slotId': slots[0]['id']}
    call('POST', '/reservations', data, tokens[0], expected=400)
    call('POST', '/reservations', {**data, 'userId': accounts[1]}, tokens[0], uid(), 400)
    call('POST', '/reservations', {**data, 'slotId': 0}, tokens[0], uid(), 400)
    results = parallel([
        lambda: call('POST', '/reservations', data, tokens[0], uid(), None),
        lambda: call('POST', '/reservations', {**data, 'vehicleId': vehicles[1]}, tokens[1], uid(), None)])
    check(sorted(r[0] for r in results) == [201, 409], 'Concurrent reservations both succeeded')
    winner = next(n for n, r in enumerate(results) if r[0] == 201)
    reservation = results[winner][1]
    other = 1 - winner
    _, detail, _ = call('GET', f"/reservations/{reservation['id']}", token=tokens[winner])
    check(detail['startTime'].endswith('Z') and dt.datetime.fromisoformat(detail['startTime']) == start, 'Lost UTC timestamp')
    check(detail['canCancel'] and detail['reservationCode'].startswith('RS-'), 'Invalid reservation detail')
    call('GET', f"/reservations/{reservation['id']}", token=tokens[other], expected=404)
    call('POST', f"/reservations/{reservation['id']}/cancel", token=tokens[other], key=uid(), expected=404)
    call('POST', f"/reservations/{reservation['id']}/cancel", token=staff['token'], key=uid(), expected=403)
    overlap = {**data, 'vehicleId': vehicles[winner], 'slotId': slots[1]['id']}
    call('POST', '/reservations', overlap, tokens[winner], uid(), 409)
    key = uid()
    call('POST', f"/reservations/{reservation['id']}/cancel", token=tokens[winner], expected=400)
    _, cancelled, _ = call('POST', f"/reservations/{reservation['id']}/cancel", token=tokens[winner], key=key)
    _, replay, headers = call('POST', f"/reservations/{reservation['id']}/cancel", token=tokens[winner], key=key)
    check(cancelled == replay and headers.get('Idempotency-Replayed') == 'true', 'Cancel replay changed result')
    check(len(availability()) == 2, 'Cancellation did not release availability')
    same_key = uid()
    results = parallel([lambda: call('POST', '/reservations', data, tokens[0], same_key, 201) for _ in range(2)])
    check(results[0][1] == results[1][1] and any(r[2].get('Idempotency-Replayed') == 'true' for r in results), 'Concurrent replay created duplicate')
    reservation = results[0][1]
    call('POST', '/reservations', {**data, 'slotId': slots[1]['id']}, tokens[0], same_key, 409)
    _, empty, _ = call('GET', '/reservations/my', token=tokens[1])
    check(all(r['id'] != reservation['id'] for r in empty), 'Other customer history leaked')
    call('GET', '/reservations/my?page=0', token=tokens[0], expected=400)
    call('GET', '/reservations/my?pageSize=201', token=tokens[0], expected=400)
    _, first, _ = call('GET', '/reservations/my?page=1&pageSize=1', token=tokens[0])
    check(len(first) == 1 and first[0]['id'] == reservation['id'], 'History pagination wrong')
    # Only move the time of this run's reservation, then let the real hosted service expire it.
    rid = int(reservation['id'])
    sql(f"DECLARE @now datetime2(7)=SYSUTCDATETIME(); UPDATE dbo.Reservation SET start_time=DATEADD(MINUTE,-20,@now),end_time=DATEADD(MINUTE,40,@now),expires_at=DATEADD(MINUTE,-5,@now) WHERE id={rid} AND user_id={accounts[0]};")
    _, expired, _ = call('GET', f'/reservations/{rid}', token=tokens[0])
    check(expired['status'] == 'EXPIRED' and not expired['canCancel'], 'Effective expiry did not apply')
    call('POST', f'/reservations/{rid}/cancel', token=tokens[0], key=uid(), expected=409)
    print('Waiting for the real expiry worker (at most 70 seconds)...', flush=True)
    deadline = time.monotonic() + 70
    while sql(f"SELECT status FROM dbo.Reservation WHERE id={rid} AND user_id={accounts[0]};") != 'EXPIRED':
        assert time.monotonic() < deadline, 'Hosted expiry service did not persist EXPIRED'
        time.sleep(2)
    check(sql(f"SELECT COUNT(*) FROM dbo.AuditLog WHERE action='RESERVATION_EXPIRED' AND entity_type='Reservation' AND entity_id={rid};") == '1', 'Expiry audit missing/duplicated')
    print(f'PASS: {passed} checks: validation, UTC, ownership, concurrent conflict/replay, cancellation, history, real worker expiry.')
finally:
    # No DELETE against demo accounts or another lot; audit entries owned by these fixtures only.
    own = ','.join(str(int(i)) for i in accounts) or '-1'
    sql(f"""IF EXISTS(SELECT 1 FROM dbo.Users WHERE id IN ({own}) AND normalized_email NOT LIKE N'reservation-check-{TAG}-%@parking.test') THROW 51999,'Unsafe cleanup identity',1;
BEGIN TRANSACTION;
DELETE dbo.AuditLog WHERE actor_user_id IN ({own}) OR (actor_user_id IS NULL AND entity_type='Reservation' AND entity_id IN (SELECT id FROM dbo.Reservation WHERE user_id IN ({own})));
DELETE dbo.RequestRecord WHERE actor_user_id IN ({own});
DELETE dbo.Reservation WHERE user_id IN ({own});
DELETE dbo.Vehicle WHERE user_id IN ({own});
DELETE dbo.Users WHERE id IN ({own});
DELETE s FROM dbo.ParkingSlot s JOIN dbo.Zone z ON z.id=s.zone_id JOIN dbo.ParkingLot l ON l.id=z.parking_lot_id WHERE l.name=N'{LOT}';
DELETE z FROM dbo.Zone z JOIN dbo.ParkingLot l ON l.id=z.parking_lot_id WHERE l.name=N'{LOT}';
DELETE dbo.ParkingLot WHERE name=N'{LOT}';
COMMIT;""")
    print('Removed this run\'s tagged accounts, lot, vehicles and reservations only.')
