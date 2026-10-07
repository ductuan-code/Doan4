import { useState } from 'react'
import Layout from '../../components/Layout'
import {
  Box, Typography, Card, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Button, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, IconButton, Tooltip, Alert, Chip
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'

const mockData = [
  { id: 1, name: 'Bãi xe A - Trung tâm', address: '123 Nguyễn Huệ, Q1', totalZones: 3, totalSlots: 50 },
  { id: 2, name: 'Bãi xe B - Sân bay', address: '456 Trường Sơn, Tân Bình', totalZones: 5, totalSlots: 100 },
  { id: 3, name: 'Bãi xe C - Chợ Bến Thành', address: '789 Lê Lợi, Q1', totalZones: 2, totalSlots: 30 },
]

function ManageParkingLots() {
  const [lots, setLots] = useState(mockData)
  const [openDialog, setOpenDialog] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [formData, setFormData] = useState({ name: '', address: '' })
  const [error, setError] = useState('')

  const handleOpen = (item = null) => {
    if (item) { setEditingId(item.id); setFormData({ name: item.name, address: item.address }) }
    else { setEditingId(null); setFormData({ name: '', address: '' }) }
    setError('')
    setOpenDialog(true)
  }

  const handleSave = () => {
    if (!formData.name.trim() || !formData.address.trim()) { setError('Vui lòng điền đầy đủ thông tin'); return }
    if (editingId) {
      setLots(lots.map(l => l.id === editingId ? { ...l, ...formData } : l))
    } else {
      setLots([...lots, { id: Date.now(), ...formData, totalZones: 0, totalSlots: 0 }])
    }
    setOpenDialog(false)
  }

  const handleDelete = (id) => {
    if (!window.confirm('Xóa bãi đỗ này?')) return
    setLots(lots.filter(l => l.id !== id))
  }

  return (
    <Layout>
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5" fontWeight={700}>Quản lý Bãi Đỗ Xe</Typography>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpen()} sx={{ borderRadius: 2 }}>Thêm bãi đỗ</Button>
        </Box>

        <Card sx={{ borderRadius: 3, boxShadow: 2 }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: '#f5f6fa' }}>
                  <TableCell><strong>STT</strong></TableCell>
                  <TableCell><strong>Tên bãi đỗ</strong></TableCell>
                  <TableCell><strong>Địa chỉ</strong></TableCell>
                  <TableCell><strong>Khu vực</strong></TableCell>
                  <TableCell><strong>Vị trí</strong></TableCell>
                  <TableCell align="center"><strong>Thao tác</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {lots.map((lot, i) => (
                  <TableRow key={lot.id} hover>
                    <TableCell>{i + 1}</TableCell>
                    <TableCell><Typography fontWeight={600}>{lot.name}</Typography></TableCell>
                    <TableCell>{lot.address}</TableCell>
                    <TableCell><Chip label={lot.totalZones} color="primary" size="small" /></TableCell>
                    <TableCell><Chip label={lot.totalSlots} color="success" size="small" /></TableCell>
                    <TableCell align="center">
                      <Tooltip title="Sửa"><IconButton color="primary" onClick={() => handleOpen(lot)}><EditIcon /></IconButton></Tooltip>
                      <Tooltip title="Xóa"><IconButton color="error" onClick={() => handleDelete(lot.id)}><DeleteIcon /></IconButton></Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>

        <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>{editingId ? 'Chỉnh sửa bãi đỗ' : 'Thêm bãi đỗ mới'}</DialogTitle>
          <DialogContent>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            <TextField label="Tên bãi đỗ" fullWidth value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} margin="normal" required />
            <TextField label="Địa chỉ" fullWidth value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} margin="normal" required />
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

export default ManageParkingLots
