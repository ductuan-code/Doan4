import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  Box, Card, CardContent, TextField, Button, Typography,
  Alert, Divider, Chip, InputAdornment, IconButton
} from '@mui/material'
import LocalParkingIcon from '@mui/icons-material/LocalParking'
import EmailIcon from '@mui/icons-material/Email'
import LockIcon from '@mui/icons-material/Lock'
import Visibility from '@mui/icons-material/Visibility'
import VisibilityOff from '@mui/icons-material/VisibilityOff'

function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
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
        'customer@test.com': { id: 1, name: 'Nguyễn Văn A', email: 'customer@test.com', role: 'Customer' },
        'staff@test.com':    { id: 2, name: 'Trần Thị B',   email: 'staff@test.com',    role: 'Staff' },
        'admin@test.com':    { id: 3, name: 'Admin System',  email: 'admin@test.com',    role: 'Admin' },
      }
      const mockUser = mockUsers[email]
      if (!mockUser || password !== '123456') throw new Error('Sai email hoặc mật khẩu')
      login(mockUser, 'mock-token-123')
      if (mockUser.role === 'Admin') navigate('/admin/dashboard')
      else if (mockUser.role === 'Staff') navigate('/staff/dashboard')
      else navigate('/customer/dashboard')
    } catch (err) {
      setError(err.message)
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
      background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
    }}>
      {/* Left panel */}
      <Box sx={{
        display: { xs: 'none', md: 'flex' },
        flex: 1,
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        p: 6,
        color: 'white',
      }}>
        <LocalParkingIcon sx={{ fontSize: 100, mb: 3, opacity: 0.9 }} />
        <Typography variant="h3" fontWeight={800} textAlign="center" mb={2}>
          ParkingLot System
        </Typography>
        <Typography variant="h6" textAlign="center" sx={{ opacity: 0.85, maxWidth: 400 }}>
          Hệ thống đặt chỗ và quản lý bãi đỗ xe thông minh
        </Typography>
        <Box sx={{ display: 'flex', gap: 3, mt: 5 }}>
          {[
            { num: '500+', label: 'Vị trí đỗ' },
            { num: '1000+', label: 'Khách hàng' },
            { num: '24/7', label: 'Hỗ trợ' },
          ].map(item => (
            <Box key={item.label} sx={{ textAlign: 'center', bgcolor: 'rgba(255,255,255,0.15)', borderRadius: 3, px: 3, py: 2 }}>
              <Typography variant="h5" fontWeight={700}>{item.num}</Typography>
              <Typography variant="caption" sx={{ opacity: 0.85 }}>{item.label}</Typography>
            </Box>
          ))}
        </Box>
      </Box>

      {/* Right panel - Form */}
      <Box sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flex: { xs: 1, md: 'none' },
        width: { md: 480 },
        p: 3,
        bgcolor: '#f0f4ff',
      }}>
        <Card sx={{ width: '100%', maxWidth: 420, borderRadius: 4, boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
          <CardContent sx={{ p: 4 }}>
            <Box sx={{ textAlign: 'center', mb: 3 }}>
              <Box sx={{
                display: 'inline-flex', p: 1.5, borderRadius: 3,
                background: 'linear-gradient(135deg, #2563eb, #7c3aed)', mb: 2
              }}>
                <LocalParkingIcon sx={{ fontSize: 32, color: 'white' }} />
              </Box>
              <Typography variant="h5" fontWeight={700}>Đăng nhập</Typography>
              <Typography variant="body2" color="text.secondary" mt={0.5}>
                Chào mừng trở lại!
              </Typography>
            </Box>

            {/* Quick login chips */}
            <Alert severity="info" sx={{ mb: 2, '& .MuiAlert-message': { width: '100%' } }}>
              <Typography variant="caption" fontWeight={600} display="block" mb={1}>
                Tài khoản test (mật khẩu: 123456)
              </Typography>
              <Box sx={{ display: 'flex', gap: 0.8, flexWrap: 'wrap' }}>
                {[
                  { label: 'Khách hàng', email: 'customer@test.com', color: 'primary' },
                  { label: 'Nhân viên', email: 'staff@test.com', color: 'success' },
                  { label: 'Admin', email: 'admin@test.com', color: 'warning' },
                ].map(item => (
                  <Chip
                    key={item.email}
                    label={item.label}
                    size="small"
                    color={item.color}
                    onClick={() => quickLogin(item.email)}
                    clickable
                    sx={{ fontWeight: 600 }}
                  />
                ))}
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
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailIcon color="primary" fontSize="small" />
                    </InputAdornment>
                  )
                }}
              />
              <TextField
                label="Mật khẩu"
                type={showPassword ? 'text' : 'password'}
                fullWidth
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                margin="normal"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockIcon color="primary" fontSize="small" />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowPassword(!showPassword)} edge="end" size="small">
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  )
                }}
              />

              <Button
                type="submit"
                variant="contained"
                fullWidth
                size="large"
                disabled={loading}
                sx={{
                  mt: 2, mb: 2, py: 1.5,
                  background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
                  '&:hover': { background: 'linear-gradient(135deg, #1d4ed8, #5b21b6)' },
                  fontWeight: 700, fontSize: 16
                }}
              >
                {loading ? 'Đang xử lý...' : 'Đăng nhập'}
              </Button>
            </form>

            <Divider sx={{ my: 2 }} />
            <Typography variant="body2" textAlign="center">
              Chưa có tài khoản?{' '}
              <Link to="/register" style={{ color: '#2563eb', fontWeight: 700 }}>Đăng ký ngay</Link>
            </Typography>
          </CardContent>
        </Card>
      </Box>
    </Box>
  )
}

export default LoginPage
