import PageHeader from '../../components/PageHeader'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Alert, Box, Button, Card, CardContent, Checkbox, FormControlLabel, MenuItem, Stack, TextField, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material'
import Layout from '../../components/Layout'
import { getErrorMessage, sessionAPI } from '../../services/api'
import { formatParkingTime } from '../../utils/reservationTime'
import { formatMoney } from '../../components/SessionReceipt'
import StaffActionDialog from '../../components/StaffActionDialog'

export default function CheckIn() {
  const [mode, setMode] = useState('reservation')
  const [slots, setSlots] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)
  const [code, setCode] = useState('')
  const [reservation, setReservation] = useState(null)
  const [looking, setLooking] = useState(false)
  const [form, setForm] = useState({ plateNumber: '', vehicleType: 'MOTORBIKE', slotId: '', reason: '', agreed: false })
  const [saving, setSaving] = useState(false)
  const [staffAction, setStaffAction] = useState(null), [notice, setNotice] = useState('')
  const pending = useRef(null), locked = useRef(false), revision = useRef(0), lookupRevision = useRef(0)
  const load = useCallback(async () => {
    const version = ++revision.current
    try {
      const { data } = await sessionAPI.getOperations()
      if (version === revision.current) { setSlots(data); setLoadError('') }
    } catch (err) { if (version === revision.current) { setSlots([]); setLoadError(getErrorMessage(err)) } }
    finally { if (version === revision.current) setLoading(false) }
  }, [])
  useEffect(() => {
    load(); const timer = setInterval(load, 30000)
    return () => { revision.current++; lookupRevision.current++; clearInterval(timer) }
  }, [load])
  const lookup = async event => {
    event.preventDefault(); const version = ++lookupRevision.current
    setLooking(true); setError(''); setResult(null); setNotice(''); setReservation(null)
    try {
      const { data } = await sessionAPI.findReservation(code.trim().toUpperCase())
      if (version === lookupRevision.current) {
        setReservation(data); setForm(previous => ({ ...previous, slotId: data.slotId, reason: '', agreed: false }))
      }
    } catch (err) { if (version === lookupRevision.current) setError(getErrorMessage(err)) }
    finally { if (version === lookupRevision.current) setLooking(false) }
  }
  const refreshReservation = async currentCode => {
    const version = ++lookupRevision.current
    setLooking(true); setReservation(null)
    try {
      const { data } = await sessionAPI.findReservation(currentCode)
      if (version === lookupRevision.current) setReservation(data)
    } catch (err) { if (version === lookupRevision.current) setError(getErrorMessage(err)) }
    finally { if (version === lookupRevision.current) setLooking(false) }
  }
  const issueSaved = async response => {
    const currentCode = reservation.reservationCode
    setStaffAction(null)
    setError('')
    setNotice(response.status === 'UNFULFILLED' ? 'Đã ghi nhận không phục vụ được. Lịch sử và lý do được giữ lại.' : 'Đã ghi nhận khách đến gặp sự cố. Hãy đối chiếu hạn xử lý bên dưới.')
    await refreshReservation(currentCode)
    await load()
  }
  const type = mode === 'reservation' ? reservation?.vehicleType : form.vehicleType
  const choices = slots.filter(s => s.vehicleType === type && s.acceptsReservations === (mode === 'reservation'))
  const replacement = mode === 'reservation' && reservation && Number(form.slotId) !== reservation.slotId
  const submit = async event => {
    event.preventDefault(); if (locked.current) return
    const data = mode === 'reservation'
      ? { slotId: Number(form.slotId), reservationCode: reservation.reservationCode,
          ...(replacement ? { replacementReason: form.reason.trim(), customerAgreed: form.agreed } : {}) }
      : { slotId: Number(form.slotId), plateNumber: form.plateNumber.trim(), vehicleType: form.vehicleType }
    const fingerprint = JSON.stringify(data)
    if (pending.current?.fingerprint !== fingerprint) pending.current = { fingerprint, key: crypto.randomUUID() }
    locked.current = true; setSaving(true); setError(''); setResult(null)
    try {
      const { data: received } = await sessionAPI.checkIn(data, pending.current.key)
      setResult(received); pending.current = null; setReservation(null); setCode('')
      setForm(previous => ({ ...previous, plateNumber: '', slotId: '', reason: '', agreed: false }))
      await load()
    } catch (err) {
      setError(getErrorMessage(err))
      if (err.response?.status === 409) {
        await load()
        if (mode === 'reservation') await refreshReservation(data.reservationCode)
      }
    }
    finally { locked.current = false; setSaving(false) }
  }
  return <Layout>
    <PageHeader title="Nhận xe vào bãi" eyebrow="Vận hành bãi" description={`${slots[0]?.parkingLotName || 'Bãi được phân công'} · Kiểm tra xe thực tế trước khi xác nhận.`} />
    {loadError && <Alert severity="error" sx={{ mb: 2 }}>{loadError}<Button onClick={load}>Tải lại vị trí</Button></Alert>}
    {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
    {notice && <Alert severity="success" sx={{ mb: 2 }}>{notice}</Alert>}
    {result && <Alert severity="success" sx={{ mb: 2 }}>Đã nhận xe! Mã phiên: {result.sessionCode}. Đơn giá: {formatMoney(result.appliedPricePerHour)}/giờ. <Link to={`/staff/checkout?query=${result.sessionCode}`}>Xem lượt gửi xe</Link></Alert>}
    <Card sx={{ borderRadius: 3, maxWidth: 760, mx: 'auto' }}><CardContent sx={{ p: { xs: 2, sm: 4 } }}>
      <ToggleButtonGroup value={mode} exclusive fullWidth disabled={saving || looking} onChange={(_, value) => {
        if (!value) return
        setMode(value); setReservation(null); setForm({ ...form, slotId: '', reason: '', agreed: false }); setError(''); setResult(null)
      }} sx={{ mb: 3 }}>
        <ToggleButton value="reservation">Có đặt chỗ trước</ToggleButton><ToggleButton value="walkin">Khách đến trực tiếp</ToggleButton>
      </ToggleButtonGroup>
      {mode === 'reservation' && <Box component="form" onSubmit={lookup} sx={{ mb: 3 }}>
        <Stack spacing={2}>
          <TextField required label="Mã đặt chỗ" value={code} disabled={saving || looking} slotProps={{ htmlInput: { maxLength: 40 } }} onChange={e => { setCode(e.target.value); setReservation(null); setForm({ ...form, slotId: '' }) }} />
          <Button type="submit" variant="outlined" disabled={looking || saving}>{looking ? 'Đang tra cứu…' : 'Tra cứu mã đặt chỗ'}</Button>
        </Stack>
      </Box>}
      {reservation && <Alert severity={reservation.status === 'CONFIRMED' ? 'info' : 'warning'} sx={{ mb: 2 }}>
        {reservation.plateNumber} · {reservation.parkingLotName} · {reservation.slotCode}<br />
        Dự kiến: {formatParkingTime(reservation.startTime)} → {formatParkingTime(reservation.endTime)} (giờ Việt Nam). Trạng thái: {reservation.status}.
      </Alert>}
      {reservation?.serviceIssueAt && <Alert severity={reservation.status === 'CONFIRMED' ? 'warning' : 'info'} sx={{ mb: 2 }}>
        Khách đến gặp sự cố: {formatParkingTime(reservation.serviceIssueAt)}.<br />
        Hạn giải quyết: {formatParkingTime(reservation.resolutionDeadline)}.<br />Lý do: {reservation.issueReason}
        {reservation.resolvedAt && <Typography variant="body2">Đã kết thúc xử lý: {formatParkingTime(reservation.resolvedAt)}.</Typography>}
      </Alert>}
      {reservation && <Stack direction="row" sx={{ gap: 1, flexWrap: 'wrap', mb: 2 }}>
        {reservation.status === 'CONFIRMED' && <>
          <Button color="warning" disabled={saving || looking || !reservation.canRecordIssue} onClick={() => setStaffAction({ kind: 'issue', id: reservation.id, code: reservation.reservationCode, plateNumber: reservation.plateNumber, deadline: reservation.expiresAt })}>Ghi nhận sự cố</Button>
          <Button color="error" disabled={saving || looking || !reservation.canMarkUnfulfilled} onClick={() => setStaffAction({ kind: 'unfulfilled', id: reservation.id, code: reservation.reservationCode, plateNumber: reservation.plateNumber, deadline: reservation.resolutionDeadline ?? reservation.expiresAt })}>Không phục vụ được</Button>
        </>}
        <Button disabled={saving || looking} onClick={() => refreshReservation(reservation.reservationCode)}>Cập nhật lượt đặt</Button>
      </Stack>}
      {(mode === 'walkin' || reservation?.status === 'CONFIRMED') && <Box component="form" onSubmit={submit}>
        <Stack spacing={2}>
          {mode === 'walkin' && <>
            <TextField required label="Biển số xe" disabled={saving} value={form.plateNumber} slotProps={{ htmlInput: { maxLength: 32 } }} onChange={e => setForm({ ...form, plateNumber: e.target.value })} />
            <TextField select label="Loại xe" disabled={saving} value={form.vehicleType} onChange={e => setForm({ ...form, vehicleType: e.target.value, slotId: '' })}>
              <MenuItem value="MOTORBIKE">Xe máy</MenuItem><MenuItem value="CAR">Ô tô</MenuItem>
            </TextField>
            <Alert severity="info">Chỉ dùng nhóm vị trí dành cho khách đến trực tiếp. Không tự gán lượt gửi vào tài khoản theo biển số.</Alert>
          </>}
          <TextField select required label="Vị trí thực tế" disabled={saving || loading || Boolean(loadError)} value={form.slotId} onChange={e => setForm({ ...form, slotId: e.target.value, reason: '', agreed: false })}>
            {choices.map(s => <MenuItem key={s.id} value={s.id} disabled={!s.isActive || s.status !== 'AVAILABLE' || s.isInBuffer || s.openSessionId != null}>
              {s.zoneName} · {s.code}{s.isInBuffer ? ' — Đang chờ hết đệm' : s.status !== 'AVAILABLE' || !s.isActive ? ' — Chưa phục vụ được' : ''}
            </MenuItem>)}
          </TextField>
          {!loading && !choices.length && <Alert severity="warning">Chưa có vị trí thuộc nhóm và loại xe này.</Alert>}
          {replacement && <>
            <TextField required label="Lý do đổi vị trí" value={form.reason} disabled={saving} slotProps={{ htmlInput: { maxLength: 1000 } }} onChange={e => setForm({ ...form, reason: e.target.value })} />
            <FormControlLabel control={<Checkbox checked={form.agreed} disabled={saving} onChange={e => setForm({ ...form, agreed: e.target.checked })} />} label="Khách đã đồng ý đổi vị trí" />
          </>}
          <Alert severity="info">Lượt đặt được nhận sớm tối đa 15 phút, trước hạn no-show hoặc trước hạn xử lý sự cố đã ghi nhận. Hệ thống kiểm tra lại vị trí và thời gian khi nhận xe.</Alert>
          <Button type="submit" variant="contained" color="success" disabled={saving || looking || loading || Boolean(loadError) || !form.slotId || (replacement && (!form.agreed || !form.reason.trim()))}>{saving ? 'Đang nhận xe…' : 'Xác nhận xe vào'}</Button>
          <Button disabled={saving} onClick={load}>Cập nhật vị trí</Button>
        </Stack>
      </Box>}
      {loading && <Typography>Đang tải vị trí…</Typography>}
    </CardContent></Card>
    <StaffActionDialog action={staffAction} onClose={() => setStaffAction(null)} onSuccess={issueSaved} />
  </Layout>
}
