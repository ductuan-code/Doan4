import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { authAPI, getErrorMessage } from '../services/api'
import { dashboardPath } from '../components/ProtectedRoute'
import {
  Box, TextField, Button, Typography,
  Alert, Divider, Chip, InputAdornment, IconButton
} from '@mui/material'
import AuthShell from '../components/AuthShell'
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
      const { data } = await authAPI.login(email.trim(), password)
      login(data.user, data.token)
      navigate(dashboardPath(data.user.role), { replace: true })
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  const quickLogin = (testEmail) => {
    setEmail(testEmail)
    setPassword('123456')
  }

  return <AuthShell>
    <Typography sx={{ fontSize: 11, letterSpacing: '.12em', fontWeight: 700, color: 'primary.main', mb: 1.5 }}>CHÀO MỪNG TRỞ LẠI</Typography>
    <Typography component="h1" variant="h4">Đăng nhập</Typography>
    <Typography sx={{ color: 'text.secondary', fontSize: 14, mt: 1, mb: 3 }}>Tiếp tục hành trình của bạn cùng ParkingLot.</Typography>
    {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
    <Box component="form" onSubmit={handleSubmit} sx={{ display: 'grid', gap: 2.5 }}>
      <TextField label="Email" type="email" fullWidth value={email} onChange={e => setEmail(e.target.value)} required autoComplete="username"
        slotProps={{ input: { startAdornment: <InputAdornment position="start"><EmailIcon sx={{ color: '#81969e', fontSize: 19 }} /></InputAdornment> } }} />
      <TextField label="Mật khẩu" type={showPassword ? 'text' : 'password'} fullWidth value={password} onChange={e => setPassword(e.target.value)} required autoComplete="current-password"
        slotProps={{ input: {
          startAdornment: <InputAdornment position="start"><LockIcon sx={{ color: '#81969e', fontSize: 19 }} /></InputAdornment>,
          endAdornment: <InputAdornment position="end"><IconButton aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'} onClick={() => setShowPassword(!showPassword)} edge="end" size="small">{showPassword ? <VisibilityOff sx={{ fontSize: 20 }} /> : <Visibility sx={{ fontSize: 20 }} />}</IconButton></InputAdornment>
        } }} />
      <Button type="submit" variant="contained" fullWidth size="large" disabled={loading} sx={{ py: 1.5 }}>{loading ? 'Đang xử lý...' : 'Đăng nhập'}</Button>
    </Box>
    <Typography variant="body2" sx={{ textAlign: 'center', my: 3 }}>Chưa có tài khoản? <Link to="/register" style={{ color: '#087f73', fontWeight: 700 }}>Đăng ký ngay</Link></Typography>
    <Divider />
    <Box sx={{ mt: 3, p: 2, border: '1px dashed #d4e2dd', borderRadius: 2, bgcolor: '#f1f6f3' }}>
      <Typography sx={{ fontSize: 12, fontWeight: 600, mb: 1 }}>Trải nghiệm theo vai trò</Typography>
      <Typography sx={{ color: 'text.secondary', fontSize: 11, mb: 1.5 }}>Tài khoản demo · Mật khẩu: 123456</Typography>
      <Box sx={{ display: 'flex', gap: .8, flexWrap: 'wrap' }}>
        {[{ label: 'Khách hàng', email: 'customer1@parking.test' }, { label: 'Nhân viên', email: 'staff1@parking.test' }, { label: 'Admin', email: 'admin@parking.test' }].map(item =>
          <Chip key={item.email} label={item.label} variant="outlined" size="small" onClick={() => quickLogin(item.email)} sx={{ bgcolor: '#fff', borderColor: '#d2dfda' }} />)}
      </Box>
    </Box>
    <Button component={Link} to="/" size="small" sx={{ mt: 2, color: 'text.secondary' }}>← Về trang chủ</Button>
  </AuthShell>
}
export default LoginPage
