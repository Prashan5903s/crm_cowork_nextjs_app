'use client'

import { useState, useEffect, useMemo } from 'react'

import {
  Card,
  MenuItem,
  Box,
  TextField,
  Button,
  Dialog,
  Checkbox,
  CardContent,
  Typography,
  DialogContent,
  DialogTitle,
  DialogActions
} from '@mui/material'

import Grid from '@mui/material/Grid2'

import { QRCodeCanvas } from 'qrcode.react'

import utc from 'dayjs/plugin/utc'
import customParseFormat from 'dayjs/plugin/customParseFormat'

import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'

import { LocalizationProvider, TimePicker } from '@mui/x-date-pickers'

import { valibotResolver } from '@hookform/resolvers/valibot'

import { object, string, maxLength, minLength, regex, pipe, optional } from 'valibot'

import {
  createColumnHelper,
  flexRender,
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel
} from '@tanstack/react-table'

import { useForm, Controller } from 'react-hook-form'

import { useSession } from 'next-auth/react'

import { toast } from 'react-toastify'

import dayjs from 'dayjs'

import CustomAvatar from '@core/components/mui/Avatar'

import tableStyles from '@core/styles/table.module.css'

import TablePaginationComponent from '@components/TablePaginationComponent'

import { usePermissionList } from '@/utils/getPermission'

import { getInitials } from '@/utils/getInitials'

import CustomTextField from '@/@core/components/mui/TextField'

import DialogCloseButton from '@/components/dialogs/DialogCloseButton'

import FormatTime from '@/utils/formatTime'

dayjs.extend(utc)
dayjs.extend(customParseFormat)

const TIME_FORMAT = 'hh:mm A'
const DATE_TIME_FORMAT = `YYYY-MM-DD ${TIME_FORMAT}`

const ID_PROOF_TYPES = ['Aadhaar', 'PAN', 'Driving License', 'Voter ID', 'Passport', 'Other']

const STATUS_LABELS = {
  '1': 'Invited',
  '2': 'Rejected',
  '3': 'Expired',
  '4': 'Accepted',
  '5': 'Rejected'
}

// Debounced Input
const DebouncedInput = ({ value: initialValue, onChange, debounce = 500, ...props }) => {
  const [value, setValue] = useState(initialValue)

  useEffect(() => {
    setValue(initialValue)
  }, [initialValue])

  useEffect(() => {
    const timeout = setTimeout(() => {
      onChange(value)
    }, debounce)

    return () => clearTimeout(timeout)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  return <CustomTextField {...props} value={value} onChange={e => setValue(e.target.value)} />
}

const columnHelper = createColumnHelper()

// ---------------- Validation schema (Visitor Registration) ----------------
const schema = object({
  visitor_name: pipe(string(), minLength(1, 'Visitor name is required')),
  visitor_contact: pipe(
    string(),
    minLength(7, 'Mobile number must be valid'),
    maxLength(15, 'Mobile number can be a maximum of 15 digits'),
    regex(/^[0-9]+$/, 'Mobile number must contain only digits (0–9)')
  ),
  email: pipe(string(), regex(/^$|^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Enter a valid email address')),
  company: optional(string()),
  purpose: pipe(string(), minLength(1, 'Purpose is required')),
  host_member: pipe(string(), minLength(1, 'Host / member is required')),
  checkin_date: pipe(string(), minLength(1, 'Visit date is required')),
  checkin_from_time: pipe(string(), minLength(1, 'From time is required')),
  checkin_to_time: pipe(string(), minLength(1, 'To time is required')),
  id_proof_type: optional(string()),
  vehicle_number: optional(string())
})

const emptyForm = {
  visitor_name: '',
  visitor_contact: '',
  email: '',
  company: '',
  purpose: '',
  host_member: '',
  checkin_date: '',
  checkin_from_time: '',
  checkin_to_time: '',
  id_proof_type: '',
  vehicle_number: ''
}

const memberName = m => `${m?.first_name || ''} ${m?.last_name || ''}`.trim() || m?.name || m?.full_name || m?.full_Name || m?.title || 'N/A'

// ---------------- Add / Edit modal ----------------
const VisitorModal = ({ open, setIsOpen, fetchVisitors, datass, setVisitorData, createData }) => {
  const { data: session } = useSession()
  const token = session?.user?.token
  const API_URL = process.env.NEXT_PUBLIC_API_URL

  // ID proof file is kept outside react-hook-form (file input)
  const [idProofFile, setIdProofFile] = useState(null)

  const members = createData?.contact || []

  const {
    control,
    handleSubmit,
    watch,
    reset,
    formState: { errors }
  } = useForm({
    resolver: valibotResolver(schema),
    defaultValues: emptyForm
  })

  const onClose = () => {
    setVisitorData(null)
    setIsOpen(false)
    setIdProofFile(null)
    reset(emptyForm)
  }

  useEffect(() => {
    if (!open) return

    setIdProofFile(null)

    if (datass) {
      reset({
        visitor_name: datass.visitor_name || '',
        visitor_contact: datass.visitor_contact_no ? String(datass.visitor_contact_no) : '',
        email: datass.email || '',
        company: datass.company || '',
        purpose: datass.purpose || '',
        host_member: datass.host_member?._id ? String(datass.host_member._id) : datass.host_member || '',
        checkin_date: datass.check_in_date || '',
        checkin_from_time: datass.check_in_from_time || '',
        checkin_to_time: datass.check_in_to_time || '',
        id_proof_type: datass.id_proof_type || '',
        vehicle_number: datass.vehicle_no || ''
      })
    } else {
      reset(emptyForm)
    }
  }, [datass, reset, open])

  const checkinDate = watch('checkin_date')
  const fromTime = watch('checkin_from_time')
  const toTime = watch('checkin_to_time')

  const now = dayjs()
  const isToday = !!checkinDate && dayjs(checkinDate).isSame(now, 'day')

  // Runs on submit — times stored as "hh:mm A"
  const validateTimes = data => {
    const now = dayjs()
    const selectedDate = dayjs(data.checkin_date)

    if (selectedDate.isBefore(now, 'day')) {
      toast.error('Visit date cannot be before today.')

      return false
    }

    const from = dayjs(`${data.checkin_date} ${data.checkin_from_time}`, DATE_TIME_FORMAT)
    const to = dayjs(`${data.checkin_date} ${data.checkin_to_time}`, DATE_TIME_FORMAT)

    if (selectedDate.isSame(now, 'day') && from.isBefore(now)) {
      toast.error('From time cannot be earlier than the current time.')

      return false
    }

    if (!to.isAfter(from)) {
      toast.error('End time must be later than start time.')

      return false
    }

    return true
  }

  const onSubmit = async data => {
    if (!validateTimes(data)) return

    if (idProofFile && idProofFile.size > 5 * 1024 * 1024) {
      toast.error('ID proof must be smaller than 5 MB.')

      return
    }

    try {
      // multipart/form-data because of the ID proof upload
      const formData = new FormData()

      Object.entries(data).forEach(([key, value]) => formData.append(key, value ?? ''))
      if (idProofFile) formData.append('id_proof', idProofFile)

      const response = await fetch(
        datass ? `${API_URL}/company/visitor/update/${datass._id}` : `${API_URL}/company/visitor`,
        {
          method: datass ? 'PUT' : 'POST',

          // Do NOT set Content-Type — the browser adds the multipart boundary
          headers: { Authorization: `Bearer ${token}` },
          body: formData
        }
      )

      if (response.ok) {
        toast.success(`Visitor ${datass ? 'updated' : 'added'} successfully`, { autoClose: 1000 })
        fetchVisitors()
        onClose()
      } else {
        const errorData = await response.json().catch(() => ({}))

        toast.error(errorData?.message || `Failed to ${datass ? 'update' : 'add'} visitor`)
      }
    } catch (error) {
      console.error('Submit error:', error)
      toast.error('Something went wrong. Please try again.')
    }
  }

  return (
    <Dialog
      fullWidth
      maxWidth='lg'
      scroll='body'
      open={open}
      sx={{ '& .MuiDialog-paper': { overflow: 'visible' } }}
    >
      <DialogCloseButton onClick={onClose}>
        <i className='tabler-x' />
      </DialogCloseButton>
      <DialogTitle>{!datass ? 'Add New Visitor' : 'Edit Visitor'}</DialogTitle>

      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent>
          <Grid container spacing={3}>
            {/* Visitor Name */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Controller
                name='visitor_name'
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label='Visitor Name *'
                    fullWidth
                    error={!!errors.visitor_name}
                    helperText={errors.visitor_name?.message}
                  />
                )}
              />
            </Grid>

            {/* Mobile */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Controller
                name='visitor_contact'
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label='Mobile *'
                    fullWidth
                    error={!!errors.visitor_contact}
                    helperText={errors.visitor_contact?.message}
                    inputProps={{ inputMode: 'numeric', pattern: '[0-9]*', maxLength: 15 }}
                    onChange={e => field.onChange(e.target.value.replace(/\D/g, ''))}
                  />
                )}
              />
            </Grid>

            {/* Email */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Controller
                name='email'
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    type='email'
                    label='Email'
                    fullWidth
                    error={!!errors.email}
                    helperText={errors.email?.message}
                  />
                )}
              />
            </Grid>

            {/* Company */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Controller
                name='company'
                control={control}
                render={({ field }) => <TextField {...field} label='Company' fullWidth />}
              />
            </Grid>

            {/* Purpose */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Controller
                name='purpose'
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label='Purpose *'
                    fullWidth
                    error={!!errors.purpose}
                    helperText={errors.purpose?.message}
                  />
                )}
              />
            </Grid>

            {/* Host / Member */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Controller
                name='host_member'
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    select
                    fullWidth
                    label='Host / Member *'
                    error={!!errors.host_member}
                    helperText={errors.host_member?.message}
                  >
                    {members.length === 0 && (
                      <MenuItem value='' disabled>
                        No members available
                      </MenuItem>
                    )}
                    {members.map(item => (
                      <MenuItem key={item._id} value={String(item._id)}>
                        {memberName(item)}
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              />
            </Grid>

            {/* Visit date / time */}
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <Grid size={{ xs: 12, md: 4 }}>
                <Controller
                  name='checkin_date'
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      type='date'
                      label='Visit Date *'
                      fullWidth
                      InputLabelProps={{ shrink: true }}
                      error={!!errors.checkin_date}
                      helperText={errors.checkin_date?.message}
                      inputProps={{ min: dayjs().format('YYYY-MM-DD') }}
                    />
                  )}
                />
              </Grid>

              <Grid size={{ xs: 12, md: 4 }}>
                <Controller
                  name='checkin_from_time'
                  control={control}
                  render={({ field }) => (
                    <TimePicker
                      label='From *'
                      ampm
                      value={field.value ? dayjs(field.value, TIME_FORMAT) : null}
                      onChange={v => field.onChange(v && v.isValid() ? v.format(TIME_FORMAT) : '')}
                      minTime={isToday ? now : undefined}
                      maxTime={toTime ? dayjs(toTime, TIME_FORMAT) : undefined}
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          error: !!errors.checkin_from_time,
                          helperText: errors.checkin_from_time?.message
                        }
                      }}
                    />
                  )}
                />
              </Grid>

              <Grid size={{ xs: 12, md: 4 }}>
                <Controller
                  name='checkin_to_time'
                  control={control}
                  render={({ field }) => (
                    <TimePicker
                      label='To *'
                      ampm
                      value={field.value ? dayjs(field.value, TIME_FORMAT) : null}
                      onChange={v => field.onChange(v && v.isValid() ? v.format(TIME_FORMAT) : '')}
                      minTime={fromTime ? dayjs(fromTime, TIME_FORMAT) : isToday ? now : undefined}
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          error: !!errors.checkin_to_time,
                          helperText: errors.checkin_to_time?.message
                        }
                      }}
                    />
                  )}
                />
              </Grid>
            </LocalizationProvider>

            {/* ID proof type */}
            <Grid size={{ xs: 12, md: 4 }}>
              <Controller
                name='id_proof_type'
                control={control}
                render={({ field }) => (
                  <TextField {...field} select fullWidth label='ID Proof Type'>
                    <MenuItem value=''>None</MenuItem>
                    {ID_PROOF_TYPES.map(t => (
                      <MenuItem key={t} value={t}>
                        {t}
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              />
            </Grid>

            {/* ID proof file */}
            <Grid size={{ xs: 12, md: 4 }}>
              <Button variant='outlined' component='label' fullWidth sx={{ height: 56 }}>
                {idProofFile ? idProofFile.name : datass?.id_proof ? 'Replace ID Proof' : 'Upload ID Proof'}
                <input
                  hidden
                  type='file'
                  accept='image/*,.pdf'
                  onChange={e => setIdProofFile(e.target.files?.[0] || null)}
                />
              </Button>
              {datass?.id_proof && !idProofFile && (
                <Typography variant='caption' color='text.secondary'>
                  Current: {datass.id_proof}
                </Typography>
              )}
            </Grid>

            {/* Vehicle Number */}
            <Grid size={{ xs: 12, md: 4 }}>
              <Controller
                name='vehicle_number'
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label='Vehicle Number'
                    fullWidth
                    onChange={e => field.onChange(e.target.value.toUpperCase())}
                  />
                )}
              />
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions sx={{ justifyContent: 'center', gap: 2 }}>
          <Button variant='contained' type='submit'>
            Submit
          </Button>
          <Button variant='outlined' color='error' onClick={onClose}>
            Cancel
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}

// ---------------- QR / OTP modal ----------------
const OTPCodeModal = ({ open, setOpenDialog, code, data }) => {
  const onClose = () => setOpenDialog(false)

  return (
    <Dialog
      fullWidth
      maxWidth='xs'
      scroll='body'
      open={open}
      onClose={onClose}
      sx={{
        '& .MuiDialog-paper': {
          overflow: 'visible',
          borderRadius: 4,
          boxShadow: '0px 6px 20px rgba(0,0,0,0.15)'
        }
      }}
    >
      <DialogCloseButton onClick={onClose}>
        <i className='tabler-x' />
      </DialogCloseButton>

      <DialogTitle
        sx={{
          textAlign: 'center',
          fontWeight: 600,
          background: 'linear-gradient(90deg, #7e57c2, #26a69a)',
          color: 'white',
          py: 2,
          fontSize: '1.2rem',
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
          boxShadow: '0px 2px 6px rgba(0,0,0,0.2)'
        }}
      >
        Visitor
      </DialogTitle>

      <DialogContent sx={{ textAlign: 'center', mt: 2, px: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mb: 2, mt: 4 }}>
          <Typography variant='body2' color='text.secondary' sx={{ fontSize: '15px' }}>
            <strong>{data?.visitor_name}</strong>
            {data?.company ? <> from <strong>{data.company}</strong></> : null} is visiting{' '}
            <strong>{memberName(data?.host_member)}</strong>
            {data?.purpose ? <> for <strong>{data.purpose}</strong></> : null}
          </Typography>
        </Box>

        <Typography color='text.secondary' gutterBottom>
          Show this QR code or OTP to the guard at the gate
        </Typography>

        <Box sx={{ my: 3, display: 'flex', justifyContent: 'center' }}>
          <Box
            sx={{ p: 2, backgroundColor: '#fff', borderRadius: 2, boxShadow: '0px 3px 10px rgba(0,0,0,0.15)' }}
          >
            <QRCodeCanvas value={String(code)} size={120} bgColor='#ffffff' fgColor='#000000' level='H' includeMargin />
          </Box>
        </Box>

        <Typography variant='body2' fontWeight={600} sx={{ my: 1 }}>
          — OR —
        </Typography>

        <Box
          sx={{
            background: 'linear-gradient(135deg, #ff9800, #ff7043)',
            color: '#fff',
            fontWeight: 700,
            fontSize: '2rem',
            borderRadius: 2,
            display: 'inline-block',
            px: 4,
            py: 1,
            my: 2,
            letterSpacing: 2,
            boxShadow: '0px 4px 12px rgba(0,0,0,0.2)'
          }}
        >
          {code}
        </Box>

        <Typography variant='body2' sx={{ fontStyle: 'italic', mt: 4, mb: 4, fontWeight: 500 }} color='text.primary'>
          <strong>{data?.check_in_date}</strong>, <strong>{data?.check_in_from_time}</strong> to{' '}
          <strong>{data?.check_in_to_time}</strong>
        </Typography>

        {data?.vehicle_no && (
          <Typography variant='body2' color='text.secondary' sx={{ mb: 1 }}>
            Vehicle: <strong>{data.vehicle_no}</strong>
          </Typography>
        )}

        <Typography variant='body2' color='text.secondary'>
          DW cowork, Deoria Road, near zoo, Gorakhpur, UP, 273004
        </Typography>

        <Box sx={{ my: 3 }}>
          <img
            src='/images/company_logo.png'
            alt='Logo'
            style={{
              width: 100,
              margin: '0 auto',
              display: 'block',
              filter: 'drop-shadow(0px 2px 4px rgba(0,0,0,0.2))'
            }}
          />
        </Box>
      </DialogContent>

      <DialogActions sx={{ justifyContent: 'center', pb: 2, mb: 8 }}>
        <Typography variant='body1' fontWeight={600} color='text.secondary'>
          <strong>DW cowork</strong>
        </Typography>
      </DialogActions>
    </Dialog>
  )
}

// ---------------- Visitor list ----------------
const VisitorTable = () => {
  const { data: session } = useSession()
  const token = session?.user?.token
  const API_URL = process.env.NEXT_PUBLIC_API_URL
  const public_url = process.env.NEXT_PUBLIC_ASSETS_URL

  const [rowSelection, setRowSelection] = useState({})
  const [data, setData] = useState([])
  const [openDialog, setOpenDialog] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [visitorData, setVisitorData] = useState(null)
  const [code, setCode] = useState('')
  const [createData, setCreateData] = useState(null)
  const [otpFilter, setOtpFilter] = useState('')
  const [searchText, setSearchText] = useState('')

  const [confirmDialog, setConfirmDialog] = useState(false)
  const [submitDialog, setSubmitDialog] = useState(false)
  const [selectedAction, setSelectedAction] = useState(null)
  const [selectedVisitorId, setSelectedVisitorId] = useState('')

  const getPermissions = usePermissionList()
  const [permissions, setPermissions] = useState({})

  const getAvatar = ({ avatar, fullName }) => {
    if (avatar) return <CustomAvatar src={`${public_url}/uploads/visitor/${avatar}`} size={34} />

    return <CustomAvatar size={34}>{getInitials(fullName || '')}</CustomAvatar>
  }

  useEffect(() => {
    const fetchPermissions = async () => {
      try {
        const result = await getPermissions()

        setPermissions(result)
      } catch (error) {
        console.error('Error fetching permissions:', error)
      }
    }

    if (getPermissions) fetchPermissions()
  }, [getPermissions])

  const fetchVisitors = async () => {
    try {
      const response = await fetch(`${API_URL}/company/visitor`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` }
      })

      const result = await response.json()

      if (response.ok) setData(result?.data || [])
    } catch (error) {
      console.error(error)
    }
  }

  const fetchCreateData = async () => {
    try {
      const response = await fetch(`${API_URL}/company/visitor/create/data`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` }
      })

      const result = await response.json()

      if (response.ok) setCreateData(result?.data || null)
    } catch (error) {
      console.error(error)
    }
  }

  useEffect(() => {
    if (API_URL && token) {
      fetchVisitors()
      fetchCreateData()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [API_URL, token])

  const handleFinalSubmit = async () => {
    try {
      const allow = selectedAction === 'accept'

      const response = await fetch(`${API_URL}/company/visitor/allow/gateIn/${allow}/${selectedVisitorId}`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
      })

      if (response.ok) {
        toast.success(`Visitor ${allow ? 'accepted' : 'rejected'} successfully`, { autoClose: 1000 })
        fetchVisitors()
      } else {
        toast.error('Action failed, please try again')
      }
    } catch (error) {
      console.error(error)
      toast.error('Something went wrong')
    } finally {
      setSubmitDialog(false)
      setSelectedAction(null)
      setSelectedVisitorId('')
    }
  }

  const filteredData = useMemo(() => {
    const q = searchText.trim().toLowerCase()

    return data.filter(row => {
      const otpMatch = otpFilter === '' || row?.otp?.toString().includes(otpFilter)

      const searchMatch =
        q === '' ||
        row?.visitor_name?.toLowerCase().includes(q) ||
        row?.visitor_contact_no?.toString().includes(q) ||
        row?.company?.toLowerCase().includes(q) ||
        row?.email?.toLowerCase().includes(q) ||
        row?.vehicle_no?.toLowerCase().includes(q)

      return otpMatch && searchMatch
    })
  }, [data, otpFilter, searchText])

  const columns = useMemo(
    () => [
      {
        id: 'select',
        header: ({ table }) => (
          <Checkbox
            checked={table.getIsAllRowsSelected()}
            indeterminate={table.getIsSomeRowsSelected()}
            onChange={table.getToggleAllRowsSelectedHandler()}
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            disabled={!row.getCanSelect()}
            onChange={row.getToggleSelectedHandler()}
          />
        )
      },
      columnHelper.display({
        id: 'visitor',
        header: 'Visitor',
        cell: ({ row }) => (
          <div className='flex items-center gap-4'>
            {getAvatar({ avatar: row.original.photo, fullName: row.original.visitor_name })}
            <div className='flex flex-col'>
              <Typography color='text.primary' className='font-medium'>
                {row.original.visitor_name ?? ''}
              </Typography>
              <Typography variant='body2'>{row.original.visitor_contact_no}</Typography>
              {row.original.email && <Typography variant='body2'>{row.original.email}</Typography>}
            </div>
          </div>
        )
      }),
      columnHelper.accessor('company', {
        header: 'Company',
        cell: info => <Typography>{info.getValue() || '-'}</Typography>
      }),
      columnHelper.accessor('purpose', {
        header: 'Purpose',
        cell: info => <Typography>{info.getValue() || '-'}</Typography>
      }),
      columnHelper.display({
        id: 'host_member',
        header: 'Host / Member',
        cell: ({ row }) => (
          <Typography>{row.original.host_member ? memberName(row.original.host_member) : '-'}</Typography>
        )
      }),
      columnHelper.accessor('check_in_date', {
        header: 'Visit date & time',
        cell: ({ row }) => (
          <Typography>
            {row.original.check_in_date || '-'} <br />
            {row.original.check_in_from_time} - {row.original.check_in_to_time}
          </Typography>
        )
      }),
      columnHelper.display({
        id: 'id_proof',
        header: 'ID Proof',
        cell: ({ row }) =>
          row.original.id_proof ? (
            <a
              href={`${public_url}/uploads/visitor/${row.original.id_proof}`}
              target='_blank'
              rel='noopener noreferrer'
            >
              {row.original.id_proof_type || 'View'}
            </a>
          ) : (
            <Typography>-</Typography>
          )
      }),
      columnHelper.accessor('vehicle_no', {
        header: 'Vehicle No.',
        cell: info => <Typography>{info.getValue() || '-'}</Typography>
      }),
      columnHelper.accessor('otp', {
        header: 'OTP',
        cell: ({ row }) => (
          <Typography>
            <i
              className='tabler-eye'
              style={{ cursor: 'pointer', transition: '0.2s' }}
              onClick={() => {
                setOpenDialog(true)
                setVisitorData(row.original)
                setCode(row.original.otp || '')
              }}
              onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.2)')}
              onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
            ></i>
          </Typography>
        )
      }),
      columnHelper.accessor('visitor_status', {
        header: 'Gate in allow',
        cell: ({ row }) =>
          row.original.visitor_status === '1' ? (
            <Button
              variant='outlined'
              onClick={() => {
                setSelectedVisitorId(row.original._id)
                setConfirmDialog(true)
              }}
            >
              Allow
            </Button>
          ) : (
            STATUS_LABELS[row.original.visitor_status] || '-'
          )
      }),
      columnHelper.accessor('created_at', {
        header: 'Created At',
        cell: ({ row }) => <Typography>{FormatTime(row.original.created_at) || '-'}</Typography>
      }),
      columnHelper.display({
        id: 'action',
        header: 'Action',
        cell: ({ row }) =>
          row.original.status ? null : (
            <i
              className='tabler-edit'
              style={{ cursor: 'pointer', transition: '0.2s' }}
              onClick={() => {
                setVisitorData(row.original)
                setIsOpen(true)
              }}
            ></i>
          )
      })
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [public_url]
  )

  const table = useReactTable({
    data: filteredData,
    columns,
    state: { rowSelection },
    initialState: { pagination: { pageSize: 10 } },
    enableRowSelection: true,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onRowSelectionChange: setRowSelection
  })

  return (
    <Card>
      <CardContent className='flex justify-between flex-col gap-4 sm:flex-row sm:items-center'>
        <div className='flex items-center gap-2'>
          <Typography>Show</Typography>
          <CustomTextField
            select
            value={table.getState().pagination.pageSize}
            onChange={e => table.setPageSize(Number(e.target.value))}
          >
            <MenuItem value={10}>10</MenuItem>
            <MenuItem value={25}>25</MenuItem>
            <MenuItem value={50}>50</MenuItem>
          </CustomTextField>
        </div>

        <div className='flex flex-wrap gap-2'>
          <DebouncedInput value={otpFilter} placeholder='OTP' onChange={v => setOtpFilter(String(v))} />
          <DebouncedInput
            value={searchText}
            placeholder='Name / mobile / company / vehicle'
            onChange={v => setSearchText(String(v))}
          />

          <Button
            variant='contained'
            startIcon={<i className='tabler-plus' />}
            onClick={() => {
              setVisitorData(null)
              setIsOpen(true)
            }}
          >
            Add Visitor
          </Button>
        </div>
      </CardContent>

      <div className='overflow-x-auto'>
        <table className={tableStyles.table}>
          <thead>
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <th key={header.id}>
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.length === 0 ? (
              <tr>
                <td colSpan={table.getVisibleFlatColumns().length} className='text-center'>
                  No data available
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map(row => (
                <tr key={row.id}>
                  {row.getVisibleCells().map(cell => (
                    <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <TablePaginationComponent table={table} />

      <VisitorModal
        open={isOpen}
        setIsOpen={setIsOpen}
        fetchVisitors={fetchVisitors}
        datass={visitorData}
        setVisitorData={setVisitorData}
        createData={createData}
      />

      <OTPCodeModal open={openDialog} setOpenDialog={setOpenDialog} code={code} data={visitorData} />

      <Dialog open={confirmDialog} onClose={() => setConfirmDialog(false)}>
        <DialogTitle>Allow Visitor</DialogTitle>
        <DialogContent>
          <Typography>Do you want to accept or reject this visitor?</Typography>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center' }}>
          <Button
            variant='contained'
            color='primary'
            onClick={() => {
              setSelectedAction('accept')
              setConfirmDialog(false)
              setSubmitDialog(true)
            }}
          >
            Accept
          </Button>
          <Button
            variant='outlined'
            color='error'
            onClick={() => {
              setSelectedAction('reject')
              setConfirmDialog(false)
              setSubmitDialog(true)
            }}
          >
            Reject
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={submitDialog} onClose={() => setSubmitDialog(false)}>
        <DialogTitle>Confirm Submission</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to {selectedAction === 'accept' ? 'accept' : 'reject'} this visitor?</Typography>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center' }}>
          <Button onClick={() => setSubmitDialog(false)}>Cancel</Button>
          <Button
            variant='contained'
            color={selectedAction === 'accept' ? 'success' : 'error'}
            onClick={handleFinalSubmit}
          >
            Submit
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  )
}

export default VisitorTable
