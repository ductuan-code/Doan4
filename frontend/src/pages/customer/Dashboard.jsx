import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import Layout from '../../components/Layout'
import { Box, Grid, Card, CardContent, Typography, Button, CardActionArea, Avatar } from '@mui/material'
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar'
import SearchIcon from '@mui/icons-material/Search'
import HistoryIcon from '@mui/icons-material/History'
import EventAvailableIcon from '@mui/icons-material/EventAvailable'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'

const menuCards = [
  {
    title: 'Quản lý phương tiện',
    desc: 'Thêm, sửa, xóa xe của bạn',
    icon: <DirectionsCarIcon sx={{ fontSize: 32 }} />,
    path: '/customer/vehicles',
    gradient: 'linear-gradient(135deg, #2563eb, #60a5fa)',
    lightBg: '#eff6ff',
  },
  {
    title: 'Tìm & Đặt chỗ',
    desc: 'Tìm kiếm bãi đỗ và đặt trước',
    icon: <SearchIcon sx={{ fontSize: 32 }} />,
    path: '/customer/search',
    gradient: 'linear-gradient(135deg, #059669, #34d399)',
    lightBg: '#f0fdf4',
  },
  {
    title: 'Lịch sử đặt chỗ',
    desc: 'Xem lịch sử và hủy đặt chỗ',
    icon: <HistoryIcon sx={{ fontSize: 32 }} />,
    path: '/customer/history',
    gradient: 'linear-gradient(135deg, #7c3aed, #a78bfa)',
    lightBg: '#faf5ff',
  },
]

function CustomerDashboard() {
  const { user } = useAuth()

  return (
    <Layout>
      <Box>
        {/* Welcome banner */}
        <Box sx={{
          background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
          borderRadius: 4,
          p: { xs: 3, md: 5 },
          color: 'white',
          mb: 4,
          position: 'relative',
          overflow: 'hidden',
        }}>
          <Box sx={{ position: 'absolute', top: -40, right: -40, width: 180, height: 180, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.08)' }} />
          <Box sx={{ position: 'absolute', bottom: -30, right: 80, width: 120, height: 120, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.06)' }} />
          <Box sx={{ position: 'relative' }}>
            <Typography variant="h4" fontWeight={800} mb={1}>
              Xin chào, {user?.name}! 👋
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.85, mb: 3 }}>
              Bạn muốn đặt chỗ đỗ xe hôm nay?
            </Typography>
            <Button
              component={Link}
              to="/customer/search"
              variant="contained"
              size="large"
              startIcon={<EventAvailableIcon />}
              sx={{
                bgcolor: '#fbbf24', color: '#1e1b4b',
                '&:hover': { bgcolor: '#f59e0b' },
                fontWeight: 700, px: 3,
              }}
            >
              Đặt chỗ ngay
            </Button>
          </Box>
        </Box>

        {/* Menu cards */}
        <Typography variant="h6" fontWeight={700} mb={2} color="text.primary">
          Chức năng
        </Typography>
        <Grid container spacing={3}>
          {menuCards.map((item) => (
            <Grid item xs={12} sm={6} md={4} key={item.path}>
              <Card sx={{
                borderRadius: 3,
                border: '1px solid #e2e8f0',
                '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 12px 40px rgba(37,99,235,0.15)', borderColor: '#2563eb' },
                transition: 'all 0.3s ease',
              }}>
                <CardActionArea component={Link} to={item.path}>
                  <CardContent sx={{ p: 0 }}>
                    {/* Top gradient bar */}
                    <Box sx={{ background: item.gradient, p: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.25)', color: 'white', width: 52, height: 52 }}>
                        {item.icon}
                      </Avatar>
                      <ArrowForwardIcon sx={{ color: 'rgba(255,255,255,0.7)' }} />
                    </Box>
                    {/* Bottom content */}
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

export default CustomerDashboard
