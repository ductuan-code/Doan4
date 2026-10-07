import { useState } from 'react'
import Layout from '../../components/Layout'
import {
  Box, Typography, Card, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Button, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, Select, MenuItem, FormControl, InputLabel,
  IconButton, Tooltip, Alert, Chip
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import LockIcon from '@mui/icons-material/Lock'
import LockOpenIcon from '@mui/icons-material/LockOpen'

const mockUsers = [
  { id: 1, name: 'Nguyễn Văn A', email: 'customer@test.com', phone: '0901234567', role: 'Customer', active: true },
  { id: 2, name: 'Trần Thị B', email: 'staff@test.com', phone: '0912345678', role: 'Staff', active: true },
  { id: 3, name: 'Admin System', email: 'admin@test.com', phone: '0923456789', role: 'Admin', active: true },
  { id: 4, name: 'Lê Văn C', email: 'user2@test.com', phone: '0934567890', role: 'Customer', active: false },
]

const roleConfig = { Admin: 'warning', Staff: 'success', Customer: 'primary' }
const roleLabel = { Admin: 'Quản trị viên', Staff: 'Nhân viên', Customer: 'Khách hàng' }

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

  const toggleStatus = (id) => {
    setUsers(users.map(u => u.id === id ? { ...u, active: !u.active } : u))
  }

  const filtered = filter === 'all' ? users : users.filter(u => u.role === filter)

  return (
    <Layout>
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5" fontWeight={700}>Quản lý Tài Khoản</Typography>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => { setError(''); setOpenDialog(true) }} sx={{ borderRadius: 2 }}>Thêm nhân viên</Button>
        </Box>

        {/* Filter */}
        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
          {['all', 'Customer', 'Staff', 'Admin'].map(f => (
            <Button key={f} variant={filter === f ? 'contained' : 'outlined'} size="small" onClick={() => setFilter(f)} sx={{ borderRadius: 2 }}>
              {f === 'all' ? 'Tất cả' : roleLabel[f]}
            </Button>
          ))}
        </Box>

        <Card sx={{ borderRadius: 3, boxShadow: 2 }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: '#f5f6fa' }}>
                  <TableCell><strong>Họ tên</strong></TableCell>
                  <TableCell><strong>Email</strong></TableCell>
                  <TableCell><strong>SĐT</strong></TableCell>
                  <TableCell><strong>Vai trò</strong></TableCell>
                  <TableCell><strong>Trạng thái</strong></TableCell>
                  <TableCell align="center"><strong>Thao tác</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.map((user) => (
                  <TableRow key={user.id} hover>
                    <TableCell><Typography fontWeight={600}>{user.name}</Typography></TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.phone}</TableCell>
                    <TableCell><Chip label={roleLabel[user.role]} color={roleConfig[user.role]} size="small" /></TableCell>
                    <TableCell><Chip label={user.active ? 'Hoạt động' : 'Bị khóa'} color={user.active ? 'success' : 'error'} size="small" variant="outlined" /></TableCell>
                    <TableCell align="center">
                      <Tooltip title={user.active ? 'Khóa tài khoản' : 'Mở khóa'}>
                        <IconButton color={user.active ? 'error' : 'success'} onClick={() => toggleStatus(user.id)}>
                          {user.active ? <LockIcon /> : <LockOpenIcon />}
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>

        <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Thêm tài khoản nhân viên</DialogTitle>
          <DialogContent>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            <TextField label="Họ tên" fullWidth value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} margin="normal" required />
            <TextField label="Email" type="email" fullWidth value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} margin="normal" required />
            <TextField label="Số điện thoại" fullWidth value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} margin="normal" />
            <TextField label="Mật khẩu tạm" type="password" fullWidth value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} margin="normal" required />
            <FormControl fullWidth margin="normal">
              <InputLabel>Vai trò</InputLabel>
              <Select value={formData.role} label="Vai trò" onChange={(e) => setFormData({...formData, role: e.target.value})}>
                <MenuItem value="Staff">Nhân viên</MenuItem>
                <MenuItem value="Admin">Quản trị viên</MenuItem>
              </Select>
            </FormControl>
          </DialogContent>
          <DialogActions sx={{ p: 2, gap: 1 }}>
            <Button onClick={() => setOpenDialog(false)}>Hủy</Button>
            <Button variant="contained" onClick={handleSave}>Thêm mới</Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Layout>
  )
}

export default ManageUsers
