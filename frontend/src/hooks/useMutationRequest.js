import { useRef, useState } from 'react'
import { getErrorMessage } from '../services/api'

// Giữ key của yêu cầu chưa rõ kết quả, kể cả khi đóng/mở lại biểu mẫu.
export default function useMutationRequest({ fingerprintOf = JSON.stringify } = {}) {
  const requests = useRef(new Map())
  const lock = useRef(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const save = async (operation, data, action) => {
    if (lock.current) return false
    lock.current = true
    setSaving(true)
    setError('')
    try {
      const fingerprint = `${operation}:${await fingerprintOf(data)}`
      if (!requests.current.has(fingerprint)) requests.current.set(fingerprint, crypto.randomUUID())
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
