import { useState } from 'react'
import Layout from '../../components/Layout'
import {
  Box, Typography, Card, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Button, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, Select, MenuItem, FormControl, InputLabel,
  IconButton, Tooltip, Alert, Chip
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import BuildIcon from '@mui/icons-material/Build'

const mockSlots = [
  { id: 1, code: 'A-01', zoneName: 'Tầng 1 - Xe máy', vehicleType: 'MOTORBIKE', status: 'AVAILABLE' },
  { id: 2, code: 'A-02', zoneName: 'Tầng 1 - Xe máy', vehicleType: 'MOTORBIKE', status: 'OCCUPIED' },
  { id: 3, code: 'A-03', zoneName: 'Tầng 1 - Xe máy', vehicleType: 'MOTORBIKE', status: 'RESERVED' },
  { id: 4, code: 'B-01', zoneName: 'Tầng 1 - Ô tô', vehicleType: 'CAR', status: 'AVAILABLE' },
  { id: 5, code: 'B-02', zoneName: 'Tầng 1 - Ô tô', vehicleType: 'CAR', status: 'MAINTENANCE' },
]

const zones = ['Tầng 1 - Xe máy', 'Tầng 1 - Ô tô', 'Khu A - Xe máy']

const statusConfig = {
  AVAILABLE:   { label: 'Trống', color: 'success' },
  OCCUPIED:    { label: 'Đang dùng', color: 'error' },
  RESERVED:    { label: 'Đã đặt', color: 'warning' },
  MAINTENANCE: { label: 'Bảo trì', color: 'default' },
}

function ManageSlots() {
  const [slots, setSlots] = useState(mockSlots)
  const [openDialog, setOpenDialog] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [formData, setFormData] = useState({ code: '', zoneName: 'Tầng 1 - Xe máy' })
  const [error, setError] = useState('')

  const handleOpen = (item = null) => {
    if (item) { setEditingId(item.id); setFormData({ code: item.code, zoneName: item.zoneName }) }
    else { setEditingId(null); setFormData({ code: '', zoneName: 'Tầng 1 - Xe máy' }) }
    setError('')
    setOpenDialog(true)
  }

  const handleSave = () => {
    if (!formData.code.trim()) { setError('Vui lòng nhập mã vị trí'); return }
    if (editingId) {
      setSlots(slots.map(s => s.id === editingId ? { ...s, ...formData } : s))
    } else {
      setSlots([...slots, { id: Date.now(), ...formData, vehicleType: 'MOTORBIKE', status: 'AVAILABLE' }])
    }
    setOpenDialog(false)
  }

  const handleDelete = (id) => {
    const slot = slots.find(s => s.id === id)
    if (slot.status !== 'AVAILABLE') { alert('Không thể xóa vị trí đang được sử dụng'); return }
    if (!window.confirm('Xóa vị trí này?')) return
    setSlots(slots.filter(s => s.id !== id))
  }

  const toggleMaintenance = (id) => {
    setSlots(slots.map(s => {
      if (s.id !== id) return s
      if (s.status === 'MAINTENANCE') return { ...s, status: 'AVAILABLE' }
      if (s.status !== 'AVAILABLE') { alert('Chỉ có thể đánh dấu bảo trì vị trí đang trống'); return s }
      return { ...s, status: 'MAINTENANCE' }
    }))
  }

  return (
    <Layout>
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5" fontWeight={700}>Quản lý Vị Trí Đỗ</Typography>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpen()} sx={{ borderRadius: 2 }}>Thêm vị trí</Button>
        </Box>

        <Card sx={{ borderRadius: 3, boxShadow: 2 }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: '#f5f6fa' }}>
                  <TableCell><strong>Mã vị trí</strong></TableCell>
                  <TableCell><strong>Khu vực</strong></TableCell>
                  <TableCell><strong>Loại xe</strong></TableCell>
                  <TableCell><strong>Trạng thái</strong></TableCell>
                  <TableCell align="center"><strong>Thao tác</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {slots.map((slot) => (
                  <TableRow key={slot.id} hover>
                    <TableCell><Typography fontWeight={700}>{slot.code}</Typography></TableCell>
                    <TableCell>{slot.zoneName}</TableCell>
                    <TableCell>
                      <Chip label={slot.vehicleType === 'CAR' ? 'Ô tô' : 'Xe máy'} color={slot.vehicleType === 'CAR' ? 'primary' : 'secondary'} size="small" variant="outlined" />
                    </TableCell>
                    <TableCell>
                      <Chip label={statusConfig[slot.status]?.label} color={statusConfig[slot.status]?.color} size="small" />
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="Sửa">
                        <IconButton color="primary" onClick={() => handleOpen(slot)}><EditIcon /></IconButton>
                      </Tooltip>
                      <Tooltip title={slot.status === 'MAINTENANCE' ? 'Mở lại' : 'Đánh dấu bảo trì'}>
                        <IconButton color={slot.status === 'MAINTENANCE' ? 'success' : 'warning'} onClick={() => toggleMaintenance(slot.id)}>
                          <BuildIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Xóa">
                        <IconButton color="error" onClick={() => handleDelete(slot.id)}><DeleteIcon /></IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>

        <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>{editingId ? 'Chỉnh sửa vị trí' : 'Thêm vị trí mới'}</DialogTitle>
          <DialogContent>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            <TextField label="Mã vị trí" fullWidth value={formData.code} onChange={(e) => setFormData({...formData, code: e.target.value})} margin="normal" placeholder="VD: A-01" required />
            <FormControl fullWidth margin="normal">
              <InputLabel>Khu vực</InputLabel>
              <Select value={formData.zoneName} label="Khu vực" onChange={(e) => setFormData({...formData, zoneName: e.target.value})}>
                {zones.map(z => <MenuItem key={z} value={z}>{z}</MenuItem>)}
              </Select>
            </FormControl>
          </DialogContent>
          <DialogActions sx={{ p: 2, gap: 1 }}>
            <Button onClick={() => setOpenDialog(false)}>Hủy</Button>
            <Button variant="contained" onClick={handleSave}>{editingId ? 'Cập nhật' : 'Thêm mới'}</Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Layout>
  )
}

export default ManageSlots
