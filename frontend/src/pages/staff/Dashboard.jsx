import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import Layout from '../../components/Layout'
import { Box, Grid, Card, CardContent, Typography, CardActionArea, Avatar } from '@mui/material'
import LoginIcon from '@mui/icons-material/Login'
import LogoutOutlinedIcon from '@mui/icons-material/LogoutOutlined'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'

const stats = [
  { label: 'Tổng vị trí',    value: 50, color: '#2563eb', bg: '#eff6ff' },
  { label: 'Đang sử dụng',   value: 28, color: '#dc2626', bg: '#fff1f2' },
  { label: 'Còn trống',      value: 18, color: '#059669', bg: '#f0fdf4' },
  { label: 'Đã đặt trước',   value: 4,  color: '#d97706', bg: '#fffbeb' },
]

const menuCards = [
  {
    title: 'Check-in xe',
    desc: 'Ghi nhận xe vào bãi, đối chiếu đặt chỗ',
    icon: <LoginIcon sx={{ fontSize: 36 }} />,
    path: '/staff/checkin',
    gradient: 'linear-gradient(135deg, #059669, #34d399)',
    lightBg: '#f0fdf4',
  },
  {
    title: 'Check-out xe',
    desc: 'Ghi nhận xe ra bãi và tính phí tự động',
    icon: <LogoutOutlinedIcon sx={{ fontSize: 36 }} />,
    path: '/staff/checkout',
    gradient: 'linear-gradient(135deg, #dc2626, #f87171)',
    lightBg: '#fff1f2',
  },
]

function StaffDashboard() {
  const { user } = useAuth()

  return (
    <Layout>
      <Box>
        {/* Welcome banner */}
        <Box sx={{
          background: 'linear-gradient(135deg, #059669 0%, #0891b2 100%)',
          borderRadius: 4, p: { xs: 3, md: 5 },
          color: 'white', mb: 4,
          position: 'relative', overflow: 'hidden',
        }}>
          <Box sx={{ position: 'absolute', top: -40, right: -40, width: 180, height: 180, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.08)' }} />
          <Box sx={{ position: 'relative' }}>
            <Typography variant="h4" fontWeight={800} mb={1}>
              Xin chào, {user?.name}! 👋
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.85 }}>
              Quản lý vận hành bãi đỗ xe hôm nay
            </Typography>
          </Box>
        </Box>

        {/* Stats */}
        <Grid container spacing={2} mb={4}>
          {stats.map((stat) => (
            <Grid item xs={6} md={3} key={stat.label}>
              <Card sx={{ borderRadius: 3, border: `1px solid ${stat.bg}` }}>
                <CardContent sx={{ textAlign: 'center', bgcolor: stat.bg, p: '20px !important' }}>
                  <Typography variant="h3" fontWeight={800} sx={{ color: stat.color }}>
                    {stat.value}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" mt={0.5}>
                    {stat.label}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Menu cards */}
        <Typography variant="h6" fontWeight={700} mb={2}>Chức năng</Typography>
        <Grid container spacing={3}>
          {menuCards.map((item) => (
            <Grid item xs={12} sm={6} key={item.path}>
              <Card sx={{
                borderRadius: 3, border: '1px solid #e2e8f0',
                '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 12px 40px rgba(5,150,105,0.15)', borderColor: '#059669' },
                transition: 'all 0.3s ease',
              }}>
                <CardActionArea component={Link} to={item.path}>
                  <CardContent sx={{ p: 0 }}>
                    <Box sx={{ background: item.gradient, p: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.25)', color: 'white', width: 56, height: 56 }}>
                        {item.icon}
                      </Avatar>
                      <ArrowForwardIcon sx={{ color: 'rgba(255,255,255,0.7)', fontSize: 28 }} />
                    </Box>
                    <Box sx={{ p: 2.5, bgcolor: item.lightBg }}>
                      <Typography variant="h6" fontWeight={700}>{item.title}</Typography>
                      <Typography variant="body2" color="text.secondary" mt={0.5}>{item.desc}</Typography>
                    </Box>
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
