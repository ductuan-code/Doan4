import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import Layout from '../../components/Layout'
import { Box, Grid, Card, CardContent, Typography, CardActionArea, Chip } from '@mui/material'
import LoginIcon from '@mui/icons-material/Login'
import LogoutOutlinedIcon from '@mui/icons-material/LogoutOutlined'
import GridViewIcon from '@mui/icons-material/GridView'

const stats = [
  { label: 'Tổng vị trí', value: 50, color: 'primary.main' },
  { label: 'Đang sử dụng', value: 28, color: 'error.main' },
  { label: 'Còn trống', value: 18, color: 'success.main' },
  { label: 'Đã đặt', value: 4, color: 'warning.main' },
]

const menuCards = [
  { title: 'Check-in xe', desc: 'Ghi nhận xe vào bãi', icon: <LoginIcon sx={{ fontSize: 48, color: 'success.main' }} />, path: '/staff/checkin', color: '#e8f5e9' },
  { title: 'Check-out xe', desc: 'Ghi nhận xe ra, tính phí', icon: <LogoutOutlinedIcon sx={{ fontSize: 48, color: 'error.main' }} />, path: '/staff/checkout', color: '#ffebee' },
]

function StaffDashboard() {
  const { user } = useAuth()

  return (
    <Layout>
      <Box>
        <Box sx={{ background: 'linear-gradient(135deg, #2e7d32, #66bb6a)', borderRadius: 3, p: 4, color: 'white', mb: 4 }}>
          <Typography variant="h4" fontWeight={700}>Xin chào, {user?.name}! 👋</Typography>
          <Typography variant="body1" sx={{ opacity: 0.9, mt: 1 }}>Quản lý vận hành bãi đỗ xe hôm nay</Typography>
          <Chip label="Nhân viên vận hành" color="success" variant="filled" sx={{ mt: 2, bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }} />
        </Box>

        {/* Stats */}
        <Grid container spacing={2} mb={4}>
          {stats.map((stat) => (
            <Grid item xs={6} md={3} key={stat.label}>
              <Card sx={{ borderRadius: 3, boxShadow: 2, textAlign: 'center' }}>
                <CardContent>
                  <Typography variant="h3" fontWeight={700} color={stat.color}>{stat.value}</Typography>
                  <Typography variant="body2" color="text.secondary">{stat.label}</Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Menu */}
        <Typography variant="h6" fontWeight={600} mb={2}>Chức năng</Typography>
        <Grid container spacing={3}>
          {menuCards.map((item) => (
            <Grid item xs={12} sm={6} key={item.path}>
              <Card sx={{ borderRadius: 3, boxShadow: 2, '&:hover': { boxShadow: 6, transform: 'translateY(-4px)', transition: 'all 0.3s' } }}>
                <CardActionArea component={Link} to={item.path}>
                  <CardContent sx={{ textAlign: 'center', p: 4, bgcolor: item.color }}>
                    {item.icon}
                    <Typography variant="h6" fontWeight={600} mt={2}>{item.title}</Typography>
                    <Typography variant="body2" color="text.secondary" mt={1}>{item.desc}</Typography>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
    </Layout>
  )
}

export default StaffDashboard
