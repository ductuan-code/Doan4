import { Box, Typography } from '@mui/material'

// Sơ đồ trang trí, không biểu diễn tồn chỗ hay trạng thái từ cơ sở dữ liệu.
export default function ParkingIllustration() {
  return <Box sx={{ bgcolor: '#23434a', border: '1px solid #3c5a60', borderRadius: 5, p: { xs: 2, sm: 3 }, position: 'relative', overflow: 'hidden' }}>
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, mb: 2 }}>
      <Typography sx={{ color: '#eaf4ef', fontWeight: 500, fontSize: 13 }}>Một hành trình, ít bận tâm hơn.</Typography>
      <Box sx={{ width: 8, height: 8, bgcolor: '#d3f28c', borderRadius: '50%', flexShrink: 0 }} />
    </Box>
    <svg viewBox="0 0 500 330" role="img" aria-label="Minh họa sơ đồ bãi đỗ xe" style={{ display: 'block', width: '100%', height: 'auto' }}>
      <defs><pattern id="parking-dots" width="20" height="20" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r="1" fill="#3c5b61" /></pattern></defs>
      <rect width="500" height="330" fill="url(#parking-dots)" />
      <rect x="20" y="18" width="460" height="290" rx="20" fill="#19363f" stroke="#49656b" />
      {[0,1,2,3,4].map(i => <g key={i} stroke="#6b878b" strokeWidth="2" fill="none">
        <path d={`M${49+i*82} 55 v75 h65 V55 M${49+i*82} 270 v-75 h65 v75`} />
      </g>)}
      <path d="M45 163h380" stroke="#6b878b" strokeWidth="2" strokeDasharray="9 10" />
      <path d="m414 154 12 9-12 9" fill="none" stroke="#d3f28c" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="295" y="48" width="66" height="85" rx="9" fill="#d3f28c" fillOpacity=".13" stroke="#d3f28c" strokeDasharray="5 5" />
      <text x="328" y="98" fill="#d3f28c" textAnchor="middle" fontSize="26" fontFamily="Roboto, sans-serif" fontWeight="700">P</text>
      {[[60,56,'#dae4e1'],[142,200,'#769b9c'],[306,200,'#d3f28c'],[388,56,'#6e9297']].map(([x,y,color]) => <g key={`${x}-${y}`} transform={`translate(${x},${y})`}>
        <rect x="-3" y="17" width="6" height="13" rx="2" fill="#0d252e" /><rect x="40" y="17" width="6" height="13" rx="2" fill="#0d252e" />
        <rect x="-3" y="46" width="6" height="13" rx="2" fill="#0d252e" /><rect x="40" y="46" width="6" height="13" rx="2" fill="#0d252e" />
        <rect width="43" height="72" rx="12" fill={color} /><path d="M5 17 Q21 11 38 17 L35 30 H8Z M8 53h27l3 8Q21 66 5 61Z" fill="#29474e" /><rect x="8" y="33" width="27" height="17" rx="4" fill="#fff" fillOpacity=".12" />
      </g>)}
      <rect x="35" y="286" width="103" height="30" rx="15" fill="#d3f28c" /><text x="86" y="306" fill="#193b35" textAnchor="middle" fontSize="12" fontWeight="700" fontFamily="Roboto, sans-serif">LỐI VÀO →</text>
    </svg>
    <Box sx={{ borderTop: '1px solid #3c5a60', mt: 1, pt: 2, display: 'flex', justifyContent: 'space-between', gap: 1 }}>
      <Typography sx={{ color: '#c0d0d1', fontSize: 11 }}>Chọn bãi · Đặt chỗ · Gửi xe</Typography>
      <Typography sx={{ color: '#88a6ab', fontSize: 10 }}>Sơ đồ minh họa</Typography>
    </Box>
  </Box>
}
