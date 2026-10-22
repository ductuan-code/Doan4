import { useId } from 'react'
import { Box, Card, CardContent, Typography } from '@mui/material'
import { formatMoney } from './SessionReceipt'

export const reportDate = value => value.split('-').reverse().join('/')
export const vietnamDate = (date = new Date()) => new Date(date.getTime() + 7 * 3600000).toISOString().slice(0, 10)
export const shiftDate = (value, days) => new Date(Date.parse(`${value}T00:00:00Z`) + days * 86400000).toISOString().slice(0, 10)

export function StatCards({ items }) {
  return <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2,1fr)', lg: 'repeat(4,1fr)' }, gap: 2, mb: 2 }}>
    {items.map((item, n) => <Card key={item.label} role="group" aria-label={item.label} sx={{ borderTop: `4px solid ${['#2563eb', '#059669', '#7c3aed', '#d97706'][n % 4]}` }}>
      <CardContent><Typography sx={{ color: 'text.secondary' }}>{item.label}</Typography>
        <Typography variant="h5" sx={{ mt: 1, overflowWrap: 'anywhere' }}>{item.value}</Typography>
        {item.hint && <Typography variant="caption" sx={{ color: 'text.secondary' }}>{item.hint}</Typography>}
      </CardContent>
    </Card>)}
  </Box>
}

export function RevenueChart({ days }) {
  const titleId = useId()
  const width = Math.max(320, days.length * 28), height = 230, pad = 32
  const max = Math.max(...days.map(d => d.revenueVnd), 1)
  const step = (width - 2 * pad) / days.length
  return <Box sx={{ overflowX: 'auto' }}>
    <svg role="img" aria-labelledby={titleId} viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', minWidth: width, height }}>
      <title id={titleId}>Tổng thu ghi nhận theo ngày Việt Nam</title>
      <text x={pad} y="16" fontSize="12" fill="#64748b">Cao nhất: {formatMoney(Math.max(...days.map(d => d.revenueVnd)))}</text>
      <line x1={pad} x2={width - pad} y1={height - pad} y2={height - pad} stroke="#cbd5e1" />
      {days.map((d, i) => {
        const h = (height - 2 * pad - 10) * d.revenueVnd / max
        const barWidth = Math.min(48, step * .7)
        return <g key={d.date}>
          <rect x={pad + (i + .5) * step - barWidth / 2} y={height - pad - h} width={barWidth} height={h} fill="#7c3aed" rx="2">
            <title>{reportDate(d.date)}: {formatMoney(d.revenueVnd)}</title>
          </rect>
          {(i % Math.ceil(days.length / 8) === 0 || i === days.length - 1) && <text x={pad + (i + .5) * step} y={height - 10} textAnchor="middle" fontSize="11" fill="#475569">{reportDate(d.date).slice(0, 5)}</text>}
        </g>
      })}
    </svg>
  </Box>
}
