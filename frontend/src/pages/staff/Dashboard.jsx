import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

function StaffDashboard() {
  const { user, logout } = useAuth()

  return (
    <div className="container">
      <h1>Dashboard Nhân Viên</h1>
      <p>Xin chào, {user?.name}!</p>

      <div style={{ marginTop: '30px' }}>
        <h3>Chức năng:</h3>
        <ul>
          <li><Link to="/staff/checkin">Check-in xe</Link></li>
          <li><Link to="/staff/checkout">Check-out xe</Link></li>
        </ul>

        <button onClick={logout} className="danger" style={{ marginTop: '20px' }}>
          Đăng xuất
        </button>
      </div>
    </div>
  )
}

export default StaffDashboard
