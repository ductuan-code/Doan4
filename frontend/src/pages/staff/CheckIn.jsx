import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Alert, Box, Button, Card, CardContent, Checkbox, FormControlLabel, MenuItem, Stack, TextField, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material'
import Layout from '../../components/Layout'
import { getErrorMessage, sessionAPI } from '../../services/api'
import { formatParkingTime } from '../../utils/reservationTime'
import { formatMoney } from '../../components/SessionReceipt'

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
    setLooking(true); setError(''); setResult(null); setReservation(null)
    try {
      const { data } = await sessionAPI.findReservation(code.trim().toUpperCase())
      if (version === lookupRevision.current) {
        setReservation(data); setForm(previous => ({ ...previous, slotId: data.slotId, reason: '', agreed: false }))
      }
    } catch (err) { if (version === lookupRevision.current) setError(getErrorMessage(err)) }
    finally { if (version === lookupRevision.current) setLooking(false) }
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
    } catch (err) { setError(getErrorMessage(err)); if (err.response?.status === 409) await load() }
    finally { locked.current = false; setSaving(false) }
  }
  return <Layout>
    <Box sx={{ background: 'linear-gradient(135deg, #059669, #34d399)', borderRadius: 3, p: 3, mb: 3, color: 'white' }}>
      <Typography variant="h5" sx={{ fontWeight: 700 }}>Nhận xe vào bãi</Typography>
      <Typography>{slots[0]?.parkingLotName || 'Bãi được phân công'} · Kiểm tra xe thực tế trước khi xác nhận.</Typography>
    </Box>
    {loadError && <Alert severity="error" sx={{ mb: 2 }}>{loadError}<Button onClick={load}>Tải lại vị trí</Button></Alert>}
    {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
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
          <Alert severity="info">Lượt đặt được nhận sớm tối đa 15 phút, trước hạn no-show. Server kiểm tra lại vị trí và thời gian khi nhận xe.</Alert>
          <Button type="submit" variant="contained" color="success" disabled={saving || looking || loading || Boolean(loadError) || !form.slotId || (replacement && (!form.agreed || !form.reason.trim()))}>{saving ? 'Đang nhận xe…' : 'Xác nhận xe vào'}</Button>
          <Button disabled={saving} onClick={load}>Cập nhật vị trí</Button>
        </Stack>
      </Box>}
      {loading && <Typography>Đang tải vị trí…</Typography>}
    </CardContent></Card>
  </Layout>
}
