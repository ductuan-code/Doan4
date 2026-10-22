export const formatParkingTime = value => new Date(value).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })
export const toUtc = value => new Date(`${value}+07:00`).toISOString()
export const vietnamInput = date => new Date(date.getTime() + 7 * 3600000).toISOString().slice(0, 16)
