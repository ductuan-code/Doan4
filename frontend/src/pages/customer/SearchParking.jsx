import PageHeader from '../../components/PageHeader'
import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Alert, Box, Button, Card, CardContent, Chip, CircularProgress, MenuItem, Stack, Step, StepLabel, Stepper, TextField, Typography } from '@mui/material'
import Layout from '../../components/Layout'
import { getErrorMessage, parkingLotAPI, reservationAPI, vehicleAPI } from '../../services/api'
import { formatParkingTime, toUtc, vietnamInput } from '../../utils/reservationTime'

export default function SearchParking() {
  const navigate = useNavigate()
  const [lots, setLots] = useState([])
  const [vehicles, setVehicles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [conflict, setConflict] = useState('')
  const [step, setStep] = useState(0)
  const [busy, setBusy] = useState(false)
  const busyRef = useRef(false)
  const [form, setForm] = useState(() => ({ lotId: '', vehicleId: '',
    startTime: vietnamInput(new Date(Date.now() + 15 * 60000)), endTime: vietnamInput(new Date(Date.now() + 75 * 60000)) }))
  const [search, setSearch] = useState(null)
  const [slots, setSlots] = useState([])
  const [slot, setSlot] = useState(null)
  const [refreshing, setRefreshing] = useState(false)
  const [updatedAt, setUpdatedAt] = useState(null)
  const request = useRef(null)
  const load = async () => {
    setLoading(true); setError('')
    try {
      const [lotResponse, vehicleResponse] = await Promise.all([parkingLotAPI.getAll(), vehicleAPI.getAll()])
      setLots(lotResponse.data); setVehicles(vehicleResponse.data.filter(v => v.isActive))
    } catch (err) { setError(getErrorMessage(err)) }
    finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])
  useEffect(() => {
    if (!search) return
    let active = true, controller, running = false
    const refresh = async () => {
      if (running) return
      running = true; controller = new AbortController(); setRefreshing(true)
      try {
        const { data } = await parkingLotAPI.getAvailability(search.lotId, search.params, controller.signal)
        if (!active) return
        setSlots(data); setUpdatedAt(new Date()); setError('')
      } catch (err) {
        if (active && err.code !== 'ERR_CANCELED') { setSlots([]); setError(getErrorMessage(err)) }
      } finally { running = false; if (active) setRefreshing(false) }
    }
    refresh()
    const timer = setInterval(refresh, 30000)
    return () => { active = false; controller?.abort(); clearInterval(timer) }
  }, [search])
  const find = event => {
    event.preventDefault()
    try {
      const start = toUtc(form.startTime), end = toUtc(form.endTime)
      const duration = Date.parse(end) - Date.parse(start)
      if (Date.parse(start) <= Date.now() || Date.parse(start) > Date.now() + 7 * 86400000 || duration < 30 * 60000 || duration > 24 * 3600000)
        throw new Error('Chọn giờ bắt đầu trong 7 ngày tới và thời gian gửi từ 30 phút đến 24 giờ.')
      setSearch({ lotId: Number(form.lotId), params: { vehicleId: Number(form.vehicleId), startTime: start, endTime: end } })
      setSlot(null); setSlots([]); setUpdatedAt(null); setStep(1); setError(''); setConflict(''); request.current = null
    } catch (err) { setError(err.message || 'Thời gian không hợp lệ.') }
  }
  const confirm = async () => {
    if (busyRef.current) return
    const data = { ...search.params, slotId: slot.id }, fingerprint = JSON.stringify(data)
    if (request.current?.fingerprint !== fingerprint) request.current = { fingerprint, key: crypto.randomUUID() }
    busyRef.current = true; setBusy(true); setError('')
    try {
      const result = await reservationAPI.create(data, request.current.key)
      request.current = null
      navigate('/customer/history', { state: { reservationCode: result.data.reservationCode } })
    } catch (err) {
      setError(getErrorMessage(err))
      if (err.response?.status === 409) { setConflict(getErrorMessage(err)); setSlot(null); setStep(1); setSearch({ ...search }) }
    } finally { busyRef.current = false; setBusy(false) }
  }
  const lot = lots.find(l => l.id === search?.lotId)
  const vehicle = vehicles.find(v => v.id === search?.params.vehicleId)
  return <Layout>
    <PageHeader title="Tìm bãi đỗ xe" eyebrow="Đặt chỗ trực tuyến" description="Chọn phương tiện và thời gian. Chúng tôi sẽ tìm vị trí phù hợp với chuyến đi của bạn." />
    <Card sx={{ borderRadius: 3, mb: 3 }}><CardContent>
      <Stepper activeStep={step} alternativeLabel sx={{ '& .MuiStepLabel-label': { fontSize: { xs: 11, sm: 13 } }, '& .MuiStepConnector-line': { borderColor: '#d6e5df' } }}>{['Chọn xe, bãi và thời gian', 'Chọn vị trí', 'Xác nhận'].map(label => <Step key={label}><StepLabel>{label}</StepLabel></Step>)}</Stepper>
    </CardContent></Card>
    {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
    {loading ? <CircularProgress aria-label="Đang tải bãi và xe" /> : step === 0 ? <Card sx={{ borderRadius: 3, maxWidth: 820, mx: 'auto' }}><CardContent>
      {!vehicles.length || !lots.length ? <Alert severity="info">
        {!vehicles.length ? <>Bạn cần thêm phương tiện đang hoạt động trước khi đặt chỗ. <Link to="/customer/vehicles">Quản lý phương tiện</Link></> : 'Chưa có bãi đang hoạt động.'}
      </Alert> : <Box component="form" onSubmit={find}>
        <Stack spacing={2}>
          <TextField select required label="Phương tiện" value={form.vehicleId} onChange={e => setForm({ ...form, vehicleId: e.target.value })}>
            {vehicles.map(v => <MenuItem key={v.id} value={v.id}>{v.plateNumber} — {v.vehicleType === 'CAR' ? 'Ô tô' : 'Xe máy'}</MenuItem>)}
          </TextField>
          <TextField select required label="Bãi đỗ" value={form.lotId} onChange={e => setForm({ ...form, lotId: e.target.value })}>
            {lots.map(l => <MenuItem key={l.id} value={l.id}>{l.name}</MenuItem>)}
          </TextField>
          <TextField required type="datetime-local" label="Giờ bắt đầu" slotProps={{ inputLabel: { shrink: true } }} value={form.startTime} onChange={e => setForm({ ...form, startTime: e.target.value })} />
          <TextField required type="datetime-local" label="Giờ kết thúc" slotProps={{ inputLabel: { shrink: true } }} value={form.endTime} onChange={e => setForm({ ...form, endTime: e.target.value })} />
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>Giờ Việt Nam (UTC+7). Đặt trước tối đa 7 ngày, mỗi lượt từ 30 phút đến 24 giờ.</Typography>
          <Button type="submit" variant="contained">Tìm chỗ trống</Button>
        </Stack>
      </Box>}
      <Button onClick={load} sx={{ mt: 2 }}>Tải lại danh sách bãi và xe</Button>
    </CardContent></Card> : step === 1 ? <Card sx={{ borderRadius: 3 }}><CardContent>
      <Typography variant="h6">{lot?.name}</Typography>
      <Typography sx={{ color: 'text.secondary', mb: 1 }}>{lot?.address}</Typography>
      <Typography sx={{ mb: 2 }}>{vehicle?.plateNumber} · {formatParkingTime(search.params.startTime)} → {formatParkingTime(search.params.endTime)}</Typography>
      <Alert severity="info" sx={{ mb: 2 }}>Chỉ hiển thị vị trí đặt được cho xe và khung giờ đã chọn. Chỗ được kiểm tra lại khi xác nhận.</Alert>
      {conflict && <Alert severity="warning" sx={{ mb: 2 }}>{conflict} Vui lòng chọn lại vị trí hoặc đổi điều kiện.</Alert>}
      {refreshing && <Typography role="status">Đang kiểm tra chỗ trống…</Typography>}
      {!refreshing && !error && slots.length === 0 && <Alert severity="warning">Không còn vị trí phù hợp. Bạn hãy chọn bãi hoặc khung giờ khác.</Alert>}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 2, my: 2 }}>
        {slots.map(s => <Button key={s.id} variant="outlined" disabled={refreshing} sx={{ py: 3 }} onClick={() => { setSlot(s); setStep(2); setError(''); setConflict('') }}>
          {s.zoneName} · {s.code}
        </Button>)}
      </Box>
      {updatedAt && <Typography variant="caption">Cập nhật {formatParkingTime(updatedAt)} · tự tải lại mỗi 30 giây.</Typography>}
      <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
        <Button onClick={() => { setSearch(null); setStep(0); setError('') }}>Đổi điều kiện</Button>
        <Button disabled={refreshing} onClick={() => setSearch({ ...search })}>Kiểm tra lại chỗ trống</Button>
      </Stack>
    </CardContent></Card> : <Card sx={{ borderRadius: 3, maxWidth: 680, mx: 'auto' }}><CardContent>
      <Typography variant="h6" sx={{ mb: 2 }}>Xác nhận đặt chỗ</Typography>
      <Stack spacing={2}>
        <Typography>{lot?.name} · {slot?.zoneName} · {slot?.code}</Typography>
        <Chip label={vehicle?.plateNumber} sx={{ alignSelf: 'start' }} />
        <Typography>Từ: {formatParkingTime(search.params.startTime)} (giờ Việt Nam)</Typography>
        <Typography>Đến: {formatParkingTime(search.params.endTime)} (giờ Việt Nam)</Typography>
        <Alert severity="info">Có thể đến sớm tối đa 15 phút. Lượt đặt hết hạn nếu chưa vào bãi sau giờ bắt đầu 15 phút. Chỉ hủy trước giờ bắt đầu. Thanh toán tại quầy khi xe ra.</Alert>
        <Button disabled={busy} variant="contained" color="success" onClick={confirm}>{busy ? 'Đang đặt…' : 'Xác nhận đặt chỗ'}</Button>
        <Button disabled={busy} onClick={() => setStep(1)}>Quay lại chọn vị trí</Button>
      </Stack>
    </CardContent></Card>}
  </Layout>
}
