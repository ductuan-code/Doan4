import { useEffect, useState } from 'react'
import { Alert, Box, Button, Checkbox, Dialog, DialogActions, DialogContent, DialogTitle, FormControlLabel, Stack, TextField, Typography } from '@mui/material'
import { reservationAPI, sessionAPI } from '../services/api'
import useMutationRequest from '../hooks/useMutationRequest'
import { formatParkingTime } from '../utils/reservationTime'

const titles = { issue: 'Ghi nhận khách đến gặp sự cố', unfulfilled: 'Xác nhận không phục vụ được', plate: 'Sửa biển số xe vãng lai' }
export default function StaffActionDialog({ action, onClose, onSuccess }) {
  const mutation = useMutationRequest()
  const [reason, setReason] = useState(''), [plate, setPlate] = useState(''), [verified, setVerified] = useState(false)
  useEffect(() => {
    setReason(''); setPlate(action?.plateNumber ?? ''); setVerified(false); mutation.setError('')
  }, [action, mutation.setError])
  const correct = action?.kind === 'plate'
  const close = () => { if (!mutation.saving) onClose() }
  const submit = async event => {
    event.preventDefault()
    if (!verified || !reason.trim() || (correct && !plate.trim())) return
    const data = correct ? { plateNumber: plate.trim(), reason: reason.trim(), vehicleVerified: true }
      : { reason: reason.trim(), customerPresent: true }
    let response
    const saved = await mutation.save(`${action.kind}:${action.id}`, data, async key => {
      const request = correct ? sessionAPI.correctPlate : action.kind === 'issue' ? reservationAPI.recordIssue : reservationAPI.markUnfulfilled
      response = (await request(action.id, data, key)).data
    })
    if (saved) await onSuccess(response)
  }
  return <Dialog open={!!action} onClose={close} fullWidth maxWidth="sm">
    <Box component="form" onSubmit={submit}>
      <DialogTitle>{titles[action?.kind]}</DialogTitle>
      <DialogContent><Stack spacing={2} sx={{ pt: 1 }}>
        <Typography sx={{ overflowWrap: 'anywhere', fontWeight: 600 }}>{action?.code} · {action?.plateNumber}</Typography>
        <Alert severity={action?.kind === 'unfulfilled' ? 'warning' : 'info'}>
          {correct ? 'Chỉ sửa biển số nhập sai của lượt vãng lai đang mở trong 5 phút đầu. Giữ nguyên tài khoản, phương tiện, giờ vào và đơn giá.' : action?.kind === 'issue'
            ? 'Chỉ ghi khi khách đã đến và có trở ngại phục vụ thực tế. Hạn xử lý tối đa 15 phút từ lần ghi đầu, không vượt giờ kết thúc lượt đặt; ghi lại không gia hạn.'
            : 'Kết thúc lượt đặt do không phục vụ được. Thao tác giữ lịch sử và lý do; không tạo lượt gửi xe hoặc phiếu thu.'}
        </Alert>
        {action?.deadline && <Typography variant="body2">{correct ? 'Hạn sửa biển số' : action.kind === 'issue' ? 'Hạn ghi nhận khách đến' : 'Hạn kết thúc xử lý'}: {formatParkingTime(action.deadline)} (giờ Việt Nam). Hệ thống kiểm tra lại khi lưu.</Typography>}
        {mutation.error && <Alert severity="error">{mutation.error}</Alert>}
        {correct && <TextField label="Biển số đúng" required disabled={mutation.saving} value={plate} onChange={e => { setPlate(e.target.value); mutation.setError('') }} slotProps={{ htmlInput: { maxLength: 32 } }} />}
        <TextField label="Lý do xử lý" required multiline minRows={2} disabled={mutation.saving} value={reason} onChange={e => { setReason(e.target.value); mutation.setError('') }} slotProps={{ htmlInput: { maxLength: 1000 } }} />
        <FormControlLabel control={<Checkbox disabled={mutation.saving} checked={verified} onChange={e => setVerified(e.target.checked)} />}
          label={correct ? 'Đã đối chiếu biển số với xe thực tế' : 'Đã đối chiếu khách và xe thực tế tại bãi'} />
      </Stack></DialogContent>
      <DialogActions><Button disabled={mutation.saving} onClick={close}>Đóng</Button>
        <Button type="submit" variant="contained" color={action?.kind === 'unfulfilled' ? 'warning' : 'primary'} disabled={mutation.saving || !verified || !reason.trim() || (correct && !plate.trim())}>{mutation.saving ? 'Đang lưu…' : 'Xác nhận xử lý'}</Button>
      </DialogActions>
    </Box>
  </Dialog>
}
