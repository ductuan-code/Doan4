import { useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Box, Drawer, AppBar, Toolbar, Typography, List, ListItem, ListItemButton, ListItemIcon,
  ListItemText, IconButton, Avatar, Button } from '@mui/material'
import MenuIcon from '@mui/icons-material/Menu'
import CloseIcon from '@mui/icons-material/Close'
import LogoutIcon from '@mui/icons-material/Logout'
import DashboardIcon from '@mui/icons-material/DashboardOutlined'
import DirectionsCarIcon from '@mui/icons-material/DirectionsCarOutlined'
import SearchIcon from '@mui/icons-material/Search'
import HistoryIcon from '@mui/icons-material/History'
import LoginIcon from '@mui/icons-material/Login'
import LogoutOutlinedIcon from '@mui/icons-material/LogoutOutlined'
import MapIcon from '@mui/icons-material/MapOutlined'
import PeopleIcon from '@mui/icons-material/PeopleOutlined'
import AttachMoneyIcon from '@mui/icons-material/AttachMoney'
import AssessmentIcon from '@mui/icons-material/AssessmentOutlined'
import GridViewIcon from '@mui/icons-material/GridViewOutlined'
import BusinessIcon from '@mui/icons-material/BusinessOutlined'
import Brand from './Brand'

const DRAWER_WIDTH = 252
const menuItems = {
  Customer: [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/customer/dashboard' },
    { text: 'Phương tiện', icon: <DirectionsCarIcon />, path: '/customer/vehicles' },
    { text: 'Tìm bãi đỗ xe', icon: <SearchIcon />, path: '/customer/search' },
    { text: 'Lịch sử đặt chỗ', icon: <HistoryIcon />, path: '/customer/history' },
    { text: 'Lịch sử gửi xe', icon: <HistoryIcon />, path: '/customer/sessions' },
  ],
  Staff: [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/staff/dashboard' },
    { text: 'Trạng thái bãi', icon: <GridViewIcon />, path: '/staff/parking-status' },
    { text: 'Check-in xe', icon: <LoginIcon />, path: '/staff/checkin' },
    { text: 'Check-out xe', icon: <LogoutOutlinedIcon />, path: '/staff/checkout' },
  ],
  Admin: [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/admin/dashboard' },
    { text: 'Bãi đỗ xe', icon: <BusinessIcon />, path: '/admin/parking-lots' },
    { text: 'Khu vực', icon: <MapIcon />, path: '/admin/zones' },
    { text: 'Vị trí đỗ', icon: <GridViewIcon />, path: '/admin/slots' },
    { text: 'Bảng giá', icon: <AttachMoneyIcon />, path: '/admin/pricing' },
    { text: 'Tài khoản', icon: <PeopleIcon />, path: '/admin/users' },
    { text: 'Báo cáo', icon: <AssessmentIcon />, path: '/admin/reports' },
  ],
}
const roleLabel = { Customer: 'Khách hàng', Staff: 'Nhân viên', Admin: 'Quản trị viên' }

export default function Layout({ children }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate(), location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)
  const items = menuItems[user?.role] || []
  const current = items.find(item => item.path === location.pathname)
  const handleLogout = () => { logout(); navigate('/login') }
  const drawer = <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: '#142e38', color: '#fff', px: 2, pt: 3 }}>
    <Box sx={{ px: 1, mb: 4 }}><Brand light /></Box>
    <Box sx={{ px: 1.5, mb: 1.5 }}>
      <Typography sx={{ fontSize: 10, letterSpacing: '.14em', color: '#8ea7b1', fontWeight: 700 }}>KHÔNG GIAN LÀM VIỆC</Typography>
      <Typography sx={{ fontSize: 13, color: '#d3f28c', mt: .7 }}>{roleLabel[user?.role]}</Typography>
    </Box>
    <List component="nav" aria-label="Điều hướng chính" sx={{ flex: 1, p: 0 }}>
      {items.map(item => {
        const active = location.pathname === item.path
        return <ListItem key={item.path} disablePadding sx={{ mb: .65 }}>
          <ListItemButton component={Link} to={item.path} aria-current={active ? 'page' : undefined} onClick={() => setMobileOpen(false)} sx={{
            borderRadius: 2, px: 1.8, py: 1.25, color: active ? '#effff8' : '#a8bdc5',
            bgcolor: active ? '#284a50' : 'transparent', border: '1px solid', borderColor: active ? '#416269' : 'transparent',
            '&:hover': { bgcolor: '#23444d', color: '#fff' }, '& .MuiSvgIcon-root': { fontSize: 21 },
          }}>
            <ListItemIcon sx={{ color: active ? '#d3f28c' : 'inherit', minWidth: 35 }}>{item.icon}</ListItemIcon>
            <ListItemText primary={item.text} slotProps={{ primary: { sx: { fontWeight: active ? 600 : 400, fontSize: 13 } } }} />
            {active && <Box sx={{ width: 6, height: 6, bgcolor: '#d3f28c', borderRadius: '50%' }} />}
          </ListItemButton>
        </ListItem>
      })}
    </List>
    <Box sx={{ mt: 3, p: 1.3, borderTop: '1px solid #304953' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, py: 1.5 }}>
        <Avatar sx={{ width: 36, height: 36, bgcolor: '#38535d', color: '#e2efec', fontSize: 14 }}>{user?.name?.charAt(0)}</Avatar>
        <Box sx={{ minWidth: 0 }}><Typography noWrap sx={{ fontSize: 13, fontWeight: 600 }}>{user?.name}</Typography><Typography noWrap sx={{ fontSize: 11, color: '#91aab4' }}>{user?.email}</Typography></Box>
      </Box>
      <Button fullWidth startIcon={<LogoutIcon sx={{ fontSize: 17 }} />} onClick={handleLogout} sx={{ color: '#afc2ca', justifyContent: 'flex-start', px: 0, '&:hover': { color: '#fff' } }}>Đăng xuất</Button>
    </Box>
  </Box>
  return <Box sx={{ display: 'flex', minHeight: '100vh' }}>
    <Box component="a" href="#main-content" sx={{ position: 'fixed', top: -80, left: 16, zIndex: 1600, bgcolor: '#fff', p: 1.5, '&:focus': { top: 12 } }}>Đến nội dung chính</Box>
    <Drawer variant="permanent" sx={{ display: { xs: 'none', md: 'block' }, width: DRAWER_WIDTH, flexShrink: 0, '& .MuiDrawer-paper': { width: DRAWER_WIDTH, boxSizing: 'border-box', border: 0 } }}>{drawer}</Drawer>
    <Drawer variant="temporary" open={mobileOpen} onClose={() => setMobileOpen(false)} sx={{ display: { xs: 'block', md: 'none' }, '& .MuiDrawer-paper': { width: DRAWER_WIDTH, border: 0 } }}>
      <IconButton aria-label="Đóng menu" onClick={() => setMobileOpen(false)} sx={{ position: 'absolute', right: 4, top: 4, color: '#a8bdc5', zIndex: 1 }}><CloseIcon sx={{ fontSize: 18 }} /></IconButton>{drawer}
    </Drawer>
    <Box sx={{ flex: 1, minWidth: 0 }}>
      <AppBar position="sticky" elevation={0} sx={{ bgcolor: 'rgba(255,255,255,.96)', color: 'text.primary', borderBottom: '1px solid', borderColor: 'divider' }}>
        <Toolbar sx={{ minHeight: { xs: 64, md: 72 }, gap: 1.5, px: { xs: 2, sm: 3, lg: 4 } }}>
          <IconButton aria-label="Mở menu" onClick={() => setMobileOpen(true)} sx={{ display: { md: 'none' }, ml: -1 }}><MenuIcon /></IconButton>
          <Typography sx={{ fontSize: 13, color: 'text.secondary', display: { xs: 'none', sm: 'block' } }}>Không gian {roleLabel[user?.role]?.toLowerCase()}</Typography>
          <Typography sx={{ color: '#b7c5ca', display: { xs: 'none', sm: 'block' } }}>/</Typography>
          <Typography noWrap sx={{ fontSize: 13, fontWeight: 600, flex: 1 }}>{current?.text === 'Dashboard' ? 'Tổng quan' : current?.text}</Typography>
          <Typography sx={{ fontSize: 12, color: 'text.secondary', display: { xs: 'none', sm: 'block' } }}>{user?.name}</Typography>
          <Avatar sx={{ width: 32, height: 32, bgcolor: '#e3f1ec', color: 'primary.main', fontSize: 13, fontWeight: 700 }}>{user?.name?.charAt(0)}</Avatar>
        </Toolbar>
      </AppBar>
      <Box component="main" id="main-content" tabIndex={-1} sx={{ p: { xs: 2, sm: 3, lg: 4 }, maxWidth: 1600, mx: 'auto', minWidth: 0, outline: 'none' }}>{children}</Box>
    </Box>
  </Box>
}
