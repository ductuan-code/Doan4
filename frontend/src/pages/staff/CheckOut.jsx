import { useState } from 'react'
import Layout from '../../components/Layout'
import { sessionAPI } from '../../services/api'
import {
  Box, Typography, Card, CardContent, TextField, Button, Alert, Divider, Grid
} from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import LogoutOutlinedIcon from '@mui/icons-material/LogoutOutlined'
import AccessTimeIcon from '@mui/icons-material/AccessTime'

const mockSession = {
  id: 1,
  plateNumber: '29A-12345',
  vehicleType: 'MOTORBIKE',
  slotCode: 'A-03',
  checkInTime: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  estimatedFee: 10000
}

function CheckOut() {
  const [query, setQuery] = useState('')
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSearch = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await sessionAPI.search(query)
      setSession(response.data)
    } catch {
      // Mock data khi chưa có backend
      setSession({ ...mockSession, plateNumber: query || mockSession.plateNumber })
    } finally {
      setLoading(false)
    }
  }

  const handleCheckout = async () => {
    try {
      const hours = Math.ceil((Date.now() - new Date(session.checkInTime)) / (1000 * 60 * 60))
      const fee = hours * 5000
      alert(`Check-out thành công!\nThời gian gửi: ${hours} giờ\nTổng phí: ${fee.toLocaleString('vi-VN')} VNĐ`)
      setSession(null)
      setQuery('')
    } catch {
      setError('Check-out thất bại')
    }
  }

  const getDuration = (start) => {
    const diff = Date.now() - new Date(start)
    const h = Math.floor(diff / 3600000)
    const m = Math.floor((diff % 3600000) / 60000)
    return `${h} giờ ${m} phút`
  }

  const getEstimatedFee = (start) => {
    const hours = Math.ceil((Date.now() - new Date(start)) / 3600000)
    return (hours * 5000).toLocaleString('vi-VN')
  }

  return (
    <Layout>
      <Box>
        <Typography variant="h5" fontWeight={700} mb={3}>Check-out Xe</Typography>

        <Card sx={{ borderRadius: 3, boxShadow: 2, maxWidth: 700, mx: 'auto' }}>
          <CardContent sx={{ p: 4 }}>
            <Box sx={{ textAlign: 'center', mb: 3 }}>
              <LogoutOutlinedIcon sx={{ fontSize: 48, color: 'error.main' }} />
              <Typography variant="h6" fontWeight={600}>Ghi nhận xe ra bãi</Typography>
            </Box>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            {/* Search form */}
            <form onSubmit={handleSearch}>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                  label="Nhập biển số xe hoặc mã phiên"
                  fullWidth
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="VD: 29A-12345"
                  required
                />
                <Button type="submit" variant="contained" disabled={loading} startIcon={<SearchIcon />} sx={{ px: 3, borderRadius: 2, whiteSpace: 'nowrap' }}>
                  Tìm kiếm
                </Button>
              </Box>
            </form>

            {/* Session info */}
            {session && (
              <Box sx={{ mt: 3, border: '2px solid #e0e0e0', borderRadius: 2, p: 3 }}>
                <Typography variant="h6" fontWeight={600} color="primary" mb={2}>Thông tin phiên gửi xe</Typography>

                <Grid container spacing={2}>
                  {[
                    ['Biển số', session.plateNumber],
                    ['Loại xe', session.vehicleType === 'CAR' ? 'Ô tô' : 'Xe máy'],
                    ['Vị trí', session.slotCode],
                    ['Giờ vào', new Date(session.checkInTime).toLocaleString('vi-VN')],
                  ].map(([label, value]) => (
                    <Grid item xs={6} key={label}>
                      <Typography variant="body2" color="text.secondary">{label}</Typography>
                      <Typography fontWeight={600}>{value}</Typography>
                    </Grid>
                  ))}
                </Grid>

                <Divider sx={{ my: 2 }} />

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <AccessTimeIcon color="warning" />
                    <Typography fontWeight={600} color="warning.main">{getDuration(session.checkInTime)}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">Phí dự kiến</Typography>
                    <Typography variant="h5" fontWeight={700} color="error.main">
                      {getEstimatedFee(session.checkInTime)} VNĐ
                    </Typography>
                  </Box>
                </Box>

                <Button variant="contained" color="error" fullWidth size="large" onClick={handleCheckout} startIcon={<LogoutOutlinedIcon />} sx={{ mt: 2, py: 1.5, borderRadius: 2 }}>
                  Xác nhận Check-out
                </Button>
              </Box>
            )}
          </CardContent>
        </Card>
      </Box>
    </Layout>
  )
}

export default CheckOut
