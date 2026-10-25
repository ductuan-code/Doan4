"""Staff parking inventory/maintenance tests. Disposable database only."""
import concurrent.futures
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
assert re.fullmatch(r'ParkingAdminVerify_[a-f0-9]{12}',DB)
assert BASE.startswith('http://127.0.0.1:')
TAG, PASSWORD = uuid.uuid4().hex[:8], 'MaintenanceTest123!'
passed=0
def check(value,label):
    global passed
    assert value,label
    passed+=1
def key(): return str(uuid.uuid4())
def call(method,route,body=None,token=None,k=None,expected=200):
    hs={'Content-Type':'application/json'}
    if token: hs['Authorization']='Bearer '+token
    if k: hs['Idempotency-Key']=k
    req=urllib.request.Request(BASE+route,method=method,headers=hs,data=None if body is None else json.dumps(body).encode())
    try:
        with urllib.request.urlopen(req,timeout=20) as r: code,raw,headers=r.status,r.read(),r.headers
    except urllib.error.HTTPError as r: code,raw,headers=r.code,r.read(),r.headers
    if expected is not None: check(code==expected,(method,route,code,expected,raw.decode()[:600]))
    return code,json.loads(raw) if raw else None,headers
def sql(statement):
    flags='SET NOCOUNT ON; SET QUOTED_IDENTIFIER ON; SET ANSI_NULLS ON; SET ANSI_PADDING ON; SET ANSI_WARNINGS ON; SET ARITHABORT ON; SET CONCAT_NULL_YIELDS_NULL ON; SET NUMERIC_ROUNDABORT OFF; SET XACT_ABORT ON; '
    result=subprocess.run([os.environ.get('PARKING_TEST_SQLCMD','sqlcmd'),'-S','localhost','-E','-C','-b','-h','-1','-W','-d',DB,'-Q',flags+statement],capture_output=True,text=True,timeout=30)
    assert result.returncode==0,result.stdout+result.stderr
    return result.stdout.strip()
def login(email,password='123456'): return call('POST','/auth/login',{'email':email,'password':password})[1]
admin=login('admin@parking.test')['token']
def create(route,body): return call('POST','/admin/'+route,body,admin,key(),201)[1]['id']
def lot(name): return create('parking-lots',{'name':name,'address':'Maintenance test','isActive':True,'reason':'Fixture'})
a,b,empty=lot('Maintenance A '+TAG),lot('Maintenance B '+TAG),lot('Empty maintenance '+TAG)
zc=create('zones',{'parkingLotId':a,'name':'Cars','floorLabel':'B1','vehicleType':'CAR','isActive':True,'reason':'Fixture'})
zm=create('zones',{'parkingLotId':a,'name':'Bikes','floorLabel':'G','vehicleType':'MOTORBIKE','isActive':True,'reason':'Fixture'})
zb=create('zones',{'parkingLotId':b,'name':'Outside','vehicleType':'CAR','isActive':True,'reason':'Fixture'})
slots={}
for code in ['W1','W2','W3','R1','R2','I1','X1']:
    slots[code]=create('slots',{'zoneId':zc,'code':code,'acceptsReservations':code.startswith('R'),'isActive':code!='I1','reason':'Fixture'})
slots['M1']=create('slots',{'zoneId':zm,'code':'M1','acceptsReservations':False,'isActive':True,'reason':'Fixture'})
foreign=create('slots',{'zoneId':zb,'code':'B1','acceptsReservations':False,'isActive':True,'reason':'Fixture'})
accounts=[]
for n,role in enumerate(['Staff','Staff','Customer']):
    body={'name':'Maintenance fixture','email':f'maint-{TAG}-{n}@parking.test','password':PASSWORD,'role':role,'assignedParkingLotId':a if n==0 else b if n==1 else None,'isActive':True,'reason':'Fixture'}
    uid=create('users',body); auth=login(body['email'],PASSWORD)
    accounts.append((uid,body,auth['token']))
staff,outside,customer=[u[2] for u in accounts]
def inventory(token=staff): return call('GET','/staff/operations',token=token)[1]
def maintain(slot,flag=True,reason='Repair lighting',k=None,token=staff,expected=200):
    return call('PUT',f'/staff/slots/{slot}/maintenance',{'isMaintenance':flag,'reason':reason,'positionVerified':True},token,k or key(),expected)
call('GET','/staff/operations',expected=401)
for token in [admin,customer]: call('GET','/staff/operations',token=token,expected=403)
rows=inventory()
check(len(rows)==8 and all(s['parkingLotId']==a for s in rows),'Inventory leaks another lot')
check(all(s['parkingLotId']==a for s in call('GET',f'/staff/operations?parkingLotId={b}',token=staff)[1]),'Query parameter overrides assigned lot')
check(all(s['zoneId'] in [zc,zm] and s['floorLabel'] in ['B1','G'] for s in rows),'Zone/floor metadata wrong')
check(next(s for s in rows if s['id']==slots['I1'])['isActive'] is False,'Inactive position hidden')
route=f"/staff/slots/{slots['R1']}/maintenance"
data={'isMaintenance':True,'reason':'Repair lighting','positionVerified':True}
call('PUT',route,data,expected=401)
for token in [admin,customer,outside]: call('PUT',route,data,token,key(),403)
call('PUT',f"/admin/slots/{slots['R1']}/maintenance",{'isMaintenance':True,'reason':'Wrong route'},staff,key(),403)
call('PUT',route,data,staff,expected=400)
call('PUT',route,data,staff,'bad key',400)
for change in [{'isMaintenance':None},{'reason':' '},{'reason':'x'*1001},{'positionVerified':False},{'positionVerified':None},{'parkingLotId':b},{'operationalStatus':'AVAILABLE'}]:
    call('PUT',route,data|change,staff,key(),400)
for missing in ['isMaintenance','positionVerified','reason']:
    call('PUT',route,{k:v for k,v in data.items() if k!=missing},staff,key(),400)
maintain(2147483647,expected=404)
maintain(foreign,expected=403)
v=call('POST','/vehicles',{'plateNumber':'MR'+TAG.upper(),'vehicleType':'CAR'},customer,key(),201)[1]
start=dt.datetime.now(dt.timezone.utc).replace(microsecond=0)+dt.timedelta(minutes=5)
r=call('POST','/reservations',{'vehicleId':v['id'],'slotId':slots['R1'],'startTime':start.isoformat(),'endTime':(start+dt.timedelta(hours=1)).isoformat()},customer,key(),201)[1]
check(next(s for s in inventory() if s['id']==slots['R1'])['confirmedReservationCount']==1,'Missing live booking count')
request_key=key()
with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool: replies=list(pool.map(lambda _:maintain(slots['R1'],k=request_key),range(2)))
check(replies[0][1]==replies[1][1] and any(x[2].get('Idempotency-Replayed')=='true' for x in replies),'Maintenance replay duplicated')
maintain(slots['R1'],False,k=request_key,expected=409)
check(sql(f"SELECT COUNT(*) FROM dbo.AuditLog WHERE action='MAINTENANCE_CHANGED' AND request_id='{request_key}' AND actor_user_id={accounts[0][0]} AND reason=N'Repair lighting'")=='1','Audit missing/duplicated')
current=next(s for s in inventory() if s['id']==slots['R1'])
check(current['status']=='MAINTENANCE' and current['confirmedReservationCount']==1,'Maintenance lost reservation')
check(call('GET',f"/reservations/{r['id']}",token=customer)[1]['status']=='CONFIRMED','Reservation cancelled by maintenance')
call('POST','/sessions/checkin',{'slotId':slots['R1'],'reservationCode':r['reservationCode']},staff,key(),409)
maintain(slots['R1'],False)
def walk(code,suffix): return call('POST','/sessions/checkin',{'slotId':slots[code],'plateNumber':'MW'+TAG.upper()+suffix,'vehicleType':'CAR'},staff,key(),201)[1]
busy=walk('W2','2')
for flag in [True,False]: maintain(slots['W2'],flag,expected=409)
current=next(s for s in inventory() if s['id']==slots['W2'])
check(current['openSessionId']==busy['id'] and current['plateNumber']=='MW'+TAG.upper()+'2' and current['status']=='OCCUPIED','Occupied position changed')
buffered=walk('W3','3'); fee=call('GET',f"/sessions/{buffered['id']}/fee",token=staff)[1]
call('POST',f"/sessions/{buffered['id']}/checkout",{'paymentMethod':'CASH','confirmedAmount':fee['amount']},staff,key())
before=next(s for s in inventory() if s['id']==slots['W3'])['bufferUntil']
for flag in [True,False]: maintain(slots['W3'],flag)
current=next(s for s in inventory() if s['id']==slots['W3'])
check(current['status']=='AVAILABLE' and current['isInBuffer'] and current['bufferUntil']==before and before.endswith('Z'),'Buffer erased or extended')
call('POST','/sessions/checkin',{'slotId':slots['W3'],'plateNumber':'MB'+TAG.upper(),'vehicleType':'CAR'},staff,key(),409)
maintain(slots['I1'])
check(not next(s for s in inventory() if s['id']==slots['I1'])['isActive'],'Maintenance reactivated inactive config')
maintain(slots['M1'])

# The same business lock must allow either maintenance or a new session, never both.
with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:
    race=list(pool.map(lambda f:f(),[
        lambda:maintain(slots['X1'],expected=None),
        lambda:call('POST','/sessions/checkin',{'slotId':slots['X1'],'plateNumber':'MX'+TAG.upper(),'vehicleType':'CAR'},staff,key(),None)]))
check(sorted(x[0] for x in race) in [[200,409],[201,409]],'Maintenance/check-in race allowed inconsistent state')
if race[1][0]==201:
    sid=race[1][1]['id']; quote=call('GET',f'/sessions/{sid}/fee',token=staff)[1]
    call('POST',f'/sessions/{sid}/checkout',{'paymentMethod':'CASH','confirmedAmount':quote['amount']},staff,key())
else: maintain(slots['X1'],False)
call('PUT',f"/admin/slots/{slots['X1']}",{'zoneId':zc,'code':'X1','acceptsReservations':False,'isActive':False,'reason':'Finish race fixture'},admin,key())
v2=call('POST','/vehicles',{'plateNumber':'ME'+TAG.upper(),'vehicleType':'CAR'},customer,key(),201)[1]
later=start+dt.timedelta(hours=2)
expired=call('POST','/reservations',{'vehicleId':v2['id'],'slotId':slots['R2'],'startTime':later.isoformat(),'endTime':(later+dt.timedelta(hours=1)).isoformat()},customer,key(),201)[1]
sql(f"DECLARE @n datetime2(7)=SYSUTCDATETIME(); UPDATE dbo.Reservation SET start_time=DATEADD(MINUTE,-60,@n),end_time=DATEADD(MINUTE,60,@n),expires_at=DATEADD(MINUTE,-45,@n) WHERE id={expired['id']};")
check(next(s for s in inventory() if s['id']==slots['R2'])['confirmedReservationCount']==0,'Expired booking counted as live')
body={k:v for k,v in accounts[0][1].items() if k!='password'}
call('PUT',f'/admin/users/{accounts[0][0]}',body|{'assignedParkingLotId':b},admin,key())
check(all(s['parkingLotId']==b for s in inventory()),'Old JWT retained lot scope')
maintain(slots['W1'],expected=403)
call('PUT',f'/admin/users/{accounts[0][0]}',body|{'assignedParkingLotId':empty},admin,key())
check(inventory()==[],'Empty assigned lot fabricated positions')
call('PUT',f'/admin/users/{accounts[0][0]}',body|{'isActive':False},admin,key())
call('GET','/staff/operations',token=staff,expected=401)
maintain(slots['W1'],expected=401)
call('PUT',f'/admin/users/{accounts[0][0]}',body,admin,key())
final=inventory()
check(sum(s['isActive'] for s in final)==6,'Active capacity wrong')
Path(os.environ['PARKING_TEST_WORK'],'maintenance-fixture.json').write_text(json.dumps({'database':DB,'lotA':a,'lotB':b,'lotName':'Maintenance A '+TAG,'staffEmail':accounts[0][1]['email'],'customerEmail':accounts[2][1]['email'],'slots':slots,'reservation':r,'busySession':busy}),encoding='utf-8')
print(f'PASS {passed} staff parking/maintenance API/data checks',flush=True)
