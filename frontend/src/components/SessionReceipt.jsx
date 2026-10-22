import { Alert, Box, Chip, Stack, Typography } from '@mui/material'
import { formatParkingTime } from '../utils/reservationTime'

export const formatMoney = value => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value)

export default function SessionReceipt({ session, fee }) {
  const paid = session.status === 'COMPLETED' && session.paymentId != null
  const lines = [
    ['Mã phiên', session.sessionCode], ['Bãi đỗ', session.parkingLotName], ['Vị trí', `${session.zoneName} · ${session.slotCode}`],
    ['Biển số', session.plateNumber], ['Loại xe', session.vehicleType === 'CAR' ? 'Ô tô' : 'Xe máy'],
    ['Giờ vào', formatParkingTime(session.checkInTime)],
    ...(session.checkOutTime ? [['Giờ ra', formatParkingTime(session.checkOutTime)]] : []),
    ['Đơn giá lúc nhận xe', `${formatMoney(session.appliedPricePerHour)}/giờ`],
    ['Số giờ tính phí', paid ? session.billableHours : fee?.billableHours],
    ...(paid ? [['Mã thanh toán', `#${session.paymentId}`], ['Phương thức', session.paymentMethod === 'CASH' ? 'Tiền mặt' : 'Thanh toán mô phỏng'], ['Thời điểm thu', formatParkingTime(session.paidAt)]] : [])
  ]
  return <Box>
    <Chip label={paid ? 'Đã thanh toán' : 'Đang gửi xe'} color={paid ? 'success' : 'info'} sx={{ mb: 2 }} />
    {session.isOverstay && <Alert severity="warning" sx={{ mb: 2 }}>Xe đang gửi quá giờ kết thúc dự kiến.</Alert>}
    <Stack spacing={1}>{lines.map(([label, value]) => <Box key={label} sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
      <Typography sx={{ color: 'text.secondary' }}>{label}</Typography><Typography sx={{ fontWeight: 600, overflowWrap: 'anywhere' }}>{value ?? '—'}</Typography>
    </Box>)}</Stack>
    <Box sx={{ p: 2, mt: 2, borderRadius: 2, bgcolor: paid ? '#ecfdf5' : '#fff7ed' }}>
      <Typography>{paid ? 'Tổng tiền đã thu' : 'Phí tạm tính từ server'}</Typography>
      <Typography variant="h5" sx={{ fontWeight: 700 }}>{formatMoney(paid ? session.paidAmount : fee?.amount ?? 0)}</Typography>
      {!paid && fee && <Typography variant="caption">Tính lúc {formatParkingTime(fee.calculatedAt)}. Phí được kiểm tra lại khi xác nhận xe ra.</Typography>}
    </Box>
    <Typography variant="caption" sx={{ display: 'block', mt: 2, color: 'text.secondary' }}>Giờ Việt Nam · Làm tròn lên từng giờ, tối thiểu một giờ.</Typography>
  </Box>
}
