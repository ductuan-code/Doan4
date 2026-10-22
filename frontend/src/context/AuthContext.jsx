import { createContext, useCallback, useState, useContext, useEffect } from 'react'
import { authAPI, getErrorMessage } from '../services/api'

const AuthContext = createContext()
export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [sessionError, setSessionError] = useState('')
  const logout = useCallback(() => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
    setSessionError('')
    setLoading(false)
  }, [])
  const refreshUser = useCallback(async () => {
    const token = localStorage.getItem('token')
    // Không khôi phục tài khoản/quyền từ dữ liệu trình duyệt của bản mock cũ.
    localStorage.removeItem('user')
    if (!token || token === 'mock-token-123') { logout(); return }
    setLoading(true)
    setSessionError('')
    try {
      const { data } = await authAPI.getCurrentUser()
      if (localStorage.getItem('token') === token) setUser(data)
    } catch (error) {
      if (localStorage.getItem('token') !== token) return
      if (error.response?.status === 401) logout()
      else setSessionError(getErrorMessage(error))
    } finally {
      if (localStorage.getItem('token') === token) setLoading(false)
    }
  }, [logout])
  useEffect(() => {
    window.addEventListener('auth:expired', logout)
    refreshUser()
    return () => window.removeEventListener('auth:expired', logout)
  }, [logout, refreshUser])
  const login = (userData, token) => {
    localStorage.setItem('token', token)
    localStorage.removeItem('user')
    setUser(userData)
    setSessionError('')
    setLoading(false)
  }
  return <AuthContext.Provider value={{ user, login, logout, loading, sessionError, refreshUser, isAuthenticated: !!user }}>
    {children}
  </AuthContext.Provider>
}
