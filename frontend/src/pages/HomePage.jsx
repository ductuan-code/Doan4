import { Link } from 'react-router-dom'
import { Box, Button, Typography, Container, Grid, Card, CardContent } from '@mui/material'
import LocalParkingIcon from '@mui/icons-material/LocalParking'
import EventAvailableIcon from '@mui/icons-material/EventAvailable'
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar'
import AssessmentIcon from '@mui/icons-material/Assessment'

const features = [
  { icon: <EventAvailableIcon sx={{ fontSize: 40, color: 'primary.main' }} />, title: 'Đặt chỗ trước', desc: 'Đặt vị trí đỗ xe trước khi đến, không lo hết chỗ' },
  { icon: <DirectionsCarIcon sx={{ fontSize: 40, color: 'success.main' }} />, title: 'Hỗ trợ xe máy & ô tô', desc: 'Khu vực riêng biệt cho từng loại phương tiện' },
  { icon: <LocalParkingIcon sx={{ fontSize: 40, color: 'warning.main' }} />, title: 'Quản lý thời gian thực', desc: 'Xem tình trạng chỗ trống theo thời gian thực' },
  { icon: <AssessmentIcon sx={{ fontSize: 40, color: 'error.main' }} />, title: 'Báo cáo thống kê', desc: 'Theo dõi doanh thu và tỷ lệ lấp đầy bãi đỗ' },
]

function HomePage() {
  return (
    <Box>
      {/* Hero Section */}
      <Box sx={{
        background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
        color: 'white',
        py: 12,
        textAlign: 'center'
      }}>
        <Container>
          <LocalParkingIcon sx={{ fontSize: 80, mb: 2 }} />
          <Typography variant="h3" fontWeight={700} gutterBottom>
            Hệ Thống Đặt Chỗ & Quản Lý Bãi Đỗ Xe
          </Typography>
          <Typography variant="h6" sx={{ opacity: 0.9, mb: 4, maxWidth: 600, mx: 'auto' }}>
            Đặt trước vị trí đỗ xe, quản lý vận hành bãi đỗ thông minh và hiệu quả
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/login">
              <Button variant="contained" size="large" color="warning" sx={{ px: 4, py: 1.5, borderRadius: 2, fontWeight: 600 }}>
                Đăng nhập
              </Button>
            </Link>
            <Link to="/register">
              <Button variant="outlined" size="large" sx={{ px: 4, py: 1.5, borderRadius: 2, fontWeight: 600, color: 'white', borderColor: 'white' }}>
                Đăng ký
              </Button>
            </Link>
          </Box>
        </Container>
      </Box>

      {/* Features Section */}
      <Container sx={{ py: 8 }}>
        <Typography variant="h4" fontWeight={700} textAlign="center" gutterBottom>
          Tính năng nổi bật
        </Typography>
        <Typography variant="body1" textAlign="center" color="text.secondary" sx={{ mb: 6 }}>
          Giải pháp toàn diện cho quản lý bãi đỗ xe hiện đại
        </Typography>
        <Grid container spacing={4}>
          {features.map((feature, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Card sx={{ textAlign: 'center', p: 2, height: '100%', borderRadius: 3, boxShadow: 3, '&:hover': { boxShadow: 6, transform: 'translateY(-4px)', transition: 'all 0.3s' } }}>
                <CardContent>
                  {feature.icon}
                  <Typography variant="h6" fontWeight={600} mt={2} mb={1}>
                    {feature.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {feature.desc}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  )
}

export default HomePage
