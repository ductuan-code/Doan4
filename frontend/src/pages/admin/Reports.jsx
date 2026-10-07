import { useState } from 'react'
import Layout from '../../components/Layout'
import {
  Box, Typography, Card, CardContent, Grid, TextField, Button,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip
} from '@mui/material'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar'
import AttachMoneyIcon from '@mui/icons-material/AttachMoney'
import GridViewIcon from '@mui/icons-material/GridView'

const stats = [
  { label: 'Tổng lượt xe hôm nay', value: 128, icon: <DirectionsCarIcon sx={{ fontSize: 32, color: 'primary.main' }} />, color: '#e3f2fd' },
  { label: 'Doanh thu hôm nay', value: '1,250,000 VNĐ', icon: <AttachMoneyIcon sx={{ fontSize: 32, color: 'success.main' }} />, color: '#e8f5e9' },
  { label: 'Tỷ lệ lấp đầy', value: '76%', icon: <GridViewIcon sx={{ fontSize: 32, color: 'warning.main' }} />, color: '#fff3e0' },
  { label: 'Doanh thu tháng', value: '28,500,000 VNĐ', icon: <TrendingUpIcon sx={{ fontSize: 32, color: 'error.main' }} />, color: '#ffebee' },
]

const mockReport = [
  { date: '07/10/2026', totalIn: 45, totalOut: 42, revenue: 425000, occupancy: '78%' },
  { date: '06/10/2026', totalIn: 52, totalOut: 50, revenue: 510000, occupancy: '82%' },
  { date: '05/10/2026', totalIn: 38, totalOut: 38, revenue: 360000, occupancy: '65%' },
  { date: '04/10/2026', totalIn: 61, totalOut: 60, revenue: 620000, occupancy: '90%' },
  { date: '03/10/2026', totalIn: 29, totalOut: 29, revenue: 280000, occupancy: '55%' },
]

function Reports() {
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  return (
    <Layout>
      <Box>
        <Typography variant="h5" fontWeight={700} mb={3}>Báo Cáo Thống Kê Vận Hành</Typography>

        {/* Stats */}
        <Grid container spacing={2} mb={4}>
          {stats.map((stat) => (
            <Grid item xs={12} sm={6} md={3} key={stat.label}>
              <Card sx={{ borderRadius: 3, boxShadow: 2, bgcolor: stat.color }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                      <Typography variant="body2" color="text.secondary">{stat.label}</Typography>
                      <Typography variant="h5" fontWeight={700} mt={0.5}>{stat.value}</Typography>
                    </Box>
                    {stat.icon}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Filter */}
        <Card sx={{ borderRadius: 3, boxShadow: 2, mb: 3 }}>
          <CardContent>
            <Typography variant="h6" fontWeight={600} mb={2}>Lọc theo thời gian</Typography>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
              <TextField label="Từ ngày" type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} InputLabelProps={{ shrink: true }} size="small" />
              <TextField label="Đến ngày" type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} InputLabelProps={{ shrink: true }} size="small" />
              <Button variant="contained" sx={{ borderRadius: 2 }}>Lọc</Button>
              <Button variant="outlined" sx={{ borderRadius: 2 }}>Hôm nay</Button>
              <Button variant="outlined" sx={{ borderRadius: 2 }}>7 ngày</Button>
              <Button variant="outlined" sx={{ borderRadius: 2 }}>Tháng này</Button>
            </Box>
          </CardContent>
        </Card>

        {/* Table */}
        <Card sx={{ borderRadius: 3, boxShadow: 2 }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: '#f5f6fa' }}>
                  <TableCell><strong>Ngày</strong></TableCell>
                  <TableCell><strong>Lượt vào</strong></TableCell>
                  <TableCell><strong>Lượt ra</strong></TableCell>
                  <TableCell><strong>Doanh thu</strong></TableCell>
                  <TableCell><strong>Tỷ lệ lấp đầy</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {mockReport.map((row) => (
                  <TableRow key={row.date} hover>
                    <TableCell><Typography fontWeight={600}>{row.date}</Typography></TableCell>
                    <TableCell><Chip label={row.totalIn} color="primary" size="small" /></TableCell>
                    <TableCell><Chip label={row.totalOut} color="success" size="small" /></TableCell>
                    <TableCell><Typography fontWeight={600} color="success.main">{row.revenue.toLocaleString('vi-VN')} VNĐ</Typography></TableCell>
                    <TableCell>
                      <Chip
                        label={row.occupancy}
                        color={parseInt(row.occupancy) >= 80 ? 'error' : parseInt(row.occupancy) >= 60 ? 'warning' : 'success'}
                        size="small"
                      />
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

export default Reports
