import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

function AdminDashboard() {
  const { user, logout } = useAuth()

  return (
    <div className="container">
      <h1>Dashboard Quản Trị</h1>
      <p>Xin chào, {user?.name}!</p>

      <div style={{ marginTop: '30px' }}>
        <h3>Chức năng:</h3>
        <ul>
          <li><Link to="/admin/parking-lots">Quản lý bãi đỗ</Link></li>
          <li><Link to="/admin/zones">Quản lý khu vực</Link></li>
          <li><Link to="/admin/slots">Quản lý vị trí</Link></li>
          <li><Link to="/admin/pricing">Quản lý bảng giá</Link></li>
          <li><Link to="/admin/users">Quản lý tài khoản</Link></li>
          <li><Link to="/admin/reports">Báo cáo thống kê</Link></li>
        </ul>

        <button onClick={logout} className="danger" style={{ marginTop: '20px' }}>
          Đăng xuất
        </button>
      </div>
    </div>
  )
}

export default AdminDashboard
