import { useState } from 'react'
import Layout from '../../components/Layout'
import {
  Box, Typography, Card, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Button, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, IconButton, Tooltip, Alert, Chip, Avatar
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import BusinessIcon from '@mui/icons-material/Business'
import LocationOnIcon from '@mui/icons-material/LocationOn'

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
    if (editingId) setLots(lots.map(l => l.id === editingId ? { ...l, ...formData } : l))
    else setLots([...lots, { id: Date.now(), ...formData, totalZones: 0, totalSlots: 0 }])
    setOpenDialog(false)
  }

  const handleDelete = (id) => {
    if (!window.confirm('Xóa bãi đỗ này?')) return
    setLots(lots.filter(l => l.id !== id))
  }

  return (
    <Layout>
      <Box>
        <Box sx={{
          background: 'linear-gradient(135deg, #2563eb, #60a5fa)',
          borderRadius: 3, p: 3, mb: 3, color: 'white',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center'
        }}>
          <Box>
            <Typography variant="h5" fontWeight={700}>Quản lý Bãi Đỗ Xe</Typography>
            <Typography variant="body2" sx={{ opacity: 0.85 }}>Cấu hình bãi đỗ xe trong hệ thống</Typography>
          </Box>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpen()}
            sx={{ bgcolor: 'white', color: '#2563eb', '&:hover': { bgcolor: '#eff6ff' }, fontWeight: 700 }}>
            Thêm bãi đỗ
          </Button>
        </Box>

        <Card sx={{ borderRadius: 3 }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: '#f8faff' }}>
                  {['', 'Tên bãi đỗ', 'Địa chỉ', 'Khu vực', 'Vị trí', 'Thao tác'].map(h => (
                    <TableCell key={h} sx={{ fontWeight: 700, color: '#2563eb' }}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {lots.map((lot, i) => (
                  <TableRow key={lot.id} hover sx={{ '&:hover': { bgcolor: '#f8faff' } }}>
                    <TableCell>
                      <Avatar sx={{ bgcolor: '#eff6ff', width: 36, height: 36 }}>
                        <BusinessIcon sx={{ color: '#2563eb', fontSize: 20 }} />
                      </Avatar>
                    </TableCell>
                    <TableCell><Typography fontWeight={700}>{lot.name}</Typography></TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.secondary' }}>
                        <LocationOnIcon fontSize="small" />
                        <Typography variant="body2">{lot.address}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip label={`${lot.totalZones} khu vực`} size="small" sx={{ bgcolor: '#eff6ff', color: '#2563eb', fontWeight: 600 }} />
                    </TableCell>
                    <TableCell>
                      <Chip label={`${lot.totalSlots} vị trí`} size="small" sx={{ bgcolor: '#f0fdf4', color: '#059669', fontWeight: 600 }} />
                    </TableCell>
                    <TableCell>
                      <Tooltip title="Sửa">
                        <IconButton onClick={() => handleOpen(lot)} sx={{ color: '#2563eb', '&:hover': { bgcolor: '#eff6ff' } }}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Xóa">
                        <IconButton onClick={() => handleDelete(lot.id)} sx={{ color: '#dc2626', '&:hover': { bgcolor: '#fff1f2' } }}>
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

        <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
          <DialogTitle sx={{ fontWeight: 700 }}>{editingId ? 'Chỉnh sửa bãi đỗ' : 'Thêm bãi đỗ mới'}</DialogTitle>
          <DialogContent>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            <TextField label="Tên bãi đỗ" fullWidth value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} margin="normal" required />
            <TextField label="Địa chỉ" fullWidth value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} margin="normal" required />
          </DialogContent>
          <DialogActions sx={{ p: 2.5, gap: 1 }}>
            <Button onClick={() => setOpenDialog(false)} variant="outlined">Hủy</Button>
            <Button variant="contained" onClick={handleSave}>{editingId ? 'Cập nhật' : 'Thêm mới'}</Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Layout>
  )
}

export default ManageParkingLots
