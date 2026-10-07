import { useState, useEffect } from 'react'
import Layout from '../../components/Layout'
import { vehicleAPI } from '../../services/api'
import {
  Box, Typography, Button, Card, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, Select, MenuItem,
  FormControl, InputLabel, Chip, Alert, IconButton, Tooltip, Avatar
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar'
import TwoWheelerIcon from '@mui/icons-material/TwoWheeler'

function VehicleManagement() {
  const [vehicles, setVehicles] = useState([])
  const [loading, setLoading] = useState(true)
  const [openDialog, setOpenDialog] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [formData, setFormData] = useState({ plateNumber: '', vehicleType: 'MOTORBIKE' })
  const [error, setError] = useState('')

  useEffect(() => { loadVehicles() }, [])

  const loadVehicles = async () => {
    try {
      const response = await vehicleAPI.getAll()
      setVehicles(response.data)
    } catch {
      setVehicles([
        { id: 1, plateNumber: '29A-12345', vehicleType: 'MOTORBIKE' },
        { id: 2, plateNumber: '30B-67890', vehicleType: 'CAR' },
      ])
    } finally {
      setLoading(false)
    }
  }

  const handleOpenDialog = (vehicle = null) => {
    if (vehicle) {
      setEditingId(vehicle.id)
      setFormData({ plateNumber: vehicle.plateNumber, vehicleType: vehicle.vehicleType })
    } else {
      setEditingId(null)
      setFormData({ plateNumber: '', vehicleType: 'MOTORBIKE' })
    }
    setError('')
    setOpenDialog(true)
  }

  const handleSubmit = async () => {
    if (!formData.plateNumber.trim()) { setError('Vui lòng nhập biển số xe'); return }
    try {
      if (editingId) {
        await vehicleAPI.update(editingId, formData)
        setVehicles(vehicles.map(v => v.id === editingId ? { ...v, ...formData } : v))
      } else {
        await vehicleAPI.create(formData)
        setVehicles([...vehicles, { id: Date.now(), ...formData }])
      }
      setOpenDialog(false)
    } catch (err) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra')
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc muốn xóa phương tiện này?')) return
    try {
      await vehicleAPI.delete(id)
      setVehicles(vehicles.filter(v => v.id !== id))
    } catch (err) {
      alert(err.response?.data?.message || 'Không thể xóa phương tiện')
    }
  }

  return (
    <Layout>
      <Box>
        {/* Header */}
        <Box sx={{
          background: 'linear-gradient(135deg, #2563eb, #60a5fa)',
          borderRadius: 3, p: 3, mb: 3, color: 'white',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center'
        }}>
          <Box>
            <Typography variant="h5" fontWeight={700}>Quản lý Phương tiện</Typography>
            <Typography variant="body2" sx={{ opacity: 0.85 }}>Danh sách xe của bạn</Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
            sx={{ bgcolor: 'white', color: '#2563eb', '&:hover': { bgcolor: '#eff6ff' }, fontWeight: 700 }}
          >
            Thêm xe
          </Button>
        </Box>

        <Card sx={{ borderRadius: 3 }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: '#f8faff' }}>
                  <TableCell sx={{ fontWeight: 700, color: '#2563eb' }}>STT</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#2563eb' }}>Biển số xe</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#2563eb' }}>Loại xe</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700, color: '#2563eb' }}>Thao tác</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={4} align="center" sx={{ py: 4 }}>Đang tải...</TableCell></TableRow>
                ) : vehicles.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} align="center" sx={{ py: 6 }}>
                      <TwoWheelerIcon sx={{ fontSize: 48, color: '#cbd5e1', mb: 1 }} />
                      <Typography color="text.secondary">Chưa có phương tiện nào</Typography>
                      <Button variant="contained" sx={{ mt: 2 }} onClick={() => handleOpenDialog()}>Thêm xe ngay</Button>
                    </TableCell>
                  </TableRow>
                ) : vehicles.map((vehicle, index) => (
                  <TableRow key={vehicle.id} hover sx={{ '&:hover': { bgcolor: '#f8faff' } }}>
                    <TableCell sx={{ color: '#64748b' }}>{index + 1}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Avatar sx={{ bgcolor: vehicle.vehicleType === 'CAR' ? '#eff6ff' : '#faf5ff', width: 36, height: 36 }}>
                          {vehicle.vehicleType === 'CAR'
                            ? <DirectionsCarIcon sx={{ color: '#2563eb', fontSize: 20 }} />
                            : <TwoWheelerIcon sx={{ color: '#7c3aed', fontSize: 20 }} />}
                        </Avatar>
                        <Typography fontWeight={700} fontSize={15}>{vehicle.plateNumber}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={vehicle.vehicleType === 'CAR' ? 'Ô tô' : 'Xe máy'}
                        size="small"
                        sx={{
                          bgcolor: vehicle.vehicleType === 'CAR' ? '#eff6ff' : '#faf5ff',
                          color: vehicle.vehicleType === 'CAR' ? '#2563eb' : '#7c3aed',
                          fontWeight: 600, border: 'none'
                        }}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="Chỉnh sửa">
                        <IconButton
                          onClick={() => handleOpenDialog(vehicle)}
                          sx={{ color: '#2563eb', '&:hover': { bgcolor: '#eff6ff' } }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Xóa">
                        <IconButton
                          onClick={() => handleDelete(vehicle.id)}
                          sx={{ color: '#dc2626', '&:hover': { bgcolor: '#fff1f1' } }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>

        <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
          <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>
            {editingId ? 'Chỉnh sửa phương tiện' : 'Thêm phương tiện mới'}
          </DialogTitle>
          <DialogContent>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            <TextField
              label="Biển số xe" fullWidth
              value={formData.plateNumber}
              onChange={(e) => setFormData({ ...formData, plateNumber: e.target.value })}
              placeholder="VD: 29A-12345" margin="normal"
            />
            <FormControl fullWidth margin="normal">
              <InputLabel>Loại xe</InputLabel>
              <Select value={formData.vehicleType} label="Loại xe" onChange={(e) => setFormData({ ...formData, vehicleType: e.target.value })}>
                <MenuItem value="MOTORBIKE">🛵 Xe máy</MenuItem>
                <MenuItem value="CAR">🚗 Ô tô</MenuItem>
              </Select>
            </FormControl>
          </DialogContent>
          <DialogActions sx={{ p: 2.5, gap: 1 }}>
            <Button onClick={() => setOpenDialog(false)} variant="outlined">Hủy</Button>
            <Button variant="contained" onClick={handleSubmit} sx={{ px: 3 }}>
              {editingId ? 'Cập nhật' : 'Thêm mới'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Layout>
  )
}

export default VehicleManagement
