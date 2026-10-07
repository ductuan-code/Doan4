import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { parkingLotAPI, vehicleAPI, reservationAPI } from '../../services/api'

function SearchParking() {
  const navigate = useNavigate()
  const [parkingLots, setParkingLots] = useState([])
  const [vehicles, setVehicles] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    vehicleType: 'MOTORBIKE',
    startTime: '',
    endTime: ''
  })
  const [selectedLot, setSelectedLot] = useState(null)
  const [availableSlots, setAvailableSlots] = useState([])
  const [selectedSlot, setSelectedSlot] = useState(null)
  const [selectedVehicle, setSelectedVehicle] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [lotsRes, vehiclesRes] = await Promise.all([
        parkingLotAPI.getAll(),
        vehicleAPI.getAll()
      ])
      setParkingLots(lotsRes.data)
      setVehicles(vehiclesRes.data)
    } catch (err) {
      console.error('Error loading data:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = async (lotId) => {
    if (!filters.startTime || !filters.endTime) {
      alert('Vui lòng chọn thời gian bắt đầu và kết thúc')
      return
    }

    try {
      const response = await parkingLotAPI.getAvailability(
        lotId, 
        filters.vehicleType, 
        filters.startTime, 
        filters.endTime
      )
      setAvailableSlots(response.data)
      setSelectedLot(lotId)
    } catch (err) {
      alert('Không thể tải thông tin chỗ trống')
    }
  }

  const handleReserve = async () => {
    if (!selectedVehicle) {
      alert('Vui lòng chọn phương tiện')
      return
    }
    if (!selectedSlot) {
      alert('Vui lòng chọn vị trí đỗ')
      return
    }

    try {
      await reservationAPI.create({
        vehicleId: selectedVehicle,
        slotId: selectedSlot,
        startTime: filters.startTime,
        endTime: filters.endTime
      })
      
      alert('Đặt chỗ thành công!')
      navigate('/customer/history')
    } catch (err) {
      alert(err.response?.data?.message || 'Đặt chỗ thất bại')
    }
  }

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h1>Tìm Bãi Đỗ Xe</h1>
        <Link to="/customer/dashboard">
          <button className="secondary">← Quay lại</button>
        </Link>
      </div>

      {/* Filters */}
      <div className="card">
        <h3>Tìm kiếm</h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginTop: '20px' }}>
          <div>
            <label>Loại xe</label>
            <select
              value={filters.vehicleType}
              onChange={(e) => setFilters({...filters, vehicleType: e.target.value})}
              style={{ width: '100%' }}
            >
              <option value="MOTORBIKE">Xe máy</option>
              <option value="CAR">Ô tô</option>
            </select>
          </div>

          <div>
            <label>Giờ bắt đầu</label>
            <input
              type="datetime-local"
              value={filters.startTime}
              onChange={(e) => setFilters({...filters, startTime: e.target.value})}
              style={{ width: '100%' }}
            />
          </div>

          <div>
            <label>Giờ kết thúc</label>
            <input
              type="datetime-local"
              value={filters.endTime}
              onChange={(e) => setFilters({...filters, endTime: e.target.value})}
              style={{ width: '100%' }}
            />
          </div>
        </div>
      </div>

      {/* Parking Lots List */}
      <h3 style={{ marginTop: '30px', marginBottom: '15px' }}>Danh sách bãi đỗ</h3>
      
      {loading ? (
        <p>Đang tải...</p>
      ) : parkingLots.length === 0 ? (
        <p>Chưa có bãi đỗ nào</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
          {parkingLots.map((lot) => (
            <div key={lot.id} className="card" style={{ cursor: 'pointer' }}>
              <h3>{lot.name}</h3>
              <p style={{ marginBottom: '15px' }}>{lot.address}</p>
              <button 
                className="primary" 
                onClick={() => handleSearch(lot.id)}
                style={{ width: '100%' }}
              >
                Xem chỗ trống
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Available Slots */}
      {selectedLot && availableSlots.length > 0 && (
        <div className="card" style={{ marginTop: '30px' }}>
          <h3>Chọn vị trí đỗ</h3>
          
          <div style={{ marginTop: '20px', marginBottom: '20px' }}>
            <label>Chọn phương tiện của bạn</label>
            <select
              value={selectedVehicle}
              onChange={(e) => setSelectedVehicle(e.target.value)}
              style={{ width: '100%' }}
            >
              <option value="">-- Chọn xe --</option>
              {vehicles.filter(v => v.vehicleType === filters.vehicleType).map(v => (
                <option key={v.id} value={v.id}>{v.plateNumber}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '10px' }}>
            {availableSlots.map((slot) => (
              <button
                key={slot.id}
                onClick={() => setSelectedSlot(slot.id)}
                style={{
                  padding: '20px',
                  backgroundColor: selectedSlot === slot.id ? '#1976d2' : '#f5f5f5',
                  color: selectedSlot === slot.id ? 'white' : '#212121',
                  border: '2px solid',
                  borderColor: selectedSlot === slot.id ? '#1976d2' : '#e0e0e0',
                  borderRadius: '8px',
                  fontWeight: 600
                }}
              >
                {slot.code}
              </button>
            ))}
          </div>

          <button 
            className="success" 
            onClick={handleReserve}
            style={{ width: '100%', marginTop: '20px', padding: '14px' }}
            disabled={!selectedSlot || !selectedVehicle}
          >
            Đặt chỗ ngay
          </button>
        </div>
      )}

      {selectedLot && availableSlots.length === 0 && (
        <div className="card" style={{ marginTop: '30px', textAlign: 'center' }}>
          <p>Không còn chỗ trống cho khung giờ này</p>
        </div>
      )}
    </div>
  )
}

export default SearchParking
