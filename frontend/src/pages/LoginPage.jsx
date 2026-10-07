import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  Box, Card, CardContent, TextField, Button, Typography,
  Alert, Divider, Chip
} from '@mui/material'
import LocalParkingIcon from '@mui/icons-material/LocalParking'

function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const mockUsers = {
        'customer@test.com': { id: 1, name: 'Khách Hàng Test', email: 'customer@test.com', role: 'Customer' },
        'staff@test.com':    { id: 2, name: 'Nhân Viên Test',  email: 'staff@test.com',    role: 'Staff' },
        'admin@test.com':    { id: 3, name: 'Quản Trị Test',   email: 'admin@test.com',    role: 'Admin' },
      }

      const mockUser = mockUsers[email]
      if (!mockUser || password !== '123456') throw new Error('Sai email hoặc mật khẩu')

      login(mockUser, 'mock-token-123')

      if (mockUser.role === 'Admin') navigate('/admin/dashboard')
      else if (mockUser.role === 'Staff') navigate('/staff/dashboard')
      else navigate('/customer/dashboard')
    } catch (err) {
      setError(err.message || 'Đăng nhập thất bại')
    } finally {
      setLoading(false)
    }
  }

  const quickLogin = (testEmail) => {
    setEmail(testEmail)
    setPassword('123456')
  }

  return (
    <Box sx={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
      p: 2
    }}>
      <Card sx={{ maxWidth: 460, width: '100%', borderRadius: 3, boxShadow: 8 }}>
        <CardContent sx={{ p: 4 }}>
          {/* Logo */}
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <LocalParkingIcon sx={{ fontSize: 56, color: 'primary.main' }} />
            <Typography variant="h5" fontWeight={700} mt={1}>
              Hệ Thống Bãi Đỗ Xe
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Đăng nhập để tiếp tục
            </Typography>
          </Box>

          {/* Test accounts hint */}
          <Alert severity="info" sx={{ mb: 2, fontSize: 13 }}>
            <strong>Tài khoản test (mật khẩu: 123456)</strong>
            <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap' }}>
              <Chip label="customer@test.com" size="small" onClick={() => quickLogin('customer@test.com')} clickable color="primary" variant="outlined" />
              <Chip label="staff@test.com" size="small" onClick={() => quickLogin('staff@test.com')} clickable color="success" variant="outlined" />
              <Chip label="admin@test.com" size="small" onClick={() => quickLogin('admin@test.com')} clickable color="warning" variant="outlined" />
            </Box>
          </Alert>

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          <form onSubmit={handleSubmit}>
            <TextField
              label="Email"
              type="email"
              fullWidth
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              margin="normal"
              placeholder="example@email.com"
            />
            <TextField
              label="Mật khẩu"
              type="password"
              fullWidth
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              margin="normal"
              placeholder="••••••••"
            />
            <Button
              type="submit"
              variant="contained"
              fullWidth
              size="large"
              disabled={loading}
              sx={{ mt: 2, mb: 2, py: 1.5, borderRadius: 2 }}
            >
              {loading ? 'Đang xử lý...' : 'Đăng nhập'}
            </Button>
          </form>

          <Divider sx={{ my: 2 }} />

          <Typography variant="body2" textAlign="center">
            Chưa có tài khoản?{' '}
            <Link to="/register" style={{ color: '#1976d2', fontWeight: 600 }}>
              Đăng ký ngay
            </Link>
          </Typography>
        </CardContent>
      </Card>
    </Box>
  )
}

export default LoginPage
