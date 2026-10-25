import { Link } from 'react-router-dom'
import { Box, Button, Typography, Container, Stack } from '@mui/material'
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded'
import EventAvailableOutlinedIcon from '@mui/icons-material/EventAvailableOutlined'
import DirectionsCarOutlinedIcon from '@mui/icons-material/DirectionsCarOutlined'
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined'
import Brand from '../components/Brand'
import ParkingIllustration from '../components/ParkingIllustration'

const features = [
  { icon: <EventAvailableOutlinedIcon />, title: 'Chủ động trước khi đến', desc: 'Chọn bãi, phương tiện và khung giờ. Tra cứu vị trí phù hợp rồi xác nhận đặt chỗ.' },
  { icon: <DirectionsCarOutlinedIcon />, title: 'Theo dõi từng lượt xe', desc: 'Nhận xe bằng mã đặt chỗ hoặc tiếp nhận trực tiếp. Theo dõi trạng thái của từng vị trí.' },
  { icon: <ReceiptLongOutlinedIcon />, title: 'Chi phí rõ ràng', desc: 'Phí gửi xe được tính theo thời gian và bảng giá. Xem lịch sử gửi xe và phiếu thu của bạn.' },
]
export default function HomePage() {
  return <Box sx={{ bgcolor: '#fafcfb' }}>
    <Box component="header" sx={{ borderBottom: '1px solid', borderColor: 'divider', bgcolor: '#fff' }}>
      <Container maxWidth="lg" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, py: 2 }}>
        <Brand />
        <Stack direction="row" sx={{ gap: 1 }}>
          <Button component={Link} to="/login" sx={{ display: { xs: 'none', sm: 'inline-flex' }, color: 'text.primary' }}>Đăng nhập</Button>
          <Button component={Link} to="/register" variant="contained" endIcon={<ArrowForwardRoundedIcon />}>Đăng ký</Button>
        </Stack>
      </Container>
    </Box>
    <Box component="main">
      <Container maxWidth="lg" sx={{ py: { xs: 6, md: 10 } }}>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1.05fr 1fr' }, gap: { xs: 5, md: 7 }, alignItems: 'center' }}>
          <Box>
            <Typography sx={{ color: 'primary.main', fontSize: 11, letterSpacing: '.14em', fontWeight: 700, mb: 2.5 }}>QUẢN LÝ BÃI ĐỖ XE TRỰC TUYẾN</Typography>
            <Typography component="h1" sx={{ fontWeight: 700, fontSize: { xs: 40, sm: 52, lg: 60 }, lineHeight: 1.13, letterSpacing: '-.045em', mb: 3 }}>Bớt tìm chỗ đỗ.<br /><Box component="span" sx={{ color: 'primary.main' }}>Thêm thảnh thơi.</Box></Typography>
            <Typography sx={{ color: 'text.secondary', maxWidth: 430, fontSize: 16, lineHeight: 1.8, mb: 4 }}>Đặt chỗ trước khi khởi hành. Quản lý phương tiện, theo dõi lịch gửi và tra cứu chi phí ngay trên một nền tảng.</Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} sx={{ gap: 1.5, alignItems: { xs: 'stretch', sm: 'center' } }}>
              <Button component={Link} to="/login" variant="contained" size="large" endIcon={<ArrowForwardRoundedIcon />} sx={{ py: 1.6, px: 3 }}>Tìm chỗ đỗ ngay</Button>
              <Button component={Link} to="/register" variant="outlined" size="large" sx={{ py: 1.6, px: 3 }}>Tạo tài khoản</Button>
            </Stack>
            <Stack direction="row" sx={{ mt: 4, gap: 2, flexWrap: 'wrap', color: 'text.secondary', fontSize: 12 }}><span>● Ô tô & xe máy</span><span>● Đặt chỗ theo khung giờ</span></Stack>
          </Box>
          <Box sx={{ bgcolor: '#142e38', borderRadius: 6, p: { xs: 2, sm: 3 }, boxShadow: '0 22px 50px #142e3818', transform: { md: 'rotate(-2deg)' } }}><ParkingIllustration /></Box>
        </Box>
      </Container>
      <Box sx={{ borderTop: '1px solid', borderBottom: '1px solid', borderColor: 'divider', bgcolor: '#fff' }}>
        <Container maxWidth="lg" sx={{ py: { xs: 5, md: 7 } }}>
          <Typography sx={{ fontSize: 11, color: 'primary.main', fontWeight: 700, letterSpacing: '.12em', mb: 1 }}>TỪ LÚC ĐẶT CHỖ ĐẾN KHI XE RA</Typography>
          <Typography component="h2" variant="h4" sx={{ mb: 4 }}>Mọi bước đều rõ ràng.</Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: { xs: 3, md: 5 } }}>
            {features.map((f, i) => <Box key={f.title}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}><Box sx={{ width: 44, height: 44, borderRadius: 2, bgcolor: '#edf6f2', color: 'primary.main', display: 'grid', placeItems: 'center' }}>{f.icon}</Box><Typography sx={{ color: '#b6c8ca', fontWeight: 500, fontSize: 13 }}>0{i+1}</Typography></Box>
              <Typography component="h3" variant="h6" sx={{ mb: 1 }}>{f.title}</Typography><Typography sx={{ color: 'text.secondary', fontSize: 14 }}>{f.desc}</Typography>
            </Box>)}
          </Box>
        </Container>
      </Box>
      <Container maxWidth="lg" sx={{ py: { xs: 5, md: 7 } }}>
        <Box sx={{ bgcolor: '#eaf3ef', borderRadius: 4, p: { xs: 3, md: 5 }, display: 'flex', alignItems: { md: 'center' }, justifyContent: 'space-between', gap: 3, flexDirection: { xs: 'column', md: 'row' } }}>
          <Box><Typography component="h2" variant="h5" sx={{ mb: 1 }}>Sẵn sàng cho hành trình tiếp theo?</Typography><Typography sx={{ color: 'text.secondary', fontSize: 14 }}>Tạo tài khoản, thêm phương tiện và chọn chỗ đỗ phù hợp.</Typography></Box>
          <Button component={Link} to="/register" variant="contained" endIcon={<ArrowForwardRoundedIcon />} sx={{ alignSelf: { xs: 'flex-start', md: 'center' } }}>Đăng ký ngay</Button>
        </Box>
      </Container>
    </Box>
    <Box component="footer" sx={{ borderTop: '1px solid', borderColor: 'divider' }}><Container maxWidth="lg" sx={{ py: 3, display: 'flex', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}><Typography sx={{ color: 'text.secondary', fontSize: 12 }}>© 2026 ParkingLot · Quản lý bãi đỗ xe trực tuyến</Typography><Typography sx={{ color: 'text.secondary', fontSize: 12 }}>Đồ án 4</Typography></Container></Box>
  </Box>
}
