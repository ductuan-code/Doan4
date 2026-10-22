import { useRef, useState } from 'react'
import { getErrorMessage } from '../../services/api'

// Giữ key khi mất phản hồi sau commit, kể cả người dùng đóng rồi mở lại biểu mẫu.
export default function useAdminMutation() {
  const requests = useRef(new Map())
  const lock = useRef(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const save = async (operation, data, action) => {
    if (lock.current) return false
    lock.current = true
    setSaving(true)
    setError('')
    const fingerprint = `${operation}:${JSON.stringify(data)}`
    if (!requests.current.has(fingerprint)) requests.current.set(fingerprint, crypto.randomUUID())
    try {
      await action(requests.current.get(fingerprint))
      requests.current.delete(fingerprint)
      return true
    } catch (e) {
      setError(getErrorMessage(e))
      return false
    } finally {
      lock.current = false
      setSaving(false)
    }
  }
  return { save, saving, error, setError }
}
