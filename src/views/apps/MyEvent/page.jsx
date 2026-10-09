'use client'

import { useState, useEffect, useMemo } from "react"

import {
    Card,
    MenuItem,
    Checkbox,
    CardContent,
    Typography,
} from "@mui/material"

import classnames from 'classnames'

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

import { useSession } from "next-auth/react"

import tableStyles from '@core/styles/table.module.css'

import TablePaginationComponent from '@components/TablePaginationComponent'

import CustomTextField from "@/@core/components/mui/TextField"

function formatTimeTo12Hour(timeStr) {
    if (!timeStr) return "-";

    const [hours, minutes] = timeStr.split(":").map(Number);
    let h = hours % 12 || 12; // 0 → 12
    let ampm = hours >= 12 ? "PM" : "AM";

    return `${String(h).padStart(2, "0")}:${String(minutes).padStart(2, "0")} ${ampm}`;
}

// Filter function
const fuzzyFilter = (row, columnId, value, addMeta) => {
    const itemRank = rankItem(row.getValue(columnId), value)

    addMeta({ itemRank })

    return itemRank.passed
}

const columnHelper = createColumnHelper()

const EventTable = ({ value, type }) => {

    const { data: session } = useSession()
    const token = session?.user?.token
    const API_URL = process.env.NEXT_PUBLIC_API_URL

    const [rowSelection, setRowSelection] = useState({})
    const [data, setData] = useState([])
    const [globalFilter, setGlobalFilter] = useState('')


    const fetchComplain = async () => {
        try {
            const response = await fetch(`${API_URL}/user/event`, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token}`
                }
            })

            const result = await response.json()

            if (response.ok) {

                const data = result?.data;

                setData(data)
            }

        } catch (error) {
            throw new Error(error)
        }
    }

    useEffect(() => {
        if (API_URL && token) {
            fetchComplain()
        }
    }, [API_URL, token])

    const columns = useMemo(() => {
        return [
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

            // Sr No
            columnHelper.display({
                id: "sr_no",
                header: "Sr No",
                cell: ({ row, table }) => (
                    <Typography className="capitalize" color="text.primary">
                        {row.index + 1}
                    </Typography>
                ),
            }),

            // Ticket
            columnHelper.accessor("event_name", {
                header: "Event name",
                cell: ({ row }) => (
                    <Typography>
                        {row.original.event_name}
                    </Typography>
                ),
            }),

            // Complaint Type
            columnHelper.accessor("venue", {
                header: "Venue",
                cell: ({ row }) => (
                    <Typography className="capitalize" color="text.primary">
                        {row.original.venue}
                    </Typography>
                ),
            }),

            // Category
            columnHelper.accessor("start_on_date", {
                header: "Start on date",
                cell: ({ row }) => {

                    return (
                        <Typography className="capitalize" color="text.primary">
                            {row.original?.start_on_date || "-"}
                        </Typography>
                    );
                },
            }),

            columnHelper.accessor("start_on_time", {
                header: "Start on time",
                cell: ({ row }) => {

                    return (
                        <Typography className="capitalize" color="text.primary">
                            {formatTimeTo12Hour(row.original?.start_on_time) || "-"}
                        </Typography>
                    );
                },
            }),


            columnHelper.accessor("end_on_date", {
                header: "End on date",
                cell: ({ row }) => {

                    return (
                        <Typography className="capitalize" color="text.primary">
                            {(row.original?.end_on_date) || "-"}
                        </Typography>
                    );
                },
            }),

            columnHelper.accessor("end_on_time", {
                header: "End on time",
                cell: ({ row }) => {

                    return (
                        <Typography className="capitalize" color="text.primary">
                            {formatTimeTo12Hour(row.original?.end_on_time) || "-"}
                        </Typography>
                    );
                },
            }),

            // Complaint Status
            columnHelper.accessor("status", {
                header: "Status",
                cell: ({ row }) => {

                    const statusMap = {
                        1: "Pending",
                        2: "Completed",
                        3: "Cancelled",
                    };

                    return (
                        <Typography className="capitalize" color="text.primary">
                            {statusMap[row.original?.status] || "Pending"}
                        </Typography>
                    );
                },
            }),
        ];
    }, []);

    const table = useReactTable({
        data: data,
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
        </Card>
    )
}

export default EventTable
