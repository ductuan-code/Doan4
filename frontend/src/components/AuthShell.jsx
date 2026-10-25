import { Box, Typography } from '@mui/material'
import Brand from './Brand'
import ParkingIllustration from './ParkingIllustration'

export default function AuthShell({ children }) {
  return <Box sx={{ minHeight: '100vh', display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1fr) minmax(460px, .9fr)' } }}>
    <Box sx={{ bgcolor: '#142e38', p: { xs: 3, md: 5, lg: 7 }, color: '#fff', display: 'flex', flexDirection: 'column' }}>
      <Brand light />
      <Box sx={{ maxWidth: 510, my: 'auto', py: 5, mx: 'auto', width: '100%', display: { xs: 'none', md: 'block' } }}>
        <Typography sx={{ fontSize: 11, color: '#d3f28c', fontWeight: 500, letterSpacing: '.14em', mb: 2 }}>GỌN MỘT CHỖ ĐỖ. NHẸ MỘT HÀNH TRÌNH.</Typography>
        <Typography component="h2" sx={{ fontSize: { xs: 28, lg: 42 }, lineHeight: 1.25, fontWeight: 700, letterSpacing: '-.03em', mb: 2 }}>Đỗ xe dễ dàng.<br />Quản lý rõ ràng.</Typography>
        <Typography sx={{ color: '#afc3c9', fontSize: 14, maxWidth: 420, mb: 4 }}>Từ đặt chỗ đến nhận và trả xe, mọi thông tin được kết nối trong cùng một hệ thống.</Typography>
        <Box sx={{ display: { xs: 'none', md: 'block' } }}><ParkingIllustration /></Box>
      </Box>
      <Typography sx={{ color: '#8ba4ae', fontSize: 11, display: { xs: 'none', md: 'block' } }}>Quản lý bãi đỗ xe trực tuyến · Đồ án 4</Typography>
    </Box>
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#fafcfb', p: { xs: 3, sm: 5, lg: 7 } }}>
      <Box sx={{ width: '100%', maxWidth: 410, py: { xs: 1, md: 3 } }}>{children}</Box>
    </Box>
  </Box>
}
