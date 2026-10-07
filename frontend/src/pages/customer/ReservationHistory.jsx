import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { reservationAPI } from '../../services/api'

function ReservationHistory() {
  const [reservations, setReservations] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadReservations()
  }, [])

  const loadReservations = async () => {
    try {
      const response = await reservationAPI.getMyReservations()
      setReservations(response.data)
    } catch (err) {
      console.error('Error loading reservations:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = async (id) => {
    if (!window.confirm('Bạn có chắc muốn hủy đặt chỗ này?')) return

    try {
      await reservationAPI.cancel(id)
      loadReservations()
      alert('Đã hủy đặt chỗ thành công')
    } catch (err) {
      alert(err.response?.data?.message || 'Không thể hủy đặt chỗ')
    }
  }

  const getStatusColor = (status) => {
    switch(status) {
      case 'CONFIRMED': return { bg: '#e8f5e9', color: '#2e7d32' }
      case 'CANCELLED': return { bg: '#ffebee', color: '#c62828' }
      case 'COMPLETED': return { bg: '#e3f2fd', color: '#1976d2' }
      case 'EXPIRED': return { bg: '#fafafa', color: '#757575' }
      default: return { bg: '#fff3e0', color: '#e65100' }
    }
  }

  const getStatusText = (status) => {
    switch(status) {
      case 'CONFIRMED': return 'Đã xác nhận'
      case 'CANCELLED': return 'Đã hủy'
      case 'COMPLETED': return 'Hoàn thành'
      case 'EXPIRED': return 'Hết hạn'
      default: return status
    }
  }

  const formatDateTime = (dateStr) => {
    return new Date(dateStr).toLocaleString('vi-VN')
  }

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h1>Lịch Sử Đặt Chỗ</h1>
        <Link to="/customer/dashboard">
          <button className="secondary">← Quay lại</button>
        </Link>
      </div>

      <div className="card">
        {loading ? (
          <p>Đang tải...</p>
        ) : reservations.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <p style={{ color: '#757575', marginBottom: '20px' }}>
              Bạn chưa có lượt đặt chỗ nào
            </p>
            <Link to="/customer/search">
              <button className="primary">Tìm bãi đỗ xe</button>
            </Link>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Mã đặt chỗ</th>
                <th>Bãi đỗ</th>
                <th>Vị trí</th>
                <th>Biển số</th>
                <th>Thời gian</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {reservations.map((res) => {
                const statusStyle = getStatusColor(res.status)
                return (
                  <tr key={res.id}>
                    <td style={{ fontWeight: 600 }}>#{res.id}</td>
                    <td>{res.parkingLotName}</td>
                    <td>{res.slotCode}</td>
                    <td>{res.plateNumber}</td>
                    <td>
                      <div>{formatDateTime(res.startTime)}</div>
                      <div>{formatDateTime(res.endTime)}</div>
                    </td>
                    <td>
                      <span style={{
                        padding: '4px 12px',
                        borderRadius: '12px',
                        fontSize: '13px',
                        backgroundColor: statusStyle.bg,
                        color: statusStyle.color,
                        fontWeight: 500
                      }}>
                        {getStatusText(res.status)}
                      </span>
                    </td>
                    <td>
                      {res.status === 'CONFIRMED' && (
                        <button 
                          onClick={() => handleCancel(res.id)}
                          className="danger"
                          style={{ padding: '6px 16px', fontSize: '14px' }}
                        >
                          Hủy
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

export default ReservationHistory
