import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Alert, Box, Button, Card, Chip, Dialog, DialogActions, DialogContent, DialogTitle, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@mui/material'
import Layout from '../../components/Layout'
import { getErrorMessage, reservationAPI } from '../../services/api'
import { formatParkingTime } from '../../utils/reservationTime'

const statuses = {
  CONFIRMED: ['Đã xác nhận', 'success'], CHECKED_IN: ['Đang gửi xe', 'info'],
  COMPLETED: ['Hoàn thành', 'primary'], CANCELLED: ['Đã hủy', 'error'],
  EXPIRED: ['Hết hạn', 'default'], UNFULFILLED: ['Không phục vụ được', 'warning']
}
const PAGE_SIZE = 20
export default function ReservationHistory() {
  const location = useLocation()
  const navigate = useNavigate()
  const [rows, setRows] = useState([])
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState(location.state?.reservationCode ? `Đặt chỗ thành công! Mã: ${location.state.reservationCode}` : '')
  const [selected, setSelected] = useState(null)
  const [saving, setSaving] = useState(false)
  const pending = useRef(new Map())
  const savingRef = useRef(false)
  const generation = useRef(0)
  useEffect(() => {
    if (location.state?.reservationCode) navigate(location.pathname, { replace: true, state: null })
  }, [location.state, location.pathname, navigate])
  const load = useCallback(async () => {
    const current = ++generation.current
    setLoading(true)
    try {
      const { data } = await reservationAPI.getMyReservations(page, PAGE_SIZE)
      if (current === generation.current) { setRows(data); setError('') }
    } catch (err) {
      if (current === generation.current) { setRows([]); setError(getErrorMessage(err)) }
    } finally { if (current === generation.current) setLoading(false) }
  }, [page])
  useEffect(() => {
    load()
    const timer = setInterval(load, 30000)
    return () => { generation.current++; clearInterval(timer) }
  }, [load])
  const cancel = async () => {
    if (savingRef.current) return
    const id = selected.id
    if (!pending.current.has(id)) pending.current.set(id, crypto.randomUUID())
    savingRef.current = true; setSaving(true); setError('')
    try {
      await reservationAPI.cancel(id, pending.current.get(id))
      pending.current.delete(id); setSelected(null); setNotice('Đã hủy lượt đặt chỗ.'); await load()
    } catch (err) { setError(getErrorMessage(err)) }
    finally { savingRef.current = false; setSaving(false) }
  }
  return <Layout>
    <Stack direction={{ xs: 'column', sm: 'row' }} sx={{ justifyContent: 'space-between', alignItems: { sm: 'center' }, gap: 2, mb: 3, p: 3, borderRadius: 3, color: 'white', background: 'linear-gradient(135deg, #7c3aed, #a78bfa)' }}>
      <Box><Typography variant="h5" sx={{ fontWeight: 700 }}>Lịch sử đặt chỗ</Typography><Typography sx={{ opacity: 0.9 }}>Thời gian hiển thị theo giờ Việt Nam · tự cập nhật mỗi 30 giây.</Typography></Box>
      <Button component={Link} to="/customer/search" variant="contained" sx={{ flexShrink: 0, bgcolor: 'white', color: '#7c3aed', '&:hover': { bgcolor: '#faf5ff' } }}>Đặt chỗ mới</Button>
    </Stack>
    {notice && <Alert severity="success" onClose={() => setNotice('')} sx={{ mb: 2 }}>{notice}</Alert>}
    {error && <Alert severity="error" sx={{ mb: 2 }}>{error}<Button onClick={load} disabled={loading}>Tải lại</Button></Alert>}
    <Card sx={{ borderRadius: 3 }}><TableContainer><Table>
      <TableHead><TableRow sx={{ bgcolor: '#faf5ff' }}>{['Mã đặt chỗ', 'Bãi / vị trí', 'Phương tiện', 'Thời gian', 'Trạng thái', 'Thao tác'].map(label => <TableCell key={label} sx={{ fontWeight: 700, color: '#7c3aed' }}>{label}</TableCell>)}</TableRow></TableHead>
      <TableBody>
        {loading ? <TableRow><TableCell colSpan={6} align="center">Đang tải lịch đặt…</TableCell></TableRow> : !rows.length ? <TableRow><TableCell colSpan={6} align="center">{error ? 'Chưa tải được dữ liệu.' : page === 1 ? 'Chưa có lượt đặt chỗ nào' : 'Không có lượt đặt ở trang này.'}</TableCell></TableRow> : rows.map(row => {
          const [label, color] = statuses[row.status] || [row.status, 'default']
          return <TableRow key={row.id} hover>
            <TableCell sx={{ maxWidth: 180, overflowWrap: 'anywhere' }}>{row.reservationCode}</TableCell>
            <TableCell>{row.parkingLotName}<Typography variant="body2" sx={{ color: 'text.secondary' }}>{row.zoneName} · {row.slotCode}</Typography></TableCell>
            <TableCell>{row.plateNumber}<Typography variant="body2">{row.vehicleType === 'CAR' ? 'Ô tô' : 'Xe máy'}</Typography></TableCell>
            <TableCell><Typography variant="body2">{formatParkingTime(row.startTime)}</Typography><Typography variant="body2">→ {formatParkingTime(row.endTime)}</Typography></TableCell>
            <TableCell><Chip label={label} color={color} size="small" /></TableCell>
            <TableCell>{row.canCancel && Date.now() < Date.parse(row.startTime) && <Button color="error" disabled={saving} onClick={() => { setSelected(row); setError('') }}>Hủy</Button>}</TableCell>
          </TableRow>
        })}
      </TableBody>
    </Table></TableContainer></Card>
    <Stack direction="row" sx={{ justifyContent: 'flex-end', alignItems: 'center', gap: 2, mt: 2, flexWrap: 'wrap' }}>
      <Button disabled={loading || saving || page === 1} onClick={() => setPage(page - 1)}>Trang trước</Button>
      <Typography>Trang {page}</Typography>
      <Button disabled={loading || saving || rows.length < PAGE_SIZE || page >= 1000000} onClick={() => setPage(page + 1)}>Trang sau</Button>
      <Button disabled={loading || saving} onClick={load}>Làm mới</Button>
    </Stack>
    <Dialog open={Boolean(selected)} onClose={() => { if (!saving) setSelected(null) }}>
      <DialogTitle>Hủy đặt chỗ</DialogTitle>
      <DialogContent>
        <Typography>Bạn muốn hủy lượt {selected?.reservationCode}? Chỉ có thể hủy trước giờ bắt đầu.</Typography>
        {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
      </DialogContent>
      <DialogActions><Button disabled={saving} onClick={() => setSelected(null)}>Đóng</Button><Button disabled={saving} color="error" onClick={cancel}>{saving ? 'Đang hủy…' : 'Xác nhận hủy'}</Button></DialogActions>
    </Dialog>
  </Layout>
}
