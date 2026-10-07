import { Link } from 'react-router-dom'
import { Box, Button, Typography, Container, Grid, Card, CardContent } from '@mui/material'
import LocalParkingIcon from '@mui/icons-material/LocalParking'
import EventAvailableIcon from '@mui/icons-material/EventAvailable'
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar'
import AccessTimeIcon from '@mui/icons-material/AccessTime'
import AssessmentIcon from '@mui/icons-material/Assessment'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'

const features = [
  { icon: <EventAvailableIcon sx={{ fontSize: 44 }} />, title: 'Đặt chỗ trước', desc: 'Đặt vị trí đỗ xe trước khi đến, không lo hết chỗ vào giờ cao điểm', color: '#eff6ff', iconColor: '#2563eb' },
  { icon: <DirectionsCarIcon sx={{ fontSize: 44 }} />, title: 'Xe máy & Ô tô', desc: 'Khu vực riêng biệt cho từng loại phương tiện với bảng giá khác nhau', color: '#f0fdf4', iconColor: '#059669' },
  { icon: <AccessTimeIcon sx={{ fontSize: 44 }} />, title: 'Thời gian thực', desc: 'Xem tình trạng chỗ trống, check-in/out và tính phí theo thời gian thực', color: '#faf5ff', iconColor: '#7c3aed' },
  { icon: <AssessmentIcon sx={{ fontSize: 44 }} />, title: 'Báo cáo thống kê', desc: 'Theo dõi doanh thu, tỷ lệ lấp đầy và lịch sử vận hành chi tiết', color: '#fff7ed', iconColor: '#d97706' },
]

const benefits = [
  'Không cần xếp hàng chờ chỗ',
  'Tính phí tự động chính xác',
  'Quản lý nhiều bãi đỗ xe',
  'Hỗ trợ check-in bằng mã đặt chỗ',
  'Dashboard thống kê trực quan',
  'Xử lý walk-in linh hoạt',
]

function HomePage() {
  return (
    <Box>
      {/* Hero */}
      <Box sx={{
        background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
        color: 'white',
        py: { xs: 8, md: 14 },
        px: 2,
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <Box sx={{
          position: 'absolute', top: -80, right: -80, width: 300, height: 300,
          borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.06)'
        }} />
        <Box sx={{
          position: 'absolute', bottom: -60, left: -60, width: 200, height: 200,
          borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.06)'
        }} />

        <Container maxWidth="md" sx={{ position: 'relative' }}>
          <Box sx={{
            display: 'inline-flex', p: 2, borderRadius: 4,
            bgcolor: 'rgba(255,255,255,0.15)', mb: 3
          }}>
            <LocalParkingIcon sx={{ fontSize: 64 }} />
          </Box>
          <Typography variant="h2" fontWeight={800} mb={2} sx={{ fontSize: { xs: '2rem', md: '3.5rem' } }}>
            Hệ Thống Đặt Chỗ<br />
            <Box component="span" sx={{ color: '#fbbf24' }}>Bãi Đỗ Xe</Box> Thông Minh
          </Typography>
          <Typography variant="h6" sx={{ opacity: 0.9, mb: 5, maxWidth: 560, mx: 'auto', fontWeight: 400 }}>
            Đặt trước vị trí đỗ xe, quản lý vận hành bãi đỗ thông minh và hiệu quả cho cả khách hàng lẫn nhân viên
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/login">
              <Button
                variant="contained"
                size="large"
                sx={{
                  px: 5, py: 1.8, fontWeight: 700, fontSize: 16,
                  bgcolor: '#fbbf24', color: '#1e1b4b',
                  '&:hover': { bgcolor: '#f59e0b' },
                  boxShadow: '0 4px 20px rgba(251,191,36,0.4)'
                }}
              >
                Bắt đầu ngay
              </Button>
            </Link>
            <Link to="/register">
              <Button
                variant="outlined"
                size="large"
                sx={{
                  px: 5, py: 1.8, fontWeight: 700, fontSize: 16,
                  color: 'white', borderColor: 'rgba(255,255,255,0.6)',
                  '&:hover': { borderColor: 'white', bgcolor: 'rgba(255,255,255,0.1)' }
                }}
              >
                Đăng ký miễn phí
              </Button>
            </Link>
          </Box>
        </Container>
      </Box>

      {/* Stats bar */}
      <Box sx={{ bgcolor: '#1e40af', py: 3 }}>
        <Container>
          <Grid container spacing={2} justifyContent="center">
            {[
              { num: '500+', label: 'Vị trí đỗ xe' },
              { num: '3', label: 'Bãi đỗ xe' },
              { num: '1,200+', label: 'Khách hàng' },
              { num: '24/7', label: 'Hoạt động' },
            ].map(item => (
              <Grid item xs={6} md={3} key={item.label} sx={{ textAlign: 'center' }}>
                <Typography variant="h4" fontWeight={800} color="#fbbf24">{item.num}</Typography>
                <Typography variant="body2" color="rgba(255,255,255,0.75)">{item.label}</Typography>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Features */}
      <Container sx={{ py: 10 }}>
        <Typography variant="h4" fontWeight={700} textAlign="center" mb={1}>
          Tính năng nổi bật
        </Typography>
        <Typography variant="body1" textAlign="center" color="text.secondary" mb={6}>
          Giải pháp toàn diện cho quản lý bãi đỗ xe hiện đại
        </Typography>
        <Grid container spacing={3}>
          {features.map((f) => (
            <Grid item xs={12} sm={6} md={3} key={f.title}>
              <Card sx={{
                height: '100%', textAlign: 'center', p: 1,
                border: '1px solid #e2e8f0',
                '&:hover': { transform: 'translateY(-6px)', boxShadow: '0 12px 40px rgba(37,99,235,0.15)', borderColor: '#2563eb' },
                transition: 'all 0.3s ease'
              }}>
                <CardContent sx={{ bgcolor: f.color, borderRadius: 2, p: 3 }}>
                  <Box sx={{ color: f.iconColor, mb: 2 }}>{f.icon}</Box>
                  <Typography variant="h6" fontWeight={700} mb={1}>{f.title}</Typography>
                  <Typography variant="body2" color="text.secondary">{f.desc}</Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* Benefits */}
      <Box sx={{ bgcolor: '#eff6ff', py: 10 }}>
        <Container>
          <Grid container spacing={6} alignItems="center">
            <Grid item xs={12} md={6}>
              <Typography variant="h4" fontWeight={700} mb={2}>
                Tại sao chọn <Box component="span" color="primary.main">ParkingLot?</Box>
              </Typography>
              <Typography color="text.secondary" mb={4}>
                Hệ thống được thiết kế để giải quyết tất cả vấn đề của bãi đỗ xe truyền thống
              </Typography>
              <Grid container spacing={1.5}>
                {benefits.map((b) => (
                  <Grid item xs={12} sm={6} key={b}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CheckCircleIcon color="success" fontSize="small" />
                      <Typography variant="body2" fontWeight={500}>{b}</Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box sx={{
                background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
                borderRadius: 4, p: 5, textAlign: 'center', color: 'white'
              }}>
                <LocalParkingIcon sx={{ fontSize: 80, mb: 2, opacity: 0.9 }} />
                <Typography variant="h5" fontWeight={700} mb={1}>Bắt đầu ngay hôm nay</Typography>
                <Typography sx={{ opacity: 0.85, mb: 3 }}>Đăng ký miễn phí, không cần thẻ tín dụng</Typography>
                <Link to="/register">
                  <Button variant="contained" size="large" sx={{ bgcolor: '#fbbf24', color: '#1e1b4b', '&:hover': { bgcolor: '#f59e0b' }, fontWeight: 700, px: 4 }}>
                    Đăng ký ngay
                  </Button>
                </Link>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Footer */}
      <Box sx={{ bgcolor: '#1e1b4b', color: 'rgba(255,255,255,0.7)', py: 4, textAlign: 'center' }}>
        <Typography variant="body2">© 2026 ParkingLot System. All rights reserved.</Typography>
      </Box>
    </Box>
  )
}

export default HomePage
