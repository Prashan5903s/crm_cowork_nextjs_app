'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'

import { useRouter, useParams } from 'next/navigation'

import {
    Alert,
    Box,
    Button,
    Chip,
    CssBaseline,
    FormControl,
    IconButton,
    MenuItem,
    Paper,
    Select,
    Skeleton,
    Stack,
    TextField,
    Typography,
} from '@mui/material'

import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew'
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom'

import { useApi } from '@/utils/api'

/* ------------------------------------------------------------------ */
/* Mock data (replace with API calls when available)                   */
/* ------------------------------------------------------------------ */

const TENANTS = [
    { id: 1, name: 'Acme Corp' },
    { id: 2, name: 'Globex Pvt Ltd' },
    { id: 3, name: 'Initech' },
]

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

// Maps API day keys ('mon', 'tue', ...) to JS getDay() indexes
const DAY_KEY_TO_INDEX = { sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6 }

const sameDay = (a, b) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()

// "09:00" -> 540
const parseTime = (value, fallback) => {
    if (typeof value !== 'string' || !value.includes(':')) return fallback

    const [h, m] = value.split(':').map(Number)

    if (Number.isNaN(h) || Number.isNaN(m)) return fallback

    return h * 60 + m
}

// 540 -> "09:00"
const toHHmm = (mins) =>
    `${String(Math.floor(mins / 60)).padStart(2, '0')}:${String(mins % 60).padStart(2, '0')}`

// 540 -> "9:00 AM", 570 -> "9:30 AM"
const fmtTime = (mins) => {
    const h = Math.floor(mins / 60)
    const m = mins % 60
    const suffix = h >= 12 ? 'PM' : 'AM'
    const hr = h % 12 === 0 ? 12 : h % 12

    return `${hr}:${String(m).padStart(2, '0')} ${suffix}`
}

// Local date -> "2026-10-14" (avoids the UTC shift of toISOString)
const toDateKey = (d) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

const groupOf = (mins) =>
    mins < 12 * 60 ? 'Morning' : mins < 17 * 60 ? 'Afternoon' : 'Evening'

const getImageUrl = (img) => {
    if (!img) return ''
    if (typeof img === 'string') return img

    return img.url || img.src || img.path || img.location || img.file || ''
}

// Converts the API payload into the shape the UI needs
const normalizeAmenity = (raw) => {
    if (!raw) return null

    const unit = String(raw.slot_time_unit || 'minutes').toLowerCase()
    const period = Number(raw.slot_time_period) || 60
    const slotMinutes = unit.startsWith('hour') ? period * 60 : period

    const availableDays = (raw.available_days || [])
        .map((d) => DAY_KEY_TO_INDEX[String(d).toLowerCase().slice(0, 3)])
        .filter((d) => d !== undefined)

    return {
        id: raw._id,
        name: raw.title,
        type: raw.type?.name || '',
        capacity: Number(raw.occupancy_per_slot) || 1,
        startMinutes: parseTime(raw.start_time, 9 * 60),
        endMinutes: parseTime(raw.end_time, 18 * 60),
        slotMinutes,
        availableDays,
        image: getImageUrl(raw.images?.[0]),
        active: raw.status !== false,
        tenantQuota: raw.has_tenant_monthly_quota ? Number(raw.tenant_monthly_quota) || 0 : null,
    }
}

// Builds slots for a given date using the amenity's slot length
const fetchSlots = (amenity, date) => {
    const slots = []
    const now = new Date()
    const nowMinutes = now.getHours() * 60 + now.getMinutes()
    const isToday = sameDay(date, now)

    for (
        let start = amenity.startMinutes;
        start + amenity.slotMinutes <= amenity.endMinutes;
        start += amenity.slotMinutes
    ) {
        slots.push({
            id: `${toDateKey(date)}-${start}`,
            start,
            end: start + amenity.slotMinutes,
            remaining: amenity.capacity, // TODO: subtract existing bookings from API
            total: amenity.capacity,
            yours: false, // TODO: mark slots already booked by the current user
            past: isToday && start <= nowMinutes,
        })
    }

    return slots
}

const surfaceSx = {
    border: '1px solid',
    borderColor: 'divider',
    borderRadius: 2.5,
    bgcolor: 'background.paper',
}

/* ------------------------------------------------------------------ */
/* Mode switch                                                         */
/* ------------------------------------------------------------------ */

const ModeSwitch = ({ mode, onChange }) => (
    <Box
        sx={{
            display: 'flex',
            bgcolor: 'grey.100',
            borderRadius: 2,
            width: '100%',
        }}
    >
        {[
            { key: 'you', label: 'Book for Yourself' },
            { key: 'tenant', label: 'Book for Tenant' },
        ].map(({ key, label }) => (
            <Button
                key={key}
                fullWidth
                disableElevation
                variant={mode === key ? 'contained' : 'text'}
                color={mode === key ? 'primary' : 'inherit'}
                onClick={() => onChange(key)}
                sx={{
                    py: 1.25,
                    px: 1.5,
                    minHeight: 48,
                    borderRadius: 1.5,
                    fontSize: 14,
                    fontWeight: 600,
                    textTransform: 'none',
                    whiteSpace: 'nowrap',
                    color: mode === key ? 'primary.contrastText' : 'text.secondary',
                    bgcolor: mode === key ? 'primary.main' : 'transparent',
                    '&:hover': {
                        bgcolor: mode === key ? 'primary.dark' : 'grey.200',
                    },
                }}
            >
                {label}
            </Button>
        ))}
    </Box>
)

/* ------------------------------------------------------------------ */
/* Selected amenity                                                    */
/* ------------------------------------------------------------------ */

const SelectedAmenityBanner = ({ amenity }) => (
    <Paper
        variant="outlined"
        sx={{
            ...surfaceSx,
            p: 2.5,
            mb: 3,
            display: 'flex',
            alignItems: 'center',
            gap: 2,
        }}
    >
        <Box
            sx={{
                width: 68,
                height: 68,
                flexShrink: 0,
                borderRadius: 2,
                bgcolor: 'grey.100',
                overflow: 'hidden',
                display: 'grid',
                placeItems: 'center',
            }}
        >
            {(
                <MeetingRoomIcon sx={{ fontSize: 34, color: 'text.secondary' }} />
            )}
        </Box>

        <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography fontSize={18} fontWeight={700}>
                {amenity.name}
            </Typography>

            <Typography fontSize={14} color="text.secondary">
                {amenity.type ? `${amenity.type} · ` : ''}Capacity {amenity.capacity}
            </Typography>

            <Typography fontSize={14} color="text.secondary" mt={0.25}>
                {fmtTime(amenity.startMinutes)} – {fmtTime(amenity.endMinutes)} ·{' '}
                {amenity.slotMinutes} min slots
            </Typography>
        </Box>
    </Paper>
)

/* ------------------------------------------------------------------ */
/* Calendar                                                            */
/* ------------------------------------------------------------------ */

const Calendar = ({ amenity, value, onChange }) => {
    const today = useMemo(() => {
        const d = new Date()

        d.setHours(0, 0, 0, 0)

        return d
    }, [])

    const [view, setView] = useState(
        () => new Date(today.getFullYear(), today.getMonth(), 1)
    )

    const cells = useMemo(() => {
        const first = new Date(view.getFullYear(), view.getMonth(), 1)
        const daysInMonth = new Date(
            view.getFullYear(),
            view.getMonth() + 1,
            0
        ).getDate()

        const list = Array(first.getDay()).fill(null)

        for (let d = 1; d <= daysInMonth; d++) {
            list.push(new Date(view.getFullYear(), view.getMonth(), d))
        }

        return list
    }, [view])

    const monthLabel = view.toLocaleString('en-US', {
        month: 'long',
        year: 'numeric',
    })

    const shift = (n) =>
        setView(new Date(view.getFullYear(), view.getMonth() + n, 1))

    const isCurrentMonth =
        view.getFullYear() === today.getFullYear() &&
        view.getMonth() === today.getMonth()

    return (
        <Box>
            <Paper variant="outlined" sx={{ ...surfaceSx, p: 2.5 }}>
                <Stack
                    direction="row"
                    alignItems="center"
                    justifyContent="space-between"
                    mb={2}
                >
                    <IconButton
                        onClick={() => shift(-1)}
                        disabled={isCurrentMonth}
                        aria-label="Previous month"
                        sx={{ border: '1px solid', borderColor: 'divider' }}
                    >
                        <ChevronLeftIcon />
                    </IconButton>

                    <Typography fontWeight={600} fontSize={17}>
                        {monthLabel}
                    </Typography>

                    <IconButton
                        onClick={() => shift(1)}
                        aria-label="Next month"
                        sx={{ border: '1px solid', borderColor: 'divider' }}
                    >
                        <ChevronRightIcon />
                    </IconButton>
                </Stack>

                <Box
                    sx={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
                        gap: { xs: 0.5, sm: 0.75 },
                    }}
                >
                    {WEEKDAYS.map((day) => (
                        <Typography
                            key={day}
                            align="center"
                            fontSize={13}
                            fontWeight={600}
                            color="text.secondary"
                            pb={0.75}
                        >
                            {day}
                        </Typography>
                    ))}

                    {cells.map((date, i) => {
                        if (!date) {
                            return <Box key={`blank-${i}`} />
                        }

                        const disabled =
                            date < today ||
                            !amenity?.availableDays?.includes(date.getDay())

                        const selected = value && sameDay(date, value)
                        const isToday = sameDay(date, today)

                        return (
                            <Box
                                key={date.toISOString()}
                                component="button"
                                type="button"
                                disabled={disabled}
                                aria-pressed={Boolean(selected)}
                                aria-label={date.toDateString()}
                                onClick={() => onChange(date)}
                                sx={{
                                    aspectRatio: '1',
                                    minWidth: 0,
                                    minHeight: { xs: 40, sm: 48 },
                                    p: 0,
                                    borderRadius: 1.5,
                                    border: '1px solid',
                                    borderColor: selected
                                        ? 'primary.main'
                                        : isToday
                                            ? 'primary.light'
                                            : 'transparent',
                                    bgcolor: selected
                                        ? 'primary.main'
                                        : isToday
                                            ? 'action.selected'
                                            : 'transparent',
                                    color: selected
                                        ? 'primary.contrastText'
                                        : disabled
                                            ? 'text.disabled'
                                            : 'text.primary',
                                    fontFamily: 'inherit',
                                    fontSize: 15,
                                    fontWeight: selected || isToday ? 700 : 500,
                                    cursor: disabled ? 'not-allowed' : 'pointer',
                                    transition: 'background-color 150ms ease',
                                    '&:hover:not(:disabled)': {
                                        bgcolor: selected ? 'primary.dark' : 'action.hover',
                                    },
                                    '&:focus-visible': {
                                        outline: '2px solid',
                                        outlineColor: 'primary.main',
                                        outlineOffset: 1,
                                    },
                                }}
                            >
                                {date.getDate()}
                            </Box>
                        )
                    })}
                </Box>
            </Paper>

            <Stack direction="row" flexWrap="wrap" gap={1} mt={1.5}>
                <Chip
                    size="small"
                    variant="outlined"
                    label="Available days"
                    sx={{ fontSize: 13 }}
                />

                <Typography fontSize={14} color="text.secondary" alignContent="center">
                    {[...(amenity?.availableDays || [])]
                        .sort((a, b) => a - b)
                        .map((d) => WEEKDAYS[d])
                        .join(', ')}
                </Typography>
            </Stack>
        </Box>
    )
}

/* ------------------------------------------------------------------ */
/* Slot legend                                                         */
/* ------------------------------------------------------------------ */

const Legend = () => (
    <Stack direction="row" flexWrap="wrap" gap={2} mb={2}>
        {[
            { label: 'Available', color: 'success.main' },
            { label: 'Your booking', color: 'warning.main' },
            { label: 'Fully booked', color: 'error.main' },
            { label: 'Selected', color: 'primary.main' },
            { label: 'Time passed', color: 'grey.400' },
        ].map(({ label, color }) => (
            <Stack key={label} direction="row" spacing={0.75} alignItems="center">
                <Box
                    sx={{
                        width: 10,
                        height: 10,
                        borderRadius: '50%',
                        bgcolor: color,
                        flexShrink: 0,
                    }}
                />

                <Typography fontSize={13} color="text.secondary">
                    {label}
                </Typography>
            </Stack>
        ))}
    </Stack>
)

/* ------------------------------------------------------------------ */
/* Slot card                                                           */
/* ------------------------------------------------------------------ */

const SLOT_STYLES = {
    selected: { bg: 'primary.main', label: 'Selected' },
    yours: { bg: 'warning.main', label: 'Already booked' },
    full: { bg: 'error.main', label: 'Fully booked' },
    past: { bg: 'grey.500', label: 'Time passed' },
    available: { bg: 'success.main', label: 'Available' },
}

const SlotCard = ({ slot, selected, onToggle }) => {
    const status = selected
        ? 'selected'
        : slot.past
            ? 'past'
            : slot.yours
                ? 'yours'
                : slot.remaining === 0
                    ? 'full'
                    : 'available'

    const current = SLOT_STYLES[status]
    const disabled = status === 'full' || status === 'yours' || status === 'past'

    return (
        <Paper
            component="button"
            type="button"
            variant="outlined"
            disabled={disabled}
            onClick={() => onToggle(slot)}
            aria-pressed={selected}
            sx={{
                width: '100%',
                minWidth: 0,
                textAlign: 'left',
                p: 2,
                borderRadius: 2,
                borderColor: selected ? 'primary.main' : 'divider',
                bgcolor: selected ? 'action.selected' : 'background.paper',
                cursor: disabled ? 'not-allowed' : 'pointer',
                opacity: disabled ? 0.7 : 1,
                fontFamily: 'inherit',
                transition: 'border-color 150ms ease, background-color 150ms ease',
                '&:hover:not(:disabled)': {
                    borderColor: 'primary.main',
                    bgcolor: 'action.hover',
                },
                '&:focus-visible': {
                    outline: '2px solid',
                    outlineColor: 'primary.main',
                    outlineOffset: 1,
                },
            }}
        >
            <Typography
                fontSize={15}
                fontWeight={600}
                color="text.primary"
                mb={1}
                noWrap
            >
                {fmtTime(slot.start)} – {fmtTime(slot.end)}
            </Typography>

            <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                gap={0.5}
            >
                <Typography fontSize={13} fontWeight={600} color="text.secondary">
                    {slot.remaining}/{slot.total} {slot.total === 1 ? 'spot' : 'spots'}
                </Typography>

                <Box
                    sx={{
                        px: 1,
                        py: 0.25,
                        borderRadius: 1,
                        bgcolor: current.bg,
                        color: 'common.white',
                        fontSize: 12,
                        fontWeight: 600,
                        whiteSpace: 'nowrap',
                    }}
                >
                    {current.label}
                </Box>
            </Stack>
        </Paper>
    )
}

/* ------------------------------------------------------------------ */
/* Time slots                                                          */
/* ------------------------------------------------------------------ */

const TimeSlots = ({ date, slots, selectedIds, onToggle }) => {
    const groups = useMemo(() => {
        const result = {
            Morning: [],
            Afternoon: [],
            Evening: [],
        }

        slots.forEach((slot) => result[groupOf(slot.start)].push(slot))

        return result
    }, [slots])

    return (
        <Box sx={{ minWidth: 0 }}>
            <Stack
                direction={{ xs: 'column', sm: 'row' }}
                alignItems={{ xs: 'flex-start', sm: 'center' }}
                justifyContent="space-between"
                gap={1}
                mb={1.5}
            >
                <Box>
                    <Typography fontWeight={700} fontSize={18}>
                        Select time slots
                    </Typography>

                    <Typography fontSize={14} color="text.secondary" mt={0.25}>
                        {date
                            ? date.toLocaleDateString('en-US', {
                                weekday: 'short',
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                            })
                            : 'Choose a date to view available times'}
                    </Typography>
                </Box>

                {date && (
                    <Chip
                        variant="outlined"
                        label={`${selectedIds.length} selected`}
                        color={selectedIds.length ? 'primary' : 'default'}
                        sx={{ fontSize: 13 }}
                    />
                )}
            </Stack>

            {!date ? (
                <Paper
                    variant="outlined"
                    sx={{
                        ...surfaceSx,
                        minHeight: 300,
                        p: 3,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        textAlign: 'center',
                        bgcolor: 'grey.50',
                    }}
                >
                    <MeetingRoomIcon
                        sx={{ fontSize: 44, color: 'text.disabled', mb: 1 }}
                    />

                    <Typography fontWeight={600} fontSize={16}>
                        No date selected
                    </Typography>

                    <Typography fontSize={14} color="text.secondary" mt={0.5}>
                        Select a date from the calendar to see available time slots.
                    </Typography>
                </Paper>
            ) : slots.length === 0 ? (
                <Alert severity="info">No time slots are available on this date.</Alert>
            ) : (
                <>
                    <Legend />

                    <Box
                        sx={{
                            maxHeight: 560,
                            overflowY: 'auto',
                            pr: { xs: 0, sm: 1 },
                            '&::-webkit-scrollbar': { width: 6 },
                            '&::-webkit-scrollbar-thumb': {
                                bgcolor: 'grey.300',
                                borderRadius: 5,
                            },
                        }}
                    >
                        {Object.entries(groups).map(([name, list]) =>
                            list.length > 0 ? (
                                <Box key={name} mb={2.5}>
                                    <Stack
                                        direction="row"
                                        alignItems="center"
                                        spacing={1}
                                        mb={1}
                                    >
                                        <Typography fontSize={14} fontWeight={700}>
                                            {name}
                                        </Typography>

                                        <Box sx={{ flex: 1, height: '1px', bgcolor: 'divider' }} />

                                        <Typography fontSize={13} color="text.secondary">
                                            {list.length} slots
                                        </Typography>
                                    </Stack>

                                    <Box
                                        sx={{
                                            display: 'grid',
                                            gridTemplateColumns: {
                                                xs: '1fr',
                                                sm: 'repeat(2, minmax(0, 1fr))',
                                                lg: 'repeat(3, minmax(0, 1fr))',
                                            },
                                            gap: 1.25,
                                        }}
                                    >
                                        {list.map((slot) => (
                                            <SlotCard
                                                key={slot.id}
                                                slot={slot}
                                                selected={selectedIds.includes(slot.id)}
                                                onToggle={onToggle}
                                            />
                                        ))}
                                    </Box>
                                </Box>
                            ) : null
                        )}
                    </Box>
                </>
            )}
        </Box>
    )
}

/* ------------------------------------------------------------------ */
/* Loading skeleton                                                    */
/* ------------------------------------------------------------------ */

const BookPageSkeleton = () => (
    <Box
        aria-busy="true"
        aria-label="Loading amenity"
        sx={{
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 3,
            p: { xs: 2, sm: 3, md: 4 },
            bgcolor: 'background.paper',
            width: '100%',
            boxSizing: 'border-box',
        }}
    >
        {/* Header */}
        <Stack direction="row" alignItems="center" spacing={2} mb={3}>
            <Skeleton variant="rounded" width={46} height={46} />

            <Box sx={{ flex: 1 }}>
                <Skeleton variant="text" width={260} height={44} />
                <Skeleton variant="text" width={320} height={22} />
            </Box>
        </Stack>

        <Paper
            elevation={0}
            sx={{
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 3,
                p: { xs: 2, sm: 3, md: 3.5 },
                bgcolor: 'background.paper',
            }}
        >
            {/* Amenity banner */}
            <Paper
                variant="outlined"
                sx={{ ...surfaceSx, p: 2.5, mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}
            >
                <Skeleton variant="rounded" width={68} height={68} sx={{ flexShrink: 0 }} />

                <Box sx={{ flex: 1 }}>
                    <Skeleton variant="text" width="40%" height={28} />
                    <Skeleton variant="text" width="30%" height={20} />
                    <Skeleton variant="text" width="50%" height={20} />
                </Box>
            </Paper>

            <Box
                sx={{
                    display: 'grid',
                    gridTemplateColumns: {
                        xs: '1fr',
                        md: 'minmax(340px, 420px) minmax(0, 1fr)',
                    },
                    gap: { xs: 4, md: 5 },
                    alignItems: 'start',
                }}
            >
                {/* Left: mode switch + calendar */}
                <Box sx={{ minWidth: 0 }}>
                    <Skeleton variant="text" width={160} height={30} sx={{ mb: 1 }} />
                    <Skeleton variant="rounded" height={48} sx={{ mb: 3 }} />
                    <Skeleton variant="text" width={110} height={28} sx={{ mb: 1.5 }} />

                    <Paper variant="outlined" sx={{ ...surfaceSx, p: 2.5 }}>
                        <Stack
                            direction="row"
                            alignItems="center"
                            justifyContent="space-between"
                            mb={2}
                        >
                            <Skeleton variant="rounded" width={40} height={40} />
                            <Skeleton variant="text" width={140} height={28} />
                            <Skeleton variant="rounded" width={40} height={40} />
                        </Stack>

                        <Box
                            sx={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
                                gap: { xs: 0.5, sm: 0.75 },
                            }}
                        >
                            {Array.from({ length: 7 }).map((_, i) => (
                                <Skeleton key={`wd-${i}`} variant="text" height={22} />
                            ))}

                            {Array.from({ length: 35 }).map((_, i) => (
                                <Skeleton
                                    key={`day-${i}`}
                                    variant="rounded"
                                    sx={{ aspectRatio: '1', height: 'auto', minHeight: { xs: 40, sm: 48 } }}
                                />
                            ))}
                        </Box>
                    </Paper>
                </Box>

                {/* Right: time slots */}
                <Box sx={{ minWidth: 0 }}>
                    <Skeleton variant="text" width={180} height={30} />
                    <Skeleton variant="text" width={140} height={22} sx={{ mb: 2 }} />

                    <Stack direction="row" gap={2} mb={2}>
                        {Array.from({ length: 4 }).map((_, i) => (
                            <Skeleton key={`lg-${i}`} variant="text" width={80} height={20} />
                        ))}
                    </Stack>

                    <Box
                        sx={{
                            display: 'grid',
                            gridTemplateColumns: {
                                xs: '1fr',
                                sm: 'repeat(2, minmax(0, 1fr))',
                                lg: 'repeat(3, minmax(0, 1fr))',
                            },
                            gap: 1.25,
                        }}
                    >
                        {Array.from({ length: 9 }).map((_, i) => (
                            <Skeleton key={`slot-${i}`} variant="rounded" height={78} />
                        ))}
                    </Box>
                </Box>
            </Box>

            {/* Footer */}
            <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                sx={{ mt: 3, pt: 2.5, borderTop: '1px solid', borderColor: 'divider' }}
            >
                <Skeleton variant="text" width={220} height={22} />

                <Stack direction="row" spacing={1.5}>
                    <Skeleton variant="rounded" width={120} height={42} />
                    <Skeleton variant="rounded" width={180} height={42} />
                </Stack>
            </Stack>
        </Paper>
    </Box>
)

/* ------------------------------------------------------------------ */
/* Booking page                                                        */
/* ------------------------------------------------------------------ */

const BookPage = () => {
    const router = useRouter()
    const { lang, id } = useParams()

    const { doGet, token, doPost } = useApi()

    const [mode, setMode] = useState('you')
    const [tenant, setTenant] = useState('')
    const [amenity, setAmenity] = useState(null)
    const [date, setDate] = useState(null)
    const [selectedIds, setSelectedIds] = useState([])
    const [remarks, setRemarks] = useState('')

    const [loading, setLoading] = useState(true)
    const [loadError, setLoadError] = useState('')

    const goBack = () => router.replace(`/${lang}/apps/amenity/list`)

    const fetchAmenityData = useCallback(async () => {
        if (!token || !id) {
            setLoading(false)

            return
        }

        setLoading(true)
        setLoadError('')

        try {
            const response = await doGet(`company/amenity/edit/data/${id}`)

            const result = response?.data ?? response
            const payload = result?.data ?? result

            const normalized = normalizeAmenity(payload)

            if (!normalized?.id) {
                throw new Error('Amenity not found.')
            }

            setAmenity(normalized)
        } catch (error) {
            console.error('Failed to fetch amenity:', error)

            setLoadError(error?.message || 'Failed to load amenity. Please try again.')
        } finally {
            setLoading(false)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token, id])

    useEffect(() => {
        fetchAmenityData()
    }, [fetchAmenityData])

    const slots = useMemo(
        () => (amenity && date ? fetchSlots(amenity, date) : []),
        [amenity, date]
    )

    const clearSelection = () => {
        setDate(null)
        setSelectedIds([])
        setRemarks('')
    }

    const handleModeChange = (nextMode) => {
        setMode(nextMode)
        setTenant('')
        clearSelection()
    }

    const handleDateChange = (nextDate) => {
        setDate(nextDate)
        setSelectedIds([])
    }

    const toggleSlot = (slot) => {
        setSelectedIds((previous) =>
            previous.includes(slot.id)
                ? previous.filter((slotId) => slotId !== slot.id)
                : [...previous, slot.id]
        )
    }

    const canConfirm =
        Boolean(amenity) &&
        Boolean(date) &&
        selectedIds.length > 0 &&
        (mode === 'you' || Boolean(tenant))

    const handleConfirm = () => {
        if (!canConfirm) return

        const selectedSlots = slots
            .filter((slot) => selectedIds.includes(slot.id))
            .sort((a, b) => a.start - b.start)
            .map((slot) => ({
                start_time: toHHmm(slot.start),
                end_time: toHHmm(slot.end),
            }))

        const payload = {
            booked_for: mode === 'you' ? 'self' : tenant,
            amenity_id: amenity.id,
            date: toDateKey(date),
            slots: selectedSlots,
            remarks,
        }

        // Replace with your booking API call.
        doPost("company/amenity/booking/data/store", payload);
        goBack();
    }

    if (loading) {
        return <BookPageSkeleton />
    }

    if (loadError || !amenity) {
        return (
            <Box sx={{ p: 3 }}>
                <Alert
                    severity="error"
                    action={
                        <Button color="inherit" size="small" onClick={fetchAmenityData}>
                            Retry
                        </Button>
                    }
                >
                    {loadError || 'Amenity not found.'}
                </Alert>
            </Box>
        )
    }

    return (
        <>
            <CssBaseline />

            <Box
                sx={{
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 3,
                    p: { xs: 2, sm: 3, md: 4 },
                    bgcolor: 'background.paper',
                    width: '100%',
                    boxSizing: 'border-box',
                }}
            >
                <Box sx={{ width: '100%', boxSizing: 'border-box' }}>
                    {/* Page header */}
                    <Stack direction="row" alignItems="center" spacing={2} mb={3}>
                        <IconButton
                            onClick={goBack}
                            aria-label="Go back"
                            sx={{
                                bgcolor: 'background.paper',
                                border: '1px solid',
                                borderColor: 'divider',
                                borderRadius: 2,
                                width: 46,
                                height: 46,
                                '&:hover': { bgcolor: 'grey.100' },
                            }}
                        >
                            <ArrowBackIosNewIcon sx={{ fontSize: 18 }} />
                        </IconButton>

                        <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography
                                variant="h5"
                                fontWeight={700}
                                fontSize={{ xs: 26, sm: 32 }}
                                letterSpacing="-0.5px"
                            >
                                Book an Amenity
                            </Typography>

                            <Typography fontSize={15} color="text.secondary" mt={0.5}>
                                Choose a date and time for your booking.
                            </Typography>
                        </Box>
                    </Stack>

                    {!amenity.active && (
                        <Alert severity="warning" sx={{ mb: 2 }}>
                            This amenity is currently inactive and cannot be booked.
                        </Alert>
                    )}

                    {/* Booking content */}
                    <Paper
                        elevation={0}
                        sx={{
                            border: '1px solid',
                            borderColor: 'divider',
                            borderRadius: 3,
                            p: { xs: 2, sm: 3, md: 3.5 },
                            bgcolor: 'background.paper',
                        }}
                    >
                        <SelectedAmenityBanner amenity={amenity} />

                        <Box
                            sx={{
                                display: 'grid',
                                gridTemplateColumns: {
                                    xs: '1fr',
                                    md: 'minmax(340px, 420px) minmax(0, 1fr)',
                                },
                                gap: { xs: 4, md: 5 },
                                alignItems: 'start',
                            }}
                        >
                            <Box sx={{ minWidth: 0 }}>
                                <Typography fontWeight={700} fontSize={18} mb={1.5}>
                                    Booking details
                                </Typography>

                                <ModeSwitch mode={mode} onChange={handleModeChange} />

                                {mode === 'tenant' && (
                                    <Box mt={2}>
                                        <Typography fontSize={15} fontWeight={600} mb={1}>
                                            Select tenant
                                            <Box component="span" color="error.main"> *</Box>
                                        </Typography>

                                        <FormControl fullWidth>
                                            <Select
                                                displayEmpty
                                                value={tenant}
                                                onChange={(event) => setTenant(event.target.value)}
                                                sx={{ borderRadius: 2, fontSize: 15 }}
                                                renderValue={(value) =>
                                                    value
                                                        ? TENANTS.find((item) => item.id === value)?.name
                                                        : 'Choose a tenant'
                                                }
                                            >
                                                {TENANTS.map((item) => (
                                                    <MenuItem key={item.id} value={item.id} sx={{ fontSize: 15 }}>
                                                        {item.name}
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>

                                        {amenity.tenantQuota !== null && (
                                            <Typography fontSize={13} color="text.secondary" mt={1}>
                                                Monthly quota per tenant: {amenity.tenantQuota} slots
                                            </Typography>
                                        )}
                                    </Box>
                                )}

                                <Typography fontSize={16} fontWeight={700} mt={3} mb={1.5}>
                                    Select date
                                    <Box component="span" color="error.main"> *</Box>
                                </Typography>

                                <Calendar
                                    amenity={amenity}
                                    value={date}
                                    onChange={handleDateChange}
                                />
                            </Box>

                            <Box sx={{ minWidth: 0, pt: { xs: 0, md: 0.25 } }}>
                                <TimeSlots
                                    date={date}
                                    slots={slots}
                                    selectedIds={selectedIds}
                                    onToggle={toggleSlot}
                                />
                            </Box>
                        </Box>

                        {/* Remarks */}
                        {date && (
                            <Box
                                sx={{
                                    mt: 3,
                                    pt: 3,
                                    borderTop: '1px solid',
                                    borderColor: 'divider',
                                }}
                            >
                                <Typography fontWeight={700} fontSize={17} mb={0.5}>
                                    Additional information
                                </Typography>

                                <Typography fontSize={14} color="text.secondary" mb={1.5}>
                                    Add any special requests or instructions (optional).
                                </Typography>

                                <TextField
                                    fullWidth
                                    multiline
                                    minRows={3}
                                    placeholder="Enter your remarks..."
                                    value={remarks}
                                    onChange={(event) => setRemarks(event.target.value)}
                                    slotProps={{
                                        input: {
                                            sx: {
                                                fontSize: 15,
                                                borderRadius: 2,
                                                alignItems: 'flex-start',
                                            },
                                        },
                                    }}
                                />
                            </Box>
                        )}

                        {/* Footer actions */}
                        <Stack
                            direction={{ xs: 'column-reverse', sm: 'row' }}
                            alignItems={{ xs: 'stretch', sm: 'center' }}
                            justifyContent="space-between"
                            gap={2}
                            sx={{
                                mt: 3,
                                pt: 2.5,
                                borderTop: '1px solid',
                                borderColor: 'divider',
                            }}
                        >
                            <Typography fontSize={14} color="text.secondary">
                                {selectedIds.length > 0
                                    ? `${selectedIds.length} time slot${selectedIds.length > 1 ? 's' : ''} selected`
                                    : 'Select at least one time slot to continue.'}
                            </Typography>

                            <Stack direction="row" spacing={1.5}>
                                <Button
                                    variant="outlined"
                                    color="inherit"
                                    size="large"
                                    onClick={goBack}
                                    sx={{
                                        minWidth: 120,
                                        fontSize: 15,
                                        borderColor: 'divider',
                                        color: 'text.primary',
                                        textTransform: 'none',
                                        borderRadius: 2,
                                    }}
                                >
                                    Cancel
                                </Button>

                                <Button
                                    variant="contained"
                                    size="large"
                                    disableElevation
                                    disabled={!canConfirm || !amenity.active}
                                    onClick={handleConfirm}
                                    sx={{
                                        minWidth: 180,
                                        fontSize: 15,
                                        borderRadius: 2,
                                        textTransform: 'none',
                                        fontWeight: 600,
                                    }}
                                >
                                    Confirm booking
                                </Button>
                            </Stack>
                        </Stack>
                    </Paper>

                    <Typography
                        fontSize={13}
                        color="text.secondary"
                        textAlign="center"
                        mt={2}
                    >
                        Please check your selected date and time before confirming.
                    </Typography>
                </Box>
            </Box>
        </>
    )
}

export default BookPage
