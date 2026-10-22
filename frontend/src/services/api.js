import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || '/api'

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

api.interceptors.response.use(
  response => response,
  error => {
    const route = error.config?.url || ''
    if (error.response?.status === 401 && route !== '/auth/login' && route !== '/auth/register') {
      window.dispatchEvent(new Event('auth:expired'))
    }
    return Promise.reject(error)
  }
)

export const getErrorMessage = error => error.response?.data?.message
  || 'Không kết nối được máy chủ. Vui lòng kiểm tra backend rồi thử lại.'

// Auth API
export const authAPI = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (userData) => api.post('/auth/register', userData),
  getCurrentUser: () => api.get('/auth/me')
}

// Vehicle API
export const vehicleAPI = {
  getAll: () => api.get('/vehicles'),
  create: (vehicleData, key) => api.post('/vehicles', vehicleData, { headers: { 'Idempotency-Key': key } }),
  update: (id, vehicleData, key) => api.patch(`/vehicles/${id}`, vehicleData, { headers: { 'Idempotency-Key': key } })
}

// Parking Lot API
export const parkingLotAPI = {
  getAll: () => api.get('/parking-lots'),
  getById: (id) => api.get(`/parking-lots/${id}`),
  getAvailability: (id, params, signal) =>
    api.get(`/parking-lots/${id}/availability`, { params, signal })
}

// Reservation API
export const reservationAPI = {
  create: (reservationData, key) => api.post('/reservations', reservationData, { headers: { 'Idempotency-Key': key } }),
  getMyReservations: (page = 1, pageSize = 20) => api.get('/reservations/my', { params: { page, pageSize } }),
  cancel: (id, key) => api.post(`/reservations/${id}/cancel`, null, { headers: { 'Idempotency-Key': key } }),
  getById: (id) => api.get(`/reservations/${id}`)
}

// Xe vào/ra và lịch sử; server giới hạn theo tài khoản.
export const sessionAPI = {
  getOperations: () => api.get('/staff/operations'),
  findReservation: code => api.get('/staff/reservations/lookup', { params: { code } }),
  checkIn: (data, key) => api.post('/sessions/checkin', data, { headers: { 'Idempotency-Key': key } }),
  getAll: params => api.get('/sessions', { params }),
  getById: id => api.get(`/sessions/${id}`),
  getFee: id => api.get(`/sessions/${id}/fee`),
  checkOut: (id, data, key) => api.post(`/sessions/${id}/checkout`, data, { headers: { 'Idempotency-Key': key } })
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
