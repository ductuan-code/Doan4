import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Layout from '../../components/Layout'
import { reservationAPI } from '../../services/api'
import {
  Box, Typography, Card, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Chip, Button, Avatar
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import EventAvailableIcon from '@mui/icons-material/EventAvailable'

const mockReservations = [
  { id: 1, parkingLotName: 'Bãi xe A', slotCode: 'A-01', plateNumber: '29A-12345', startTime: '2026-10-07T08:00:00', endTime: '2026-10-07T10:00:00', status: 'CONFIRMED' },
  { id: 2, parkingLotName: 'Bãi xe B', slotCode: 'B-05', plateNumber: '30B-67890', startTime: '2026-10-06T14:00:00', endTime: '2026-10-06T16:00:00', status: 'COMPLETED' },
  { id: 3, parkingLotName: 'Bãi xe A', slotCode: 'A-03', plateNumber: '29A-12345', startTime: '2026-10-05T09:00:00', endTime: '2026-10-05T11:00:00', status: 'CANCELLED' },
  { id: 4, parkingLotName: 'Bãi xe C', slotCode: 'C-02', plateNumber: '29A-12345', startTime: '2026-10-04T07:00:00', endTime: '2026-10-04T08:00:00', status: 'EXPIRED' },
]

const statusConfig = {
  CONFIRMED: { label: 'Đã xác nhận', bg: '#f0fdf4', color: '#059669', border: '#bbf7d0' },
  COMPLETED: { label: 'Hoàn thành',  bg: '#eff6ff', color: '#2563eb', border: '#bfdbfe' },
  CANCELLED: { label: 'Đã hủy',      bg: '#fff1f2', color: '#dc2626', border: '#fecaca' },
  EXPIRED:   { label: 'Hết hạn',     bg: '#f8fafc', color: '#64748b', border: '#e2e8f0' },
}

function ReservationHistory() {
  const [reservations, setReservations] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadReservations() }, [])

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
        {/* Header */}
        <Box sx={{
          background: 'linear-gradient(135deg, #7c3aed, #a78bfa)',
          borderRadius: 3, p: 3, mb: 3, color: 'white',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center'
        }}>
          <Box>
            <Typography variant="h5" fontWeight={700}>Lịch Sử Đặt Chỗ</Typography>
            <Typography variant="body2" sx={{ opacity: 0.85 }}>Danh sách các lượt đặt chỗ của bạn</Typography>
          </Box>
          <Button
            component={Link} to="/customer/search"
            variant="contained"
            startIcon={<AddIcon />}
            sx={{ bgcolor: 'white', color: '#7c3aed', '&:hover': { bgcolor: '#faf5ff' }, fontWeight: 700 }}
          >
            Đặt chỗ mới
          </Button>
        </Box>

        <Card sx={{ borderRadius: 3 }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: '#f8faff' }}>
                  {['Mã đặt chỗ', 'Bãi đỗ', 'Vị trí', 'Biển số', 'Thời gian', 'Trạng thái', 'Thao tác'].map(h => (
                    <TableCell key={h} sx={{ fontWeight: 700, color: '#7c3aed' }}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={7} align="center" sx={{ py: 4 }}>Đang tải...</TableCell></TableRow>
                ) : reservations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                      <EventAvailableIcon sx={{ fontSize: 48, color: '#cbd5e1', mb: 1 }} />
                      <Typography color="text.secondary" mb={2}>Chưa có lượt đặt chỗ nào</Typography>
                      <Button component={Link} to="/customer/search" variant="contained">Đặt chỗ ngay</Button>
                    </TableCell>
                  </TableRow>
                ) : reservations.map((res) => {
                  const sc = statusConfig[res.status] || statusConfig.EXPIRED
                  return (
                    <TableRow key={res.id} hover sx={{ '&:hover': { bgcolor: '#f8faff' } }}>
                      <TableCell>
                        <Typography fontWeight={700} color="primary">#{res.id}</Typography>
                      </TableCell>
                      <TableCell>{res.parkingLotName}</TableCell>
                      <TableCell>
                        <Chip label={res.slotCode} size="small" sx={{ bgcolor: '#eff6ff', color: '#2563eb', fontWeight: 700 }} />
                      </TableCell>
                      <TableCell>{res.plateNumber}</TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={500}>{formatDate(res.startTime)}</Typography>
                        <Typography variant="caption" color="text.secondary">{formatDate(res.endTime)}</Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={sc.label} size="small"
                          sx={{ bgcolor: sc.bg, color: sc.color, border: `1px solid ${sc.border}`, fontWeight: 600 }}
                        />
                      </TableCell>
                      <TableCell>
                        {res.status === 'CONFIRMED' && (
                          <Button size="small" onClick={() => handleCancel(res.id)}
                            sx={{ color: '#dc2626', borderColor: '#fecaca', '&:hover': { bgcolor: '#fff1f2' } }}
                            variant="outlined"
                          >
                            Hủy
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      </Box>
    </Layout>
  )
}

export default ReservationHistory
