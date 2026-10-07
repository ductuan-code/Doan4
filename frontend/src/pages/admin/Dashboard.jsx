import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import Layout from '../../components/Layout'
import { Box, Grid, Card, CardContent, Typography, CardActionArea, Chip } from '@mui/material'
import BusinessIcon from '@mui/icons-material/Business'
import MapIcon from '@mui/icons-material/Map'
import GridViewIcon from '@mui/icons-material/GridView'
import AttachMoneyIcon from '@mui/icons-material/AttachMoney'
import PeopleIcon from '@mui/icons-material/People'
import AssessmentIcon from '@mui/icons-material/Assessment'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar'

const stats = [
  { label: 'Tổng bãi đỗ', value: 3, color: 'primary.main', bg: '#e3f2fd' },
  { label: 'Tổng vị trí', value: 180, color: 'success.main', bg: '#e8f5e9' },
  { label: 'Đang sử dụng', value: 95, color: 'error.main', bg: '#ffebee' },
  { label: 'Doanh thu hôm nay', value: '1.2M', color: 'warning.main', bg: '#fff3e0' },
]

const menuCards = [
  { title: 'Bãi đỗ xe', desc: 'Quản lý các bãi đỗ', icon: <BusinessIcon sx={{ fontSize: 40, color: 'primary.main' }} />, path: '/admin/parking-lots', color: '#e3f2fd' },
  { title: 'Khu vực', desc: 'Quản lý zone trong bãi', icon: <MapIcon sx={{ fontSize: 40, color: 'success.main' }} />, path: '/admin/zones', color: '#e8f5e9' },
  { title: 'Vị trí đỗ', desc: 'Quản lý từng slot', icon: <GridViewIcon sx={{ fontSize: 40, color: 'info.main' }} />, path: '/admin/slots', color: '#e1f5fe' },
  { title: 'Bảng giá', desc: 'Cấu hình giá theo loại xe', icon: <AttachMoneyIcon sx={{ fontSize: 40, color: 'warning.main' }} />, path: '/admin/pricing', color: '#fff3e0' },
  { title: 'Tài khoản', desc: 'Quản lý người dùng & nhân viên', icon: <PeopleIcon sx={{ fontSize: 40, color: 'secondary.main' }} />, path: '/admin/users', color: '#fce4ec' },
  { title: 'Báo cáo', desc: 'Thống kê vận hành', icon: <AssessmentIcon sx={{ fontSize: 40, color: 'error.main' }} />, path: '/admin/reports', color: '#ffebee' },
]

function AdminDashboard() {
  const { user } = useAuth()

  return (
    <Layout>
      <Box>
        <Box sx={{ background: 'linear-gradient(135deg, #e65100, #ff9800)', borderRadius: 3, p: 4, color: 'white', mb: 4 }}>
          <Typography variant="h4" fontWeight={700}>Xin chào, {user?.name}! 👋</Typography>
          <Typography variant="body1" sx={{ opacity: 0.9, mt: 1 }}>Tổng quan hệ thống quản lý bãi đỗ xe</Typography>
          <Chip label="Quản trị viên" sx={{ mt: 2, bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }} />
        </Box>

        {/* Stats */}
        <Grid container spacing={2} mb={4}>
          {stats.map((stat) => (
            <Grid item xs={6} md={3} key={stat.label}>
              <Card sx={{ borderRadius: 3, boxShadow: 2, bgcolor: stat.bg }}>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h3" fontWeight={700} color={stat.color}>{stat.value}</Typography>
                  <Typography variant="body2" color="text.secondary">{stat.label}</Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Menu */}
        <Typography variant="h6" fontWeight={600} mb={2}>Quản lý hệ thống</Typography>
        <Grid container spacing={3}>
          {menuCards.map((item) => (
            <Grid item xs={12} sm={6} md={4} key={item.path}>
              <Card sx={{ borderRadius: 3, boxShadow: 2, '&:hover': { boxShadow: 6, transform: 'translateY(-4px)', transition: 'all 0.3s' } }}>
                <CardActionArea component={Link} to={item.path}>
                  <CardContent sx={{ p: 3, bgcolor: item.color }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      {item.icon}
                      <Box>
                        <Typography variant="h6" fontWeight={600}>{item.title}</Typography>
                        <Typography variant="body2" color="text.secondary">{item.desc}</Typography>
                      </Box>
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

export default AdminDashboard
