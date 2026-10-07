import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import Layout from '../../components/Layout'
import {
  Box, Grid, Card, CardContent, Typography, Button, CardActionArea
} from '@mui/material'
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar'
import SearchIcon from '@mui/icons-material/Search'
import HistoryIcon from '@mui/icons-material/History'
import EventAvailableIcon from '@mui/icons-material/EventAvailable'

const menuCards = [
  { title: 'Quản lý phương tiện', desc: 'Thêm, sửa, xóa xe của bạn', icon: <DirectionsCarIcon sx={{ fontSize: 48, color: 'primary.main' }} />, path: '/customer/vehicles', color: '#e3f2fd' },
  { title: 'Tìm bãi đỗ xe', desc: 'Tìm kiếm và đặt chỗ trước', icon: <SearchIcon sx={{ fontSize: 48, color: 'success.main' }} />, path: '/customer/search', color: '#e8f5e9' },
  { title: 'Lịch sử đặt chỗ', desc: 'Xem lịch sử và hủy đặt chỗ', icon: <HistoryIcon sx={{ fontSize: 48, color: 'warning.main' }} />, path: '/customer/history', color: '#fff3e0' },
]

function CustomerDashboard() {
  const { user } = useAuth()

  return (
    <Layout>
      <Box>
        {/* Welcome */}
        <Box sx={{
          background: 'linear-gradient(135deg, #1976d2, #42a5f5)',
          borderRadius: 3,
          p: 4,
          color: 'white',
          mb: 4
        }}>
          <Typography variant="h4" fontWeight={700}>
            Xin chào, {user?.name}! 👋
          </Typography>
          <Typography variant="body1" sx={{ opacity: 0.9, mt: 1 }}>
            Chào mừng bạn đến với hệ thống quản lý bãi đỗ xe
          </Typography>
          <Button
            component={Link}
            to="/customer/search"
            variant="contained"
            color="warning"
            size="large"
            startIcon={<EventAvailableIcon />}
            sx={{ mt: 2, borderRadius: 2, fontWeight: 600 }}
          >
            Đặt chỗ ngay
          </Button>
        </Box>

        {/* Menu cards */}
        <Typography variant="h6" fontWeight={600} mb={2}>Chức năng</Typography>
        <Grid container spacing={3}>
          {menuCards.map((item) => (
            <Grid item xs={12} sm={6} md={4} key={item.path}>
              <Card sx={{ borderRadius: 3, boxShadow: 2, '&:hover': { boxShadow: 6, transform: 'translateY(-4px)', transition: 'all 0.3s' } }}>
                <CardActionArea component={Link} to={item.path}>
                  <CardContent sx={{ textAlign: 'center', p: 4, bgcolor: item.color }}>
                    {item.icon}
                    <Typography variant="h6" fontWeight={600} mt={2}>
                      {item.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" mt={1}>
                      {item.desc}
                    </Typography>
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

export default CustomerDashboard
