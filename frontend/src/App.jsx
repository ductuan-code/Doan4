import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { createTheme, ThemeProvider } from '@mui/material/styles'

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

const theme = createTheme({
  palette: {
    primary:   { main: '#2563eb', light: '#60a5fa', dark: '#1d4ed8' },
    secondary: { main: '#7c3aed', light: '#a78bfa', dark: '#5b21b6' },
    success:   { main: '#059669', light: '#34d399', dark: '#047857' },
    warning:   { main: '#d97706', light: '#fbbf24', dark: '#b45309' },
    error:     { main: '#dc2626', light: '#f87171', dark: '#b91c1c' },
    info:      { main: '#0891b2', light: '#22d3ee', dark: '#0e7490' },
    background: { default: '#f0f4ff', paper: '#ffffff' },
  },
  typography: {
    fontFamily: 'Roboto, sans-serif',
    h4: { fontWeight: 700 },
    h5: { fontWeight: 700 },
    h6: { fontWeight: 600 },
  },
  shape: { borderRadius: 10 },
  components: {
    MuiButton: {
      styleOverrides: {
        root: { textTransform: 'none', fontWeight: 600, borderRadius: 8 },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: { borderRadius: 12, boxShadow: '0 2px 12px rgba(0,0,0,0.08)' },
      },
    },
    MuiChip: {
      styleOverrides: { root: { fontWeight: 500 } },
    },
  },
})

function App() {
  return (
    <ThemeProvider theme={theme}>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            <Route path="/customer/dashboard" element={<CustomerDashboard />} />
            <Route path="/customer/vehicles" element={<VehicleManagement />} />
            <Route path="/customer/search" element={<SearchParking />} />
            <Route path="/customer/history" element={<ReservationHistory />} />

            <Route path="/staff/dashboard" element={<StaffDashboard />} />
            <Route path="/staff/checkin" element={<CheckIn />} />
            <Route path="/staff/checkout" element={<CheckOut />} />

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
    </ThemeProvider>
  )
}

export default App
