import { useState } from 'react'
import { Link } from 'react-router-dom'
import { sessionAPI } from '../../services/api'

function CheckOut() {
  const [searchQuery, setSearchQuery] = useState('')
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSearch = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await sessionAPI.search(searchQuery)
      setSession(response.data)
    } catch (err) {
      setError(err.response?.data?.message || 'Không tìm thấy phiên gửi xe')
      setSession(null)
    } finally {
      setLoading(false)
    }
  }

  const handleCheckout = async () => {
    if (!session) return

    try {
      const response = await sessionAPI.checkOut(session.id)
      alert(`Check-out thành công!\nTổng phí: ${response.data.totalFee.toLocaleString('vi-VN')} VNĐ`)
      setSession(null)
      setSearchQuery('')
    } catch (err) {
      alert(err.response?.data?.message || 'Check-out thất bại')
    }
  }

  const formatDateTime = (dateStr) => {
    return new Date(dateStr).toLocaleString('vi-VN')
  }

  const calculateDuration = (start, end) => {
    const diff = new Date(end) - new Date(start)
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    return `${hours} giờ ${minutes} phút`
  }

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h1>Check-out Xe</h1>
        <Link to="/staff/dashboard">
          <button className="secondary">← Quay lại</button>
        </Link>
      </div>

      <div className="card" style={{ maxWidth: '800px', margin: '0 auto' }}>
        <h3>Tra cứu phiên gửi xe</h3>

        <form onSubmit={handleSearch} style={{ marginTop: '20px' }}>
          {error && (
            <div style={{ 
              padding: '12px', 
              backgroundColor: '#ffebee', 
              color: '#c62828', 
              borderRadius: '8px', 
              marginBottom: '15px' 
            }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', gap: '10px' }}>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Nhập biển số xe hoặc mã phiên"
              required
              style={{ flex: 1 }}
            />
            <button 
              type="submit" 
              className="primary" 
              disabled={loading}
              style={{ padding: '12px 24px' }}
            >
              {loading ? 'Đang tìm...' : 'Tìm kiếm'}
            </button>
          </div>
        </form>

        {session && (
          <div style={{ marginTop: '30px', border: '2px solid #e0e0e0', borderRadius: '12px', padding: '20px' }}>
            <h3 style={{ marginBottom: '20px', color: '#1976d2' }}>Thông tin phiên gửi xe</h3>

            <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr', gap: '12px', marginBottom: '20px' }}>
              <div style={{ fontWeight: 600 }}>Biển số:</div>
              <div>{session.plateNumber}</div>

              <div style={{ fontWeight: 600 }}>Loại xe:</div>
              <div>{session.vehicleType === 'CAR' ? 'Ô tô' : 'Xe máy'}</div>

              <div style={{ fontWeight: 600 }}>Vị trí:</div>
              <div>{session.slotCode}</div>

              <div style={{ fontWeight: 600 }}>Giờ vào:</div>
              <div>{formatDateTime(session.checkInTime)}</div>

              <div style={{ fontWeight: 600 }}>Giờ hiện tại:</div>
              <div>{formatDateTime(new Date())}</div>

              <div style={{ fontWeight: 600 }}>Thời gian gửi:</div>
              <div style={{ color: '#1976d2', fontWeight: 600 }}>
                {calculateDuration(session.checkInTime, new Date())}
              </div>

              <div style={{ fontWeight: 600 }}>Phí dự kiến:</div>
              <div style={{ color: '#d32f2f', fontWeight: 600, fontSize: '18px' }}>
                {session.estimatedFee?.toLocaleString('vi-VN')} VNĐ
              </div>
            </div>

            <button 
              onClick={handleCheckout}
              className="success"
              style={{ width: '100%', padding: '14px', fontSize: '16px' }}
            >
              Xác nhận Check-out
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default CheckOut
