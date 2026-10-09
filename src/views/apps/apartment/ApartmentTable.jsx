'use client'

// React Imports
import { useState, useMemo, useEffect } from 'react'

// Next Imports
import { useParams } from 'next/navigation'

// MUI Imports
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Card,
  CardContent,
  Typography,
  MenuItem,
  Checkbox,
  Chip,
  IconButton,
  DialogActions,
  Button,
  CircularProgress,
} from '@mui/material'

// Third-party Imports
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

// Component Imports
import OptionMenu from '@core/components/option-menu'
import CustomTextField from '@core/components/mui/TextField'
import TablePaginationComponent from '@components/TablePaginationComponent'

// Style Imports
import tableStyles from '@core/styles/table.module.css'
import ApartmentDialog from '@/components/dialogs/apartment-dialog/page'
import RegionDialog from '@/components/dialogs/region-dialog/page'
import { usePermissionList } from '@/utils/getPermission'
import formatTime from '@/utils/formatTime'

// Filter function
const fuzzyFilter = (row, columnId, value, addMeta) => {
  const itemRank = rankItem(row.getValue(columnId), value)

  addMeta({ itemRank })

  return itemRank.passed

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

  }, [value])

  return <CustomTextField {...props} value={value} onChange={e => setValue(e.target.value)} />

}

const columnHelper = createColumnHelper()

// States
const ApartmentTable = ({ tableData, fetchZoneData }) => {
  const [role, setRole] = useState('')
  const [rowSelection, setRowSelection] = useState({})
  const [data, setData] = useState([])
  const [filteredData, setFilteredData] = useState([])
  const [globalFilter, setGlobalFilter] = useState('')
  const [openDialog, setOpenDialog] = useState(false)
  const [openZoneDialog, setOpenZoneDialog] = useState(false)
  const [selectedZone, setSelectedZone] = useState(null)
  const [selectedRegion, setSelectedRegion] = useState(null)

  const { lang: locale } = useParams()

  const getPermissions = usePermissionList();
  const [permissions, setPermissions] = useState({});

  useEffect(() => {
    const fetchPermissions = async () => {
      try {
        const result = await getPermissions();

        setPermissions(result);
      } catch (error) {
        console.error('Error fetching permissions:', error);
      }
    };

    if (getPermissions) {
      fetchPermissions();
    }
  }, [getPermissions]); // Include in dependency array

  useEffect(() => {
    if (tableData) {
      setData(tableData)
      setFilteredData(tableData)
    }
  }, [tableData])

  // Role filter effect
  useEffect(() => {
    const filtered = data.filter(user => {
      if (role && user.role !== role) return false

      return true
    })

    setFilteredData(filtered)
  }, [role, data])

  const columns = useMemo(() => [
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
          indeterminate={row.getIsSomeSelected()}
          onChange={row.getToggleSelectedHandler()}
        />
      )
    },
    columnHelper.accessor('apartment_no', {
      header: 'Apartment No',
      cell: info => <Typography>{info.getValue()}</Typography>
    }),
    columnHelper.accessor(row => row.tower_id?.name ?? '-', {
      id: 'tower_name',
      header: 'Tower Name',
      cell: info => <Typography>{info.getValue()}</Typography>
    }),
    columnHelper.accessor(row => row.floor_id?.floor_name ?? '-', {
      id: 'floor_name',
      header: 'Floor Name',
      cell: info => <Typography>{info.getValue()}</Typography>
    }),
    columnHelper.accessor('apartment_area', {
      header: 'Apartment Area (sqft)',
      cell: info => <Typography>{info.getValue()}</Typography>
    }),
    columnHelper.accessor(row => row.apartment_type?.name ?? '-', {
      id: 'apartment_type',
      header: 'Apartment Type',
      cell: info => <Typography>{info.getValue()}</Typography>
    }),
    columnHelper.accessor('assigned_apartment_to', {
      header: 'Assigned User',
      cell: ({ row }) => (
        <Typography>{row?.original?.assigned_to?.first_name || "-"} {row?.original?.assigned_to?.last_name || "-"}</Typography>
      )
    }),
    columnHelper.accessor('status', {
      header: 'Apartment Status',
      cell: ({ row }) => (
        <Chip
          label={row.original.status ? 'Occupied' : 'Unsold'}
          color={row.original.status ? 'success' : 'default'}
          variant='tonal'
          size='small'
        />
      )
    }),

    //This is the issue
    columnHelper.accessor('assigned_at', {
      header: 'Assigned At',
      cell: ({ row }) => (
        <Typography>{formatTime(row?.original?.assigned_at) || "-"}</Typography>
      )
    }),
    columnHelper.display({
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) =>
        permissions?.['hasApartmentEditPermission'] && (
          <IconButton
            onClick={() => {
              setSelectedZone(row.original)
              setOpenDialog(true)
            }}
          >
            <i className='tabler-edit text-textSecondary' />
          </IconButton>
        )
    })
  ], [permissions])


  const table = useReactTable({
    data: filteredData,
    columns,
    filterFns: { fuzzy: fuzzyFilter },
    globalFilterFn: fuzzyFilter,
    state: { globalFilter, rowSelection },
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
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
        <div className='flex gap-4 flex-col !items-start max-sm:is-full sm:flex-row sm:items-center'>
          <DebouncedInput
            value={globalFilter ?? ''}
            className='max-sm:is-full min-is-[250px]'
            onChange={value => setGlobalFilter(String(value))}
            placeholder='Search Apartment'
          />
          <Button
            variant='contained'
            size='small'
            onClick={() => {
              setOpenDialog(true)
              setSelectedZone()
              setSelectedRegion()
            }}
          >
            Add Apartment
          </Button>
          {/* <CustomTextField
            select
            value={role}
            onChange={e => setRole(e.target.value)}
            id='roles-app-role-select'
            className='max-sm:is-full sm:is-[160px]'
            slotProps={{ select: { displayEmpty: true } }}
          >
            <MenuItem value=''>Select Role</MenuItem>
            {tableData.map((item, index) => {
              return (
                <MenuItem key={index} value={item._id}>
                  {item.name}
                </MenuItem>
              );
            })}
          </CustomTextField> */}
        </div>
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
                          'flex items-center': header.column.getIsSorted(),
                          'cursor-pointer select-none': header.column.getCanSort()
                        })}
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
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
            {table.getFilteredRowModel().rows.length === 0 ? (
              <tr>
                <td colSpan={table.getVisibleFlatColumns().length} className='text-center'>
                  No data available
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map(row => (
                <tr key={row.id} className={classnames({ selected: row.getIsSelected() })}>
                  {row.getVisibleCells().map(cell => (
                    <td key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <TablePaginationComponent table={table} />

      {/* Role Dialog */}
      {openDialog && (
        <ApartmentDialog
          open={openDialog}
          setOpen={setOpenDialog}
          selectedZone={selectedZone}
          fetchZoneData={fetchZoneData}
          tableData={tableData}
        />
      )}
    </Card>
  )
}

export default ApartmentTable
