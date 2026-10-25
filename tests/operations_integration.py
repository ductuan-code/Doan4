"""Service incidents and plate corrections on an owned disposable SQL database."""
import concurrent.futures
import datetime as dt
import json
import os
from pathlib import Path
import re
import subprocess
import time
import urllib.error
import urllib.request
import uuid

BASE, DB = os.environ['PARKING_TEST_API'], os.environ['PARKING_TEST_DATABASE']
assert re.fullmatch(r'ParkingAdminVerify_[a-f0-9]{12}', DB), 'Use run_admin_tests.py'
assert BASE.startswith('http://127.0.0.1:')
TAG, PASSWORD = uuid.uuid4().hex[:8], 'OperationTest123!'
passed = 0
def check(value, label):
    global passed
    assert value, label
    passed += 1
def key(): return str(uuid.uuid4())
def call(method, route, body=None, token=None, k=None, expected=200):
    headers={'Content-Type':'application/json'}
    if token: headers['Authorization']='Bearer '+token
    if k: headers['Idempotency-Key']=k
    req=urllib.request.Request(BASE+route,method=method,headers=headers,data=None if body is None else json.dumps(body).encode())
    try:
        with urllib.request.urlopen(req,timeout=20) as r: code, raw, hs=r.status,r.read(),r.headers
    except urllib.error.HTTPError as r: code,raw,hs=r.code,r.read(),r.headers
    if expected is not None: check(code==expected,(method,route,code,expected,raw.decode()[:600]))
    return code,json.loads(raw) if raw else None,hs
def sql(statement):
    flags='SET NOCOUNT ON; SET QUOTED_IDENTIFIER ON; SET ANSI_NULLS ON; SET ANSI_PADDING ON; SET ANSI_WARNINGS ON; SET ARITHABORT ON; SET CONCAT_NULL_YIELDS_NULL ON; SET NUMERIC_ROUNDABORT OFF; SET XACT_ABORT ON; '
    result=subprocess.run([os.environ.get('PARKING_TEST_SQLCMD','sqlcmd'),'-S','localhost','-E','-C','-b','-h','-1','-W','-d',DB,'-Q',flags+statement],capture_output=True,text=True,timeout=30)
    assert result.returncode==0,result.stdout+result.stderr
    return result.stdout.strip()
def login(email,password='123456'): return call('POST','/auth/login',{'email':email,'password':password})[1]
admin=login('admin@parking.test')['token']
def create(route,body): return call('POST','/admin/'+route,body,admin,key(),201)[1]['id']
a=create('parking-lots',{'name':'Operations '+TAG,'address':'Test only','isActive':True,'reason':'Test'})
b=create('parking-lots',{'name':'Outside '+TAG,'address':'Test only','isActive':True,'reason':'Test'})
slots={}
for lot_id in [a,b]:
    z=create('zones',{'parkingLotId':lot_id,'name':'Cars','vehicleType':'CAR','isActive':True,'reason':'Test'})
    for code in ([f'R{i}' for i in range(1,11)]+[f'W{i}' for i in range(1,8)] if lot_id==a else ['W1']):
        slots[(lot_id,code)]=create('slots',{'zoneId':z,'code':code,'acceptsReservations':code.startswith('R'),'isActive':True,'reason':'Test'})
accounts=[]
for n, role in enumerate(['Staff','Staff','Customer']):
    email=f'ops-{TAG}-{n}@parking.test'
    uid=create('users',{'name':'Operations fixture','email':email,'password':PASSWORD,'role':role,'assignedParkingLotId':a if n==0 else b if n==1 else None,'isActive':True,'reason':'Test'})
    accounts.append((uid,email,login(email,PASSWORD)['token']))
staff, outside, customer=[u[2] for u in accounts]
def reserve(n,minutes=5):
    v=call('POST','/vehicles',{'plateNumber':f'OR{TAG.upper()}{n}','vehicleType':'CAR'},customer,key(),201)[1]
    start=dt.datetime.now(dt.timezone.utc).replace(microsecond=0)+dt.timedelta(minutes=minutes)
    return call('POST','/reservations',{'vehicleId':v['id'],'slotId':slots[(a,f'R{n}')],'startTime':start.isoformat(),'endTime':(start+dt.timedelta(hours=1)).isoformat()},customer,key(),201)[1],v
def issue(r,unfulfilled=False,body=None,k=None,token=None,expected=200):
    return call('POST',f"/reservations/{r['id']}/"+('unfulfilled' if unfulfilled else 'service-issue'),body or {'reason':'Blocked position; customer arrived','customerPresent':True},token or staff,k or key(),expected)
def detail(r): return call('GET',f"/reservations/{r['id']}",token=customer)[1]
def checkin(r,n): return call('POST','/sessions/checkin',{'slotId':slots[(a,f'R{n}')],'reservationCode':r['reservationCode']},staff,key(),201)[1]
r1,v1=reserve(1)
body={'reason':'Broken gate','customerPresent':True}
for action in ['service-issue','unfulfilled']:
    route=f"/reservations/{r1['id']}/{action}"
    call('POST',route,body,expected=401)
    for token in [admin,customer,outside]: call('POST',route,body,token,key(),403)
call('POST',f"/reservations/{r1['id']}/service-issue",body,staff,expected=400)
for invalid in [{'reason':' ','customerPresent':True},{'reason':'Test'},{'reason':'Test','customerPresent':False},{'reason':'Test','customerPresent':True,'serviceIssueAt':'2020-01-01'},{'reason':'x'*1001,'customerPresent':True}]:
    issue(r1,body=invalid,expected=400)
issue({'id':2147483647},expected=404)
k=key()
with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool: results=list(pool.map(lambda _:issue(r1,body=body,k=k),range(2)))
saved=results[0][1]
check(results[1][1]==saved and any(r[2].get('Idempotency-Replayed')=='true' for r in results),'Incident replay duplicated')
check(saved['serviceIssueAt'].endswith('Z') and saved['resolutionDeadline'].endswith('Z'),'Incident timestamp is not UTC')
check(dt.datetime.fromisoformat(saved['resolutionDeadline'])-dt.datetime.fromisoformat(saved['serviceIssueAt'])==dt.timedelta(minutes=15),'Incident deadline wrong')
issue(r1,body=body|{'reason':'Changed'},k=k,expected=409)
issue(r1,body=body,expected=409)
check(sql(f"SELECT COUNT(*) FROM dbo.AuditLog WHERE request_id='{k}' AND action='SERVICE_ISSUE_RECORDED'")=='1','Incident audit missing/duplicated')
view=detail(r1)
check(view['issueReason']=='Broken gate' and not view['canRecordIssue'] and not view['canMarkUnfulfilled'],'Customer mutation flags leaked')
staff_view=call('GET','/staff/reservations/lookup?code='+r1['reservationCode'],token=staff)[1]
check(not staff_view['canRecordIssue'] and staff_view['canMarkUnfulfilled'],'Staff incident flags wrong')
# Past normal no-show, still within the incident resolution window.
sql(f"DECLARE @n datetime2(7)=SYSUTCDATETIME(); UPDATE dbo.Reservation SET start_time=DATEADD(MINUTE,-20,@n),end_time=DATEADD(MINUTE,40,@n),expires_at=DATEADD(MINUTE,-5,@n),service_issue_at=DATEADD(MINUTE,-10,@n) WHERE id={r1['id']};")
check(detail(r1)['status']=='CONFIRMED','Incident treated as ordinary no-show')
session=checkin(r1,1)
check(detail(r1)['resolvedAt'] is not None,'Check-in did not resolve incident')
check(sql(f"SELECT resolved_by_staff_id FROM dbo.Reservation WHERE id={r1['id']}")==str(accounts[0][0]),'Incident resolver not recorded')
issue(r1,unfulfilled=True,expected=409)
_, replay, hs=issue(r1,body=body,k=k)
check(replay==saved and hs.get('Idempotency-Replayed')=='true','Incident replay failed after resolution')

r2,_=reserve(2)
issue(r2)
uk=key(); result=issue(r2,True,{'reason':'No alternative; customer declined','customerPresent':True},uk)[1]
check(result['status']=='UNFULFILLED' and result['resolvedAt'].endswith('Z'),'Unfulfilled not completed')
check(detail(r2)['issueReason']=='No alternative; customer declined','Customer cannot see resolution reason')
check(sql(f"SELECT COUNT(*) FROM dbo.ParkingSession WHERE reservation_id={r2['id']}")=='0','Unfulfilled invented a session')
issue(r2,True,{'reason':'No alternative; customer declined','customerPresent':True},uk)
r3,_=reserve(3,120); issue(r3,expected=409)
r4,_=reserve(4)
sql(f"DECLARE @n datetime2(7)=SYSUTCDATETIME(); UPDATE dbo.Reservation SET start_time=DATEADD(MINUTE,-20,@n),end_time=DATEADD(MINUTE,40,@n),expires_at=DATEADD(MINUTE,-5,@n) WHERE id={r4['id']};")
issue(r4,expected=409)
r5,_=reserve(5)
with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:
    actions=[lambda:issue(r5,True,expected=None),lambda:call('POST','/sessions/checkin',{'slotId':slots[(a,'R5')],'reservationCode':r5['reservationCode']},staff,key(),None)]
    race=list(pool.map(lambda f:f(),actions))
check(sorted(x[0] for x in race) in [[200,409],[201,409]],'Check-in and unfulfilled both succeeded')

def walk(code,plate,token=staff,lot=a): return call('POST','/sessions/checkin',{'slotId':slots[(lot,code)],'plateNumber':plate,'vehicleType':'CAR'},token,key(),201)[1]
def correction(s,plate,reason='Correct entry typo',k=None,token=staff,expected=200):
    return call('PATCH',f"/sessions/{s['id']}/plate",{'plateNumber':plate,'reason':reason,'vehicleVerified':True},token,k or key(),expected)
original=f'OW{TAG.upper()}0'; corrected=f'OW{TAG.upper()}1'
walk1=walk('W1',original)
foreign=walk('W1',f'OW{TAG.upper()}2',outside,b)
route=f"/sessions/{walk1['id']}/plate"
data={'plateNumber':corrected,'reason':'Correct entry typo','vehicleVerified':True}
call('PATCH',route,data,expected=401)
for token in [admin,customer,outside]: call('PATCH',route,data,token,key(),403)
call('PATCH',route,data,staff,expected=400)
for change in [{'plateNumber':'Sai biển'},{'plateNumber':'AB'},{'reason':' '},{'vehicleVerified':False},{'customerId':accounts[2][0]},{'vehicleType':'MOTORBIKE'}]:
    call('PATCH',route,data|change,staff,key(),400)
correction({'id':2147483647},corrected,expected=404)
correction(walk1,f'OW{TAG.upper()}2',expected=409)
pk=key()
with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool: corrected_results=list(pool.map(lambda _:correction(walk1,corrected,k=pk),range(2)))
check(corrected_results[0][1]==corrected_results[1][1] and any(r[2].get('Idempotency-Replayed')=='true' for r in corrected_results),'Plate correction did not replay')
correction(walk1,corrected+'3',k=pk,expected=409)
current=call('GET',f"/sessions/{walk1['id']}",token=staff)[1]
check(current['plateNumber']==corrected and current['customerId'] is None and current['reservationId'] is None,'Plate changed ownership')
check(current['vehicleType']=='CAR' and current['checkInTime']==walk1['checkInTime'] and current['appliedPricePerHour']==walk1['appliedPricePerHour'],'Correction changed billing snapshot')
check(current['canCorrectPlate'] and current['plateCorrectionDeadline'].endswith('Z'),'Correction flags/deadline wrong')
check(sql(f"SELECT COUNT(*) FROM dbo.AuditLog WHERE action='PLATE_CORRECTED' AND request_id='{pk}' AND reason=N'Correct entry typo'")=='1','Plate correction audit missing/duplicated')
correction(session,corrected,expected=409)
sql(f"UPDATE dbo.ParkingSession SET check_in_time=DATEADD(MINUTE,-6,SYSUTCDATETIME()) WHERE id={walk1['id']};")
check(not call('GET',f"/sessions/{walk1['id']}",token=staff)[1]['canCorrectPlate'],'Late correction still offered')
correction(walk1,corrected,k=pk)
correction(walk1,corrected+'4',expected=409)
quote=call('GET',f"/sessions/{walk1['id']}/fee",token=staff)[1]
call('POST',f"/sessions/{walk1['id']}/checkout",{'paymentMethod':'CASH','confirmedAmount':quote['amount']},staff,key())
correction(walk1,corrected+'5',expected=409)

# A walk-in with an existing vehicle link may only change plate presentation.
linked_plate=f'OL{TAG.upper()}0'
vehicle=call('POST','/vehicles',{'plateNumber':linked_plate,'vehicleType':'CAR'},customer,key(),201)[1]
linked=walk('W2',linked_plate)
sql(f"UPDATE dbo.ParkingSession SET customer_id={accounts[2][0]},vehicle_id={vehicle['id']} WHERE id={linked['id']};")
correction(linked,linked_plate+'1',expected=409)
correction(linked,linked_plate.lower())
check(not call('GET',f"/sessions/{linked['id']}",token=customer)[1]['canCorrectPlate'],'Customer offered plate mutation')
rw=walk('W3',f'OC{TAG.upper()}0'); new_plate=f'OC{TAG.upper()}1'
fee=call('GET',f"/sessions/{rw['id']}/fee",token=staff)[1]
with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:
    race=list(pool.map(lambda f:f(),[
        lambda:correction(rw,new_plate,expected=None),
        lambda:call('POST',f"/sessions/{rw['id']}/checkout",{'paymentMethod':'CASH','confirmedAmount':fee['amount']},staff,key(),None)]))
check(race[1][0]==200 and race[0][0] in [200,409],'Correction/checkout race invalid')
check(sql(f"SELECT COUNT(*) FROM dbo.Payment WHERE session_id={rw['id']}")=='1','Correction/checkout payment duplicated')

# Observe the real background worker, not a manual call to the expiry procedure.
timed,_=reserve(6); issue(timed)
sql(f"DECLARE @n datetime2(7)=SYSUTCDATETIME(); UPDATE dbo.Reservation SET start_time=DATEADD(MINUTE,-20,@n),end_time=DATEADD(MINUTE,40,@n),expires_at=DATEADD(MINUTE,-5,@n),service_issue_at=DATEADD(SECOND,-899,@n) WHERE id={timed['id']};")
time.sleep(1.2)
check(detail(timed)['status']=='UNFULFILLED','Read API ignored elapsed incident deadline')
deadline=time.monotonic()+70
while sql(f"SELECT status FROM dbo.Reservation WHERE id={timed['id']}")!='UNFULFILLED' and time.monotonic()<deadline: time.sleep(.5)
check(sql(f"SELECT status FROM dbo.Reservation WHERE id={timed['id']}")=='UNFULFILLED','Background worker failed incident expiry')
check(sql(f"SELECT COUNT(*) FROM dbo.AuditLog WHERE entity_id={timed['id']} AND action='RESERVATION_UNFULFILLED' AND actor_user_id IS NULL")=='1','Background expiry audit missing/duplicated')
check(detail(timed)['resolvedAt'] is not None,'Background resolution time missing')
issue(timed,True,expected=409)
ui1,_=reserve(7); ui2,_=reserve(8); ui3,_=reserve(9)
ui_walk=walk('W4',f'UI{TAG.upper()}0')
Path(os.environ['PARKING_TEST_WORK'],'operations-fixture.json').write_text(json.dumps({'database':DB,'staffEmail':accounts[0][1],'customerEmail':accounts[2][1],'reservations':[ui1,ui2,ui3],'walk':ui_walk,'plate':f'UI{TAG.upper()}0','newPlate':f'UI{TAG.upper()}1'}),encoding='utf-8')
print(f'PASS {passed} service-issue/plate API/data checks',flush=True)
