import { useState } from 'react'
import Layout from '../../components/Layout'
import {
  Box, Typography, Card, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Button, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, Select, MenuItem, FormControl, InputLabel,
  IconButton, Tooltip, Alert, Chip, Avatar
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import LockIcon from '@mui/icons-material/Lock'
import LockOpenIcon from '@mui/icons-material/LockOpen'

const mockUsers = [
  { id: 1, name: 'Nguyễn Văn A', email: 'customer@test.com', phone: '0901234567', role: 'Customer', active: true },
  { id: 2, name: 'Trần Thị B',   email: 'staff@test.com',    phone: '0912345678', role: 'Staff',    active: true },
  { id: 3, name: 'Admin System', email: 'admin@test.com',    phone: '0923456789', role: 'Admin',    active: true },
  { id: 4, name: 'Lê Văn C',     email: 'user2@test.com',    phone: '0934567890', role: 'Customer', active: false },
]

const roleConfig = {
  Admin:    { bg: '#faf5ff', color: '#7c3aed', label: 'Quản trị viên' },
  Staff:    { bg: '#f0fdf4', color: '#059669', label: 'Nhân viên' },
  Customer: { bg: '#eff6ff', color: '#2563eb', label: 'Khách hàng' },
}

function ManageUsers() {
  const [users, setUsers] = useState(mockUsers)
  const [openDialog, setOpenDialog] = useState(false)
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', password: '', role: 'Staff' })
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('all')

  const handleSave = () => {
    if (!formData.name || !formData.email || !formData.password) { setError('Vui lòng điền đầy đủ thông tin'); return }
    setUsers([...users, { id: Date.now(), ...formData, active: true }])
    setOpenDialog(false)
    setFormData({ name: '', email: '', phone: '', password: '', role: 'Staff' })
  }

  const toggleStatus = (id) => setUsers(users.map(u => u.id === id ? { ...u, active: !u.active } : u))

  const filtered = filter === 'all' ? users : users.filter(u => u.role === filter)

  return (
    <Layout>
      <Box>
        <Box sx={{
          background: 'linear-gradient(135deg, #7c3aed, #2563eb)',
          borderRadius: 3, p: 3, mb: 3, color: 'white',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center'
        }}>
          <Box>
            <Typography variant="h5" fontWeight={700}>Quản lý Tài Khoản</Typography>
            <Typography variant="body2" sx={{ opacity: 0.85 }}>Người dùng và nhân viên hệ thống</Typography>
          </Box>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => { setError(''); setOpenDialog(true) }}
            sx={{ bgcolor: 'white', color: '#7c3aed', '&:hover': { bgcolor: '#faf5ff' }, fontWeight: 700 }}>
            Thêm nhân viên
          </Button>
        </Box>

        {/* Filter */}
        <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
          {[
            { key: 'all', label: 'Tất cả' },
            { key: 'Customer', label: 'Khách hàng' },
            { key: 'Staff', label: 'Nhân viên' },
            { key: 'Admin', label: 'Admin' },
          ].map(f => (
            <Button key={f.key} size="small"
              variant={filter === f.key ? 'contained' : 'outlined'}
              onClick={() => setFilter(f.key)}
              sx={{ borderRadius: 5, px: 2,
                ...(filter === f.key ? {} : { borderColor: '#e2e8f0', color: 'text.secondary' })
              }}
            >
              {f.label}
            </Button>
          ))}
        </Box>

        <Card sx={{ borderRadius: 3 }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: '#f8faff' }}>
                  {['', 'Họ tên', 'Email', 'SĐT', 'Vai trò', 'Trạng thái', 'Thao tác'].map(h => (
                    <TableCell key={h} sx={{ fontWeight: 700, color: '#7c3aed' }}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.map((user) => {
                  const rc = roleConfig[user.role]
                  return (
                    <TableRow key={user.id} hover sx={{ '&:hover': { bgcolor: '#f8faff' } }}>
                      <TableCell>
                        <Avatar sx={{ bgcolor: rc.bg, color: rc.color, width: 36, height: 36, fontWeight: 700, fontSize: 14 }}>
                          {user.name.charAt(0)}
                        </Avatar>
                      </TableCell>
                      <TableCell><Typography fontWeight={600}>{user.name}</Typography></TableCell>
                      <TableCell><Typography variant="body2" color="text.secondary">{user.email}</Typography></TableCell>
                      <TableCell>{user.phone}</TableCell>
                      <TableCell>
                        <Chip label={rc.label} size="small" sx={{ bgcolor: rc.bg, color: rc.color, fontWeight: 600 }} />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={user.active ? 'Hoạt động' : 'Bị khóa'} size="small"
                          sx={{
                            bgcolor: user.active ? '#f0fdf4' : '#fff1f2',
                            color: user.active ? '#059669' : '#dc2626',
                            fontWeight: 600
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Tooltip title={user.active ? 'Khóa tài khoản' : 'Mở khóa'}>
                          <IconButton
                            onClick={() => toggleStatus(user.id)}
                            sx={{
                              color: user.active ? '#dc2626' : '#059669',
                              '&:hover': { bgcolor: user.active ? '#fff1f2' : '#f0fdf4' }
                            }}
                          >
                            {user.active ? <LockIcon fontSize="small" /> : <LockOpenIcon fontSize="small" />}
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>

        <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
          <DialogTitle sx={{ fontWeight: 700 }}>Thêm tài khoản nhân viên</DialogTitle>
          <DialogContent>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            <TextField label="Họ tên" fullWidth value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} margin="normal" required />
            <TextField label="Email" type="email" fullWidth value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} margin="normal" required />
            <TextField label="Số điện thoại" fullWidth value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} margin="normal" />
            <TextField label="Mật khẩu tạm" type="password" fullWidth value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} margin="normal" required />
            <FormControl fullWidth margin="normal">
              <InputLabel>Vai trò</InputLabel>
              <Select value={formData.role} label="Vai trò" onChange={(e) => setFormData({ ...formData, role: e.target.value })}>
                <MenuItem value="Staff">Nhân viên</MenuItem>
                <MenuItem value="Admin">Quản trị viên</MenuItem>
              </Select>
            </FormControl>
          </DialogContent>
          <DialogActions sx={{ p: 2.5, gap: 1 }}>
            <Button onClick={() => setOpenDialog(false)} variant="outlined">Hủy</Button>
            <Button variant="contained" onClick={handleSave}>Thêm mới</Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Layout>
  )
}

export default ManageUsers
