import { useState } from 'react'
import Layout from '../../components/Layout'
import {
  Box, Typography, Card, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Button, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, IconButton, Tooltip, Alert, Chip
} from '@mui/material'
import EditIcon from '@mui/icons-material/Edit'
import TwoWheelerIcon from '@mui/icons-material/TwoWheeler'
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar'

const mockPricing = [
  { id: 1, vehicleType: 'MOTORBIKE', pricePerHour: 5000 },
  { id: 2, vehicleType: 'CAR', pricePerHour: 20000 },
]

function ManagePricing() {
  const [pricing, setPricing] = useState(mockPricing)
  const [openDialog, setOpenDialog] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [price, setPrice] = useState('')
  const [error, setError] = useState('')

  const handleOpen = (item) => {
    setEditingItem(item)
    setPrice(item.pricePerHour.toString())
    setError('')
    setOpenDialog(true)
  }

  const handleSave = () => {
    const val = parseInt(price)
    if (!val || val <= 0) { setError('Giá phải là số dương'); return }
    setPricing(pricing.map(p => p.id === editingItem.id ? { ...p, pricePerHour: val } : p))
    setOpenDialog(false)
  }

  return (
    <Layout>
      <Box>
        <Typography variant="h5" fontWeight={700} mb={3}>Quản lý Bảng Giá</Typography>

        <Card sx={{ borderRadius: 3, boxShadow: 2, maxWidth: 600 }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: '#f5f6fa' }}>
                  <TableCell><strong>Loại xe</strong></TableCell>
                  <TableCell><strong>Đơn giá / giờ</strong></TableCell>
                  <TableCell align="center"><strong>Thao tác</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {pricing.map((item) => (
                  <TableRow key={item.id} hover>
                    <TableCell>
                      <Chip
                        icon={item.vehicleType === 'CAR' ? <DirectionsCarIcon /> : <TwoWheelerIcon />}
                        label={item.vehicleType === 'CAR' ? 'Ô tô' : 'Xe máy'}
                        color={item.vehicleType === 'CAR' ? 'primary' : 'secondary'}
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography fontWeight={700} color="error.main" variant="h6">
                        {item.pricePerHour.toLocaleString('vi-VN')} VNĐ
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="Chỉnh sửa giá">
                        <IconButton color="primary" onClick={() => handleOpen(item)}><EditIcon /></IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>

        <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="xs" fullWidth>
          <DialogTitle>Chỉnh sửa giá - {editingItem?.vehicleType === 'CAR' ? 'Ô tô' : 'Xe máy'}</DialogTitle>
          <DialogContent>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            <TextField label="Đơn giá / giờ (VNĐ)" fullWidth type="number" value={price} onChange={(e) => setPrice(e.target.value)} margin="normal" inputProps={{ min: 0 }} />
          </DialogContent>
          <DialogActions sx={{ p: 2, gap: 1 }}>
            <Button onClick={() => setOpenDialog(false)}>Hủy</Button>
            <Button variant="contained" onClick={handleSave}>Cập nhật</Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Layout>
  )
}

export default ManagePricing
