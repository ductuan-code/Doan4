import { Link } from 'react-router-dom'

function HomePage() {
  return (
    <div className="container">
      <h1>Hệ Thống Quản Lý Bãi Đỗ Xe</h1>
      <p>Chào mừng bạn đến với hệ thống đặt chỗ và quản lý bãi đỗ xe</p>
      
      <div style={{ marginTop: '20px' }}>
        <Link to="/login">
          <button className="primary">Đăng nhập</button>
        </Link>
        {' '}
        <Link to="/register">
          <button>Đăng ký</button>
        </Link>
      </div>
    </div>
  )
}

export default HomePage
