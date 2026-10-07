import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Layout from '../../components/Layout'
import { reservationAPI } from '../../services/api'
import {
  Box, Typography, Card, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Chip, Button, Alert
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'

const mockReservations = [
  { id: 1, parkingLotName: 'Bãi xe A', slotCode: 'A-01', plateNumber: '29A-12345', startTime: '2026-10-07T08:00:00', endTime: '2026-10-07T10:00:00', status: 'CONFIRMED' },
  { id: 2, parkingLotName: 'Bãi xe B', slotCode: 'B-05', plateNumber: '30B-67890', startTime: '2026-10-06T14:00:00', endTime: '2026-10-06T16:00:00', status: 'COMPLETED' },
  { id: 3, parkingLotName: 'Bãi xe A', slotCode: 'A-03', plateNumber: '29A-12345', startTime: '2026-10-05T09:00:00', endTime: '2026-10-05T11:00:00', status: 'CANCELLED' },
]

const statusConfig = {
  CONFIRMED: { label: 'Đã xác nhận', color: 'success' },
  COMPLETED: { label: 'Hoàn thành', color: 'primary' },
  CANCELLED: { label: 'Đã hủy', color: 'error' },
  EXPIRED:   { label: 'Hết hạn', color: 'default' },
}

function ReservationHistory() {
  const [reservations, setReservations] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadReservations()
  }, [])

  const loadReservations = async () => {
    try {
      const response = await reservationAPI.getMyReservations()
      setReservations(response.data)
    } catch {
      setReservations(mockReservations)
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = async (id) => {
    if (!window.confirm('Bạn có chắc muốn hủy đặt chỗ này?')) return
    try {
      await reservationAPI.cancel(id)
      setReservations(reservations.map(r => r.id === id ? { ...r, status: 'CANCELLED' } : r))
    } catch (err) {
      alert(err.response?.data?.message || 'Không thể hủy đặt chỗ')
    }
  }

  const formatDate = (str) => new Date(str).toLocaleString('vi-VN')

  return (
    <Layout>
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5" fontWeight={700}>Lịch Sử Đặt Chỗ</Typography>
          <Button component={Link} to="/customer/search" variant="contained" startIcon={<AddIcon />} sx={{ borderRadius: 2 }}>
            Đặt chỗ mới
          </Button>
        </Box>

        <Card sx={{ borderRadius: 3, boxShadow: 2 }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: '#f5f6fa' }}>
                  <TableCell><strong>Mã đặt chỗ</strong></TableCell>
                  <TableCell><strong>Bãi đỗ</strong></TableCell>
                  <TableCell><strong>Vị trí</strong></TableCell>
                  <TableCell><strong>Biển số</strong></TableCell>
                  <TableCell><strong>Thời gian</strong></TableCell>
                  <TableCell><strong>Trạng thái</strong></TableCell>
                  <TableCell align="center"><strong>Thao tác</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={7} align="center" sx={{ py: 4 }}>Đang tải...</TableCell></TableRow>
                ) : reservations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                      <Typography color="text.secondary" mb={2}>Chưa có lượt đặt chỗ nào</Typography>
                      <Button component={Link} to="/customer/search" variant="contained">Đặt chỗ ngay</Button>
                    </TableCell>
                  </TableRow>
                ) : reservations.map((res) => (
                  <TableRow key={res.id} hover>
                    <TableCell><strong>#{res.id}</strong></TableCell>
                    <TableCell>{res.parkingLotName}</TableCell>
                    <TableCell>{res.slotCode}</TableCell>
                    <TableCell>{res.plateNumber}</TableCell>
                    <TableCell>
                      <Typography variant="body2">{formatDate(res.startTime)}</Typography>
                      <Typography variant="body2" color="text.secondary">{formatDate(res.endTime)}</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={statusConfig[res.status]?.label || res.status}
                        color={statusConfig[res.status]?.color || 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="center">
                      {res.status === 'CONFIRMED' && (
                        <Button size="small" color="error" variant="outlined" onClick={() => handleCancel(res.id)}>
                          Hủy
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      </Box>
    </Layout>
  )
}

export default ReservationHistory
