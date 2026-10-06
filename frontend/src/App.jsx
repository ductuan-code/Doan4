import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'

// Pages
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'

// Customer Pages
import CustomerDashboard from './pages/customer/Dashboard'
import VehicleManagement from './pages/customer/VehicleManagement'
import SearchParking from './pages/customer/SearchParking'
import ReservationHistory from './pages/customer/ReservationHistory'

// Staff Pages
import StaffDashboard from './pages/staff/Dashboard'
import CheckIn from './pages/staff/CheckIn'
import CheckOut from './pages/staff/CheckOut'

// Admin Pages
import AdminDashboard from './pages/admin/Dashboard'
import ManageParkingLots from './pages/admin/ManageParkingLots'
import ManageZones from './pages/admin/ManageZones'
import ManageSlots from './pages/admin/ManageSlots'
import ManagePricing from './pages/admin/ManagePricing'
import ManageUsers from './pages/admin/ManageUsers'
import Reports from './pages/admin/Reports'

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Customer Routes */}
          <Route path="/customer/dashboard" element={<CustomerDashboard />} />
          <Route path="/customer/vehicles" element={<VehicleManagement />} />
          <Route path="/customer/search" element={<SearchParking />} />
          <Route path="/customer/history" element={<ReservationHistory />} />

          {/* Staff Routes */}
          <Route path="/staff/dashboard" element={<StaffDashboard />} />
          <Route path="/staff/checkin" element={<CheckIn />} />
          <Route path="/staff/checkout" element={<CheckOut />} />

          {/* Admin Routes */}
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/parking-lots" element={<ManageParkingLots />} />
          <Route path="/admin/zones" element={<ManageZones />} />
          <Route path="/admin/slots" element={<ManageSlots />} />
          <Route path="/admin/pricing" element={<ManagePricing />} />
          <Route path="/admin/users" element={<ManageUsers />} />
          <Route path="/admin/reports" element={<Reports />} />
        </Routes>
      </Router>
    </AuthProvider>
  )
}

export default App
