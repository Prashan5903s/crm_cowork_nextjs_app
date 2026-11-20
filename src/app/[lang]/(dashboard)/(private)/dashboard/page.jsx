"use client"

import { useId } from 'react'

import { useParams } from 'next/navigation'

import Grid from '@mui/material/Grid2'

import { Card, CardContent, Typography, Box, Chip, Avatar, LinearProgress, Stack, Divider } from '@mui/material'

import { alpha, useTheme } from '@mui/material/styles'

import PermissionGuard from '@/hocs/PermissionClientGuard'

/* -------------------------------------------------------------------------- */
/*                                Static data                                 */
/* -------------------------------------------------------------------------- */

const MONTHS = ['Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov']

// good: whether an increase is good news (e.g. "Follow-ups Due" going up is not)
const LEAD_KPIS = [
  { label: 'New Leads', value: '148', icon: 'tabler-user-plus', color: 'primary', delta: 12.4 },
  { label: 'Qualified Leads', value: '86', icon: 'tabler-user-check', color: 'success', delta: 8.1 },
  { label: 'Hot Leads', value: '27', icon: 'tabler-flame', color: 'error', delta: 15.0 },
  { label: 'Follow-ups Due', value: '34', icon: 'tabler-phone-call', color: 'warning', delta: -6.2, good: false },
  { label: 'Meetings Today', value: '9', icon: 'tabler-calendar-event', color: 'info', delta: 2.0 },
  { label: 'Property/Space Visits', value: '18', icon: 'tabler-map-pin', color: 'primary', delta: 5.6 },
  { label: 'Proposals Sent', value: '41', icon: 'tabler-file-text', color: 'info', delta: 9.3 },
  { label: 'Applications', value: '23', icon: 'tabler-clipboard-check', color: 'success', delta: 4.5 }
]

const MEMBER_KPIS = [
  { label: 'Active Members', value: '412', icon: 'tabler-users-group', color: 'primary', delta: 3.0 },
  { label: 'New Memberships', value: '37', icon: 'tabler-id-badge-2', color: 'success', delta: 7.2 },
  { label: 'Expiring Memberships', value: '21', icon: 'tabler-clock-exclamation', color: 'warning', delta: 10.5, good: false },
  { label: 'Renewals Due', value: '15', icon: 'tabler-refresh', color: 'info', delta: -3.4, good: false }
]

const BUSINESS_KPIS = [
  { label: 'Pending Payments', value: '₹4.8L', icon: 'tabler-wallet', color: 'error', delta: -8.2, good: false },
  { label: 'Monthly Revenue', value: '₹31.2L', icon: 'tabler-currency-rupee', color: 'success', delta: 13.0 },
  { label: 'Occupancy', value: '86%', icon: 'tabler-chart-pie', color: 'primary', delta: 2.4 },
  { label: 'Available Desks', value: '58', icon: 'tabler-armchair', color: 'info', delta: -9.4, good: false },
  { label: 'Available Private Offices', value: '6', icon: 'tabler-door', color: 'warning', delta: -14.3, good: false }
]

const LEAD_SOURCES = [
  { name: 'Website', value: 28 },
  { name: 'Referrals', value: 22 },
  { name: 'Google Ads', value: 18 },
  { name: 'Walk-ins', value: 12 },
  { name: 'Social media', value: 11 },
  { name: 'Brokers', value: 9 }
]

const FUNNEL = [
  { stage: 'Leads', value: 1240 },
  { stage: 'Qualified', value: 612 },
  { stage: 'Visits', value: 318 },
  { stage: 'Proposals', value: 164 },
  { stage: 'Applications', value: 92 },
  { stage: 'Members', value: 61 }
]

const SALESPEOPLE = [
  { name: 'Aarav Sharma', closed: 17, target: 20, revenue: 8.4 },
  { name: 'Neha Verma', closed: 15, target: 18, revenue: 7.1 },
  { name: 'Rohit Singh', closed: 12, target: 16, revenue: 5.9 },
  { name: 'Priya Mishra', closed: 11, target: 12, revenue: 5.3 },
  { name: 'Karan Gupta', closed: 6, target: 12, revenue: 2.8 }
]

const LOCATIONS = [
  { name: 'Kanpur – Civil Lines', leads: 312, occupancy: 91, revenue: 9.8 },
  { name: 'Lucknow – Gomti Nagar', leads: 284, occupancy: 88, revenue: 8.6 },
  { name: 'Noida – Sector 62', leads: 356, occupancy: 84, revenue: 8.9 },
  { name: 'Gurugram – Udyog Vihar', leads: 288, occupancy: 79, revenue: 3.9 }
]

/* -------------------------------------------------------------------------- */
/*                               Chart helpers                                */
/* -------------------------------------------------------------------------- */

const W = 560
const H = 240
const PAD = { l: 44, r: 16, t: 16, b: 28 }
const INNER_W = W - PAD.l - PAD.r
const INNER_H = H - PAD.t - PAD.b

const niceMax = v => {
  const p = Math.pow(10, Math.floor(Math.log10(v)))
  const n = v / p

  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * p
}

const Axes = ({ max, labels, xAt, fmt }) => {
  const theme = useTheme()
  const ticks = 4

  return (
    <>
      {Array.from({ length: ticks + 1 }).map((_, i) => {
        const y = PAD.t + INNER_H * (1 - i / ticks)

        return (
          <g key={i}>
            <line
              x1={PAD.l}
              x2={W - PAD.r}
              y1={y}
              y2={y}
              stroke={theme.palette.divider}
              strokeDasharray={i ? '3 4' : '0'}
            />
            <text x={PAD.l - 8} y={y + 4} textAnchor='end' fontSize='11' fill={theme.palette.text.secondary}>
              {fmt((max / ticks) * i)}
            </text>
          </g>
        )
      })}
      {labels.map((l, i) => (
        <text key={l} x={xAt(i)} y={H - 8} textAnchor='middle' fontSize='11' fill={theme.palette.text.secondary}>
          {l}
        </text>
      ))}
    </>
  )
}

const LineChart = ({ labels, series, fmt = v => v, area = true }) => {
  const theme = useTheme()
  const uid = useId().replace(/:/g, '')
  const max = niceMax(Math.max(...series.flatMap(s => s.data)))
  const xAt = i => PAD.l + (INNER_W * i) / (labels.length - 1)
  const yAt = v => PAD.t + INNER_H * (1 - v / max)

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width='100%' role='img'>
      <defs>
        {series.map((s, si) => (
          <linearGradient key={si} id={`${uid}-${si}`} x1='0' y1='0' x2='0' y2='1'>
            <stop offset='0%' stopColor={s.color} stopOpacity='0.28' />
            <stop offset='100%' stopColor={s.color} stopOpacity='0' />
          </linearGradient>
        ))}
      </defs>
      <Axes max={max} labels={labels} xAt={xAt} fmt={fmt} />
      {series.map((s, si) => {
        const line = s.data.map((v, i) => `${i ? 'L' : 'M'}${xAt(i)},${yAt(v)}`).join(' ')
        const areaPath = `${line} L${xAt(s.data.length - 1)},${yAt(0)} L${xAt(0)},${yAt(0)} Z`

        return (
          <g key={s.name}>
            {area && !s.dashed && <path d={areaPath} fill={`url(#${uid}-${si})`} />}
            <path
              d={line}
              fill='none'
              stroke={s.color}
              strokeWidth='2.5'
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeDasharray={s.dashed ? '6 5' : undefined}
            />
            {!s.dashed &&
              s.data.map((v, i) => (
                <circle
                  key={i}
                  cx={xAt(i)}
                  cy={yAt(v)}
                  r='4'
                  fill={theme.palette.background.paper}
                  stroke={s.color}
                  strokeWidth='2'
                >
                  <title>{`${s.name} · ${labels[i]}: ${fmt(v)}`}</title>
                </circle>
              ))}
          </g>
        )
      })}
    </svg>
  )
}

const BarChart = ({ labels, series, stacked = false, fmt = v => v }) => {
  const max = niceMax(
    stacked
      ? Math.max(...labels.map((_, i) => series.reduce((sum, s) => sum + s.data[i], 0)))
      : Math.max(...series.flatMap(s => s.data))
  )

  const band = INNER_W / labels.length
  const xAt = i => PAD.l + band * i + band / 2
  const groupW = band * 0.56
  const barW = stacked ? groupW : groupW / series.length

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width='100%' role='img'>
      <Axes max={max} labels={labels} xAt={xAt} fmt={fmt} />
      {labels.map((l, i) => {
        let acc = 0

        return series.map((s, j) => {
          const v = s.data[i]
          const h = (INNER_H * v) / max
          const y = stacked ? PAD.t + INNER_H * (1 - (acc + v) / max) : PAD.t + INNER_H - h
          const x = xAt(i) - groupW / 2 + (stacked ? 0 : j * barW)

          if (stacked) acc += v

          return (
            <rect key={`${i}-${j}`} x={x} y={y} width={barW - (stacked ? 0 : 3)} height={h} rx='3' fill={s.color}>
              <title>{`${s.name} · ${l}: ${fmt(v)}`}</title>
            </rect>
          )
        })
      })}
    </svg>
  )
}

const Donut = ({ data, colors, centerValue, centerLabel }) => {
  const theme = useTheme()
  const r = 70
  const c = 2 * Math.PI * r
  const total = data.reduce((s, d) => s + d.value, 0)
  let offset = 0

  return (
    <svg viewBox='0 0 200 200' width='100%' style={{ maxWidth: 220 }} role='img'>
      <g transform='rotate(-90 100 100)'>
        {data.map((d, i) => {

          const len = (d.value / total) * c

          const el = (
          
            <circle
              key={d.name}
              cx='100'
              cy='100'
              r={r}
              fill='none'
              stroke={colors[i % colors.length]}
              strokeWidth='24'
              strokeDasharray={`${Math.max(len - 3, 0)} ${c - Math.max(len - 3, 0)}`}
              strokeDashoffset={-offset}
            >
              <title>{`${d.name}: ${d.value}%`}</title>
            </circle>
          )

          offset += len

          return el
        })}
      </g>
      <text x='100' y='102' textAnchor='middle' fontSize='26' fontWeight='700' fill={theme.palette.text.primary}>
        {centerValue}
      </text>
      <text x='100' y='122' textAnchor='middle' fontSize='11' fill={theme.palette.text.secondary}>
        {centerLabel}
      </text>
    </svg>
  )
}

const Legend = ({ items }) => (
  <Stack direction='row' flexWrap='wrap' gap={3}>
    {items.map(i => (
      <Box key={i.name} display='flex' alignItems='center' gap={1.5}>
        <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: i.color }} />
        <Typography variant='body2' color='text.secondary'>
          {i.name}
        </Typography>
      </Box>
    ))}
  </Stack>
)

/* -------------------------------------------------------------------------- */
/*                               UI building blocks                           */
/* -------------------------------------------------------------------------- */

const Panel = ({ title, subtitle, action, children }) => (
  <Card sx={{ height: '100%', borderRadius: 3, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
    <CardContent sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Box display='flex' justifyContent='space-between' alignItems='flex-start' gap={2} mb={4}>
        <Box>
          <Typography variant='h6'>{title}</Typography>
          {subtitle && (
            <Typography variant='body2' color='text.secondary'>
              {subtitle}
            </Typography>
          )}
        </Box>
        {action}
      </Box>
      <Box flexGrow={1}>{children}</Box>
    </CardContent>
  </Card>
)

const KpiCard = ({ label, value, icon, color, delta, good = true }) => {
  const theme = useTheme()
  const up = delta >= 0
  const positive = up === good
  const tone = positive ? theme.palette.success.main : theme.palette.error.main

  return (
    <Card sx={{ borderRadius: 3, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
      <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <Box display='flex' justifyContent='space-between' alignItems='center'>
          <Typography variant='body2' color='text.secondary' fontWeight={500}>
            {label}
          </Typography>
          <Avatar
            variant='rounded'
            sx={{
              width: 36,
              height: 36,
              bgcolor: alpha(theme.palette[color].main, 0.14),
              color: theme.palette[color].main
            }}
          >
            <i className={icon} style={{ fontSize: 20 }} />
          </Avatar>
        </Box>
        <Typography variant='h4' fontWeight={700}>
          {value}
        </Typography>
        <Box display='flex' alignItems='center' gap={1} sx={{ color: tone }}>
          <i className={up ? 'tabler-trending-up' : 'tabler-trending-down'} style={{ fontSize: 16 }} />
          <Typography variant='caption' sx={{ color: 'inherit', fontWeight: 600 }}>
            {up ? '+' : ''}
            {delta}%
          </Typography>
          <Typography variant='caption' color='text.secondary'>
            vs last month
          </Typography>
        </Box>
      </CardContent>
    </Card>
  )
}

const KpiSection = ({ title, items, columns }) => (
  <Box>
    <Typography variant='h6' mb={3}>
      {title}
    </Typography>
    <Box
      sx={{
        display: 'grid',
        gap: 4,
        gridTemplateColumns: { xs: 'repeat(1, 1fr)', sm: 'repeat(2, 1fr)', md: `repeat(${columns}, 1fr)` }
      }}
    >
      {items.map(k => (
        <KpiCard key={k.label} {...k} />
      ))}
    </Box>
  </Box>
)

/* -------------------------------------------------------------------------- */
/*                                   Page                                     */
/* -------------------------------------------------------------------------- */

const CrmDashboard = () => {
  const { lang: locale } = useParams()
  const theme = useTheme()
  const { primary, success, warning, error, info } = theme.palette

  const sourceColors = [primary.main, info.main, success.main, warning.main, error.main, theme.palette.secondary.main]
  const lakh = v => `₹${Number(v.toFixed(1))}L`
  const pct = v => `${Number(v.toFixed(1))}%`

  return (
    <PermissionGuard locale={locale} element={'isCompany'}>
      <Stack spacing={6}>
        {/* Header */}
        <Box display='flex' justifyContent='space-between' alignItems='center' flexWrap='wrap' gap={3}>
          <Box>
            <Typography variant='h4'>CRM Dashboard</Typography>
            <Typography color='text.secondary'>Leads, memberships, revenue and space across all locations</Typography>
          </Box>
          <Stack direction='row' gap={2}>
            <Chip icon={<i className='tabler-map-pin' />} label='All locations' variant='outlined' />
            <Chip icon={<i className='tabler-calendar' />} label='November 2026' variant='outlined' />
          </Stack>
        </Box>

        {/* KPIs */}
        <KpiSection title='Leads (Pending)' items={LEAD_KPIS} columns={4} />
        <KpiSection title='Memberships' items={MEMBER_KPIS} columns={4} />
        <KpiSection title='Revenue and space' items={BUSINESS_KPIS} columns={5} />

        {/* Graphs */}
        <Typography variant='h6' sx={{ mb: -2 }}>
          Graphs (Pending)
        </Typography>

        <Grid container spacing={6}>
          {/* Revenue trend + Sales funnel */}
          <Grid size={{ xs: 12, md: 8 }}>
            <Panel
              title='Revenue trend'
              subtitle='Monthly revenue against target (₹ lakh)'
              action={<Chip label='+13.0% vs last month' color='success' size='small' variant='tonal' />}
            >
              <LineChart
                labels={MONTHS}
                fmt={lakh}
                series={[
                  { name: 'Revenue', color: primary.main, data: [18.4, 21.2, 22.9, 24.1, 27.6, 31.2] },
                  { name: 'Target', color: theme.palette.text.disabled, dashed: true, data: [20, 22, 24, 26, 28, 30] }
                ]}
              />
              <Legend
                items={[
                  { name: 'Revenue', color: primary.main },
                  { name: 'Target', color: theme.palette.text.disabled }
                ]}
              />
            </Panel>
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <Panel title='Sales funnel' subtitle='Lead to member, this month'>
              <Stack spacing={1.5} alignItems='center'>
                {FUNNEL.map((f, i) => {
                  const width = Math.max((f.value / FUNNEL[0].value) * 100, 24)
                  const prev = i ? Math.round((f.value / FUNNEL[i - 1].value) * 100) : null

                  return (
                    <Box key={f.stage} width='100%' display='flex' flexDirection='column' alignItems='center'>
                      <Box
                        sx={{
                          width: `${width}%`,
                          minWidth: 120,
                          py: 1.5,
                          px: 3,
                          borderRadius: 2,
                          bgcolor: alpha(primary.main, 1 - i * 0.13),
                          color: primary.contrastText,
                          display: 'flex',
                          justifyContent: 'space-between'
                        }}
                      >
                        <Typography variant='body2' sx={{ color: 'inherit' }}>
                          {f.stage}
                        </Typography>
                        <Typography variant='body2' fontWeight={700} sx={{ color: 'inherit' }}>
                          {f.value.toLocaleString('en-IN')}
                        </Typography>
                      </Box>
                      {prev !== null && (
                        <Typography variant='caption' color='text.secondary' mt={0.5}>
                          {prev}% moved on
                        </Typography>
                      )}
                    </Box>
                  )
                })}
              </Stack>
            </Panel>
          </Grid>

          {/* Lead source + conversion */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Panel title='Lead source analysis' subtitle='Share of new leads by channel'>
              <Box display='flex' flexDirection='column' alignItems='center' gap={4}>
                <Donut data={LEAD_SOURCES} colors={sourceColors} centerValue='148' centerLabel='new leads' />
                <Legend items={LEAD_SOURCES.map((s, i) => ({ name: `${s.name} ${s.value}%`, color: sourceColors[i] }))} />
              </Box>
            </Panel>
          </Grid>

          <Grid size={{ xs: 12, md: 8 }}>
            <Panel
              title='Lead conversion'
              subtitle='Leads that became members'
              action={<Chip label='5.4% this month' color='primary' size='small' variant='tonal' />}
            >
              <LineChart
                labels={MONTHS}
                fmt={pct}
                series={[{ name: 'Conversion', color: success.main, data: [3.8, 4.1, 4.6, 4.4, 5.0, 5.4] }]}
              />
            </Panel>
          </Grid>

          {/* Occupancy, membership, renewal */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Panel title='Occupancy trend' subtitle='Share of desks and offices in use'>
              <LineChart
                labels={MONTHS}
                fmt={v => `${Math.round(v)}%`}
                series={[{ name: 'Occupancy', color: info.main, data: [71, 74, 78, 81, 84, 86] }]}
              />
            </Panel>
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <Panel title='Membership trend' subtitle='Active members at month end'>
              <LineChart
                labels={MONTHS}
                fmt={v => Math.round(v)}
                series={[{ name: 'Active members', color: primary.main, data: [338, 359, 376, 391, 402, 412] }]}
              />
            </Panel>
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <Panel title='Renewal trend' subtitle='Memberships renewed vs lapsed'>
              <BarChart
                labels={MONTHS}
                stacked
                fmt={v => Math.round(v)}
                series={[
                  { name: 'Renewed', color: success.main, data: [18, 21, 19, 24, 26, 28] },
                  { name: 'Lapsed', color: error.main, data: [5, 4, 7, 6, 5, 7] }
                ]}
              />
              <Legend
                items={[
                  { name: 'Renewed', color: success.main },
                  { name: 'Lapsed', color: error.main }
                ]}
              />
            </Panel>
          </Grid>

          {/* Salesperson + Location */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Panel title='Salesperson performance' subtitle='Deals closed against monthly target'>
              <Stack spacing={4} divider={<Divider flexItem />}>
                {SALESPEOPLE.map(p => {
                  const progress = Math.round((p.closed / p.target) * 100)
                  const tone = progress >= 90 ? 'success' : progress >= 70 ? 'primary' : 'warning'

                  return (
                    <Box key={p.name} display='flex' alignItems='center' gap={3}>
                      <Avatar sx={{ bgcolor: alpha(theme.palette[tone].main, 0.14), color: theme.palette[tone].main }}>
                        {p.name
                          .split(' ')
                          .map(n => n[0])
                          .join('')}
                      </Avatar>
                      <Box flexGrow={1}>
                        <Box display='flex' justifyContent='space-between' mb={1}>
                          <Typography fontWeight={600}>{p.name}</Typography>
                          <Typography variant='body2' color='text.secondary'>
                            {p.closed}/{p.target} deals · {lakh(p.revenue)}
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant='determinate'
                          value={Math.min(progress, 100)}
                          color={tone}
                          sx={{ height: 8, borderRadius: 4 }}
                        />
                      </Box>
                    </Box>
                  )
                })}
              </Stack>
            </Panel>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Panel title='Location-wise performance' subtitle='Leads, occupancy and revenue by centre'>
              <Stack spacing={4} divider={<Divider flexItem />}>
                {LOCATIONS.map(l => (
                  <Box key={l.name}>
                    <Box display='flex' justifyContent='space-between' alignItems='center' mb={1.5}>
                      <Typography fontWeight={600}>{l.name}</Typography>
                      <Typography fontWeight={700}>{lakh(l.revenue)}</Typography>
                    </Box>
                    <Box display='flex' alignItems='center' gap={3}>
                      <LinearProgress
                        variant='determinate'
                        value={l.occupancy}
                        color={l.occupancy >= 85 ? 'success' : 'warning'}
                        sx={{ flexGrow: 1, height: 8, borderRadius: 4 }}
                      />
                      <Typography variant='body2' color='text.secondary' sx={{ minWidth: 150, textAlign: 'right' }}>
                        {l.occupancy}% occupied · {l.leads} leads
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </Stack>
            </Panel>
          </Grid>
        </Grid>
      </Stack>
    </PermissionGuard>
  )
}

export default CrmDashboard
