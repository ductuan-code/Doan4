import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import { AuthProvider } from './context/AuthContext'
import { ThemeProvider } from '@mui/material/styles'
import { CssBaseline } from '@mui/material'
import theme from './theme'

// Pages
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'

// Customer Pages
import CustomerDashboard from './pages/customer/Dashboard'
import VehicleManagement from './pages/customer/VehicleManagement'
import SearchParking from './pages/customer/SearchParking'
import ReservationHistory from './pages/customer/ReservationHistory'
import SessionHistory from './pages/SessionHistory'

// Staff Pages
import StaffDashboard from './pages/staff/Dashboard'
import CheckIn from './pages/staff/CheckIn'
import CheckOut from './pages/staff/CheckOut'
import ParkingStatus from './pages/staff/ParkingStatus'

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
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            <Route element={<ProtectedRoute roles={['Customer']} />}>
            <Route path="/customer/dashboard" element={<CustomerDashboard />} />
            <Route path="/customer/vehicles" element={<VehicleManagement />} />
            <Route path="/customer/search" element={<SearchParking />} />
            <Route path="/customer/history" element={<ReservationHistory />} />
            <Route path="/customer/sessions" element={<SessionHistory />} />
            </Route>

            <Route element={<ProtectedRoute roles={['Staff']} />}>
            <Route path="/staff/dashboard" element={<StaffDashboard />} />
            <Route path="/staff/checkin" element={<CheckIn />} />
            <Route path="/staff/checkout" element={<CheckOut />} />
            <Route path="/staff/parking-status" element={<ParkingStatus />} />
            </Route>

            <Route element={<ProtectedRoute roles={['Admin']} />}>
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/parking-lots" element={<ManageParkingLots />} />
            <Route path="/admin/zones" element={<ManageZones />} />
            <Route path="/admin/slots" element={<ManageSlots />} />
            <Route path="/admin/pricing" element={<ManagePricing />} />
            <Route path="/admin/users" element={<ManageUsers />} />
            <Route path="/admin/reports" element={<Reports />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App
