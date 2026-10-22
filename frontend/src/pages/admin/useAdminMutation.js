import { useRef, useState } from 'react'
import { getErrorMessage } from '../../services/api'

// Giữ key khi mất phản hồi sau commit, kể cả người dùng đóng rồi mở lại biểu mẫu.
export default function useAdminMutation({ fingerprintOf = JSON.stringify } = {}) {
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
      // Cho phép biểu mẫu chứa mật khẩu dùng digest nội dung thay vì giữ mật khẩu
      // trong map của các yêu cầu đang chờ; digest không rời khỏi bộ nhớ trang.
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
