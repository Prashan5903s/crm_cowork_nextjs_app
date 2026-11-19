
'use client'

import { useState, useMemo, useEffect } from 'react'

import {
  Dialog,
  CardContent,
  MenuItem,
  Typography,
  Checkbox,
  DialogContent,
  DialogTitle
} from '@mui/material'

import classnames from 'classnames'

import { rankItem } from '@tanstack/match-sorter-utils'

import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getFilteredRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFacetedMinMaxValues,
  getPaginationRowModel,
  getSortedRowModel
} from '@tanstack/react-table'

import CustomTextField from '@core/components/mui/TextField'
import TablePaginationComponent from '@components/TablePaginationComponent'

import tableStyles from '@core/styles/table.module.css'

import DialogCloseButton from '../DialogCloseButton'

// Follow-up dropdown labels
const FOLLOW_UP_TYPES = {
  calls: 'Calls',
  emails: 'Emails',
  meetings: 'Meetings',
  whatsapp: 'Whatsapp'
}

const FOLLOW_UP_PRIORITIES = {
  low: 'Low',
  medium: 'Medium',
  high: 'High'
}

const FOLLOW_UP_STATUSES = {
  in_progress: 'In progress',
  completed: 'Completed',
  missed: 'Missed'
}

// Common display helper
const getLabel = (value, options) => {
  if (!value) return ''

  // Supports populated objects as well as string values
  if (typeof value === 'object') {
    return value.name || value.title || options[value._id] || ''
  }

  return options[value] || value
}

// Date formatter
const formatDate = value => {
  if (!value) return ''

  const date = new Date(value)

  if (isNaN(date.getTime())) return ''

  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  })
}

// Fuzzy search filter
const fuzzyFilter = (row, columnId, value, addMeta) => {
  const itemRank = rankItem(
    String(row.getValue(columnId) ?? ''),
    value
  )

  addMeta({ itemRank })

  return itemRank.passed
}

// Debounced search input
const DebouncedInput = ({
  value: initialValue,
  onChange,
  debounce = 500,
  ...props
}) => {
  const [value, setValue] = useState(initialValue)

  useEffect(() => {
    setValue(initialValue)
  }, [initialValue])

  useEffect(() => {
    const timeout = setTimeout(() => {
      onChange(value)
    }, debounce)

    return () => clearTimeout(timeout)
  }, [value, debounce, onChange])

  return (
    <CustomTextField
      {...props}
      value={value}
      onChange={e => setValue(e.target.value)}
    />
  )
}

const columnHelper = createColumnHelper()

const FollowUpTable = ({
  open,
  setOpen,
  tableData,
  selectedLeadId
}) => {
  const [rowSelection, setRowSelection] = useState({})
  const [globalFilter, setGlobalFilter] = useState('')

  // Follow-ups come from the selected lead
  const filteredData = useMemo(() => {
    return Array.isArray(tableData?.followUp)
      ? tableData.followUp
      : []
  }, [tableData])

  // Reset selection when changing leads
  useEffect(() => {
    setRowSelection({})
    setGlobalFilter('')
  }, [selectedLeadId])

  const handleClose = () => {
    setOpen(false)
  }

  const columns = useMemo(
    () => [
      {
        id: 'select',
        header: ({ table }) => (
          <Checkbox
            checked={table.getIsAllPageRowsSelected()}
            indeterminate={table.getIsSomePageRowsSelected()}
            onChange={table.getToggleAllPageRowsSelectedHandler()}
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

      columnHelper.accessor('follow_up_date', {
        header: 'Follow Up Date',
        cell: ({ row }) => (
          <Typography color='text.primary'>
            {formatDate(row.original.follow_up_date)}
          </Typography>
        )
      }),

      columnHelper.accessor('next_follow_up_date', {
        header: 'Next Follow Up Date',
        cell: ({ row }) => (
          <Typography variant='body2' color='text.secondary'>
            {formatDate(row.original.next_follow_up_date)}
          </Typography>
        )
      }),

      columnHelper.accessor('follow_up_type', {
        header: 'Type',
        cell: ({ row }) => (
          <Typography>
            {getLabel(
              row.original.follow_up_type,
              FOLLOW_UP_TYPES
            )}
          </Typography>
        )
      }),

      columnHelper.accessor('priority', {
        header: 'Priority',
        cell: ({ row }) => (
          <Typography>
            {getLabel(
              row.original.priority,
              FOLLOW_UP_PRIORITIES
            )}
          </Typography>
        )
      }),

      columnHelper.accessor('notes', {
        header: 'Notes',
        cell: ({ row }) => {
          const notes = row.original.notes || ''
          const words = notes.trim().split(/\s+/).filter(Boolean)

          return (
            <Typography>
              {words.slice(0, 5).join(' ')}
              {words.length > 5 ? '...' : ''}
            </Typography>
          )
        }
      }),

      columnHelper.accessor('status', {
        header: 'Status',
        cell: ({ row }) => {
          const status = row.original.status

          return (
            <Typography
              color={
                status === 'completed'
                  ? 'success.main'
                  : status === 'missed'
                    ? 'error.main'
                    : 'warning.main'
              }
            >
              {getLabel(status, FOLLOW_UP_STATUSES)}
            </Typography>
          )
        }
      })
    ],
    []
  )

  const table = useReactTable({
    data: filteredData,
    columns,

    filterFns: {
      fuzzy: fuzzyFilter
    },

    state: {
      rowSelection,
      globalFilter
    },

    initialState: {
      pagination: {
        pageSize: 10
      }
    },

    enableRowSelection: true,

    globalFilterFn: fuzzyFilter,

    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setGlobalFilter,

    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),

    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    getFacetedMinMaxValues: getFacetedMinMaxValues()
  })

  return (
    <Dialog
      fullWidth
      maxWidth='lg'
      scroll='body'
      open={open}
      onClose={handleClose}
      closeAfterTransition={false}
      sx={{
        '& .MuiDialog-paper': {
          overflow: 'visible'
        }
      }}
    >
      <DialogCloseButton onClick={handleClose}>
        <i className='tabler-x' />
      </DialogCloseButton>

      <DialogTitle className='text-center'>
        Follow Up List
      </DialogTitle>

      <DialogContent
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: 3
        }}
      >
        <CardContent className='flex justify-between flex-col gap-4 items-start sm:flex-row sm:items-center'>

          {/* Page size */}
          <div className='flex items-center gap-2'>
            <Typography>Show</Typography>

            <CustomTextField
              select
              value={table.getState().pagination.pageSize}
              onChange={e =>
                table.setPageSize(Number(e.target.value))
              }
              className='max-sm:is-full sm:is-[70px]'
            >
              <MenuItem value={10}>10</MenuItem>
              <MenuItem value={25}>25</MenuItem>
              <MenuItem value={50}>50</MenuItem>
            </CustomTextField>
          </div>

          {/* Search */}
          <div className='flex gap-4 flex-col !items-start max-sm:is-full sm:flex-row sm:items-center'>
            <DebouncedInput
              value={globalFilter ?? ''}
              className='max-sm:is-full min-is-[250px]'
              onChange={value => setGlobalFilter(String(value))}
              placeholder='Search Follow Up'
            />
          </div>

        </CardContent>

        {/* Table */}
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
                            'flex items-center':
                              header.column.getIsSorted(),
                            'cursor-pointer select-none':
                              header.column.getCanSort()
                          })}
                          onClick={
                            header.column.getToggleSortingHandler()
                          }
                        >
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}

                          {{
                            asc: <i className='tabler-chevron-up text-xl' />,
                            desc: <i className='tabler-chevron-down text-xl' />
                          }[header.column.getIsSorted()] ?? null}
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
                  <td
                    colSpan={table.getVisibleFlatColumns().length}
                    className='text-center'
                  >
                    No follow-up records available
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map(row => (
                  <tr
                    key={row.id}
                    className={classnames({
                      selected: row.getIsSelected()
                    })}
                  >
                    {row.getVisibleCells().map(cell => (
                      <td key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>

          </table>
        </div>

        <TablePaginationComponent table={table} />

      </DialogContent>
    </Dialog>
  )
}

export default FollowUpTable
