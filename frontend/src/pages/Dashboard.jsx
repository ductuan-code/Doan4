import PageHeader from '../components/PageHeader'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Alert, Box, Button, Card, CardActionArea, CardContent, Chip, Stack, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Typography } from '@mui/material'
import Layout from '../components/Layout'
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded'
import DirectionsCarOutlinedIcon from '@mui/icons-material/DirectionsCarOutlined'
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined'
import EventAvailableOutlinedIcon from '@mui/icons-material/EventAvailableOutlined'
import { useAuth } from '../context/AuthContext'
import { dashboardAPI, getErrorMessage } from '../services/api'
import { StatCards, reportDate } from '../components/ReportingWidgets'
import { formatMoney } from '../components/SessionReceipt'
import { formatParkingTime } from '../utils/reservationTime'

const shortcuts = {
  Admin: [['Bãi đỗ xe', 'Cấu hình bãi hoạt động', '/admin/parking-lots'], ['Khu vực', 'Phân loại xe và tầng', '/admin/zones'],
    ['Vị trí đỗ', 'Nhóm đặt trước, trực tiếp và bảo trì', '/admin/slots'], ['Bảng giá', 'Giá hiện hành và lịch sử', '/admin/pricing'],
    ['Tài khoản', 'Phân quyền và phân công bãi', '/admin/users'], ['Báo cáo', 'Tổng thu và lượt xe theo ngày, bãi', '/admin/reports']],
  Staff: [['Trạng thái bãi và bảo trì', 'Theo dõi từng vị trí và xử lý bảo trì', '/staff/parking-status'], ['Nhận xe', 'Tra mã đặt hoặc nhận khách trực tiếp', '/staff/checkin'], ['Trả xe và thu tiền', 'Tính phí, xác nhận xe ra và phiếu thu', '/staff/checkout']],
  Customer: [['Phương tiện', 'Thêm, sửa và ngừng sử dụng xe', '/customer/vehicles'], ['Tìm và đặt chỗ', 'Chọn xe, bãi và khung giờ', '/customer/search'],
    ['Lịch sử đặt chỗ', 'Theo dõi và hủy lịch của bạn', '/customer/history'], ['Lịch sử gửi xe', 'Xem lượt gửi và phiếu thu của bạn', '/customer/sessions']]
}
export default function Dashboard() {
  const { user, refreshUser } = useAuth()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [revision, setRevision] = useState(0)
  useEffect(() => {
    const timer = setInterval(() => setRevision(r => r + 1), 30000)
    return () => clearInterval(timer)
  }, [])
  useEffect(() => {
    let current = true
    setLoading(true); setError(''); setData(null)
    dashboardAPI.get().then(async r => {
      if (!current) return
      if (r.data.role !== user.role) { await refreshUser(); return }
      setData(r.data)
    }).catch(e => { if (current) setError(getErrorMessage(e)) })
      .finally(() => { if (current) setLoading(false) })
    return () => { current = false }
  }, [revision, user.role, refreshUser])
  const s = data?.summary
  const items = !s ? [] : user.role === 'Customer' ? [
    { label: 'Phương tiện hoạt động', value: s.activeVehicleCount }, { label: 'Đặt chỗ còn hiệu lực', value: s.confirmedReservations },
    { label: 'Xe đang gửi', value: s.openSessions }, { label: 'Tổng tiền đã trả', value: formatMoney(s.totalPaid), hint: 'Các phiếu thu gắn với tài khoản' }
  ] : user.role === 'Admin' ? [
    { label: 'Bãi đang hoạt động', value: s.activeLotCount }, { label: 'Vị trí hoạt động', value: s.totalActiveSlots },
    { label: 'Xe đang gửi', value: s.openSessions }, { label: 'Thu ghi nhận hôm nay', value: formatMoney(s.todayRevenue), hint: 'Gồm tiền mặt và thanh toán mô phỏng' }
  ] : [
    { label: 'Vị trí hoạt động', value: s.totalActiveSlots }, { label: 'Xe đang gửi', value: s.openSessions },
    { label: 'Chỗ chưa có xe', value: s.availableSlots }, { label: 'Đặt chỗ còn hiệu lực', value: s.confirmedReservations }
  ]
  return <Layout>
    <PageHeader title={`Xin chào, ${user.name}!`} description={`Tổng quan ${data?.scopeName ?? ''}`} eyebrow="Tổng quan hôm nay" action={<Button variant="outlined" disabled={loading} onClick={() => setRevision(r => r + 1)}>Làm mới</Button>} />
    {loading && <Typography role="status">Đang tải số liệu...</Typography>}
    {error && <Alert severity="error" sx={{ mb: 2 }}>{error} Nhấn Làm mới để thử lại.</Alert>}
    {data && <>
      <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>Ngày {reportDate(data.dateVn)} (giờ Việt Nam) · Cập nhật {formatParkingTime(data.generatedAt)} · Tự làm mới mỗi 30 giây</Typography>
      <StatCards items={items} />
      {user.role === 'Customer' ? <Typography sx={{ mb: 2 }}>Đã hoàn tất {s.completedSessions} lượt gửi xe. Số liệu chỉ thuộc tài khoản của bạn.</Typography> : <>
        <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 1, mb: 2 }}>
          <Chip label={`Xe vào hôm nay: ${s.todayCheckIns}`} /><Chip label={`Xe ra hôm nay: ${s.todayCheckOuts}`} />
          <Chip label={`Bảo trì: ${s.maintenanceSlots}`} /><Chip label={`Đang có đệm: ${s.bufferSlots}`} />
          <Chip label={`Chỗ nhận trực tiếp: ${s.walkInReadySlots}`} />
          {user.role === 'Admin' && <Chip label={`Đặt chỗ còn hiệu lực: ${s.confirmedReservations}`} />}
        </Stack>
        <Alert severity="info" sx={{ mb: 2 }}>Chỗ chưa có xe có thể vẫn còn đệm hoặc lịch đặt trước. Chỗ nhận trực tiếp chỉ tính nhóm khách trực tiếp đã hết đệm. Khách đặt trước cần tra theo xe và khung giờ.</Alert>
        <Typography variant="h6" sx={{ mb: 1 }}>Tình trạng bãi hiện tại</Typography>
        <TableContainer component={Card} sx={{ mb: 2 }}><Table sx={{ minWidth: 850 }}>
          <TableHead><TableRow>{['Bãi đỗ', 'Vị trí hoạt động', 'Chưa có xe', 'Có xe', 'Bảo trì', 'Còn đệm', 'Lấp đầy'].map(t => <TableCell key={t}>{t}</TableCell>)}</TableRow></TableHead>
          <TableBody>{data.lots.map(l => <TableRow key={l.parkingLotId}>
            <TableCell>{l.parkingLotName}{!l.isActive && <Chip size="small" label="Ngừng hoạt động" sx={{ ml: 1 }} />}</TableCell>
            <TableCell>{l.totalActiveSlots}</TableCell><TableCell>{l.availableSlots}</TableCell><TableCell>{l.occupiedSlots}</TableCell>
            <TableCell>{l.maintenanceSlots}</TableCell><TableCell>{l.bufferSlots}</TableCell><TableCell>{l.occupancyPercent === null ? '—' : `${l.occupancyPercent}%`}</TableCell>
          </TableRow>)}{!data.lots.length && <TableRow><TableCell colSpan={7}>Chưa có bãi đỗ trong phạm vi này.</TableCell></TableRow>}</TableBody>
        </Table></TableContainer>
        <Typography variant="caption" component="p" sx={{ color: 'text.secondary', mb: 2 }}>Lấp đầy = vị trí có xe / vị trí hoạt động không bảo trì; dấu — khi không có mẫu số. Đây là tỷ lệ hiện tại.</Typography>
      </>}
    </>}
    <Box sx={{ mt: 3.5, mb: 2 }}><Typography variant="h6">Chức năng</Typography><Typography sx={{ color: 'text.secondary', fontSize: 13, mt: .5 }}>Truy cập nhanh các công việc thường dùng.</Typography></Box>
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2,1fr)', lg: 'repeat(3,1fr)' }, gap: 2 }}>
      {shortcuts[user.role].map(([title, desc, path]) => <Card key={path} sx={{ transition: 'border-color .15s, box-shadow .15s', '&:hover': { borderColor: '#acd2c7', boxShadow: '0 6px 20px #183b3510' } }}><CardActionArea component={Link} to={path} sx={{ height: '100%' }}>
        <CardContent><Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}><Box sx={{ color: 'primary.main', bgcolor: '#edf6f2', width: 38, height: 38, borderRadius: 2, display: 'grid', placeItems: 'center' }}>{/search|history/.test(path) ? <EventAvailableOutlinedIcon sx={{ fontSize: 21 }} /> : /check|vehicle|parking-status/.test(path) ? <DirectionsCarOutlinedIcon sx={{ fontSize: 21 }} /> : <SettingsOutlinedIcon sx={{ fontSize: 21 }} />}</Box><ArrowForwardRoundedIcon sx={{ color: '#92aaa9', fontSize: 19 }} /></Box>
          <Typography variant="h6">{title}</Typography><Typography sx={{ color: 'text.secondary', mt: .5, fontSize: 13 }}>{desc}</Typography></CardContent>
      </CardActionArea></Card>)}
    </Box>
  </Layout>
}
