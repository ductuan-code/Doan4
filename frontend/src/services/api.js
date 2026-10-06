import axios from 'axios'

const API_URL = 'http://localhost:5000/api'

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Auth API
export const authAPI = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (userData) => api.post('/auth/register', userData),
  getCurrentUser: () => api.get('/auth/me')
}

// Vehicle API
export const vehicleAPI = {
  getAll: () => api.get('/vehicles'),
  create: (vehicleData) => api.post('/vehicles', vehicleData),
  update: (id, vehicleData) => api.put(`/vehicles/${id}`, vehicleData),
  delete: (id) => api.delete(`/vehicles/${id}`)
}

// Parking Lot API
export const parkingLotAPI = {
  getAll: () => api.get('/parking-lots'),
  getById: (id) => api.get(`/parking-lots/${id}`),
  getAvailability: (id, vehicleType, startTime, endTime) => 
    api.get(`/parking-lots/${id}/availability`, { 
      params: { vehicleType, startTime, endTime } 
    })
}

// Reservation API
export const reservationAPI = {
  create: (reservationData) => api.post('/reservations', reservationData),
  getMyReservations: () => api.get('/reservations/my'),
  cancel: (id) => api.put(`/reservations/${id}/cancel`),
  getById: (id) => api.get(`/reservations/${id}`)
}

// Parking Session API (Staff)
export const sessionAPI = {
  checkIn: (checkInData) => api.post('/sessions/checkin', checkInData),
  checkOut: (sessionId) => api.post(`/sessions/${sessionId}/checkout`),
  search: (plateNumber) => api.get(`/sessions/search`, { params: { plateNumber } })
}

// Admin APIs
export const adminAPI = {
  // Parking Lots
  createParkingLot: (data) => api.post('/admin/parking-lots', data),
  updateParkingLot: (id, data) => api.put(`/admin/parking-lots/${id}`, data),
  deleteParkingLot: (id) => api.delete(`/admin/parking-lots/${id}`),
  
  // Zones
  getZones: (parkingLotId) => api.get(`/admin/parking-lots/${parkingLotId}/zones`),
  createZone: (data) => api.post('/admin/zones', data),
  updateZone: (id, data) => api.put(`/admin/zones/${id}`, data),
  deleteZone: (id) => api.delete(`/admin/zones/${id}`),
  
  // Slots
  getSlots: (zoneId) => api.get(`/admin/zones/${zoneId}/slots`),
  createSlot: (data) => api.post('/admin/slots', data),
  updateSlot: (id, data) => api.put(`/admin/slots/${id}`, data),
  deleteSlot: (id) => api.delete(`/admin/slots/${id}`),
  
  // Pricing
  getPricing: () => api.get('/admin/pricing'),
  updatePricing: (id, data) => api.put(`/admin/pricing/${id}`, data),
  
  // Users
  getUsers: () => api.get('/admin/users'),
  createUser: (data) => api.post('/admin/users', data),
  updateUser: (id, data) => api.put(`/admin/users/${id}`, data),
  toggleUserStatus: (id) => api.put(`/admin/users/${id}/toggle-status`),
  
  // Reports
  getReports: (params) => api.get('/admin/reports', { params })
}

export default api
