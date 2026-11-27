'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'

import {
  Card,
  MenuItem,
  Tab,
  Button,
  Dialog,
  CardContent,
  Typography,
  DialogContent,
  DialogTitle,
  DialogActions,
  Chip,
  Tooltip
} from '@mui/material'

import { TabContext, TabPanel, TabList } from '@mui/lab'

import Grid from '@mui/material/Grid2'

import classnames from 'classnames'

import { valibotResolver } from '@hookform/resolvers/valibot'

import { object, string, minLength, maxLength, regex, pipe, optional, picklist } from 'valibot'

import { rankItem } from '@tanstack/match-sorter-utils'

import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel
} from '@tanstack/react-table'

import { useForm, Controller } from 'react-hook-form'

import { useSession } from 'next-auth/react'

import { toast } from 'react-toastify'

import tableStyles from '@core/styles/table.module.css'

import TablePaginationComponent from '@components/TablePaginationComponent'

import CustomTextField from '@/@core/components/mui/TextField'

import DialogCloseButton from '@/components/dialogs/DialogCloseButton'

import { usePermissionList } from '@/utils/getPermission'

const ASSET_URL = process.env.NEXT_PUBLIC_ASSETS_URL

/* -------------------------------------------------------------------------- */
/*  Constants                                                                 */
/* -------------------------------------------------------------------------- */

// NOTE: codes 1-4 are kept identical to your old backend values
// (1 Pending -> Open, 2 Assigned, 3 Resolved, 4 In Progress).
// 5 (Waiting) and 6 (Closed) are NEW - make sure the backend accepts them.
const STATUS = {
  1: { label: 'Open', color: 'info' },
  2: { label: 'Assigned', color: 'primary' },
  4: { label: 'In Progress', color: 'warning' },
  5: { label: 'Waiting', color: 'secondary' },
  3: { label: 'Resolved', color: 'success' },
  6: { label: 'Closed', color: 'default' }
}

// Tab order shown in the UI
const STATUS_TABS = ['1', '2', '4', '5', '3', '6']

// Statuses an employee can set manually ("Assigned" is set by the assign action)
const CHANGEABLE_STATUS = ['1', '4', '5', '3', '6']

const RESOLVED = 3
const CLOSED = 6

// Priority (must match the backend: '1' | '2' | '3')
const PRIORITY = {
  1: { label: 'Low', color: 'success' },
  2: { label: 'Medium', color: 'warning' },
  3: { label: 'High', color: 'error' }
}

// STATIC ticket types (must match TICKET_TYPES in the backend model)
const TICKET_TYPES = [
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'housekeeping', label: 'Housekeeping' },
  { value: 'internet', label: 'Internet / Wi-Fi' },
  { value: 'electricity', label: 'Electricity' },
  { value: 'air_conditioning', label: 'Air Conditioning' },
  { value: 'security', label: 'Security' },
  { value: 'billing', label: 'Billing' },
  { value: 'other', label: 'Other' }
]

const TICKET_TYPE_LABEL = Object.fromEntries(TICKET_TYPES.map(t => [t.value, t.label]))

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                   */
/* -------------------------------------------------------------------------- */

function formatTimestamp(timestamp) {
  if (!timestamp) return '-'

  return new Date(timestamp).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit'
  })
}

const fullName = user => (user ? `${user.first_name ?? ''} ${user.last_name ?? ''}`.trim() : '')

// Current status of a complaint row (latest history entry wins)
const getRowStatus = row => Number(row?.latest_complain_user?.complaint_status ?? row?.complaint_status ?? 1)

const getTicketId = row => row?.ticket_id || (row?._id ? `#${String(row._id).slice(-6).toUpperCase()}` : '-')

const getTicketType = row => TICKET_TYPE_LABEL[row?.category] || row?.category || '-'

const getPriority = row => {
  const p = PRIORITY[row?.priority]

  if (p) return p

  return row?.priority ? { label: String(row.priority), color: 'default' } : null
}

const StatusChip = ({ status }) => {
  const s = STATUS[status] || STATUS[1]

  return <Chip size='small' variant='tonal' label={s.label} color={s.color} />
}

// Global search filter
const fuzzyFilter = (row, columnId, value, addMeta) => {
  const itemRank = rankItem(String(row.getValue(columnId) ?? ''), value)

  addMeta({ itemRank })

  return itemRank.passed
}

const columnHelper = createColumnHelper()

const center = node => <div style={{ textAlign: 'center' }}>{node}</div>

/* -------------------------------------------------------------------------- */
/*  Image preview                                                             */
/* -------------------------------------------------------------------------- */

const ImageModal = ({ open, setOpen, imgFile }) => {
  const handleClose = () => setOpen(false)

  const imageUrl = `${ASSET_URL}/uploads/complain/${imgFile}`

  return (
    <Dialog
      fullWidth
      maxWidth='sm'
      scroll='body'
      open={open}
      onClose={handleClose}
      sx={{ '& .MuiDialog-paper': { overflow: 'visible' } }}
    >
      <DialogCloseButton onClick={handleClose}>
        <i className='tabler-x' />
      </DialogCloseButton>
      <DialogTitle>Attachment</DialogTitle>
      <DialogContent>
        {!imgFile ? (
          <Typography textAlign='center' fontWeight='bold'>
            Attachment not found
          </Typography>
        ) : (
          <img
            src={imageUrl}
            alt='Attachment'
            style={{ maxWidth: '100%', maxHeight: '80vh', objectFit: 'contain' }}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

/* -------------------------------------------------------------------------- */
/*  Assign / change status dialog                                             */
/*  code 1 = assign employee, code 2 = change status                          */
/* -------------------------------------------------------------------------- */

const ComplainModal = ({ open, setIsOpen, fetchComplain, code, id, complainData }) => {
  const { data: session } = useSession()
  const token = session?.user?.token
  const API_URL = process.env.NEXT_PUBLIC_API_URL

  const [employees, setEmployees] = useState([])

  const schema = useMemo(
    () =>
      object({
        user: code == 1 ? pipe(string(), minLength(1, 'Employee is required')) : optional(string()),
        status: code == 2 ? pipe(string(), minLength(1, 'Status is required')) : optional(string()),
        remark: optional(string())
      }),
    [code]
  )

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm({
    resolver: valibotResolver(schema),
    defaultValues: { status: '', remark: '', user: '' }
  })

  const onClose = () => {
    reset({ status: '', remark: '', user: '' })
    setIsOpen(false)
  }

  // Prefill form when the dialog opens for a row
  useEffect(() => {
    if (!open) return

    if (complainData && code == 1) {
      reset({
        remark: complainData?.assigned_to?.remark ?? '',
        user: complainData?.assigned_user?._id ?? '',
        status: ''
      })
    } else if (complainData && code == 2) {
      reset({
        remark: '',
        status: String(getRowStatus(complainData)) === '2' ? '' : String(getRowStatus(complainData)),
        user: ''
      })
    } else {
      reset({ remark: '', status: '', user: '' })
    }
  }, [open, complainData, reset, code])

  // Employees list is only needed when assigning
  useEffect(() => {
    if (!open || code != 1 || !API_URL || !token) return

    const fetchEmployees = async () => {
      try {
        const response = await fetch(`${API_URL}/company/complain/create`, {
          headers: { Authorization: `Bearer ${token}` }
        })

        const result = await response.json()

        if (response.ok) setEmployees(result?.data || [])
      } catch (error) {
        console.error('Fetch error:', error)
      }
    }

    fetchEmployees()
  }, [open, code, API_URL, token])

  const onSubmit = async data => {
    try {
      const response = await fetch(`${API_URL}/company/complain/data/${id}/${code}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(data)
      })

      if (response.ok) {
        toast.success(code == 1 ? 'Employee assigned successfully' : 'Status updated successfully', {
          autoClose: 1000
        })
        fetchComplain()
        onClose()
      } else {
        const errorData = await response.json().catch(() => ({}))

        toast.error(errorData?.message || 'Failed to update ticket')
      }
    } catch (error) {
      console.error('Submit error:', error)
      toast.error('Something went wrong. Please try again.')
    }
  }

  return (
    <Dialog
      fullWidth
      maxWidth='md'
      scroll='body'
      open={open}
      onClose={onClose}
      sx={{ '& .MuiDialog-paper': { overflow: 'visible' } }}
    >
      <DialogCloseButton onClick={onClose}>
        <i className='tabler-x' />
      </DialogCloseButton>

      <DialogTitle>{code == 1 ? 'Assign employee' : 'Change status'}</DialogTitle>

      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent>
          <Grid container spacing={3}>
            {code == 1 && (
              <Grid size={{ xs: 12 }}>
                <Controller
                  name='user'
                  control={control}
                  render={({ field }) => (
                    <CustomTextField
                      {...field}
                      value={field.value ?? ''}
                      fullWidth
                      select
                      label='Assigned employee *'
                      error={!!errors.user}
                      helperText={errors.user?.message}
                    >
                      {employees.length === 0 ? (
                        <MenuItem disabled value=''>
                          No employees found
                        </MenuItem>
                      ) : (
                        employees.map(item => (
                          <MenuItem key={item._id} value={item._id}>
                            {fullName(item)}
                          </MenuItem>
                        ))
                      )}
                    </CustomTextField>
                  )}
                />
              </Grid>
            )}

            {code == 2 && (
              <Grid size={{ xs: 12 }}>
                <Controller
                  name='status'
                  control={control}
                  render={({ field }) => (
                    <CustomTextField
                      {...field}
                      value={field.value ?? ''}
                      fullWidth
                      select
                      label='Status *'
                      error={!!errors.status}
                      helperText={errors.status?.message}
                    >
                      {CHANGEABLE_STATUS.map(key => (
                        <MenuItem key={key} value={key}>
                          {STATUS[key].label}
                        </MenuItem>
                      ))}
                    </CustomTextField>
                  )}
                />
              </Grid>
            )}

            <Grid size={{ xs: 12 }}>
              <Controller
                name='remark'
                control={control}
                render={({ field }) => (
                  <CustomTextField
                    {...field}
                    value={field.value ?? ''}
                    fullWidth
                    multiline
                    minRows={4}
                    label='Remark'
                    error={!!errors.remark}
                    helperText={errors.remark?.message}
                  />
                )}
              />
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions sx={{ justifyContent: 'center', gap: 2 }}>
          <Button variant='contained' type='submit' disabled={isSubmitting}>
            Save
          </Button>
          <Button variant='outlined' color='error' onClick={onClose}>
            Cancel
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}

/* -------------------------------------------------------------------------- */
/*  History dialog                                                            */
/* -------------------------------------------------------------------------- */

const ComplainHistoryModal = ({ open, setOpen, history }) => {
  const onClose = () => setOpen(false)

  const columns = useMemo(
    () => [
      columnHelper.display({
        id: 'sr_no',
        header: () => center('Sr No'),
        cell: ({ row }) => center(<Typography color='text.primary'>{row.index + 1}</Typography>)
      }),
      columnHelper.display({
        id: 'status',
        header: () => center('Status'),
        cell: ({ row }) => center(<StatusChip status={Number(row.original?.complaint_status)} />)
      }),
      columnHelper.display({
        id: 'remark',
        header: () => center('Remark'),
        cell: ({ row }) => center(<Typography color='text.primary'>{row.original?.remark || '-'}</Typography>)
      }),
      columnHelper.display({
        id: 'date',
        header: () => center('Date'),
        cell: ({ row }) => center(<Typography>{formatTimestamp(row.original?.created_at)}</Typography>)
      })
    ],
    []
  )

  const table = useReactTable({
    data: history,
    columns,
    initialState: { pagination: { pageSize: 10 } },
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel()
  })

  return (
    <Dialog
      fullWidth
      maxWidth='md'
      scroll='body'
      open={open}
      onClose={onClose}
      sx={{ '& .MuiDialog-paper': { overflow: 'visible' } }}
    >
      <DialogCloseButton onClick={onClose}>
        <i className='tabler-x' />
      </DialogCloseButton>
      <DialogTitle>Ticket history</DialogTitle>
      <DialogContent>
        <Card>
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
                      No history available
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
        </Card>
      </DialogContent>
    </Dialog>
  )
}

/* -------------------------------------------------------------------------- */
/*  Ticket table (one per status tab)                                         */
/* -------------------------------------------------------------------------- */

const ComplainTable = ({ status, refreshKey }) => {
  const { data: session } = useSession()
  const token = session?.user?.token
  const API_URL = process.env.NEXT_PUBLIC_API_URL

  const getPermissions = usePermissionList()

  const [permissions, setPermissions] = useState({})
  const [data, setData] = useState([])
  const [globalFilter, setGlobalFilter] = useState('')

  const [openDialog, setOpenDialog] = useState(false)
  const [selectedComplain, setSelectedComplain] = useState(null)
  const [code, setCode] = useState(1)
  const [complainId, setComplainId] = useState()

  const [openHistory, setOpenHistory] = useState(false)
  const [history, setHistory] = useState([])

  const [openImgDialog, setOpenImgDialog] = useState(false)
  const [imgFileName, setImgFileName] = useState()

  useEffect(() => {
    const fetchPermissions = async () => {
      try {
        const result = await getPermissions()

        setPermissions(result || {})
      } catch (error) {
        console.error('Error fetching permissions:', error)
      }
    }

    if (getPermissions) fetchPermissions()
  }, [getPermissions])

  const fetchComplain = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/company/complain/data/${status}`, {
        headers: { Authorization: `Bearer ${token}` }
      })

      const result = await response.json()

      if (response.ok) setData(result?.data || [])
    } catch (error) {
      console.error('Error fetching tickets:', error)
      toast.error('Failed to load tickets')
    }
  }, [API_URL, token, status])

  useEffect(() => {
    if (API_URL && token && status) fetchComplain()
  }, [API_URL, token, status, fetchComplain, refreshKey])

  const openAssign = row => {
    setSelectedComplain(row)
    setCode(1)
    setComplainId(row._id)
    setOpenDialog(true)
  }

  const openStatus = row => {
    setSelectedComplain(row)
    setCode(2)
    setComplainId(row._id)
    setOpenDialog(true)
  }

  const openHistoryFor = row => {
    setHistory(row?.all_complain_users || [])
    setOpenHistory(true)
  }

  const canViewHistory = !!permissions?.['hasComplainRecordViewPermission']

  const columns = useMemo(
    () => [
      columnHelper.accessor(row => getTicketId(row), {
        id: 'ticket_id',
        header: () => center('Ticket ID'),
        cell: ({ getValue }) => center(<Typography fontWeight={500} color='text.primary'>{getValue()}</Typography>)
      }),

      columnHelper.accessor(row => fullName(row?.created_by) || '-', {
        id: 'member',
        header: () => center('Member'),
        cell: ({ getValue }) => center(<Typography color='text.primary'>{getValue()}</Typography>)
      }),

      columnHelper.accessor(row => getTicketType(row), {
        id: 'category',
        header: () => center('Ticket type'),
        cell: ({ getValue }) => center(<Typography color='text.primary'>{getValue()}</Typography>)
      }),

      columnHelper.accessor(row => getPriority(row)?.label || '-', {
        id: 'priority',
        header: () => center('Priority'),
        cell: ({ row }) => {
          const p = getPriority(row.original)

          return center(
            p ? <Chip size='small' variant='tonal' label={p.label} color={p.color} /> : <Typography>-</Typography>
          )
        }
      }),

      columnHelper.accessor(row => row?.description || '', {
        id: 'description',
        header: () => center('Description'),
        cell: ({ getValue }) => {
          const text = getValue()

          return (
            <Tooltip title={text} placement='top' disableHoverListener={!text}>
              <Typography
                color='text.primary'
                sx={{
                  maxWidth: 260,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}
              >
                {text || '-'}
              </Typography>
            </Tooltip>
          )
        }
      }),

      columnHelper.display({
        id: 'attachment',
        header: () => center('Attachment'),
        cell: ({ row }) => {
          const file = row.original?.complain_img

          if (!file) return center(<Typography>-</Typography>)

          return (
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <i
                className='tabler-eye'
                style={{ cursor: 'pointer', fontSize: 20, transition: 'transform 0.2s' }}
                onClick={() => {
                  setImgFileName(file)
                  setOpenImgDialog(true)
                }}
                onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.2)')}
                onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
              />
            </div>
          )
        }
      }),

      columnHelper.accessor(row => fullName(row?.assigned_user) || 'Unassigned', {
        id: 'assigned_employee',
        header: () => center('Assigned employee'),
        cell: ({ row, getValue }) => {
          const st = getRowStatus(row.original)
          const locked = st === RESOLVED || st === CLOSED

          return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8 }}>
              <Typography color='text.primary'>{getValue()}</Typography>
              {!locked && (
                <Button size='small' variant='outlined' onClick={() => openAssign(row.original)}>
                  {row.original?.assigned_user ? 'Change' : 'Assign'}
                </Button>
              )}
            </div>
          )
        }
      }),

      columnHelper.accessor(row => STATUS[getRowStatus(row)]?.label || '-', {
        id: 'status',
        header: () => center('Status'),
        cell: ({ row }) => center(<StatusChip status={getRowStatus(row.original)} />)
      }),

      columnHelper.display({
        id: 'actions',
        header: () => center('Action'),
        cell: ({ row }) => {
          const st = getRowStatus(row.original)

          return (
            <div style={{ display: 'flex', justifyContent: 'center', gap: 10 }}>
              {st !== CLOSED && (
                <Button size='small' variant='outlined' onClick={() => openStatus(row.original)}>
                  Update
                </Button>
              )}
              {canViewHistory && (
                <Button size='small' variant='contained' onClick={() => openHistoryFor(row.original)}>
                  View
                </Button>
              )}
            </div>
          )
        }
      }),

      columnHelper.accessor(row => row?.created_at || '', {
        id: 'created_at',
        header: () => center('Created at'),
        cell: ({ row }) => center(<Typography>{formatTimestamp(row.original?.created_at)}</Typography>)
      })
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [canViewHistory]
  )

  const table = useReactTable({
    data,
    columns,
    filterFns: { fuzzy: fuzzyFilter },
    globalFilterFn: fuzzyFilter,
    state: { globalFilter },
    initialState: { pagination: { pageSize: 10 } },
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel()
  })

  return (
    <Card>
      <CardContent className='flex justify-between flex-col gap-4 items-start sm:flex-row sm:items-center'>
        <div className='flex items-center gap-2'>
          <Typography>Show</Typography>
          <CustomTextField
            select
            value={table.getState().pagination.pageSize}
            onChange={e => table.setPageSize(Number(e.target.value))}
            className='max-sm:is-full sm:is-[70px]'
          >
            <MenuItem value={10}>10</MenuItem>
            <MenuItem value={25}>25</MenuItem>
            <MenuItem value={50}>50</MenuItem>
          </CustomTextField>
        </div>

        <CustomTextField
          value={globalFilter ?? ''}
          onChange={e => setGlobalFilter(e.target.value)}
          placeholder='Search tickets'
          className='max-sm:is-full'
        />
      </CardContent>

      <div className='overflow-x-auto'>
        <table className={tableStyles.table}>
          <thead>
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <th key={header.id}>
                    {header.isPlaceholder ? null : (
                      <div
                        className={classnames({
                          'cursor-pointer select-none': header.column.getCanSort()
                        })}
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                      </div>
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.length === 0 ? (
              <tr>
                <td colSpan={table.getVisibleFlatColumns().length} className='text-center'>
                  No tickets found
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

      <ComplainModal
        open={openDialog}
        setIsOpen={setOpenDialog}
        id={complainId}
        fetchComplain={fetchComplain}
        code={code}
        complainData={selectedComplain}
      />

      <ImageModal imgFile={imgFileName} open={openImgDialog} setOpen={setOpenImgDialog} />

      <ComplainHistoryModal open={openHistory} setOpen={setOpenHistory} history={history} />
    </Card>
  )
}

/* -------------------------------------------------------------------------- */
/*  Add complain dialog                                                       */
/* -------------------------------------------------------------------------- */

const NATURE_OPTIONS = [
  { value: '1', label: 'Complaint' },
  { value: '2', label: 'Suggestion' }
]

const TYPE_OPTIONS = [
  { value: '1', label: 'Individual' },
  { value: '2', label: 'Society' }
]

const PRIORITY_OPTIONS = [
  { value: '1', label: 'Low' },
  { value: '2', label: 'Medium' },
  { value: '3', label: 'High' }
]

const MAX_FILE_SIZE = 5 * 1024 * 1024

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']

const requiredSelect = message => pipe(string(), minLength(1, message))

const addSchema = object({
  nature: requiredSelect('Nature is required'),
  complain_type: requiredSelect('Complain type is required'),
  category: pipe(
    string(),
    minLength(1, 'Ticket type is required'),
    picklist(
      TICKET_TYPES.map(t => t.value),
      'Select a valid ticket type'
    )
  ),
  priority: requiredSelect('Priority is required'),
  description: pipe(
    string(),
    minLength(1, 'Description is required'),
    maxLength(5000, 'Maximum 5000 characters')
  )
})

const ADD_DEFAULTS = {
  nature: '',
  complain_type: '',
  category: '',
  priority: '',
  description: ''
}

const SelectField = ({ name, control, label, options, error }) => (
  <Controller
    name={name}
    control={control}
    render={({ field }) => (
      <CustomTextField
        {...field}
        value={field.value ?? ''}
        fullWidth
        select
        label={label}
        error={!!error}
        helperText={error?.message}
      >
        {options.map(option => (
          <MenuItem key={option.value} value={option.value}>
            {option.label}
          </MenuItem>
        ))}
      </CustomTextField>
    )}
  />
)

const AddComplainModal = ({ open, setOpen, onCreated }) => {
  const { data: session } = useSession()
  const token = session?.user?.token
  const API_URL = process.env.NEXT_PUBLIC_API_URL

  const [file, setFile] = useState(null)
  const [fileError, setFileError] = useState('')

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm({
    resolver: valibotResolver(addSchema),
    defaultValues: ADD_DEFAULTS
  })

  const onClose = () => {
    reset(ADD_DEFAULTS)
    setFile(null)
    setFileError('')
    setOpen(false)
  }

  const handleFile = e => {
    const selected = e.target.files?.[0]

    e.target.value = '' // allows picking the same file again

    if (!selected) return

    if (!ALLOWED_IMAGE_TYPES.includes(selected.type)) {
      setFile(null)
      setFileError('Only JPG, PNG, GIF or WebP images are allowed')

      return
    }

    if (selected.size > MAX_FILE_SIZE) {
      setFile(null)
      setFileError('Image must be 5 MB or smaller')

      return
    }

    setFileError('')
    setFile(selected)
  }

  const onSubmit = async data => {
    try {
      const formData = new FormData()

      Object.entries(data).forEach(([key, value]) => formData.append(key, value))

      if (file) formData.append('complain_img', file)

      // Do not set Content-Type here: the browser adds the multipart boundary
      const response = await fetch(`${API_URL}/company/complain/create`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      })

      if (response.ok) {
        toast.success('Complain added successfully', { autoClose: 1000 })
        onCreated?.()
        onClose()
      } else {
        const errorData = await response.json().catch(() => ({}))

        toast.error(errorData?.message || 'Failed to add complain')
      }
    } catch (error) {
      console.error('Submit error:', error)
      toast.error('Something went wrong. Please try again.')
    }
  }

  return (
    <Dialog
      fullWidth
      maxWidth='md'
      scroll='body'
      open={open}
      onClose={onClose}
      sx={{ '& .MuiDialog-paper': { overflow: 'visible' } }}
    >
      <DialogCloseButton onClick={onClose}>
        <i className='tabler-x' />
      </DialogCloseButton>

      <DialogTitle>Add Complain</DialogTitle>

      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <SelectField
                name='nature'
                control={control}
                label='Nature *'
                options={NATURE_OPTIONS}
                error={errors.nature}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <SelectField
                name='complain_type'
                control={control}
                label='Complain type *'
                options={TYPE_OPTIONS}
                error={errors.complain_type}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <SelectField
                name='category'
                control={control}
                label='Ticket type *'
                options={TICKET_TYPES}
                error={errors.category}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <SelectField
                name='priority'
                control={control}
                label='Priority *'
                options={PRIORITY_OPTIONS}
                error={errors.priority}
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <Controller
                name='description'
                control={control}
                render={({ field }) => (
                  <CustomTextField
                    {...field}
                    value={field.value ?? ''}
                    fullWidth
                    multiline
                    minRows={4}
                    label='Description *'
                    error={!!errors.description}
                    helperText={errors.description?.message}
                  />
                )}
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <div className='flex items-center gap-3 flex-wrap'>
                <Button component='label' variant='outlined' startIcon={<i className='tabler-upload' />}>
                  {file ? 'Change image' : 'Attach image'}
                  <input hidden type='file' accept='image/jpeg,image/png,image/gif,image/webp' onChange={handleFile} />
                </Button>

                {file && (
                  <>
                    <Typography variant='body2' noWrap sx={{ maxWidth: 260 }}>
                      {file.name}
                    </Typography>
                    <Button size='small' color='error' onClick={() => setFile(null)}>
                      Remove
                    </Button>
                  </>
                )}
              </div>

              {fileError && (
                <Typography variant='caption' color='error'>
                  {fileError}
                </Typography>
              )}
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions sx={{ justifyContent: 'center', gap: 2 }}>
          <Button variant='contained' type='submit' disabled={isSubmitting}>
            Add Complain
          </Button>
          <Button variant='outlined' color='error' onClick={onClose}>
            Cancel
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}

/* -------------------------------------------------------------------------- */
/*  Tabs                                                                      */
/* -------------------------------------------------------------------------- */

const ComplainTab = () => {
  const [value, setValue] = useState('1')
  const [openAdd, setOpenAdd] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  // New complains start as Open: jump to that tab and reload it
  const handleCreated = () => {
    setValue('1')
    setRefreshKey(key => key + 1)
  }

  return (
    <>
      <TabContext value={value}>
        <div className='flex items-center justify-between gap-4 flex-wrap mb-4'>
          <Typography variant='h5'>Tickets</Typography>
          <Button variant='contained' startIcon={<i className='tabler-plus' />} onClick={() => setOpenAdd(true)}>
            Add Complain
          </Button>
        </div>

        <TabList variant='scrollable' onChange={(e, newValue) => setValue(newValue)} className='border-b px-0 pt-0'>
          {STATUS_TABS.map(key => (
            <Tab key={key} label={STATUS[key].label} value={key} />
          ))}
        </TabList>

        <div className='pt-0 mt-4'>
          {STATUS_TABS.map(key => (
            <TabPanel key={key} value={key} className='p-0'>
              <ComplainTable status={key} refreshKey={refreshKey} />
            </TabPanel>
          ))}
        </div>
      </TabContext>

      <AddComplainModal open={openAdd} setOpen={setOpenAdd} onCreated={handleCreated} />
    </>
  )
}

export default ComplainTab
