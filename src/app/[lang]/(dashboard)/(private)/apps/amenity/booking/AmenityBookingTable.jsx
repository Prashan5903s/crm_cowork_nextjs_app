'use client'

// React Imports
import { useState, useMemo, useEffect } from 'react'

import {
  Button,
  CardContent,
  Card,
  Checkbox,
  Typography,
  MenuItem
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

import AmenityBookingDialog from '@/components/dialogs/amenity-booking-dialog/page'

import { usePermissionList } from '@/utils/getPermission'
import formatTime from '@/utils/formatTime'

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

const AmenityBookingTable = ({ tableData, fetchZoneData }) => {

  const [role, setRole] = useState('')
  const [rowSelection, setRowSelection] = useState({})
  const [data, setData] = useState([])
  const [filteredData, setFilteredData] = useState([])
  const [globalFilter, setGlobalFilter] = useState('')
  const [openDialog, setOpenDialog] = useState(false)
  const [selectedZone, setSelectedZone] = useState(null)

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
  }, [getPermissions]);

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

  // Helper function to format 24h time string (e.g., "15:04:00" or "15:04") into 12-hour format with AM/PM
  function formatTime12Hour(timeString) {
    if (!timeString) return "-";

    // Handle cases where time might be "HH:mm:ss" or "HH:mm"
    const [hoursStr, minutesStr] = timeString.split(":");
    let hours = parseInt(hoursStr, 10);
    const minutes = minutesStr ? minutesStr.padStart(2, "0") : "00";

    if (isNaN(hours)) return timeString; // Fallback if format is unexpected

    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'

    return `${hours}:${minutes} ${ampm}`;
  }

  const columns = useMemo(() => {
    const baseColumns = [
      {
        id: "select",
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
        ),
      },
    ];

    baseColumns.splice(
      1,
      0,
      columnHelper.accessor("amenity_name", {
        header: "Amenity name",
        cell: ({ row }) => (
          <Typography className="capitalize" color="text.primary">
            {row.original.amenity_id.title}
          </Typography>
        ),
      })
    );

    baseColumns.splice(
      2,
      1,
      columnHelper.accessor("User", {
        header: "No of User",
        cell: ({ row }) => (
          <Typography className="capitalize" color="text.primary">
            {row.original.bookingLog?.length}
          </Typography>
        ),
      })
    )

    baseColumns.splice(
      3,
      0,
      columnHelper.accessor("Start_time", {
        header: "Start Time",
        cell: ({ row }) => (
          <Typography className="capitalize" color="text.primary">
            {formatTime(row.original.booking_start_time)}
          </Typography>
        ),
      })
    );

    baseColumns.splice(
      4,
      0,
      columnHelper.accessor("end_time", {
        header: "End Time",
        cell: ({ row }) => (
          <Typography className="capitalize" color="text.primary">
            {formatTime(row.original.booking_end_time)}
          </Typography>
        ),
      })
    );

    baseColumns.splice(
      5,
      0,
      columnHelper.accessor("no_of_person", {
        header: "No of person",
        cell: ({ row }) => {
          return (
            <Typography className="capitalize" color="text.primary">
              {row.original.no_of_person}
            </Typography>
          );
        },
      })
    );

    baseColumns.splice(
      6,
      0,
      columnHelper.accessor("action", {
        header: "Action",
        cell: ({ row }) => {
          return (
            <div className="flex items-center">
              <i
                className='tabler-edit cursor-pointer text-textSecondary hover:text-primary transition-colors text-xl'
                onClick={() => {
                  setSelectedZone(row?.original)
                  setOpenDialog(true)
                }}
              />
            </div>
          );
        },
      })
    );

    return baseColumns;
  }, [permissions]);

  const table = useReactTable({
    data: filteredData,
    columns,
    filterFns: { fuzzy: fuzzyFilter },
    state: { rowSelection, globalFilter },
    initialState: { pagination: { pageSize: 10 } },
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
            placeholder='Search Bill'
          />
          <Button
            variant="contained"
            size="small"
            onClick={() => {
              setSelectedZone(null); // Clear selected zone for new creation
              setOpenDialog(true);
            }}
            className='max-sm:is-full min-is-[250px]'
          >
            Add Booking
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
              <></>
              /* keeping structure intact */
            )}
            {table.getFilteredRowModel().rows.length > 0 && table.getRowModel().rows.map(row => (
              <tr key={row.id} className={classnames({ selected: row.getIsSelected() })}>
                {row.getVisibleCells().map(cell => (
                  <td key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <TablePaginationComponent table={table} />

      {/* Role Dialog */}
      {openDialog && (
        <AmenityBookingDialog
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

export default AmenityBookingTable
