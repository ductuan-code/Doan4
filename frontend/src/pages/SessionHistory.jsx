import { useCallback, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Alert, Box, Button, Card, Checkbox, Chip, Dialog, DialogActions, DialogContent, DialogTitle, FormControlLabel, MenuItem, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography } from '@mui/material'
import Layout from '../components/Layout'
import SessionReceipt from '../components/SessionReceipt'
import { useAuth } from '../context/AuthContext'
import { getErrorMessage, sessionAPI } from '../services/api'
import { formatParkingTime } from '../utils/reservationTime'

const SIZE = 20
export default function SessionHistory() {
  const { user } = useAuth(), staff = user.role === 'Staff'
  const [searchParams] = useSearchParams()
  const [query, setQuery] = useState(searchParams.get('query') || '')
  const [filters, setFilters] = useState({ query: searchParams.get('query') || '', status: staff ? 'OPEN' : '' })
  const [page, setPage] = useState(1), [rows, setRows] = useState([]), [loading, setLoading] = useState(true)
  const [error, setError] = useState(''), [notice, setNotice] = useState('')
  const [selected, setSelected] = useState(null), [fee, setFee] = useState(null), [detailError, setDetailError] = useState('')
  const [detailLoading, setDetailLoading] = useState(false), [dialogOpen, setDialogOpen] = useState(false)
  const [method, setMethod] = useState('CASH'), [confirmed, setConfirmed] = useState(false), [saving, setSaving] = useState(false)
  const revision = useRef(0), detailRevision = useRef(0), locked = useRef(false), pending = useRef(null)
  const load = useCallback(async () => {
    const version = ++revision.current
    setLoading(true)
    try {
      const { data } = await sessionAPI.getAll({ ...filters, status: filters.status || undefined, query: filters.query || undefined, page, pageSize: SIZE })
      if (version === revision.current) { setRows(data); setError('') }
    } catch (err) { if (version === revision.current) { setRows([]); setError(getErrorMessage(err)) } }
    finally { if (version === revision.current) setLoading(false) }
  }, [filters, page])
  useEffect(() => {
    load(); const timer = setInterval(load, 30000)
    return () => { revision.current++; clearInterval(timer) }
  }, [load])
  useEffect(() => () => { detailRevision.current++ }, [])
  const open = async id => {
    const version = ++detailRevision.current
    setDialogOpen(true); setDetailLoading(true); setDetailError(''); setConfirmed(false)
    setSelected({ id }); setFee(null)
    try {
      const [sessionResponse, feeResponse] = await Promise.all([sessionAPI.getById(id), sessionAPI.getFee(id)])
      if (version === detailRevision.current) { setSelected(sessionResponse.data); setFee(feeResponse.data) }
    } catch (err) { if (version === detailRevision.current) setDetailError(getErrorMessage(err)) }
    finally { if (version === detailRevision.current) setDetailLoading(false) }
  }
  const checkout = async () => {
    if (locked.current || !confirmed || !selected || !fee) return
    const id = selected.id, data = { paymentMethod: method, confirmedAmount: fee.amount }
    const fingerprint = JSON.stringify({ id, ...data })
    if (pending.current?.fingerprint !== fingerprint) pending.current = { fingerprint, key: crypto.randomUUID() }
    locked.current = true; setSaving(true); setDetailError('')
    try {
      const { data: result } = await sessionAPI.checkOut(id, data, pending.current.key)
      pending.current = null; setConfirmed(false)
      // Hiển thị kết quả đã commit ngay cả khi truy vấn phiếu thu sau đó mất mạng.
      setSelected(previous => ({ ...previous, status: 'COMPLETED', paymentId: result.paymentId, totalFee: result.amount,
        paidAmount: result.amount, billableHours: result.billableHours, checkOutTime: result.checkOutTime, paidAt: result.checkOutTime, paymentMethod: method, isOverstay: false }))
      setNotice(`Đã thu tiền và xác nhận xe ra. Phiếu thu #${result.paymentId}.`)
      await load()
    } catch (err) {
      if (err.response?.status === 409) {
        // Không tự thu lại theo giá mới: tải lại và bắt buộc nhân viên xác nhận lần nữa.
        await open(id)
        setDetailError(`${getErrorMessage(err)} Vui lòng đối chiếu lại trạng thái và phí trước khi xác nhận.`)
      } else setDetailError(getErrorMessage(err))
    } finally { locked.current = false; setSaving(false) }
  }
  const close = () => { if (!saving) { detailRevision.current++; setDialogOpen(false); setSelected(null); setFee(null) } }
  return <Layout>
    <Box sx={{ background: staff ? 'linear-gradient(135deg, #dc2626, #f87171)' : 'linear-gradient(135deg, #2563eb, #60a5fa)', borderRadius: 3, p: 3, mb: 3, color: 'white' }}>
      <Typography variant="h5" sx={{ fontWeight: 700 }}>{staff ? 'Xe ra và thu tiền' : 'Lịch sử gửi xe'}</Typography>
      <Typography>{staff ? 'Chỉ hiển thị lượt gửi trong bãi được phân công.' : 'Lượt gửi của bạn và phiếu thu sau khi thanh toán.'} Tự tải lại mỗi 30 giây.</Typography>
    </Box>
    {notice && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setNotice('')}>{notice}</Alert>}
    {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
    <Box component="form" onSubmit={e => { e.preventDefault(); setPage(1); setFilters({ ...filters, query: query.trim() }) }} sx={{ mb: 3 }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
        <TextField label="Biển số hoặc mã phiên" value={query} onChange={e => setQuery(e.target.value)} slotProps={{ htmlInput: { maxLength: 40 } }} sx={{ flex: 1 }} />
        <TextField select label="Trạng thái" value={filters.status} onChange={e => { setPage(1); setFilters({ ...filters, status: e.target.value }) }} sx={{ minWidth: 180 }}>
          <MenuItem value="">Tất cả</MenuItem><MenuItem value="OPEN">Đang gửi</MenuItem><MenuItem value="COMPLETED">Đã kết thúc</MenuItem>
        </TextField>
        <Button type="submit" variant="contained" disabled={loading}>Tra cứu</Button><Button onClick={load} disabled={loading}>Làm mới</Button>
      </Stack>
    </Box>
    <Card sx={{ borderRadius: 3 }}><TableContainer><Table>
      <TableHead><TableRow sx={{ bgcolor: '#f8faff' }}>{['Mã phiên', 'Biển số', 'Bãi / vị trí', 'Giờ vào', 'Trạng thái', 'Thao tác'].map(label => <TableCell key={label} sx={{ fontWeight: 700 }}>{label}</TableCell>)}</TableRow></TableHead>
      <TableBody>{loading ? <TableRow><TableCell colSpan={6} align="center">Đang tải lượt gửi xe…</TableCell></TableRow> : !rows.length ? <TableRow><TableCell colSpan={6} align="center">{error ? 'Chưa tải được dữ liệu.' : 'Không có lượt gửi xe phù hợp.'}</TableCell></TableRow> : rows.map(row => <TableRow key={row.id}>
        <TableCell sx={{ maxWidth: 190, overflowWrap: 'anywhere' }}>{row.sessionCode}</TableCell><TableCell>{row.plateNumber}</TableCell>
        <TableCell>{row.parkingLotName}<Typography variant="body2">{row.zoneName} · {row.slotCode}</Typography></TableCell>
        <TableCell>{formatParkingTime(row.checkInTime)}</TableCell>
        <TableCell><Chip label={row.status === 'OPEN' ? 'Đang gửi' : 'Đã kết thúc'} color={row.status === 'OPEN' ? 'info' : 'success'} size="small" />{row.isOverstay && <Typography variant="caption" sx={{ display: 'block', color: 'error.main' }}>Quá giờ dự kiến</Typography>}</TableCell>
        <TableCell><Button onClick={() => { setMethod('CASH'); open(row.id) }}>{row.status === 'COMPLETED' ? 'Xem phiếu thu' : staff ? 'Xem phí và xe ra' : 'Xem phí'}</Button></TableCell>
      </TableRow>)}</TableBody>
    </Table></TableContainer></Card>
    <Stack direction="row" sx={{ justifyContent: 'flex-end', alignItems: 'center', gap: 2, mt: 2, flexWrap: 'wrap' }}>
      <Button disabled={loading || page === 1} onClick={() => setPage(page - 1)}>Trang trước</Button><Typography>Trang {page}</Typography>
      <Button disabled={loading || rows.length < SIZE || page >= 1000000} onClick={() => setPage(page + 1)}>Trang sau</Button>
    </Stack>
    <Dialog open={dialogOpen} onClose={close} fullWidth maxWidth="sm">
      <DialogTitle>{selected?.status === 'COMPLETED' ? 'Phiếu thu tiền gửi xe' : 'Chi tiết lượt gửi và phí'}</DialogTitle>
      <DialogContent>
        {detailLoading ? <Typography>Đang lấy phí từ server…</Typography> : selected?.sessionCode && fee && <SessionReceipt session={selected} fee={fee} />}
        {detailError && <Alert severity="error" sx={{ mt: 2 }}>{detailError}</Alert>}
        {staff && !detailLoading && selected?.status === 'OPEN' && fee && <Stack spacing={2} sx={{ mt: 3 }}>
          <TextField select label="Phương thức thu tiền" disabled={saving} value={method} onChange={e => { setMethod(e.target.value); setConfirmed(false) }}>
            <MenuItem value="CASH">Tiền mặt</MenuItem><MenuItem value="SIMULATED">Thanh toán mô phỏng</MenuItem>
          </TextField>
          <FormControlLabel control={<Checkbox disabled={saving} checked={confirmed} onChange={e => setConfirmed(e.target.checked)} />} label="Đã nhận đủ tiền theo phí hiển thị và xe sẵn sàng ra" />
        </Stack>}
      </DialogContent>
      <DialogActions sx={{ flexWrap: 'wrap' }}>
        <Button disabled={saving} onClick={close}>Đóng</Button>
        <Button disabled={saving || detailLoading} onClick={() => open(selected.id)}>Cập nhật phí / trạng thái</Button>
        {staff && selected?.status === 'OPEN' && fee && <Button variant="contained" color="error" disabled={saving || !confirmed || detailLoading} onClick={checkout}>{saving ? 'Đang xác nhận…' : 'Xác nhận thu tiền và xe ra'}</Button>}
      </DialogActions>
    </Dialog>
  </Layout>
}
