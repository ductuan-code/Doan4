import { useEffect, useState } from 'react'
import {
  Alert, Box, Button, Card, Dialog, DialogActions, DialogContent, DialogTitle,
  Chip, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  TextField, Typography
} from '@mui/material'
import Layout from '../../components/Layout'
import { adminAPI, getErrorMessage } from '../../services/api'
import { formatParkingTime } from '../../utils/reservationTime'
import { formatMoney } from '../../components/SessionReceipt'
import useAdminMutation from './useAdminMutation'

const types = { MOTORBIKE: 'Xe máy', CAR: 'Ô tô' }
export default function ManagePricing() {
  const [rows, setRows] = useState([])
  const [history, setHistory] = useState(false)
  const [page, setPage] = useState(1)
  const [revision, setRevision] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [type, setType] = useState(null)
  const [price, setPrice] = useState('')
  const [reason, setReason] = useState('')
  const mutation = useAdminMutation()
  useEffect(() => {
    let current = true
    setLoading(true)
    setError('')
    setRows([])
    adminAPI.getPricing({ includeHistory: history, page, pageSize: 20 })
      .then(r => { if (current) setRows(r.data) })
      .catch(e => { if (current) setError(getErrorMessage(e)) })
      .finally(() => { if (current) setLoading(false) })
    return () => { current = false }
  }, [history, page, revision])
  const displayed = history ? rows : Object.keys(types).map(vehicleType => rows.find(r => r.vehicleType === vehicleType) ?? { vehicleType })
  const open = row => {
    setType(row.vehicleType)
    setPrice(row.pricePerHour?.toString() ?? '')
    setReason('')
    mutation.setError('')
    setNotice('')
  }
  const submit = async event => {
    event.preventDefault()
    const value = Number(price)
    if (!Number.isSafeInteger(value) || value < 1 || value > 1000000000 || !reason.trim()) {
      mutation.setError('Giá phải là số nguyên từ 1 đến 1.000.000.000 VND và cần lý do thay đổi.')
      return
    }
    const data = { pricePerHour: value, reason: reason.trim() }
    if (await mutation.save(`price:${type}`, data, key => adminAPI.updatePricing(type, data, key))) {
      setType(null)
      setNotice('Đã lưu phiên bản giá mới. Các xe đã vào giữ nguyên đơn giá lúc nhận xe.')
      setPage(1)
      setRevision(r => r + 1)
    }
  }
  return <Layout>
    <Stack direction={{ xs: 'column', sm: 'row' }} sx={{ gap: 2, justifyContent: 'space-between', mb: 2 }}>
      <Typography variant="h4">Quản lý bảng giá</Typography>
      <Stack direction="row" spacing={1}>
        <Button variant="outlined" disabled={loading || mutation.saving} onClick={() => setRevision(r => r + 1)}>Tải lại</Button>
        <Button variant="contained" disabled={mutation.saving} onClick={() => { setHistory(h => !h); setPage(1) }}>{history ? 'Giá hiện hành' : 'Lịch sử giá'}</Button>
      </Stack>
    </Stack>
    <Alert severity="info" sx={{ mb: 2 }}>Giá tính theo giờ, làm tròn số giờ theo quy tắc tính phí của hệ thống. Giá mới áp dụng cho lượt nhận xe tiếp theo; xe đang gửi giữ đơn giá lúc vào.</Alert>
    {notice && <Alert severity="success" sx={{ mb: 2 }}>{notice}</Alert>}
    {error && <Alert severity="error" sx={{ mb: 2 }}>{error} Nhấn Tải lại để thử lại.</Alert>}
    {loading ? <Typography role="status">Đang tải dữ liệu...</Typography> : !error && <>
      <Typography variant="h6" sx={{ mb: 1 }}>{history ? `Lịch sử phiên bản giá · Trang ${page}` : 'Giá hiện hành'}</Typography>
      <TableContainer component={Card}><Table sx={{ minWidth: 650 }}>
        <TableHead><TableRow><TableCell>Loại xe</TableCell><TableCell>Giá / giờ</TableCell><TableCell>Cập nhật lần cuối</TableCell><TableCell>Trạng thái</TableCell>{!history && <TableCell>Thao tác</TableCell>}</TableRow></TableHead>
        <TableBody>{displayed.map(r => <TableRow key={r.id ?? r.vehicleType}>
          <TableCell>{types[r.vehicleType]}</TableCell><TableCell sx={{ fontWeight: 600 }}>{r.id ? formatMoney(r.pricePerHour) : 'Chưa cấu hình'}</TableCell>
          <TableCell>{r.updatedAt ? formatParkingTime(r.updatedAt) : '—'}</TableCell>
          <TableCell><Chip size="small" color={r.isActive ? 'success' : 'default'} label={r.isActive ? 'Hiện hành' : r.id ? 'Đã thay thế' : 'Chưa cấu hình'} /></TableCell>
          {!history && <TableCell><Button disabled={mutation.saving} onClick={() => open(r)}>{r.id ? 'Sửa giá' : 'Thiết lập giá'}</Button></TableCell>}
        </TableRow>)}{!displayed.length && <TableRow><TableCell colSpan={4}>Không có phiên bản giá ở trang này.</TableCell></TableRow>}</TableBody>
      </Table></TableContainer>
      {history && <Stack direction="row" sx={{ justifyContent: 'flex-end', mt: 2 }} spacing={1}>
        <Button disabled={page === 1} onClick={() => setPage(p => p - 1)}>Trang trước</Button>
        <Button disabled={rows.length < 20} onClick={() => setPage(p => p + 1)}>Trang sau</Button>
      </Stack>}
    </>}
    <Dialog open={!!type} onClose={() => !mutation.saving && setType(null)} fullWidth maxWidth="sm">
      <Box component="form" onSubmit={submit}>
        <DialogTitle>Cập nhật giá {types[type]}</DialogTitle>
        <DialogContent><Stack spacing={2} sx={{ pt: 1 }}>
          {mutation.error && <Alert severity="error">{mutation.error}</Alert>}
          <TextField label="Giá mỗi giờ (VND)" required disabled={mutation.saving} type="number" value={price} onChange={e => setPrice(e.target.value)}
            slotProps={{ htmlInput: { min: 1, max: 1000000000, step: 1 } }} helperText="Số nguyên từ 1 đến 1.000.000.000 VND" />
          <TextField label="Lý do thay đổi" required disabled={mutation.saving} value={reason} onChange={e => setReason(e.target.value)} slotProps={{ htmlInput: { maxLength: 1000 } }} />
          <Typography sx={{ color: 'text.secondary' }}>Mỗi lần lưu tạo một phiên bản mới và giữ lại giá trước đó trong lịch sử.</Typography>
        </Stack></DialogContent>
        <DialogActions><Button disabled={mutation.saving} onClick={() => setType(null)}>Đóng</Button><Button type="submit" variant="contained" disabled={mutation.saving}>{mutation.saving ? 'Đang lưu...' : 'Lưu giá'}</Button></DialogActions>
      </Box>
    </Dialog>
  </Layout>
}
