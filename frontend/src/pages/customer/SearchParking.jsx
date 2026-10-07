import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../../components/Layout'
import {
  Box, Typography, Card, CardContent, Grid, Button, TextField,
  Select, MenuItem, FormControl, InputLabel, Chip, Alert,
  Stepper, Step, StepLabel, Divider
} from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import LocationOnIcon from '@mui/icons-material/LocationOn'
import EventAvailableIcon from '@mui/icons-material/EventAvailable'

const mockLots = [
  { id: 1, name: 'Bãi xe A - Trung tâm', address: '123 Nguyễn Huệ, Q1', totalSlots: 50, availableSlots: 12 },
  { id: 2, name: 'Bãi xe B - Sân bay', address: '456 Trường Sơn, Tân Bình', totalSlots: 100, availableSlots: 35 },
  { id: 3, name: 'Bãi xe C - Chợ Bến Thành', address: '789 Lê Lợi, Q1', totalSlots: 30, availableSlots: 0 },
]

const mockSlots = [
  { id: 1, code: 'A-01', status: 'AVAILABLE' },
  { id: 2, code: 'A-02', status: 'AVAILABLE' },
  { id: 3, code: 'A-03', status: 'RESERVED' },
  { id: 4, code: 'A-04', status: 'OCCUPIED' },
  { id: 5, code: 'A-05', status: 'AVAILABLE' },
  { id: 6, code: 'A-06', status: 'AVAILABLE' },
  { id: 7, code: 'A-07', status: 'MAINTENANCE' },
  { id: 8, code: 'A-08', status: 'AVAILABLE' },
]

const slotStatusConfig = {
  AVAILABLE:   { label: 'Trống', color: '#4caf50', bg: '#e8f5e9' },
  RESERVED:    { label: 'Đã đặt', color: '#ff9800', bg: '#fff3e0' },
  OCCUPIED:    { label: 'Đang dùng', color: '#f44336', bg: '#ffebee' },
  MAINTENANCE: { label: 'Bảo trì', color: '#9e9e9e', bg: '#f5f5f5' },
}

const steps = ['Chọn bãi & thời gian', 'Chọn vị trí', 'Xác nhận']

function SearchParking() {
  const navigate = useNavigate()
  const [activeStep, setActiveStep] = useState(0)
  const [filters, setFilters] = useState({ vehicleType: 'MOTORBIKE', startTime: '', endTime: '' })
  const [selectedLot, setSelectedLot] = useState(null)
  const [selectedSlot, setSelectedSlot] = useState(null)
  const [error, setError] = useState('')

  const handleSelectLot = (lot) => {
    if (lot.availableSlots === 0) {
      setError('Bãi này đã hết chỗ trống!')
      return
    }
    if (!filters.startTime || !filters.endTime) {
      setError('Vui lòng chọn thời gian trước!')
      return
    }
    setError('')
    setSelectedLot(lot)
    setActiveStep(1)
  }

  const handleSelectSlot = (slot) => {
    if (slot.status !== 'AVAILABLE') return
    setSelectedSlot(slot)
    setActiveStep(2)
  }

  const handleConfirm = async () => {
    try {
      // Gọi API khi có backend
      alert(`Đặt chỗ thành công!\nBãi: ${selectedLot.name}\nVị trí: ${selectedSlot.code}`)
      navigate('/customer/history')
    } catch (err) {
      setError('Đặt chỗ thất bại')
    }
  }

  return (
    <Layout>
      <Box>
        <Typography variant="h5" fontWeight={700} mb={3}>Tìm Bãi Đỗ Xe</Typography>

        {/* Stepper */}
        <Card sx={{ borderRadius: 3, boxShadow: 2, mb: 3 }}>
          <CardContent>
            <Stepper activeStep={activeStep}>
              {steps.map((label) => (
                <Step key={label}><StepLabel>{label}</StepLabel></Step>
              ))}
            </Stepper>
          </CardContent>
        </Card>

        {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

        {/* Step 1: Tìm bãi */}
        {activeStep === 0 && (
          <>
            <Card sx={{ borderRadius: 3, boxShadow: 2, mb: 3 }}>
              <CardContent>
                <Typography variant="h6" fontWeight={600} mb={2}>Thông tin tìm kiếm</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={4}>
                    <FormControl fullWidth>
                      <InputLabel>Loại xe</InputLabel>
                      <Select value={filters.vehicleType} label="Loại xe" onChange={(e) => setFilters({...filters, vehicleType: e.target.value})}>
                        <MenuItem value="MOTORBIKE">Xe máy</MenuItem>
                        <MenuItem value="CAR">Ô tô</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField label="Giờ bắt đầu" type="datetime-local" fullWidth value={filters.startTime} onChange={(e) => setFilters({...filters, startTime: e.target.value})} InputLabelProps={{ shrink: true }} />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField label="Giờ kết thúc" type="datetime-local" fullWidth value={filters.endTime} onChange={(e) => setFilters({...filters, endTime: e.target.value})} InputLabelProps={{ shrink: true }} />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            <Typography variant="h6" fontWeight={600} mb={2}>Danh sách bãi đỗ</Typography>
            <Grid container spacing={3}>
              {mockLots.map((lot) => (
                <Grid item xs={12} sm={6} md={4} key={lot.id}>
                  <Card sx={{ borderRadius: 3, boxShadow: 2, border: lot.availableSlots === 0 ? '1px solid #ffcdd2' : '1px solid #e0e0e0' }}>
                    <CardContent>
                      <Typography variant="h6" fontWeight={600}>{lot.name}</Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.secondary', mb: 2 }}>
                        <LocationOnIcon fontSize="small" />
                        <Typography variant="body2">{lot.address}</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                        <Chip label={`Còn trống: ${lot.availableSlots}`} color={lot.availableSlots > 0 ? 'success' : 'error'} size="small" />
                        <Chip label={`Tổng: ${lot.totalSlots}`} variant="outlined" size="small" />
                      </Box>
                      <Button
                        variant="contained"
                        fullWidth
                        disabled={lot.availableSlots === 0}
                        onClick={() => handleSelectLot(lot)}
                        startIcon={<EventAvailableIcon />}
                        sx={{ borderRadius: 2 }}
                      >
                        {lot.availableSlots === 0 ? 'Hết chỗ' : 'Chọn bãi này'}
                      </Button>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </>
        )}

        {/* Step 2: Chọn vị trí */}
        {activeStep === 1 && (
          <Card sx={{ borderRadius: 3, boxShadow: 2 }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6" fontWeight={600}>Chọn vị trí tại {selectedLot?.name}</Typography>
                <Button onClick={() => setActiveStep(0)}>← Quay lại</Button>
              </Box>

              {/* Legend */}
              <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
                {Object.entries(slotStatusConfig).map(([key, val]) => (
                  <Box key={key} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Box sx={{ width: 16, height: 16, borderRadius: 0.5, bgcolor: val.bg, border: `2px solid ${val.color}` }} />
                    <Typography variant="caption">{val.label}</Typography>
                  </Box>
                ))}
              </Box>

              <Grid container spacing={2}>
                {mockSlots.map((slot) => {
                  const config = slotStatusConfig[slot.status]
                  return (
                    <Grid item xs={6} sm={3} md={2} key={slot.id}>
                      <Button
                        fullWidth
                        disabled={slot.status !== 'AVAILABLE'}
                        onClick={() => handleSelectSlot(slot)}
                        sx={{
                          py: 2,
                          bgcolor: config.bg,
                          color: config.color,
                          border: `2px solid ${config.color}`,
                          borderRadius: 2,
                          fontWeight: 700,
                          '&:hover': { bgcolor: slot.status === 'AVAILABLE' ? '#c8e6c9' : config.bg },
                          '&.Mui-disabled': { bgcolor: config.bg, color: config.color, border: `2px solid ${config.color}`, opacity: 0.7 }
                        }}
                      >
                        {slot.code}
                      </Button>
                    </Grid>
                  )
                })}
              </Grid>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Xác nhận */}
        {activeStep === 2 && (
          <Card sx={{ borderRadius: 3, boxShadow: 2, maxWidth: 500, mx: 'auto' }}>
            <CardContent sx={{ p: 4 }}>
              <Typography variant="h6" fontWeight={600} mb={3} textAlign="center">Xác nhận đặt chỗ</Typography>
              <Box sx={{ bgcolor: '#f5f6fa', borderRadius: 2, p: 2, mb: 3 }}>
                {[
                  ['Bãi đỗ xe', selectedLot?.name],
                  ['Vị trí', selectedSlot?.code],
                  ['Loại xe', filters.vehicleType === 'CAR' ? 'Ô tô' : 'Xe máy'],
                  ['Giờ bắt đầu', filters.startTime ? new Date(filters.startTime).toLocaleString('vi-VN') : ''],
                  ['Giờ kết thúc', filters.endTime ? new Date(filters.endTime).toLocaleString('vi-VN') : ''],
                ].map(([label, value]) => (
                  <Box key={label} sx={{ display: 'flex', justifyContent: 'space-between', py: 1 }}>
                    <Typography color="text.secondary">{label}:</Typography>
                    <Typography fontWeight={600}>{value}</Typography>
                  </Box>
                ))}
              </Box>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button fullWidth onClick={() => setActiveStep(1)}>← Quay lại</Button>
                <Button fullWidth variant="contained" color="success" onClick={handleConfirm} sx={{ borderRadius: 2 }}>
                  Xác nhận đặt chỗ
                </Button>
              </Box>
            </CardContent>
          </Card>
        )}
      </Box>
    </Layout>
  )
}

export default SearchParking
