"""Dashboard scope and Vietnamese-day accounting. Owned disposable DB only."""
import datetime as dt
import json
import os
from pathlib import Path
import re
import subprocess
import urllib.error
import urllib.request
import uuid

BASE, DB = os.environ['PARKING_TEST_API'], os.environ['PARKING_TEST_DATABASE']
assert re.fullmatch(r'ParkingAdminVerify_[a-f0-9]{12}', DB), 'Use run_admin_tests.py'
assert BASE.startswith('http://127.0.0.1:')
TAG, PASSWORD = uuid.uuid4().hex[:8], 'ReportFixture123!'
passed = 0
def check(value, label):
    global passed
    assert value, label
    passed += 1
def key(): return str(uuid.uuid4())
def call(method, route, body=None, token=None, status=200):
    hs = {'Content-Type':'application/json', 'Idempotency-Key':key()}
    if token: hs['Authorization'] = 'Bearer ' + token
    req = urllib.request.Request(BASE + route, method=method, headers=hs, data=None if body is None else json.dumps(body).encode())
    try:
        with urllib.request.urlopen(req, timeout=20) as r: code, raw = r.status, r.read()
    except urllib.error.HTTPError as r: code, raw = r.code, r.read()
    check(code == status, (method, route, code, status, raw.decode()[:600]))
    return json.loads(raw) if raw else None
def sql(statement):
    settings = 'SET NOCOUNT ON; SET QUOTED_IDENTIFIER ON; SET ANSI_NULLS ON; SET ANSI_PADDING ON; SET ANSI_WARNINGS ON; SET ARITHABORT ON; SET CONCAT_NULL_YIELDS_NULL ON; SET NUMERIC_ROUNDABORT OFF; SET XACT_ABORT ON; '
    result = subprocess.run([os.environ.get('PARKING_TEST_SQLCMD','sqlcmd'),'-S','localhost','-E','-C','-b','-h','-1','-W','-d',DB,'-Q',settings+statement],capture_output=True,text=True,timeout=30)
    assert result.returncode == 0, result.stdout+result.stderr
    return result.stdout.strip()
def login(email, password='123456'):
    return call('POST','/auth/login',{'email':email,'password':password})
admin = login('admin@parking.test')['token']
def save(route, body): return call('POST','/admin/'+route,body,admin,201)['id']
def lot(name): return save('parking-lots',{'name':name,'address':'Report fixture','isActive':True,'reason':'Report test'})
lot_name = 'Report A '+TAG
a, b, empty = lot(lot_name), lot('Report B '+TAG), lot('Empty '+TAG)
z = save('zones',{'parkingLotId':a,'name':'Cars','vehicleType':'CAR','isActive':True,'reason':'Report test'})
slots = {}
for code in ['R1','R2','R3','W1','W2','M1']:
    slots[code] = save('slots',{'zoneId':z,'code':code,'acceptsReservations':code.startswith('R'),'isActive':True,'reason':'Report test'})
zb = save('zones',{'parkingLotId':b,'name':'Cars','vehicleType':'CAR','isActive':True,'reason':'Report test'})
sb = save('slots',{'zoneId':zb,'code':'W1','acceptsReservations':False,'isActive':True,'reason':'Report test'})
call('PUT',f"/admin/slots/{slots['M1']}/maintenance",{'isMaintenance':True,'reason':'Report test'},admin)
inactive = save('zones',{'parkingLotId':a,'name':'Inactive zone','vehicleType':'CAR','isActive':False,'reason':'Inactive scope test'})
sql(f"INSERT dbo.ParkingSlot(zone_id,code,accepts_reservations) VALUES({inactive},'I0',0);")
maintenance_lot = lot('All maintenance '+TAG)
zm = save('zones',{'parkingLotId':maintenance_lot,'name':'Cars','vehicleType':'CAR','isActive':True,'reason':'Report test'})
sm = save('slots',{'zoneId':zm,'code':'M0','acceptsReservations':False,'isActive':True,'reason':'Report test'})
call('PUT',f'/admin/slots/{sm}/maintenance',{'isMaintenance':True,'reason':'Report test'},admin)

accounts = []
for n, role in enumerate(['Staff','Staff','Customer','Customer']):
    email = f'report-{TAG}-{n}@parking.test'
    body = {'name':'Report fixture','email':email,'password':PASSWORD,'role':role,'assignedParkingLotId':(a if n==0 else b) if role=='Staff' else None,'isActive':True,'reason':'Report test'}
    uid = save('users',body)
    auth = login(email,PASSWORD)
    accounts.append((uid,email,auth['token'],body))
staff, other_staff, customer, outsider = [x[2] for x in accounts]
for method, route in [('GET','/dashboard'),('GET','/admin/reports?fromDate=2020-01-02&toDate=2020-01-02')]:
    call(method,route,status=401)
for token in [staff,customer]: call('GET','/admin/reports?fromDate=2020-01-02&toDate=2020-01-02',token=token,status=403)
for query in ['', 'fromDate=2020-01-02', 'fromDate=bad&toDate=2020-01-02', 'fromDate=2020-1-2&toDate=2020-01-02',
              'fromDate=2019-02-29&toDate=2019-03-01', 'fromDate=1999-12-31&toDate=2000-01-01',
              'fromDate=2099-12-31&toDate=2100-01-01', 'fromDate=2020-01-03&toDate=2020-01-02',
              'fromDate=2020-01-01&toDate=2021-01-01', 'fromDate=2020-01-02T00:00:00Z&toDate=2020-01-02',
              'fromDate=2020-01-02&toDate=2020-01-02&parkingLotId=0']:
    call('GET','/admin/reports?'+query,token=admin,status=400)
call('GET','/admin/reports?fromDate=2020-01-02&toDate=2020-01-02&parkingLotId=2147483647',token=admin,status=404)
leap = call('GET','/admin/reports?fromDate=2020-01-01&toDate=2020-12-31',token=admin)
check(len(leap['days']) == 366, 'Leap-year range rejected or truncated')

vehicles = []
for n in range(4):
    vehicles.append(call('POST','/vehicles',{'plateNumber':f'RD{TAG.upper()}{n}','vehicleType':'CAR'},customer,201))
now = dt.datetime.now(dt.timezone.utc).replace(microsecond=0)
def reservation(vehicle, code, offset):
    start = now+dt.timedelta(minutes=offset)
    return call('POST','/reservations',{'vehicleId':vehicle['id'],'slotId':slots[code],'startTime':start.isoformat(),'endTime':(start+dt.timedelta(hours=1)).isoformat()},customer,201)
r1, r2, r3 = reservation(vehicles[0],'R1',5), reservation(vehicles[1],'R2',120), reservation(vehicles[2],'R3',5)
open_session = call('POST','/sessions/checkin',{'slotId':slots['R1'],'reservationCode':r1['reservationCode']},staff,201)
paid_session = call('POST','/sessions/checkin',{'slotId':slots['R3'],'reservationCode':r3['reservationCode']},staff,201)
fee = call('GET',f"/sessions/{paid_session['id']}/fee",token=staff)
rate = fee['amount']
call('POST',f"/sessions/{paid_session['id']}/checkout",{'paymentMethod':'CASH','confirmedAmount':rate},staff)

# Real API-created payments, then shift only owned fixtures to exact UTC boundaries.
# A1 and A3 pay on Jan 2 VN; A0 is just before, A2 is exactly after. B stays in history after closure.
for n, (slot, token, paid_at, method) in enumerate([
    (slots['W1'],staff,'2020-01-01T16:59:59.9999999','CASH'),
    (slots['W1'],staff,'2020-01-01T17:00:00','CASH'),
    (slots['W1'],staff,'2020-01-02T17:00:00','SIMULATED'),
    (slots['W1'],staff,'2020-01-02T16:59:59.9999999','SIMULATED'),
    (sb,other_staff,'2020-01-02T00:00:00','CASH')]):
    plate = vehicles[3]['plateNumber'] if n==0 else f'RF{TAG.upper()}{n}'
    session = call('POST','/sessions/checkin',{'slotId':slot,'plateNumber':plate,'vehicleType':'CAR'},token,201)
    quote = call('GET',f"/sessions/{session['id']}/fee",token=token)
    check(quote['amount'] == rate, 'Fixture prices differ')
    call('POST',f"/sessions/{session['id']}/checkout",{'paymentMethod':method,'confirmedAmount':quote['amount']},token)
    out = "CONVERT(datetime2(7),'2020-01-01T16:50:00')" if n==3 else f"CONVERT(datetime2(7),'{paid_at}')"
    sql(f"BEGIN TRAN; UPDATE dbo.ParkingSession SET check_in_time=DATEADD(MINUTE,-10,{out}),check_out_time={out} WHERE id={session['id']}; UPDATE dbo.Payment SET paid_at=CONVERT(datetime2(7),'{paid_at}') WHERE session_id={session['id']}; UPDATE dbo.ParkingSlot SET buffer_until=NULL WHERE id={slot}; COMMIT;")
call('PATCH',f"/vehicles/{vehicles[3]['id']}",{'plateNumber':vehicles[3]['plateNumber'],'vehicleType':'CAR','isActive':False},customer)
call('PUT',f'/admin/parking-lots/{b}',{'name':'Report B '+TAG,'address':'Report fixture','isActive':False,'reason':'Closed after historical payments'},admin)
expired = reservation(vehicles[2],'R3',240)
sql(f"DECLARE @expiredNow datetime2(7)=SYSUTCDATETIME(); UPDATE dbo.Reservation SET start_time=DATEADD(MINUTE,-60,@expiredNow),end_time=DATEADD(MINUTE,60,@expiredNow),expires_at=DATEADD(MINUTE,-45,@expiredNow) WHERE id={expired['id']};")

dash = call('GET','/dashboard',token=staff)
s = dash['summary']
check(len(dash['lots']) == 1 and dash['lots'][0]['parkingLotId'] == a, 'Staff sees another lot')
check('todayRevenue' not in s, 'Staff revenue leaked')
expected = {'totalActiveSlots':6,'occupiedSlots':1,'availableSlots':4,'maintenanceSlots':1,'bufferSlots':1,'walkInReadySlots':2,'openSessions':1,'confirmedReservations':1,'todayCheckIns':2,'todayCheckOuts':1}
for k,v in expected.items(): check(s[k] == v, (k,s[k],v))
check(dash['lots'][0]['occupancyPercent'] == 20, 'Wrong occupancy denominator')
check(dash['generatedAt'].endswith('Z') and dash['dateVn'] == (dt.datetime.now(dt.timezone.utc)+dt.timedelta(hours=7)).date().isoformat(), 'Missing UTC timestamp/VN day')
customer_dash = call('GET','/dashboard?userId='+str(accounts[3][0])+'&parkingLotId='+str(b),token=customer)
check(customer_dash['lots'] == [] and customer_dash['summary'] == {'activeVehicleCount':3,'confirmedReservations':1,'openSessions':1,'completedSessions':1,'totalPaid':rate}, 'Customer scope/expired reservation/walk-in attribution wrong')
other_dash = call('GET','/dashboard',token=outsider)
check(all(v == 0 for v in other_dash['summary'].values()), 'Other customer sees owner statistics')
global_dash = call('GET','/dashboard',token=admin)
check(any(l['parkingLotId']==b and not l['isActive'] and l['totalActiveSlots']==0 for l in global_dash['lots']), 'Inactive lot contributes capacity')
for lot_id in [empty,maintenance_lot]:
    check(next(l for l in global_dash['lots'] if l['parkingLotId']==lot_id)['occupancyPercent'] is None, 'Undefined occupancy shown as zero')
check(global_dash['summary']['totalActiveSlots'] == sum(l['totalActiveSlots'] for l in global_dash['lots']), 'Capacity total mismatch')
check('todayRevenue' in global_dash['summary'], 'Admin has no revenue')

def report(lot_id=None, start='2020-01-02', end='2020-01-02'):
    return call('GET',f'/admin/reports?fromDate={start}&toDate={end}'+(f'&parkingLotId={lot_id}' if lot_id else ''),token=admin)
for lot_id, counts in [(a,(1,1,2)),(b,(1,1,1)),(None,(2,2,3))]:
    value = report(lot_id)
    t = value['totals']
    check((t['checkInCount'],t['checkOutCount'],t['paymentCount']) == counts, 'Boundary/traffic count wrong')
    check(t['revenueVnd'] == counts[2]*rate, 'Payment counted more than once/wrong day')
    check(t['cashRevenueVnd']+t['simulatedRevenueVnd'] == t['revenueVnd'], 'Payment-method split wrong')
    check(len(value['days'])==1 and value['days'][0]['date']=='2020-01-02', 'Inclusive report day wrong')
    for k in t:
        check(sum(d[k] for d in value['days']) == t[k] and sum(l[k] for l in value['lots']) == t[k], 'Daily/lot totals disagree: '+k)
check(report(a)['totals']['simulatedRevenueVnd']==rate, 'Simulated amount missing')
check(not report(b)['lots'][0]['isActive'], 'Closed lot lost historical payment')
range_report = report(a,'2020-01-01','2020-01-04')
check(len(range_report['days'])==4 and range_report['days'][-1]['paymentCount']==0, 'Missing zero-filled day')
check(range_report['totals']['paymentCount']==4, 'Outside single-day boundaries not preserved in wider report')
zero = report(empty)
check(all(v==0 for v in zero['totals'].values()) and len(zero['days'])==1, 'Empty report fabricated or omitted zero rows')
reassigned = {k:v for k,v in accounts[0][3].items() if k!='password'} | {'assignedParkingLotId':empty}
call('PUT',f'/admin/users/{accounts[0][0]}',reassigned,admin)
check(call('GET','/dashboard',token=staff)['lots'][0]['parkingLotId']==empty, 'Old JWT retained dashboard assignment')
call('PUT',f'/admin/users/{accounts[0][0]}',reassigned | {'isActive':False},admin)
call('GET','/dashboard',token=staff,status=401)
call('PUT',f'/admin/users/{accounts[0][0]}',{k:v for k,v in accounts[0][3].items() if k!='password'},admin)
sql(f"CREATE USER report_verify_role WITHOUT LOGIN; ALTER ROLE parking_backend ADD MEMBER report_verify_role; EXECUTE AS USER='report_verify_role'; EXEC dbo.usp_GetDashboard @ActorId={accounts[0][0]}; EXEC dbo.usp_AdminDailyReport @ActorId=1,@FromDateVN='20200102',@ToDateVNExclusive='20200103'; REVERT;")
check(sql("EXECUTE AS USER='report_verify_role'; SELECT HAS_PERMS_BY_NAME('dbo.Payment','OBJECT','SELECT'); REVERT;")=='0','Backend role directly reads private payment table')
Path(os.environ['PARKING_TEST_WORK'],'report-fixture.json').write_text(json.dumps({'database':DB,'lotA':a,'lotB':b,'lotName':lot_name,'staffEmail':accounts[0][1],'customerEmail':accounts[2][1],'rate':rate}),encoding='utf-8')
print(f'PASS {passed} dashboard/report API/data checks',flush=True)
