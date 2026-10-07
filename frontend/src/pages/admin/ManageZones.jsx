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

const mockZones = [
  { id: 1, name: 'Tầng 1 - Xe máy', parkingLotName: 'Bãi xe A', vehicleType: 'MOTORBIKE', totalSlots: 20 },
  { id: 2, name: 'Tầng 1 - Ô tô', parkingLotName: 'Bãi xe A', vehicleType: 'CAR', totalSlots: 15 },
  { id: 3, name: 'Khu A - Xe máy', parkingLotName: 'Bãi xe B', vehicleType: 'MOTORBIKE', totalSlots: 30 },
]

const parkingLots = ['Bãi xe A', 'Bãi xe B', 'Bãi xe C']

function ManageZones() {
  const [zones, setZones] = useState(mockZones)
  const [openDialog, setOpenDialog] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [formData, setFormData] = useState({ name: '', parkingLotName: 'Bãi xe A', vehicleType: 'MOTORBIKE' })
  const [error, setError] = useState('')

  const handleOpen = (item = null) => {
    if (item) { setEditingId(item.id); setFormData({ name: item.name, parkingLotName: item.parkingLotName, vehicleType: item.vehicleType }) }
    else { setEditingId(null); setFormData({ name: '', parkingLotName: 'Bãi xe A', vehicleType: 'MOTORBIKE' }) }
    setError('')
    setOpenDialog(true)
  }

  const handleSave = () => {
    if (!formData.name.trim()) { setError('Vui lòng nhập tên khu vực'); return }
    if (editingId) {
      setZones(zones.map(z => z.id === editingId ? { ...z, ...formData } : z))
    } else {
      setZones([...zones, { id: Date.now(), ...formData, totalSlots: 0 }])
    }
    setOpenDialog(false)
  }

  const handleDelete = (id) => {
    if (!window.confirm('Xóa khu vực này?')) return
    setZones(zones.filter(z => z.id !== id))
  }

  return (
    <Layout>
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5" fontWeight={700}>Quản lý Khu Vực</Typography>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpen()} sx={{ borderRadius: 2 }}>Thêm khu vực</Button>
        </Box>

        <Card sx={{ borderRadius: 3, boxShadow: 2 }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: '#f5f6fa' }}>
                  <TableCell><strong>Tên khu vực</strong></TableCell>
                  <TableCell><strong>Bãi đỗ</strong></TableCell>
                  <TableCell><strong>Loại xe</strong></TableCell>
                  <TableCell><strong>Số vị trí</strong></TableCell>
                  <TableCell align="center"><strong>Thao tác</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {zones.map((zone) => (
                  <TableRow key={zone.id} hover>
                    <TableCell><Typography fontWeight={600}>{zone.name}</Typography></TableCell>
                    <TableCell>{zone.parkingLotName}</TableCell>
                    <TableCell>
                      <Chip label={zone.vehicleType === 'CAR' ? 'Ô tô' : 'Xe máy'} color={zone.vehicleType === 'CAR' ? 'primary' : 'secondary'} size="small" variant="outlined" />
                    </TableCell>
                    <TableCell><Chip label={zone.totalSlots} color="success" size="small" /></TableCell>
                    <TableCell align="center">
                      <Tooltip title="Sửa"><IconButton color="primary" onClick={() => handleOpen(zone)}><EditIcon /></IconButton></Tooltip>
                      <Tooltip title="Xóa"><IconButton color="error" onClick={() => handleDelete(zone.id)}><DeleteIcon /></IconButton></Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>

        <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>{editingId ? 'Chỉnh sửa khu vực' : 'Thêm khu vực mới'}</DialogTitle>
          <DialogContent>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            <TextField label="Tên khu vực" fullWidth value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} margin="normal" placeholder="VD: Tầng 1 - Khu xe máy" required />
            <FormControl fullWidth margin="normal">
              <InputLabel>Bãi đỗ</InputLabel>
              <Select value={formData.parkingLotName} label="Bãi đỗ" onChange={(e) => setFormData({...formData, parkingLotName: e.target.value})}>
                {parkingLots.map(l => <MenuItem key={l} value={l}>{l}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl fullWidth margin="normal">
              <InputLabel>Loại xe phục vụ</InputLabel>
              <Select value={formData.vehicleType} label="Loại xe phục vụ" onChange={(e) => setFormData({...formData, vehicleType: e.target.value})}>
                <MenuItem value="MOTORBIKE">Xe máy</MenuItem>
                <MenuItem value="CAR">Ô tô</MenuItem>
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

export default ManageZones
