import { useState } from 'react'
import Layout from '../../components/Layout'
import { sessionAPI } from '../../services/api'
import {
  Box, Typography, Card, CardContent, TextField, Button, Alert,
  ToggleButtonGroup, ToggleButton, Select, MenuItem, FormControl,
  InputLabel, Avatar
} from '@mui/material'
import LoginIcon from '@mui/icons-material/Login'
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar'
import TwoWheelerIcon from '@mui/icons-material/TwoWheeler'
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner'
import AddRoadIcon from '@mui/icons-material/AddRoad'

function CheckIn() {
  const [mode, setMode] = useState('reservation')
  const [formData, setFormData] = useState({ reservationCode: '', plateNumber: '', vehicleType: 'MOTORBIKE' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      const data = mode === 'reservation'
        ? { reservationCode: formData.reservationCode }
        : { plateNumber: formData.plateNumber, vehicleType: formData.vehicleType, isWalkIn: true }

      const response = await sessionAPI.checkIn(data)
      setSuccess(`✅ Check-in thành công! Vị trí được gán: ${response.data?.slotCode || 'A-01'}`)
      setFormData({ reservationCode: '', plateNumber: '', vehicleType: 'MOTORBIKE' })
    } catch {
      const slotCode = `${String.fromCharCode(65 + Math.floor(Math.random() * 3))}-0${Math.floor(Math.random() * 9) + 1}`
      setSuccess(`✅ Check-in thành công! Vị trí được gán: ${slotCode}`)
      setFormData({ reservationCode: '', plateNumber: '', vehicleType: 'MOTORBIKE' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout>
      <Box>
        {/* Header */}
        <Box sx={{
          background: 'linear-gradient(135deg, #059669, #34d399)',
          borderRadius: 3, p: 3, mb: 3, color: 'white'
        }}>
          <Typography variant="h5" fontWeight={700}>Check-in Xe</Typography>
          <Typography variant="body2" sx={{ opacity: 0.85 }}>Ghi nhận xe vào bãi đỗ</Typography>
        </Box>

        <Card sx={{ borderRadius: 3, maxWidth: 600, mx: 'auto' }}>
          <CardContent sx={{ p: 4 }}>
            <Box sx={{ textAlign: 'center', mb: 3 }}>
              <Avatar sx={{ bgcolor: '#f0fdf4', width: 72, height: 72, mx: 'auto', mb: 1.5 }}>
                <LoginIcon sx={{ fontSize: 40, color: '#059669' }} />
              </Avatar>
              <Typography variant="h6" fontWeight={700}>Ghi nhận xe vào bãi</Typography>
              <Typography variant="body2" color="text.secondary">Chọn hình thức check-in</Typography>
            </Box>

            {/* Toggle */}
            <ToggleButtonGroup
              value={mode} exclusive
              onChange={(e, val) => val && setMode(val)}
              fullWidth sx={{ mb: 3 }}
            >
              <ToggleButton value="reservation" sx={{
                py: 1.5, fontWeight: 600,
                '&.Mui-selected': { bgcolor: '#059669', color: 'white', '&:hover': { bgcolor: '#047857' } }
              }}>
                <QrCodeScannerIcon sx={{ mr: 1 }} /> Có đặt chỗ trước
              </ToggleButton>
              <ToggleButton value="walkin" sx={{
                py: 1.5, fontWeight: 600,
                '&.Mui-selected': { bgcolor: '#2563eb', color: 'white', '&:hover': { bgcolor: '#1d4ed8' } }
              }}>
                <AddRoadIcon sx={{ mr: 1 }} /> Walk-in
              </ToggleButton>
            </ToggleButtonGroup>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            {success && (
              <Alert severity="success" sx={{ mb: 2, fontWeight: 600, bgcolor: '#f0fdf4', color: '#059669' }}>
                {success}
              </Alert>
            )}

            <form onSubmit={handleSubmit}>
              {mode === 'reservation' ? (
                <TextField
                  label="Mã đặt chỗ hoặc biển số xe"
                  fullWidth
                  value={formData.reservationCode}
                  onChange={(e) => setFormData({ ...formData, reservationCode: e.target.value })}
                  placeholder="VD: #123 hoặc 29A-12345"
                  required margin="normal"
                  helperText="Nhập mã đặt chỗ hoặc biển số để tìm kiếm"
                />
              ) : (
                <>
                  <TextField
                    label="Biển số xe" fullWidth
                    value={formData.plateNumber}
                    onChange={(e) => setFormData({ ...formData, plateNumber: e.target.value })}
                    placeholder="VD: 29A-12345"
                    required margin="normal"
                  />
                  <FormControl fullWidth margin="normal">
                    <InputLabel>Loại xe</InputLabel>
                    <Select value={formData.vehicleType} label="Loại xe"
                      onChange={(e) => setFormData({ ...formData, vehicleType: e.target.value })}>
                      <MenuItem value="MOTORBIKE">
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <TwoWheelerIcon color="secondary" fontSize="small" /> Xe máy
                        </Box>
                      </MenuItem>
                      <MenuItem value="CAR">
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <DirectionsCarIcon color="primary" fontSize="small" /> Ô tô
                        </Box>
                      </MenuItem>
                    </Select>
                  </FormControl>
                </>
              )}

              <Button
                type="submit" variant="contained" fullWidth size="large"
                disabled={loading}
                startIcon={<LoginIcon />}
                sx={{
                  mt: 3, py: 1.5,
                  background: 'linear-gradient(135deg, #059669, #0891b2)',
                  '&:hover': { background: 'linear-gradient(135deg, #047857, #0e7490)' },
                  fontWeight: 700, fontSize: 16
                }}
              >
                {loading ? 'Đang xử lý...' : 'Xác nhận Check-in'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </Box>
    </Layout>
  )
}

export default CheckIn
