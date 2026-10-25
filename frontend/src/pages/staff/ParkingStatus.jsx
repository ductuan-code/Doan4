import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Alert, Box, Button, Card, Chip, MenuItem, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography } from '@mui/material'
import Layout from '../../components/Layout'
import SlotMaintenanceDialog from '../../components/SlotMaintenanceDialog'
import { StatCards } from '../../components/ReportingWidgets'
import { getErrorMessage, sessionAPI } from '../../services/api'
import { formatParkingTime } from '../../utils/reservationTime'

const states = { AVAILABLE: ['Chưa có xe', 'success'], OCCUPIED: ['Có xe', 'info'], MAINTENANCE: ['Bảo trì', 'warning'], BUFFER: ['Còn đệm', 'default'], INACTIVE: ['Ngừng hoạt động', 'default'] }
const displayState = slot => !slot.isActive ? 'INACTIVE' : slot.status === 'AVAILABLE' && slot.isInBuffer ? 'BUFFER' : slot.status
const emptyFilters = { zone: 'all', type: 'all', group: 'all', state: 'all', query: '' }
export default function ParkingStatus() {
  const [slots, setSlots] = useState([]), [filters, setFilters] = useState(emptyFilters)
  const [loading, setLoading] = useState(true), [error, setError] = useState(''), [notice, setNotice] = useState('')
  const [loaded, setLoaded] = useState(false)
  const [action, setAction] = useState(null)
  const revision = useRef(0), currentLot = useRef(null)
  const load = useCallback(async () => {
    const version = ++revision.current
    setLoading(true)
    try {
      const { data } = await sessionAPI.getOperations()
      if (version !== revision.current) return
      const lot = data[0]?.parkingLotId ?? null
      if (currentLot.current !== lot) setFilters(emptyFilters)
      currentLot.current = lot
      setSlots(data); setError(''); setLoaded(true)
    } catch (e) { if (version === revision.current) { setSlots([]); setError(getErrorMessage(e)) } }
    finally { if (version === revision.current) setLoading(false) }
  }, [])
  useEffect(() => {
    load(); const timer = setInterval(load, 30000)
    return () => { revision.current++; clearInterval(timer) }
  }, [load])
  const zones = useMemo(() => [...new Map(slots.map(s => [s.zoneId, `${s.zoneName}${s.floorLabel ? ` · ${s.floorLabel}` : ''}`])).entries()], [slots])
  const filtered = slots.filter(s => (filters.zone === 'all' || s.zoneId === filters.zone)
    && (filters.type === 'all' || s.vehicleType === filters.type)
    && (filters.group === 'all' || s.acceptsReservations === (filters.group === 'reserved'))
    && (filters.state === 'all' || (filters.state === 'BUFFER' ? s.isActive && s.isInBuffer : displayState(s) === filters.state))
    && `${s.code} ${s.zoneName} ${s.plateNumber ?? ''}`.toLocaleLowerCase('vi-VN').includes(filters.query.trim().toLocaleLowerCase('vi-VN')))
  const change = (key, value) => setFilters(f => ({ ...f, [key]: value }))
  const active = slots.filter(s => s.isActive)
  const select = (name, label, options) => <TextField select label={label} value={filters[name]} onChange={e => change(name, e.target.value)} sx={{ minWidth: 180 }}>
    <MenuItem value="all">Tất cả</MenuItem>{options.map(([value, title]) => <MenuItem key={value} value={value}>{title}</MenuItem>)}
  </TextField>
  return <Layout>
    <Stack direction={{ xs: 'column', sm: 'row' }} sx={{ gap: 2, justifyContent: 'space-between', mb: 2 }}>
      <Box><Typography variant="h4">Trạng thái bãi và bảo trì</Typography>
        <Typography sx={{ color: 'text.secondary', mt: 1 }}>{slots[0]?.parkingLotName ?? 'Bãi được phân công'} · Tự cập nhật mỗi 30 giây</Typography></Box>
      <Button variant="outlined" disabled={loading} onClick={load}>Làm mới vị trí</Button>
    </Stack>
    {notice && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setNotice('')}>{notice}</Alert>}
    {error && <Alert severity="error" sx={{ mb: 2 }}>{error} Nhấn Làm mới vị trí để thử lại.</Alert>}
    {loading && <Typography role="status" sx={{ mb: 2 }}>Đang tải trạng thái bãi…</Typography>}
    {loaded && !error && <>
      <StatCards items={[
        { label: 'Vị trí hoạt động', value: active.length }, { label: 'Vị trí có xe', value: active.filter(s => s.status === 'OCCUPIED').length },
        { label: 'Vị trí bảo trì', value: active.filter(s => s.status === 'MAINTENANCE').length },
        { label: 'Vị trí còn đệm', value: active.filter(s => s.isInBuffer).length }
      ]} />
      <Alert severity="info" sx={{ mb: 2 }}>Số liệu trên tính các vị trí hoạt động trong toàn bãi. Chỗ chưa có xe có thể có lịch đặt; số lịch còn hiệu lực không đồng nghĩa với số xe đang gửi. Bảo trì không hủy lịch đặt hoặc xóa thời gian đệm.</Alert>
      <Stack direction={{ xs: 'column', sm: 'row' }} sx={{ gap: 2, flexWrap: 'wrap', mb: 2 }}>
        {select('zone', 'Khu vực', zones)}
        {select('type', 'Loại xe', [['CAR', 'Ô tô'], ['MOTORBIKE', 'Xe máy']])}
        {select('group', 'Nhóm vị trí', [['reserved', 'Đặt trước'], ['walkin', 'Khách trực tiếp']])}
        {select('state', 'Trạng thái vị trí', Object.entries(states).map(([id, value]) => [id, value[0]]))}
        <TextField label="Tìm mã vị trí, khu hoặc biển số" value={filters.query} onChange={e => change('query', e.target.value)} slotProps={{ htmlInput: { maxLength: 150 } }} sx={{ minWidth: 220, flex: 1 }} />
        <Button onClick={() => setFilters(emptyFilters)}>Xóa bộ lọc</Button>
      </Stack>
      <Typography variant="body2" sx={{ mb: 1, color: 'text.secondary' }}>Hiển thị {filtered.length} / {slots.length} vị trí.</Typography>
      <TableContainer component={Card}><Table sx={{ minWidth: 1100 }}>
        <TableHead><TableRow>{['Vị trí / khu vực', 'Loại xe / nhóm', 'Vận hành', 'Cấu hình', 'Khoảng đệm', 'Lịch còn hiệu lực', 'Xe đang gửi', 'Thao tác'].map(t => <TableCell key={t}>{t}</TableCell>)}</TableRow></TableHead>
        <TableBody>{filtered.map(s => {
          const status = states[s.status] ?? [s.status, 'default']
          const busy = s.status === 'OCCUPIED' || s.openSessionId !== null
          return <TableRow key={s.id} aria-label={`${s.zoneName} · ${s.code}`}>
            <TableCell sx={{ fontWeight: 600 }}>{s.code}<Typography variant="body2" sx={{ color: 'text.secondary' }}>{s.zoneName}{s.floorLabel ? ` · ${s.floorLabel}` : ''}</Typography></TableCell>
            <TableCell>{s.vehicleType === 'CAR' ? 'Ô tô' : 'Xe máy'}<Typography variant="body2">{s.acceptsReservations ? 'Đặt trước' : 'Khách trực tiếp'}</Typography></TableCell>
            <TableCell><Chip size="small" label={status[0]} color={status[1]} /></TableCell>
            <TableCell><Chip size="small" label={s.isActive ? 'Hoạt động' : 'Ngừng hoạt động'} color={s.isActive ? 'success' : 'default'} /></TableCell>
            <TableCell>{s.isInBuffer ? <><Chip size="small" label="Còn đệm" /><Typography variant="body2">Đến {formatParkingTime(s.bufferUntil)}</Typography></> : '—'}</TableCell>
            <TableCell>{s.confirmedReservationCount}</TableCell>
            <TableCell>{s.plateNumber || '—'}{s.openSessionId && s.plateNumber && <Button component={Link} to={`/staff/checkout?query=${encodeURIComponent(s.plateNumber)}`} size="small">Xem lượt gửi</Button>}</TableCell>
            <TableCell><Button color={s.status === 'MAINTENANCE' ? 'success' : 'warning'} disabled={busy}
              onClick={() => setAction({ ...s, isMaintenance: s.status !== 'MAINTENANCE' })}>{s.status === 'MAINTENANCE' ? 'Kết thúc bảo trì' : 'Bảo trì'}</Button>
              {busy && <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary' }}>Có xe, chưa thể bảo trì</Typography>}</TableCell>
          </TableRow>
        })}{!filtered.length && <TableRow><TableCell colSpan={8}>{slots.length ? 'Không có vị trí phù hợp với bộ lọc.' : 'Chưa có vị trí trong bãi được phân công.'}</TableCell></TableRow>}</TableBody>
      </Table></TableContainer>
    </>}
    <SlotMaintenanceDialog action={action} onClose={() => setAction(null)} onSuccess={async code => {
      setAction(null); setNotice(`Đã lưu thao tác bảo trì cho vị trí ${code}.`); await load()
    }} />
  </Layout>
}
