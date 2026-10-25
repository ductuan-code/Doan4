import { Box, Typography } from '@mui/material'
import LocalParkingRoundedIcon from '@mui/icons-material/LocalParkingRounded'
import { Link } from 'react-router-dom'

export default function Brand({ light = false, linked = true }) {
  return <Box component={linked ? Link : 'div'} {...(linked ? { to: '/' } : {})} sx={{ display: 'inline-flex', alignItems: 'center', gap: 1.2, color: light ? '#fff' : 'text.primary', textDecoration: 'none', flexShrink: 0 }}>
    <Box sx={{ width: 39, height: 39, borderRadius: '12px 12px 12px 3px', display: 'grid', placeItems: 'center', bgcolor: light ? '#d3f28c' : 'primary.main', color: light ? '#193b35' : '#fff' }}><LocalParkingRoundedIcon sx={{ fontSize: 27 }} /></Box>
    <Box><Typography sx={{ fontWeight: 700, fontSize: 20, letterSpacing: '-.6px', lineHeight: 1.2 }}>ParkingLot<span style={{ color: light ? '#d3f28c' : '#087f73' }}>.</span></Typography>
      <Typography sx={{ fontSize: 10, letterSpacing: '.08em', color: light ? '#a5b9bf' : 'text.secondary', mt: .3 }}>BÃI ĐỖ XE TRỰC TUYẾN</Typography></Box>
  </Box>
}
