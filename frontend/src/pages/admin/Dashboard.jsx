import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import Layout from '../../components/Layout'
import { Box, Grid, Card, CardContent, Typography, CardActionArea, Avatar } from '@mui/material'
import BusinessIcon from '@mui/icons-material/Business'
import MapIcon from '@mui/icons-material/Map'
import GridViewIcon from '@mui/icons-material/GridView'
import AttachMoneyIcon from '@mui/icons-material/AttachMoney'
import PeopleIcon from '@mui/icons-material/People'
import AssessmentIcon from '@mui/icons-material/Assessment'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'

const stats = [
  { label: 'Tổng bãi đỗ',      value: 3,        color: '#2563eb', bg: '#eff6ff' },
  { label: 'Tổng vị trí',      value: 180,       color: '#059669', bg: '#f0fdf4' },
  { label: 'Đang sử dụng',     value: 95,        color: '#dc2626', bg: '#fff1f2' },
  { label: 'Doanh thu hôm nay', value: '1.2M ₫', color: '#d97706', bg: '#fffbeb' },
]

const menuCards = [
  { title: 'Bãi đỗ xe',   desc: 'Quản lý các bãi đỗ',            icon: <BusinessIcon sx={{ fontSize: 32 }} />, path: '/admin/parking-lots', gradient: 'linear-gradient(135deg, #2563eb, #60a5fa)', lightBg: '#eff6ff' },
  { title: 'Khu vực',     desc: 'Quản lý zone trong bãi',         icon: <MapIcon sx={{ fontSize: 32 }} />,      path: '/admin/zones',        gradient: 'linear-gradient(135deg, #059669, #34d399)', lightBg: '#f0fdf4' },
  { title: 'Vị trí đỗ',  desc: 'Quản lý từng slot đỗ xe',        icon: <GridViewIcon sx={{ fontSize: 32 }} />, path: '/admin/slots',        gradient: 'linear-gradient(135deg, #0891b2, #22d3ee)', lightBg: '#ecfeff' },
  { title: 'Bảng giá',   desc: 'Cấu hình giá theo loại xe',       icon: <AttachMoneyIcon sx={{ fontSize: 32 }} />, path: '/admin/pricing',   gradient: 'linear-gradient(135deg, #d97706, #fbbf24)', lightBg: '#fffbeb' },
  { title: 'Tài khoản',  desc: 'Quản lý người dùng & nhân viên', icon: <PeopleIcon sx={{ fontSize: 32 }} />,   path: '/admin/users',        gradient: 'linear-gradient(135deg, #7c3aed, #a78bfa)', lightBg: '#faf5ff' },
  { title: 'Báo cáo',    desc: 'Thống kê vận hành chi tiết',      icon: <AssessmentIcon sx={{ fontSize: 32 }} />, path: '/admin/reports',   gradient: 'linear-gradient(135deg, #dc2626, #f87171)', lightBg: '#fff1f2' },
]

function AdminDashboard() {
  const { user } = useAuth()

  return (
    <Layout>
      <Box>
        {/* Welcome banner */}
        <Box sx={{
          background: 'linear-gradient(135deg, #7c3aed 0%, #2563eb 100%)',
          borderRadius: 4, p: { xs: 3, md: 5 },
          color: 'white', mb: 4,
          position: 'relative', overflow: 'hidden',
        }}>
          <Box sx={{ position: 'absolute', top: -50, right: -50, width: 200, height: 200, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.07)' }} />
          <Box sx={{ position: 'absolute', bottom: -30, right: 120, width: 140, height: 140, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.05)' }} />
          <Box sx={{ position: 'relative' }}>
            <Typography variant="h4" fontWeight={800} mb={1}>
              Xin chào, {user?.name}! 👋
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.85 }}>
              Tổng quan hệ thống quản lý bãi đỗ xe
            </Typography>
          </Box>
        </Box>

        {/* Stats */}
        <Grid container spacing={2} mb={4}>
          {stats.map((stat) => (
            <Grid item xs={6} md={3} key={stat.label}>
              <Card sx={{ borderRadius: 3, border: '1px solid #e2e8f0' }}>
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
        <Typography variant="h6" fontWeight={700} mb={2}>Quản lý hệ thống</Typography>
        <Grid container spacing={3}>
          {menuCards.map((item) => (
            <Grid item xs={12} sm={6} md={4} key={item.path}>
              <Card sx={{
                borderRadius: 3, border: '1px solid #e2e8f0',
                '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 12px 40px rgba(124,58,237,0.15)', borderColor: '#7c3aed' },
                transition: 'all 0.3s ease',
              }}>
                <CardActionArea component={Link} to={item.path}>
                  <CardContent sx={{ p: 0 }}>
                    <Box sx={{ background: item.gradient, p: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.25)', color: 'white', width: 50, height: 50 }}>
                        {item.icon}
                      </Avatar>
                      <ArrowForwardIcon sx={{ color: 'rgba(255,255,255,0.7)' }} />
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

export default AdminDashboard
