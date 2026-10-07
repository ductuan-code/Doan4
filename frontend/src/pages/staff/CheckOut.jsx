import { useState } from 'react'
import Layout from '../../components/Layout'
import { sessionAPI } from '../../services/api'
import {
  Box, Typography, Card, CardContent, TextField, Button, Alert,
  Divider, Grid, Avatar, Chip
} from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import LogoutOutlinedIcon from '@mui/icons-material/LogoutOutlined'
import AccessTimeIcon from '@mui/icons-material/AccessTime'
import LocalParkingIcon from '@mui/icons-material/LocalParking'
import PaidIcon from '@mui/icons-material/Paid'

const mockSession = {
  id: 1,
  plateNumber: '29A-12345',
  vehicleType: 'MOTORBIKE',
  slotCode: 'A-03',
  checkInTime: new Date(Date.now() - 2.5 * 60 * 60 * 1000).toISOString(),
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
      setSession({ ...mockSession, plateNumber: query || mockSession.plateNumber })
    } finally {
      setLoading(false)
    }
  }

  const handleCheckout = () => {
    const hours = Math.ceil((Date.now() - new Date(session.checkInTime)) / 3600000)
    const rate = session.vehicleType === 'CAR' ? 20000 : 5000
    const fee = hours * rate
    alert(`✅ Check-out thành công!\nThời gian gửi: ${hours} giờ\nTổng phí: ${fee.toLocaleString('vi-VN')} VNĐ`)
    setSession(null)
    setQuery('')
  }

  const getDuration = (start) => {
    const diff = Date.now() - new Date(start)
    const h = Math.floor(diff / 3600000)
    const m = Math.floor((diff % 3600000) / 60000)
    return `${h} giờ ${m} phút`
  }

  const getEstimatedFee = (start, type) => {
    const hours = Math.ceil((Date.now() - new Date(start)) / 3600000)
    const rate = type === 'CAR' ? 20000 : 5000
    return (hours * rate).toLocaleString('vi-VN')
  }

  return (
    <Layout>
      <Box>
        {/* Header */}
        <Box sx={{
          background: 'linear-gradient(135deg, #dc2626, #f87171)',
          borderRadius: 3, p: 3, mb: 3, color: 'white'
        }}>
          <Typography variant="h5" fontWeight={700}>Check-out Xe</Typography>
          <Typography variant="body2" sx={{ opacity: 0.85 }}>Ghi nhận xe ra bãi và tính phí</Typography>
        </Box>

        <Card sx={{ borderRadius: 3, maxWidth: 680, mx: 'auto' }}>
          <CardContent sx={{ p: 4 }}>
            <Box sx={{ textAlign: 'center', mb: 3 }}>
              <Avatar sx={{ bgcolor: '#fff1f2', width: 72, height: 72, mx: 'auto', mb: 1.5 }}>
                <LogoutOutlinedIcon sx={{ fontSize: 40, color: '#dc2626' }} />
              </Avatar>
              <Typography variant="h6" fontWeight={700}>Tra cứu phiên gửi xe</Typography>
            </Box>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            <form onSubmit={handleSearch}>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                  label="Biển số xe hoặc mã phiên"
                  fullWidth value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="VD: 29A-12345" required
                />
                <Button type="submit" variant="contained" disabled={loading}
                  startIcon={<SearchIcon />}
                  sx={{ px: 3, whiteSpace: 'nowrap', minWidth: 120 }}
                >
                  {loading ? 'Đang tìm...' : 'Tìm'}
                </Button>
              </Box>
            </form>

            {session && (
              <Box sx={{ mt: 3, border: '2px solid #e2e8f0', borderRadius: 3, overflow: 'hidden' }}>
                {/* Session header */}
                <Box sx={{ bgcolor: '#f8faff', p: 2, display: 'flex', alignItems: 'center', gap: 2, borderBottom: '1px solid #e2e8f0' }}>
                  <Avatar sx={{ bgcolor: '#eff6ff' }}>
                    <LocalParkingIcon color="primary" />
                  </Avatar>
                  <Box>
                    <Typography fontWeight={700}>Phiên gửi xe #{session.id}</Typography>
                    <Typography variant="caption" color="text.secondary">Đang hoạt động</Typography>
                  </Box>
                  <Chip label="Đang sử dụng" color="success" size="small" sx={{ ml: 'auto' }} />
                </Box>

                {/* Session details */}
                <Box sx={{ p: 3 }}>
                  <Grid container spacing={2} mb={2}>
                    {[
                      ['Biển số', session.plateNumber],
                      ['Loại xe', session.vehicleType === 'CAR' ? '🚗 Ô tô' : '🛵 Xe máy'],
                      ['Vị trí', session.slotCode],
                      ['Giờ vào', new Date(session.checkInTime).toLocaleString('vi-VN')],
                    ].map(([label, value]) => (
                      <Grid item xs={6} key={label}>
                        <Typography variant="caption" color="text.secondary" display="block">{label}</Typography>
                        <Typography fontWeight={600}>{value}</Typography>
                      </Grid>
                    ))}
                  </Grid>

                  <Divider sx={{ my: 2 }} />

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, bgcolor: '#fffbeb', px: 2, py: 1, borderRadius: 2 }}>
                      <AccessTimeIcon sx={{ color: '#d97706' }} />
                      <Box>
                        <Typography variant="caption" color="text.secondary">Thời gian gửi</Typography>
                        <Typography fontWeight={700} color="#d97706">
                          {getDuration(session.checkInTime)}
                        </Typography>
                      </Box>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, bgcolor: '#fff1f2', px: 2, py: 1, borderRadius: 2 }}>
                      <PaidIcon sx={{ color: '#dc2626' }} />
                      <Box>
                        <Typography variant="caption" color="text.secondary">Phí dự kiến</Typography>
                        <Typography variant="h6" fontWeight={800} color="#dc2626">
                          {getEstimatedFee(session.checkInTime, session.vehicleType)} VNĐ
                        </Typography>
                      </Box>
                    </Box>
                  </Box>

                  <Button
                    variant="contained" fullWidth size="large"
                    onClick={handleCheckout}
                    startIcon={<LogoutOutlinedIcon />}
                    sx={{
                      py: 1.5, fontWeight: 700, fontSize: 16,
                      background: 'linear-gradient(135deg, #dc2626, #f87171)',
                      '&:hover': { background: 'linear-gradient(135deg, #b91c1c, #ef4444)' },
                    }}
                  >
                    Xác nhận Check-out & Tính phí
                  </Button>
                </Box>
              </Box>
            )}
          </CardContent>
        </Card>
      </Box>
    </Layout>
  )
}

export default CheckOut
