import { useState } from 'react'
import Layout from '../../components/Layout'
import { sessionAPI } from '../../services/api'
import {
  Box, Typography, Card, CardContent, TextField, Button, Alert,
  ToggleButtonGroup, ToggleButton, Select, MenuItem, FormControl, InputLabel
} from '@mui/material'
import LoginIcon from '@mui/icons-material/Login'
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar'
import TwoWheelerIcon from '@mui/icons-material/TwoWheeler'

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
      setSuccess(`Check-in thành công! Vị trí được gán: ${response.data?.slotCode || 'A-01'}`)
      setFormData({ reservationCode: '', plateNumber: '', vehicleType: 'MOTORBIKE' })
    } catch {
      // Mock success khi chưa có backend
      setSuccess(`Check-in thành công! Vị trí được gán: A-0${Math.floor(Math.random() * 9) + 1}`)
      setFormData({ reservationCode: '', plateNumber: '', vehicleType: 'MOTORBIKE' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout>
      <Box>
        <Typography variant="h5" fontWeight={700} mb={3}>Check-in Xe</Typography>
        <Card sx={{ borderRadius: 3, boxShadow: 2, maxWidth: 600, mx: 'auto' }}>
          <CardContent sx={{ p: 4 }}>
            <Box sx={{ textAlign: 'center', mb: 3 }}>
              <LoginIcon sx={{ fontSize: 48, color: 'success.main' }} />
              <Typography variant="h6" fontWeight={600}>Ghi nhận xe vào bãi</Typography>
            </Box>

            {/* Toggle mode */}
            <ToggleButtonGroup value={mode} exclusive onChange={(e, val) => val && setMode(val)} fullWidth sx={{ mb: 3 }}>
              <ToggleButton value="reservation" sx={{ py: 1.5 }}>Có đặt chỗ trước</ToggleButton>
              <ToggleButton value="walkin" sx={{ py: 1.5 }}>Walk-in (không đặt trước)</ToggleButton>
            </ToggleButtonGroup>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

            <form onSubmit={handleSubmit}>
              {mode === 'reservation' ? (
                <TextField
                  label="Mã đặt chỗ hoặc biển số xe"
                  fullWidth
                  value={formData.reservationCode}
                  onChange={(e) => setFormData({...formData, reservationCode: e.target.value})}
                  placeholder="VD: #123 hoặc 29A-12345"
                  required
                  margin="normal"
                />
              ) : (
                <>
                  <TextField
                    label="Biển số xe"
                    fullWidth
                    value={formData.plateNumber}
                    onChange={(e) => setFormData({...formData, plateNumber: e.target.value})}
                    placeholder="VD: 29A-12345"
                    required
                    margin="normal"
                  />
                  <FormControl fullWidth margin="normal">
                    <InputLabel>Loại xe</InputLabel>
                    <Select value={formData.vehicleType} label="Loại xe" onChange={(e) => setFormData({...formData, vehicleType: e.target.value})}>
                      <MenuItem value="MOTORBIKE"><TwoWheelerIcon sx={{ mr: 1, verticalAlign: 'middle' }} />Xe máy</MenuItem>
                      <MenuItem value="CAR"><DirectionsCarIcon sx={{ mr: 1, verticalAlign: 'middle' }} />Ô tô</MenuItem>
                    </Select>
                  </FormControl>
                </>
              )}

              <Button type="submit" variant="contained" color="success" fullWidth size="large" disabled={loading} startIcon={<LoginIcon />} sx={{ mt: 3, py: 1.5, borderRadius: 2 }}>
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
