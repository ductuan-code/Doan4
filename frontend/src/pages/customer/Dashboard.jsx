import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

function CustomerDashboard() {
  const { user, logout } = useAuth()

  return (
    <div className="container">
      <h1>Dashboard Khách Hàng</h1>
      <p>Xin chào, {user?.name}!</p>

      <div style={{ marginTop: '30px' }}>
        <h3>Chức năng:</h3>
        <ul>
          <li><Link to="/customer/vehicles">Quản lý phương tiện</Link></li>
          <li><Link to="/customer/search">Tìm bãi đỗ xe</Link></li>
          <li><Link to="/customer/history">Lịch sử đặt chỗ</Link></li>
        </ul>

        <button onClick={logout} className="danger" style={{ marginTop: '20px' }}>
          Đăng xuất
        </button>
      </div>
    </div>
  )
}

export default CustomerDashboard
