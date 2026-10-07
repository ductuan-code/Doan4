import { useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  Box, Drawer, AppBar, Toolbar, Typography, List, ListItem,
  ListItemButton, ListItemIcon, ListItemText, IconButton,
  Avatar, Menu, MenuItem, Divider, Chip
} from '@mui/material'
import MenuIcon from '@mui/icons-material/Menu'
import LogoutIcon from '@mui/icons-material/Logout'
import LocalParkingIcon from '@mui/icons-material/LocalParking'
import DashboardIcon from '@mui/icons-material/Dashboard'
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar'
import SearchIcon from '@mui/icons-material/Search'
import HistoryIcon from '@mui/icons-material/History'
import LoginIcon from '@mui/icons-material/Login'
import LogoutOutlinedIcon from '@mui/icons-material/LogoutOutlined'
import MapIcon from '@mui/icons-material/Map'
import PeopleIcon from '@mui/icons-material/People'
import AttachMoneyIcon from '@mui/icons-material/AttachMoney'
import AssessmentIcon from '@mui/icons-material/Assessment'
import GridViewIcon from '@mui/icons-material/GridView'
import BusinessIcon from '@mui/icons-material/Business'

const DRAWER_WIDTH = 260

const menuItems = {
  Customer: [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/customer/dashboard' },
    { text: 'Phương tiện', icon: <DirectionsCarIcon />, path: '/customer/vehicles' },
    { text: 'Tìm bãi đỗ xe', icon: <SearchIcon />, path: '/customer/search' },
    { text: 'Lịch sử đặt chỗ', icon: <HistoryIcon />, path: '/customer/history' },
  ],
  Staff: [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/staff/dashboard' },
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
  ]
}

const roleColor = {
  Customer: 'primary',
  Staff: 'success',
  Admin: 'warning'
}

const roleLabel = {
  Customer: 'Khách hàng',
  Staff: 'Nhân viên',
  Admin: 'Quản trị viên'
}

function Layout({ children }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [anchorEl, setAnchorEl] = useState(null)

  const items = menuItems[user?.role] || []

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const sidebarBg = {
    Customer: 'linear-gradient(180deg, #2563eb 0%, #1d4ed8 100%)',
    Staff:    'linear-gradient(180deg, #059669 0%, #047857 100%)',
    Admin:    'linear-gradient(180deg, #7c3aed 0%, #5b21b6 100%)',
  }

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', background: sidebarBg[user?.role] || sidebarBg.Customer }}>
      {/* Logo */}
      <Box sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Box sx={{ bgcolor: 'rgba(255,255,255,0.2)', borderRadius: 2, p: 0.8, display: 'flex' }}>
          <LocalParkingIcon sx={{ color: 'white', fontSize: 28 }} />
        </Box>
        <Box>
          <Typography variant="h6" fontWeight={700} color="white" lineHeight={1.1}>
            ParkingLot
          </Typography>
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>
            Hệ thống bãi đỗ xe
          </Typography>
        </Box>
      </Box>

      {/* User info */}
      <Box sx={{ px: 2, pb: 2 }}>
        <Box sx={{ bgcolor: 'rgba(255,255,255,0.15)', borderRadius: 2, p: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{ bgcolor: 'rgba(255,255,255,0.3)', borderRadius: '50%', width: 38, height: 38, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Typography fontWeight={700} color="white" fontSize={16}>
              {user?.name?.charAt(0)}
            </Typography>
          </Box>
          <Box>
            <Typography variant="subtitle2" color="white" fontWeight={600} noWrap>
              {user?.name}
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.75)' }}>
              {roleLabel[user?.role]}
            </Typography>
          </Box>
        </Box>
      </Box>

      <Divider sx={{ borderColor: 'rgba(255,255,255,0.15)', mx: 2 }} />

      {/* Menu items */}
      <List sx={{ flex: 1, px: 1.5, py: 2 }}>
        {items.map((item) => {
          const isActive = location.pathname === item.path
          return (
            <ListItem key={item.path} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                component={Link}
                to={item.path}
                onClick={() => setMobileOpen(false)}
                sx={{
                  borderRadius: 2,
                  color: isActive ? '#1d4ed8' : 'rgba(255,255,255,0.85)',
                  bgcolor: isActive ? 'white' : 'transparent',
                  py: 1.2,
                  '&:hover': {
                    bgcolor: isActive ? 'white' : 'rgba(255,255,255,0.12)',
                    color: isActive ? '#1d4ed8' : 'white',
                  },
                  transition: 'all 0.2s',
                }}
              >
                <ListItemIcon sx={{ color: 'inherit', minWidth: 38 }}>{item.icon}</ListItemIcon>
                <ListItemText
                  primary={item.text}
                  primaryTypographyProps={{ fontWeight: isActive ? 700 : 400, fontSize: 14 }}
                />
                {isActive && (
                  <Box sx={{ width: 4, height: 24, bgcolor: '#2563eb', borderRadius: 2 }} />
                )}
              </ListItemButton>
            </ListItem>
          )
        })}
      </List>

      {/* Logout */}
      <Divider sx={{ borderColor: 'rgba(255,255,255,0.15)', mx: 2 }} />
      <List sx={{ px: 1.5, py: 1.5 }}>
        <ListItem disablePadding>
          <ListItemButton
            onClick={handleLogout}
            sx={{
              borderRadius: 2,
              color: 'rgba(255,255,255,0.85)',
              '&:hover': { bgcolor: 'rgba(239,68,68,0.25)', color: '#fca5a5' },
              transition: 'all 0.2s',
            }}
          >
            <ListItemIcon sx={{ color: 'inherit', minWidth: 38 }}><LogoutIcon /></ListItemIcon>
            <ListItemText primary="Đăng xuất" primaryTypographyProps={{ fontSize: 14 }} />
          </ListItemButton>
        </ListItem>
      </List>
    </Box>
  )

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* AppBar mobile */}
      <AppBar position="fixed" sx={{ display: { md: 'none' }, zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <Toolbar>
          <IconButton color="inherit" edge="start" onClick={() => setMobileOpen(!mobileOpen)} sx={{ mr: 2 }}>
            <MenuIcon />
          </IconButton>
          <LocalParkingIcon sx={{ mr: 1 }} />
          <Typography variant="h6" fontWeight={700}>Bãi Đỗ Xe</Typography>
        </Toolbar>
      </AppBar>

      {/* Drawer desktop */}
      <Drawer
        variant="permanent"
        sx={{ display: { xs: 'none', md: 'block' }, width: DRAWER_WIDTH, flexShrink: 0, '& .MuiDrawer-paper': { width: DRAWER_WIDTH, boxSizing: 'border-box', border: 'none' } }}
      >
        {drawer}
      </Drawer>

      {/* Drawer mobile */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        sx={{ display: { xs: 'block', md: 'none' }, '& .MuiDrawer-paper': { width: DRAWER_WIDTH } }}
      >
        {drawer}
      </Drawer>

      {/* Main content */}
      <Box component="main" sx={{ flexGrow: 1, p: 3, mt: { xs: 8, md: 0 }, bgcolor: '#f0f4ff', minHeight: '100vh' }}>
        {children}
      </Box>
    </Box>
  )
}

export default Layout
