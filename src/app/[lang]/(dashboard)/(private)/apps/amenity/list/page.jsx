'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'

import { useRouter, useParams } from 'next/navigation'

import Link from 'next/link'

import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import Chip from '@mui/material/Chip'
import Grid from '@mui/material/Grid2'
import IconButton from '@mui/material/IconButton'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import Skeleton from '@mui/material/Skeleton'
import Stack from '@mui/material/Stack'
import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import Typography from '@mui/material/Typography'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Tooltip from '@mui/material/Tooltip'

import ApartmentIcon from '@mui/icons-material/Apartment'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import PauseCircleOutlineIcon from '@mui/icons-material/PauseCircleOutline'
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined'
import ViewListIcon from '@mui/icons-material/ViewList'
import GridViewIcon from '@mui/icons-material/GridView'
import EditNoteIcon from '@mui/icons-material/EditNote'
import AutorenewIcon from '@mui/icons-material/Autorenew'
import EventAvailableOutlinedIcon from '@mui/icons-material/EventAvailableOutlined'
import BusinessOutlinedIcon from '@mui/icons-material/BusinessOutlined'
import AccessTimeIcon from '@mui/icons-material/AccessTime'
import PublicIcon from '@mui/icons-material/Public'
import ScheduleIcon from '@mui/icons-material/Schedule'
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined'
import { useApi } from '@/utils/api'

const ORANGE = '#D35400'

const STATUS_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' }
]

const TIME_OPTIONS = [
  { value: 'all', label: 'All Time' },
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'This Week' },
  { value: 'month', label: 'This Month' }
]

const SKELETON_COUNT = 6

/* ---------- helpers ---------- */

const normalize = a => ({
  id: a.id ?? a._id,
  name: a.name ?? a.title ?? '-',
  type: a.type ?? a.amenity_type ?? a.category ?? '',
  image: a.image ?? a.image_url ?? a.photo ?? '',
  isActive: Boolean(a.status),
  access: a.internal_access ?? a.access ?? 'Entire organisation',
  slot: a.slot_duration ?? a.slot ?? 1,
  listedPublicly: Boolean(a.listed_publicly ?? a.is_public ?? a.public ?? false),
  from: a.start_time ?? a.open_time ?? '09:00',
  to: a.end_time ?? a.close_time ?? '21:00',
  max: a.max_capacity ?? a.capacity ?? a.max_people ?? 0,
  createdAt: a.created_at ? new Date(a.created_at) : null
})

const inTimeRange = (date, range) => {
  if (range === 'all' || !date) return true

  const now = new Date()
  const start = new Date(now)

  start.setHours(0, 0, 0, 0)

  if (range === 'week') start.setDate(start.getDate() - start.getDay())
  if (range === 'month') start.setDate(1)

  return date >= start
}

/* ---------- small pieces ---------- */

const StatTile = ({ label, value, icon, sx, loading }) => (
  <Box
    sx={{
      flex: 1,
      minWidth: 220,
      height: 96,
      px: 3,
      py: 2.5,
      borderRadius: 2.5,
      color: '#fff',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-end',
      ...sx
    }}
  >
    <Box sx={{ alignSelf: 'stretch', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
      <Typography sx={{ fontSize: 12, fontWeight: 700, letterSpacing: 0.4, color: 'inherit', opacity: 0.95 }}>
        {label}
      </Typography>
      {loading ? (
        <Skeleton
          variant='rounded'
          width={56}
          height={34}
          sx={{ bgcolor: 'rgba(255,255,255,0.35)' }}
        />
      ) : (
        <Typography sx={{ fontSize: 36, fontWeight: 700, lineHeight: 1, color: 'inherit' }}>{value}</Typography>
      )}
    </Box>
    <Box sx={{ opacity: 0.95, display: 'flex' }}>{icon}</Box>
  </Box>
)

const InfoRow = ({ icon, children }) => (
  <Stack direction='row' spacing={1.5} alignItems='center' sx={{ color: 'text.secondary' }}>
    <Box sx={{ display: 'flex', fontSize: 18 }}>{icon}</Box>
    <Typography variant='body2' sx={{ color: 'text.secondary' }}>
      {children}
    </Typography>
  </Stack>
)

const AmenityCard = ({ item, onEdit, onToggle, onBook }) => (
  <Card
    variant='outlined'
    sx={{ borderRadius: 2, overflow: 'hidden', borderColor: 'divider', height: '100%', display: 'flex', flexDirection: 'column' }}
  >
    <Box sx={{ position: 'relative', height: 160, bgcolor: 'action.hover' }}>
      {item.image ? (
        <Box component='img' src={item.image} alt={item.name} sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      ) : (
        <Box sx={{ height: '100%', display: 'grid', placeItems: 'center', color: 'text.disabled' }}>
          <ApartmentIcon sx={{ fontSize: 48 }} />
        </Box>
      )}
      <Chip
        label={item.isActive ? 'Active' : 'Inactive'}
        size='small'
        sx={{
          position: 'absolute',
          top: 12,
          right: 12,
          height: 24,
          fontWeight: 700,
          color: 'common.white',
          bgcolor: item.isActive ? 'success.main' : 'error.main'
        }}
      />
    </Box>

    <Box sx={{ p: 2.5, flex: 1 }}>
      <Typography variant='h6' sx={{ fontWeight: 700, color: item.isActive ? 'text.primary' : 'text.secondary' }}>
        {item.name}
      </Typography>
      <Typography variant='body2' sx={{ color: 'text.secondary', mb: 2 }}>
        {item.type?.name}
      </Typography>

      <Stack spacing={1.25}>
        <InfoRow icon={<BusinessOutlinedIcon fontSize='inherit' />}>Internal access: {item.access}</InfoRow>
        <InfoRow icon={<AccessTimeIcon fontSize='inherit' />}>Slot: {item.slot} hours</InfoRow>
        <InfoRow icon={<PublicIcon fontSize='inherit' />}>Listed publicly: {item.listedPublicly ? 'Yes' : 'No'}</InfoRow>
        <InfoRow icon={<ScheduleIcon fontSize='inherit' />}>
          {item.from} - {item.to}
        </InfoRow>
        <InfoRow icon={<GroupsOutlinedIcon fontSize='inherit' />}>Max: {item.max} people</InfoRow>
      </Stack>
    </Box>

    <Stack
      direction='row'
      alignItems='center'
      justifyContent='space-between'
      sx={{ px: 2, py: 1.5, borderTop: '1px solid', borderColor: 'divider' }}
    >
      <Stack direction='row' spacing={0.5}>
        <Tooltip title='Edit'>
          <IconButton size='small' onClick={() => onEdit?.(item)}>
            <EditNoteIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title={item.isActive ? 'Deactivate' : 'Activate'}>
          <IconButton size='small' onClick={() => onToggle?.(item)} sx={{ color: 'primary.main' }}>
            <AutorenewIcon fontSize='small' />
          </IconButton>
        </Tooltip>
      </Stack>

      <Button
        size='small'
        variant='contained'
        style={{
          margin: '5px 1px'
        }}
        startIcon={<EventAvailableOutlinedIcon />}
        onClick={() => onBook?.(item)}
      >
        Book Now
      </Button>
    </Stack>
  </Card>
)

const AmenityList = ({ items, onEdit, onToggle, onBook }) => (
  <Card variant='outlined' sx={{ borderRadius: 2, overflowX: 'auto' }}>
    <Table size='small'>
      <TableHead>
        <TableRow>
          {['Amenity', 'Type', 'Access', 'Slot', 'Hours', 'Max', 'Public', 'Status', ''].map((h, i) => (
            <TableCell key={`${h}-${i}`} sx={{ fontWeight: 700 }}>
              {h}
            </TableCell>
          ))}
        </TableRow>
      </TableHead>
      <TableBody>
        {items.map(item => (
          <TableRow key={item.id} hover>
            <TableCell sx={{ fontWeight: 600 }}>{item.name}</TableCell>
            <TableCell>{item.type?.name}</TableCell>
            <TableCell>{item.access}</TableCell>
            <TableCell>{item.slot} h</TableCell>
            <TableCell>
              {item.from} - {item.to}
            </TableCell>
            <TableCell>{item.max}</TableCell>
            <TableCell>{item.listedPublicly ? 'Yes' : 'No'}</TableCell>
            <TableCell>
              <Chip
                label={item.isActive ? 'Active' : 'Inactive'}
                size='small'
                sx={{
                  fontWeight: 700,
                  color: 'common.white',
                  bgcolor: item.isActive ? 'success.main' : 'error.main'
                }}
              />
            </TableCell>
            <TableCell align='right' sx={{ whiteSpace: 'nowrap' }}>
              <IconButton size='small' onClick={() => onEdit?.(item)}>
                <EditNoteIcon />
              </IconButton>
              <IconButton size='small' onClick={() => onToggle?.(item)} sx={{ color: 'primary.main' }}>
                <AutorenewIcon fontSize='small' />
              </IconButton>
              <Button size='small' variant='contained' onClick={() => onBook?.(item)}>
                Book Now
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </Card>
)

/* ---------- skeletons ---------- */

const AmenityCardSkeleton = () => (
  <Card
    variant='outlined'
    sx={{ borderRadius: 2, overflow: 'hidden', borderColor: 'divider', height: '100%', display: 'flex', flexDirection: 'column' }}
  >
    <Skeleton variant='rectangular' height={160} animation='wave' />

    <Box sx={{ p: 2.5, flex: 1 }}>
      <Skeleton variant='text' width='60%' sx={{ fontSize: 24 }} />
      <Skeleton variant='text' width='35%' sx={{ mb: 2 }} />

      <Stack spacing={1.5}>
        {[0, 1, 2, 3, 4].map(i => (
          <Stack key={i} direction='row' spacing={1.5} alignItems='center'>
            <Skeleton variant='circular' width={18} height={18} />
            <Skeleton variant='text' width={`${70 - i * 6}%`} />
          </Stack>
        ))}
      </Stack>
    </Box>

    <Stack
      direction='row'
      alignItems='center'
      justifyContent='space-between'
      sx={{ px: 2, py: 1.5, borderTop: '1px solid', borderColor: 'divider' }}
    >
      <Stack direction='row' spacing={1}>
        <Skeleton variant='circular' width={30} height={30} />
        <Skeleton variant='circular' width={30} height={30} />
      </Stack>
      <Skeleton variant='rounded' width={110} height={32} />
    </Stack>
  </Card>
)

const AmenityListSkeleton = () => (
  <Card variant='outlined' sx={{ borderRadius: 2, overflowX: 'auto' }}>
    <Table size='small'>
      <TableHead>
        <TableRow>
          {['Amenity', 'Type', 'Access', 'Slot', 'Hours', 'Max', 'Public', 'Status', ''].map((h, i) => (
            <TableCell key={`${h}-${i}`} sx={{ fontWeight: 700 }}>
              {h}
            </TableCell>
          ))}
        </TableRow>
      </TableHead>
      <TableBody>
        {Array.from({ length: SKELETON_COUNT }).map((_, row) => (
          <TableRow key={row}>
            <TableCell>
              <Skeleton variant='text' width={120} />
            </TableCell>
            <TableCell>
              <Skeleton variant='text' width={80} />
            </TableCell>
            <TableCell>
              <Skeleton variant='text' width={110} />
            </TableCell>
            <TableCell>
              <Skeleton variant='text' width={30} />
            </TableCell>
            <TableCell>
              <Skeleton variant='text' width={90} />
            </TableCell>
            <TableCell>
              <Skeleton variant='text' width={30} />
            </TableCell>
            <TableCell>
              <Skeleton variant='text' width={30} />
            </TableCell>
            <TableCell>
              <Skeleton variant='rounded' width={64} height={24} />
            </TableCell>
            <TableCell align='right'>
              <Stack direction='row' spacing={1} justifyContent='flex-end' alignItems='center'>
                <Skeleton variant='circular' width={28} height={28} />
                <Skeleton variant='circular' width={28} height={28} />
                <Skeleton variant='rounded' width={84} height={30} />
              </Stack>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </Card>
)

/* ---------- main component ---------- */

const AmenityTable = () => {
  const router = useRouter()
  const { lang } = useParams()

  const [view, setView] = useState('grid')
  const [status, setStatus] = useState('active')
  const [range, setRange] = useState('all')

  const { doGet, token } = useApi()

  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [data, setData] = useState([])

  const publicUrl = ''

  const onEdit = item => {
    router.replace(`/${lang}/apps/amenity/create/${item?.id}`)
  }

  const onBook = item => {
    router.replace(`/${lang}/apps/amenity/book/${item?.id}`)
  }

  const onCreate = () => {
    router.replace(`/${lang}/apps/amenity/create`)
  }

  // silent = true refreshes the data without showing the skeleton (used after a toggle)
  const fetchCreateData = useCallback(
    async (silent = false) => {
      if (!token) {
        setLoading(false)

        return
      }

      if (!silent) setLoading(true)
      setLoadError('')

      try {
        const response = await doGet('company/amenity/fetch/data')

        const result = response?.data ?? response
        const payload = result?.data ?? result

        setData(Array.isArray(payload) ? payload : [])
      } catch (error) {
        console.error('Failed to fetch amenities:', error)

        setLoadError(error?.message || 'Failed to load amenities. Please try again.')
      } finally {
        setLoading(false)
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [token]
  )

  useEffect(() => {
    fetchCreateData()
  }, [fetchCreateData])

  const onToggleStatus = useCallback(
    async item => {
      if (!token) return

      setLoadError('')

      try {
        await doGet(`company/amenity/toggle/data/${item?.id}`)

        // flip only the toggled item, leave the rest of the list alone
        setData(prev => prev.map(a => ((a.id ?? a._id) === item.id ? { ...a, status: !a.status } : a)))
      } catch (error) {
        console.error('Failed to toggle amenity status:', error)
        setLoadError(error?.message || 'Failed to update status. Please try again.')
        throw error
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [token]
  )

  const handleToggle = async item => {
    try {
      await onToggleStatus(item)
      fetchCreateData(true) // silent re-sync with the server
    } catch {
      // error already stored in loadError
    }
  }

  const all = useMemo(() => data.map(normalize), [data])

  const counts = useMemo(
    () => ({
      all: all.length,
      active: all.filter(a => a.isActive).length,
      inactive: all.filter(a => !a.isActive).length
    }),
    [all]
  )

  const filtered = useMemo(
    () =>
      all.filter(a => {
        const statusOk = status === 'all' || (status === 'active' ? a.isActive : !a.isActive)

        return statusOk && inTimeRange(a.createdAt, range)
      }),
    [all, status, range]
  )

  const filtersActive = status !== 'all' || range !== 'all'

  const clearAll = () => {
    setStatus('all')
    setRange('all')
  }

  const selectSx = {
    minWidth: 150,
    height: 44,
    borderRadius: 2,
    bgcolor: 'background.paper'
  }

  return (
    <Box>
      {/* Header */}
      <Stack direction='row' justifyContent='space-between' alignItems='center' flexWrap='wrap' gap={2} sx={{ mb: 4 }}>
        <Typography variant='h4' sx={{ fontWeight: 700 }}>
          Amenities
        </Typography>

        <Stack direction='row' spacing={2}>
          <Button
            component={Link}
            href={publicUrl}
            variant='outlined'
            color='inherit'
            startIcon={<VisibilityOutlinedIcon />}
            sx={{ textTransform: 'none', borderColor: 'divider', bgcolor: 'background.paper', height: 44 }}
          >
            View public Amenities
          </Button>
          <Button variant='contained' onClick={onCreate}>
            + Create New Amenity
          </Button>
        </Stack>
      </Stack>

      {/* Error */}
      {loadError && (
        <Alert
          severity='error'
          onClose={() => setLoadError('')}
          action={
            <Button color='inherit' size='small' onClick={() => fetchCreateData()}>
              Retry
            </Button>
          }
          sx={{ mb: 3 }}
        >
          {loadError}
        </Alert>
      )}

      {/* Stat tiles */}
      <Stack direction='row' gap={3} flexWrap='wrap' sx={{ mb: 4 }}>
        <StatTile
          label='ALL AMENITIES'
          value={counts.all}
          loading={loading}
          icon={<ApartmentIcon sx={{ fontSize: 44 }} />}
          sx={{ background: 'linear-gradient(90deg, #3b5bdb 0%, #7c3aed 100%)' }}
        />
        <StatTile
          label='ACTIVE'
          value={counts.active}
          loading={loading}
          icon={<CheckCircleOutlineIcon sx={{ fontSize: 44 }} />}
          sx={{ background: '#16a763', border: '3px solid #0f7a48' }}
        />
        <StatTile
          label='INACTIVE'
          value={counts.inactive}
          loading={loading}
          icon={<PauseCircleOutlineIcon sx={{ fontSize: 44 }} />}
          sx={{ background: '#475063' }}
        />
      </Stack>

      {/* Toolbar */}
      <Stack direction='row' alignItems='center' gap={2} flexWrap='wrap' sx={{ mb: 2.5 }}>
        <ToggleButtonGroup
          exclusive
          size='small'
          value={view}
          onChange={(_, newView) => {
            if (newView !== null) setView(newView)
          }}
          sx={{
            bgcolor: 'action.hover',
            p: 0.5,
            borderRadius: 2,
            '& .MuiToggleButton-root': {
              border: 0,
              borderRadius: 1.5,
              color: 'text.secondary',
              minWidth: 36,
              '&:hover': {
                bgcolor: 'action.selected'
              },
              '&.Mui-selected': {
                bgcolor: 'primary.main',
                color: '#fff',
                '&:hover': {
                  bgcolor: 'primary.dark'
                }
              }
            }
          }}
        >
          <ToggleButton value='list' aria-label='List view'>
            <ViewListIcon />
          </ToggleButton>

          <ToggleButton value='grid' aria-label='Grid view'>
            <GridViewIcon />
          </ToggleButton>
        </ToggleButtonGroup>

        <Select
          value={status}
          onChange={e => setStatus(e.target.value)}
          sx={{ ...selectSx, ...(status !== 'all' && { '& fieldset': { borderColor: ORANGE } }) }}
        >
          {STATUS_OPTIONS.map(o => (
            <MenuItem key={o.value} value={o.value}>
              {o.label}
            </MenuItem>
          ))}
        </Select>

        <Select value={range} onChange={e => setRange(e.target.value)} sx={selectSx}>
          {TIME_OPTIONS.map(o => (
            <MenuItem key={o.value} value={o.value}>
              {o.label}
            </MenuItem>
          ))}
        </Select>
      </Stack>

      {/* Result summary + active filters */}
      <Stack direction='row' alignItems='center' gap={2} flexWrap='wrap' sx={{ mb: 3 }}>
        {loading ? (
          <Skeleton variant='text' width={220} />
        ) : (
          <Typography variant='body2'>
            Showing <b>{filtered.length}</b> of <b>{counts.all}</b> amenities{' '}
            {filtersActive && <i style={{ opacity: 0.7 }}>(filtered)</i>}
          </Typography>
        )}

        {filtersActive && (
          <>
            <Box sx={{ width: '1px', height: 18, bgcolor: 'divider' }} />
            <Typography variant='caption' sx={{ fontWeight: 700, letterSpacing: 0.5, color: 'text.secondary' }}>
              ACTIVE FILTERS:
            </Typography>
            {status !== 'all' && (
              <Chip
                size='small'
                variant='outlined'
                label={STATUS_OPTIONS.find(o => o.value === status)?.label}
                onDelete={() => setStatus('all')}
                icon={
                  <Box
                    component='span'
                    sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: status === 'active' ? '#16a763' : '#6b7280' }}
                  />
                }
                sx={{ borderColor: '#16a763', bgcolor: '#ecfdf3', '& .MuiChip-icon': { ml: 1 } }}
              />
            )}
            {range !== 'all' && (
              <Chip
                size='small'
                variant='outlined'
                label={TIME_OPTIONS.find(o => o.value === range)?.label}
                onDelete={() => setRange('all')}
              />
            )}
            <Button size='small' color='error' onClick={clearAll} sx={{ textTransform: 'none', fontWeight: 700, minWidth: 0 }}>
              Clear All
            </Button>
          </>
        )}
      </Stack>

      {/* Content */}
      {loading ? (
        view === 'grid' ? (
          <Grid container spacing={3}>
            {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
              <Grid key={i} size={{ xs: 12, md: 6, lg: 4 }}>
                <AmenityCardSkeleton />
              </Grid>
            ))}
          </Grid>
        ) : (
          <AmenityListSkeleton />
        )
      ) : filtered.length === 0 ? (
        <Box sx={{ py: 10, textAlign: 'center' }}>
          <Typography sx={{ fontWeight: 600 }}>No amenities match these filters</Typography>
          <Button onClick={clearAll} sx={{ mt: 1, textTransform: 'none' }}>
            Clear filters
          </Button>
        </Box>
      ) : view === 'grid' ? (
        <Grid container spacing={3}>
          {filtered.map(item => (
            <Grid key={item.id} size={{ xs: 12, md: 6, lg: 4 }}>
              <AmenityCard item={item} onEdit={onEdit} onToggle={handleToggle} onBook={onBook} />
            </Grid>
          ))}
        </Grid>
      ) : (
        <AmenityList items={filtered} onEdit={onEdit} onToggle={handleToggle} onBook={onBook} />
      )}

      {!loading && (
        <Typography variant='body2' sx={{ textAlign: 'center', mt: 5, mb: 2 }}>
          No more items to display
        </Typography>
      )}
    </Box>
  )
}

export default AmenityTable
