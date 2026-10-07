import { useState, useEffect } from 'react'
import Layout from '../../components/Layout'
import { vehicleAPI } from '../../services/api'
import {
  Box, Typography, Button, Card, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, Select, MenuItem,
  FormControl, InputLabel, Chip, Alert, IconButton, Tooltip
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
      // mock data khi chưa có backend
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
    if (!formData.plateNumber.trim()) {
      setError('Vui lòng nhập biển số xe')
      return
    }
    try {
      if (editingId) {
        await vehicleAPI.update(editingId, formData)
      } else {
        await vehicleAPI.create(formData)
      }
      loadVehicles()
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
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5" fontWeight={700}>Quản lý Phương tiện</Typography>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDialog()} sx={{ borderRadius: 2 }}>
            Thêm phương tiện
          </Button>
        </Box>

        <Card sx={{ borderRadius: 3, boxShadow: 2 }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: '#f5f6fa' }}>
                  <TableCell fontWeight={600}><strong>STT</strong></TableCell>
                  <TableCell><strong>Biển số xe</strong></TableCell>
                  <TableCell><strong>Loại xe</strong></TableCell>
                  <TableCell align="center"><strong>Thao tác</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={4} align="center" sx={{ py: 4 }}>Đang tải...</TableCell></TableRow>
                ) : vehicles.length === 0 ? (
                  <TableRow><TableCell colSpan={4} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                    Chưa có phương tiện nào. Hãy thêm xe của bạn!
                  </TableCell></TableRow>
                ) : vehicles.map((vehicle, index) => (
                  <TableRow key={vehicle.id} hover>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>
                      <Typography fontWeight={600}>{vehicle.plateNumber}</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={vehicle.vehicleType === 'CAR' ? <DirectionsCarIcon /> : <TwoWheelerIcon />}
                        label={vehicle.vehicleType === 'CAR' ? 'Ô tô' : 'Xe máy'}
                        color={vehicle.vehicleType === 'CAR' ? 'primary' : 'secondary'}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="Chỉnh sửa">
                        <IconButton color="primary" onClick={() => handleOpenDialog(vehicle)}>
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Xóa">
                        <IconButton color="error" onClick={() => handleDelete(vehicle.id)}>
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>

        {/* Dialog thêm/sửa */}
        <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>{editingId ? 'Chỉnh sửa phương tiện' : 'Thêm phương tiện mới'}</DialogTitle>
          <DialogContent>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            <TextField
              label="Biển số xe"
              fullWidth
              value={formData.plateNumber}
              onChange={(e) => setFormData({ ...formData, plateNumber: e.target.value })}
              placeholder="VD: 29A-12345"
              margin="normal"
            />
            <FormControl fullWidth margin="normal">
              <InputLabel>Loại xe</InputLabel>
              <Select
                value={formData.vehicleType}
                label="Loại xe"
                onChange={(e) => setFormData({ ...formData, vehicleType: e.target.value })}
              >
                <MenuItem value="MOTORBIKE">Xe máy</MenuItem>
                <MenuItem value="CAR">Ô tô</MenuItem>
              </Select>
            </FormControl>
          </DialogContent>
          <DialogActions sx={{ p: 2, gap: 1 }}>
            <Button onClick={() => setOpenDialog(false)}>Hủy</Button>
            <Button variant="contained" onClick={handleSubmit}>
              {editingId ? 'Cập nhật' : 'Thêm mới'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Layout>
  )
}

export default VehicleManagement
