import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { Alert, Box, Button, CircularProgress } from '@mui/material'
import { useAuth } from '../context/AuthContext'

export const dashboardPath = role => ({
  Customer: '/customer/dashboard', Staff: '/staff/dashboard', Admin: '/admin/dashboard',
}[role] || '/')

export default function ProtectedRoute({ roles }) {
  const { user, loading, sessionError, refreshUser, logout } = useAuth()
  const location = useLocation()
  if (loading) return <Box sx={{ p: 6, textAlign: 'center' }}><CircularProgress aria-label="Đang kiểm tra đăng nhập" /></Box>
  if (sessionError) return (
    <Box sx={{ p: 4, maxWidth: 680, mx: 'auto' }}>
      <Alert severity="error" sx={{ mb: 2 }}>{sessionError}</Alert>
      <Button onClick={refreshUser}>Thử kết nối lại</Button>
      <Button onClick={logout}>Về đăng nhập</Button>
    </Box>
  )
  if (!user) return <Navigate to="/login" state={{ from: location.pathname }} replace />
  if (!roles.includes(user.role)) return <Navigate to={dashboardPath(user.role)} replace />
  return <Outlet />
}
