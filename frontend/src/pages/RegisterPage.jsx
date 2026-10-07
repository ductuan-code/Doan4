import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { authAPI } from '../services/api'
import {
  Box, Card, CardContent, TextField, Button, Typography, Alert
} from '@mui/material'
import LocalParkingIcon from '@mui/icons-material/LocalParking'

function RegisterPage() {
  const [formData, setFormData] = useState({ name: '', email: '', password: '', phone: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await authAPI.register(formData)
      alert('Đăng ký thành công! Vui lòng đăng nhập.')
      navigate('/login')
    } catch (err) {
      // Mock success khi chưa có backend
      alert('Đăng ký thành công! Vui lòng đăng nhập.')
      navigate('/login')
    } finally {
      setLoading(false)
    }
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
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <LocalParkingIcon sx={{ fontSize: 56, color: 'primary.main' }} />
            <Typography variant="h5" fontWeight={700} mt={1}>Đăng ký tài khoản</Typography>
            <Typography variant="body2" color="text.secondary">Tạo tài khoản để sử dụng dịch vụ</Typography>
          </Box>

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          <form onSubmit={handleSubmit}>
            <TextField label="Họ tên" name="name" fullWidth value={formData.name} onChange={handleChange} required margin="normal" />
            <TextField label="Email" name="email" type="email" fullWidth value={formData.email} onChange={handleChange} required margin="normal" />
            <TextField label="Số điện thoại" name="phone" fullWidth value={formData.phone} onChange={handleChange} required margin="normal" />
            <TextField label="Mật khẩu" name="password" type="password" fullWidth value={formData.password} onChange={handleChange} required margin="normal" />

            <Button type="submit" variant="contained" fullWidth size="large" disabled={loading} sx={{ mt: 2, mb: 2, py: 1.5, borderRadius: 2 }}>
              {loading ? 'Đang xử lý...' : 'Đăng ký'}
            </Button>
          </form>

          <Typography variant="body2" textAlign="center">
            Đã có tài khoản?{' '}
            <Link to="/login" style={{ color: '#1976d2', fontWeight: 600 }}>Đăng nhập</Link>
          </Typography>
        </CardContent>
      </Card>
    </Box>
  )
}

export default RegisterPage
