import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { vehicleAPI } from '../../services/api'

function VehicleManagement() {
  const [vehicles, setVehicles] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [formData, setFormData] = useState({
    plateNumber: '',
    vehicleType: 'MOTORBIKE'
  })
  const [error, setError] = useState('')

  useEffect(() => {
    loadVehicles()
  }, [])

  const loadVehicles = async () => {
    try {
      const response = await vehicleAPI.getAll()
      setVehicles(response.data)
    } catch (err) {
      console.error('Error loading vehicles:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    try {
      if (editingId) {
        await vehicleAPI.update(editingId, formData)
      } else {
        await vehicleAPI.create(formData)
      }
      
      loadVehicles()
      resetForm()
    } catch (err) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra')
    }
  }

  const handleEdit = (vehicle) => {
    setEditingId(vehicle.id)
    setFormData({
      plateNumber: vehicle.plateNumber,
      vehicleType: vehicle.vehicleType
    })
    setShowForm(true)
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc muốn xóa phương tiện này?')) return

    try {
      await vehicleAPI.delete(id)
      loadVehicles()
    } catch (err) {
      alert(err.response?.data?.message || 'Không thể xóa phương tiện')
    }
  }

  const resetForm = () => {
    setFormData({ plateNumber: '', vehicleType: 'MOTORBIKE' })
    setEditingId(null)
    setShowForm(false)
    setError('')
  }

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h1>Quản lý Phương tiện</h1>
        <Link to="/customer/dashboard">
          <button className="secondary">← Quay lại</button>
        </Link>
      </div>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3>Danh sách xe của bạn</h3>
          {!showForm && (
            <button className="primary" onClick={() => setShowForm(true)}>
              + Thêm phương tiện
            </button>
          )}
        </div>

        {showForm && (
          <div className="card" style={{ backgroundColor: '#f9f9f9', marginBottom: '20px' }}>
            <h3>{editingId ? 'Chỉnh sửa phương tiện' : 'Thêm phương tiện mới'}</h3>
            
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

              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="submit" className="primary">
                  {editingId ? 'Cập nhật' : 'Thêm mới'}
                </button>
                <button type="button" className="secondary" onClick={resetForm}>
                  Hủy
                </button>
              </div>
            </form>
          </div>
        )}

        {loading ? (
          <p>Đang tải...</p>
        ) : vehicles.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#757575', padding: '40px' }}>
            Chưa có phương tiện nào. Hãy thêm xe của bạn!
          </p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Biển số</th>
                <th>Loại xe</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {vehicles.map((vehicle) => (
                <tr key={vehicle.id}>
                  <td style={{ fontWeight: 600 }}>{vehicle.plateNumber}</td>
                  <td>
                    <span style={{
                      padding: '4px 12px',
                      borderRadius: '12px',
                      fontSize: '13px',
                      backgroundColor: vehicle.vehicleType === 'CAR' ? '#e3f2fd' : '#f3e5f5',
                      color: vehicle.vehicleType === 'CAR' ? '#1976d2' : '#7b1fa2'
                    }}>
                      {vehicle.vehicleType === 'CAR' ? 'Ô tô' : 'Xe máy'}
                    </span>
                  </td>
                  <td>
                    <button 
                      onClick={() => handleEdit(vehicle)}
                      style={{ 
                        padding: '6px 16px', 
                        marginRight: '8px',
                        backgroundColor: '#1976d2',
                        color: 'white',
                        fontSize: '14px'
                      }}
                    >
                      Sửa
                    </button>
                    <button 
                      onClick={() => handleDelete(vehicle.id)}
                      className="danger"
                      style={{ padding: '6px 16px', fontSize: '14px' }}
                    >
                      Xóa
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

export default VehicleManagement
