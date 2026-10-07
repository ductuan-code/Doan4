import { useState } from 'react'
import { Link } from 'react-router-dom'
import { sessionAPI } from '../../services/api'

function CheckIn() {
  const [searchType, setSearchType] = useState('reservation') // reservation | walkin
  const [formData, setFormData] = useState({
    reservationCode: '',
    plateNumber: '',
    vehicleType: 'MOTORBIKE'
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      const checkInData = searchType === 'reservation' 
        ? { reservationCode: formData.reservationCode }
        : { 
            plateNumber: formData.plateNumber, 
            vehicleType: formData.vehicleType,
            isWalkIn: true
          }

      const response = await sessionAPI.checkIn(checkInData)
      setSuccess(`Check-in thành công! Vị trí: ${response.data.slotCode}`)
      setFormData({
        reservationCode: '',
        plateNumber: '',
        vehicleType: 'MOTORBIKE'
      })
    } catch (err) {
      setError(err.response?.data?.message || 'Check-in thất bại')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h1>Check-in Xe</h1>
        <Link to="/staff/dashboard">
          <button className="secondary">← Quay lại</button>
        </Link>
      </div>

      <div className="card" style={{ maxWidth: '600px', margin: '0 auto' }}>
        <h3>Nhập thông tin check-in</h3>

        {/* Toggle Search Type */}
        <div style={{ display: 'flex', gap: '10px', marginTop: '20px', marginBottom: '20px' }}>
          <button
            onClick={() => setSearchType('reservation')}
            style={{
              flex: 1,
              padding: '12px',
              backgroundColor: searchType === 'reservation' ? '#1976d2' : '#f5f5f5',
              color: searchType === 'reservation' ? 'white' : '#212121',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 500
            }}
          >
            Có đặt chỗ
          </button>
          <button
            onClick={() => setSearchType('walkin')}
            style={{
              flex: 1,
              padding: '12px',
              backgroundColor: searchType === 'walkin' ? '#1976d2' : '#f5f5f5',
              color: searchType === 'walkin' ? 'white' : '#212121',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 500
            }}
          >
            Walk-in
          </button>
        </div>

        <form onSubmit={handleSubmit}>
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

          {success && (
            <div style={{ 
              padding: '12px', 
              backgroundColor: '#e8f5e9', 
              color: '#2e7d32', 
              borderRadius: '8px', 
              marginBottom: '15px' 
            }}>
              {success}
            </div>
          )}

          {searchType === 'reservation' ? (
            <div style={{ marginBottom: '20px' }}>
              <label>Mã đặt chỗ *</label>
              <input
                type="text"
                value={formData.reservationCode}
                onChange={(e) => setFormData({...formData, reservationCode: e.target.value})}
                placeholder="Nhập mã đặt chỗ hoặc biển số"
                required
                style={{ width: '100%' }}
              />
              <small style={{ color: '#757575' }}>Có thể nhập mã đặt chỗ hoặc biển số xe</small>
            </div>
          ) : (
            <>
              <div style={{ marginBottom: '15px' }}>
                <label>Biển số xe *</label>
                <input
                  type="text"
                  value={formData.plateNumber}
                  onChange={(e) => setFormData({...formData, plateNumber: e.target.value})}
                  placeholder="VD: 29A-12345"
                  required
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label>Loại xe *</label>
                <select
                  value={formData.vehicleType}
                  onChange={(e) => setFormData({...formData, vehicleType: e.target.value})}
                  style={{ width: '100%' }}
                >
                  <option value="MOTORBIKE">Xe máy</option>
                  <option value="CAR">Ô tô</option>
                </select>
              </div>
            </>
          )}

          <button 
            type="submit" 
            className="primary" 
            disabled={loading}
            style={{ width: '100%', padding: '14px' }}
          >
            {loading ? 'Đang xử lý...' : 'Check-in'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default CheckIn
