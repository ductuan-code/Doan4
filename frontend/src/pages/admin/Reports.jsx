import { useState } from 'react'
import Layout from '../../components/Layout'
import {
  Box, Typography, Card, CardContent, Grid, TextField, Button,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, Avatar
} from '@mui/material'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar'
import AttachMoneyIcon from '@mui/icons-material/AttachMoney'
import GridViewIcon from '@mui/icons-material/GridView'
import CalendarTodayIcon from '@mui/icons-material/CalendarToday'

const stats = [
  { label: 'Lượt xe hôm nay', value: 128, icon: <DirectionsCarIcon sx={{ fontSize: 28 }} />, color: '#2563eb', bg: '#eff6ff' },
  { label: 'Doanh thu hôm nay', value: '1,250,000 ₫', icon: <AttachMoneyIcon sx={{ fontSize: 28 }} />, color: '#059669', bg: '#f0fdf4' },
  { label: 'Tỷ lệ lấp đầy', value: '76%', icon: <GridViewIcon sx={{ fontSize: 28 }} />, color: '#d97706', bg: '#fffbeb' },
  { label: 'Doanh thu tháng', value: '28.5M ₫', icon: <TrendingUpIcon sx={{ fontSize: 28 }} />, color: '#7c3aed', bg: '#faf5ff' },
]

const mockReport = [
  { date: '07/10/2026', totalIn: 45, totalOut: 42, revenue: 425000, occupancy: 78 },
  { date: '06/10/2026', totalIn: 52, totalOut: 50, revenue: 510000, occupancy: 82 },
  { date: '05/10/2026', totalIn: 38, totalOut: 38, revenue: 360000, occupancy: 65 },
  { date: '04/10/2026', totalIn: 61, totalOut: 60, revenue: 620000, occupancy: 90 },
  { date: '03/10/2026', totalIn: 29, totalOut: 29, revenue: 280000, occupancy: 55 },
]

function Reports() {
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const getOccupancyColor = (val) => {
    if (val >= 80) return { bg: '#fff1f2', color: '#dc2626' }
    if (val >= 60) return { bg: '#fffbeb', color: '#d97706' }
    return { bg: '#f0fdf4', color: '#059669' }
  }

  return (
    <Layout>
      <Box>
        {/* Header */}
        <Box sx={{
          background: 'linear-gradient(135deg, #dc2626, #7c3aed)',
          borderRadius: 3, p: 3, mb: 3, color: 'white'
        }}>
          <Typography variant="h5" fontWeight={700}>Báo Cáo Thống Kê Vận Hành</Typography>
          <Typography variant="body2" sx={{ opacity: 0.85 }}>Theo dõi hiệu suất và doanh thu bãi đỗ xe</Typography>
        </Box>

        {/* Stats */}
        <Grid container spacing={2} mb={3}>
          {stats.map((stat) => (
            <Grid item xs={12} sm={6} md={3} key={stat.label}>
              <Card sx={{ borderRadius: 3, border: '1px solid #e2e8f0' }}>
                <CardContent sx={{ bgcolor: stat.bg, p: '16px !important' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                      <Typography variant="caption" color="text.secondary">{stat.label}</Typography>
                      <Typography variant="h6" fontWeight={800} sx={{ color: stat.color }} mt={0.3}>
                        {stat.value}
                      </Typography>
                    </Box>
                    <Avatar sx={{ bgcolor: 'white', width: 44, height: 44, boxShadow: 1 }}>
                      <Box sx={{ color: stat.color }}>{stat.icon}</Box>
                    </Avatar>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Filter */}
        <Card sx={{ borderRadius: 3, mb: 3 }}>
          <CardContent>
            <Typography variant="h6" fontWeight={600} mb={2} display="flex" alignItems="center" gap={1}>
              <CalendarTodayIcon color="primary" fontSize="small" /> Lọc theo thời gian
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
              <TextField label="Từ ngày" type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} InputLabelProps={{ shrink: true }} size="small" />
              <TextField label="Đến ngày" type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} InputLabelProps={{ shrink: true }} size="small" />
              <Button variant="contained" size="small">Lọc</Button>
              {['Hôm nay', '7 ngày', 'Tháng này'].map(label => (
                <Button key={label} variant="outlined" size="small" sx={{ borderColor: '#e2e8f0', color: 'text.secondary' }}>{label}</Button>
              ))}
            </Box>
          </CardContent>
        </Card>

        {/* Table */}
        <Card sx={{ borderRadius: 3 }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: '#f8faff' }}>
                  {['Ngày', 'Lượt vào', 'Lượt ra', 'Doanh thu', 'Tỷ lệ lấp đầy'].map(h => (
                    <TableCell key={h} sx={{ fontWeight: 700, color: '#7c3aed' }}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {mockReport.map((row) => {
                  const oc = getOccupancyColor(row.occupancy)
                  return (
                    <TableRow key={row.date} hover sx={{ '&:hover': { bgcolor: '#f8faff' } }}>
                      <TableCell><Typography fontWeight={600}>{row.date}</Typography></TableCell>
                      <TableCell>
                        <Chip label={row.totalIn} size="small" sx={{ bgcolor: '#eff6ff', color: '#2563eb', fontWeight: 700 }} />
                      </TableCell>
                      <TableCell>
                        <Chip label={row.totalOut} size="small" sx={{ bgcolor: '#f0fdf4', color: '#059669', fontWeight: 700 }} />
                      </TableCell>
                      <TableCell>
                        <Typography fontWeight={700} sx={{ color: '#059669' }}>
                          {row.revenue.toLocaleString('vi-VN')} ₫
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip label={`${row.occupancy}%`} size="small" sx={{ bgcolor: oc.bg, color: oc.color, fontWeight: 700 }} />
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

export default Reports
