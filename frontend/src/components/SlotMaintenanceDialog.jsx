import { useEffect, useState } from 'react'
import { Alert, Box, Button, Checkbox, Dialog, DialogActions, DialogContent, DialogTitle, FormControlLabel, Stack, TextField, Typography } from '@mui/material'
import { sessionAPI } from '../services/api'
import useMutationRequest from '../hooks/useMutationRequest'
import { formatParkingTime } from '../utils/reservationTime'

export default function SlotMaintenanceDialog({ action, onClose, onSuccess }) {
  const [reason, setReason] = useState(''), [verified, setVerified] = useState(false)
  const mutation = useMutationRequest()
  useEffect(() => { setReason(''); setVerified(false); mutation.setError('') }, [action, mutation.setError])
  const close = () => { if (!mutation.saving) onClose() }
  const submit = async event => {
    event.preventDefault()
    if (!verified || !reason.trim()) return
    const data = { isMaintenance: action.isMaintenance, reason: reason.trim(), positionVerified: true }
    if (await mutation.save(`maintenance:${action.id}`, data, key => sessionAPI.setMaintenance(action.id, data, key)))
      await onSuccess(action.code)
  }
  return <Dialog open={!!action} onClose={close} fullWidth maxWidth="sm">
    <Box component="form" onSubmit={submit}>
      <DialogTitle>{action?.isMaintenance ? 'Đưa vị trí vào bảo trì' : 'Kết thúc bảo trì vị trí'}</DialogTitle>
      <DialogContent><Stack spacing={2} sx={{ pt: 1 }}>
        <Typography sx={{ fontWeight: 600 }}>{action?.zoneName} · {action?.code}</Typography>
        <Alert severity="info">{action?.isMaintenance ? 'Bảo trì chặn nhận xe vào vị trí này.' : 'Chỉ mở lại sau khi đã xác nhận vị trí phục vụ được.'} Lịch đặt đã xác nhận và thời gian đệm sau trả xe vẫn được giữ. Thao tác không kích hoạt lại cấu hình đã ngừng hoạt động.</Alert>
        {!!action?.confirmedReservationCount && <Alert severity="warning">Vị trí đang có {action.confirmedReservationCount} lịch đặt còn hiệu lực. Cần điều phối khi khách đến; bảo trì không hủy các lịch này.</Alert>}
        {action?.isInBuffer && <Typography variant="body2">Còn đệm đến {formatParkingTime(action.bufferUntil)} (giờ Việt Nam).</Typography>}
        {mutation.error && <Alert severity="error">{mutation.error}</Alert>}
        <TextField label="Lý do bảo trì hoặc mở lại" required multiline minRows={2} disabled={mutation.saving} value={reason}
          onChange={e => { setReason(e.target.value); mutation.setError('') }} slotProps={{ htmlInput: { maxLength: 1000 } }} />
        <FormControlLabel control={<Checkbox disabled={mutation.saving} checked={verified} onChange={e => setVerified(e.target.checked)} />}
          label={action?.isMaintenance ? 'Đã kiểm tra tình trạng vị trí thực tế' : 'Đã kiểm tra và xác nhận vị trí phục vụ được'} />
      </Stack></DialogContent>
      <DialogActions><Button disabled={mutation.saving} onClick={close}>Đóng</Button>
        <Button type="submit" variant="contained" disabled={mutation.saving || !verified || !reason.trim()}>{mutation.saving ? 'Đang lưu…' : 'Xác nhận bảo trì'}</Button>
      </DialogActions>
    </Box>
  </Dialog>
}
