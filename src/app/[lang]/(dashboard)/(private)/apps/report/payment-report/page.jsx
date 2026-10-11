'use client'

import { useState, useMemo, useEffect, useRef } from 'react'

import dynamic from 'next/dynamic'

import { useSession } from 'next-auth/react'

import {
    TabContext,
    TabList,
    TabPanel
} from '@mui/lab'

import { Controller, useForm } from 'react-hook-form'

import {
    Tab,
    Checkbox,
    Box,
    Stack,
    Card,
    Dialog,
    TextField,
    Button,
    CardHeader,
    MenuItem,
    CardContent,
    Typography,
} from '@mui/material'

import dayjs from 'dayjs'

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

import { useTheme } from '@mui/material/styles'

import AppReactDatepicker from '@/libs/styles/AppReactDatepicker';

import OptionMenu from '@core/components/option-menu'

import CustomAvatar from '@core/components/mui/Avatar'

import TablePaginationComponent from '@components/TablePaginationComponent'

import CustomTextField from '@/@core/components/mui/TextField'

import tableStyles from '@core/styles/table.module.css'

import FormatTime from '@/utils/formatTime'

import DialogCloseButton from '@/components/dialogs/DialogCloseButton'

const AppReactApexCharts = dynamic(() => import('@/libs/styles/AppReactApexCharts'))

const columnHelper = createColumnHelper()

const fuzzyFilter = (row, columnId, value, addMeta) => {
    const itemRank = rankItem(row.getValue(columnId), value)

    addMeta({ itemRank })

    return itemRank.passed
}

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

const EarningReportsWithTabs = () => {
    // States
    const [value, setValue] = useState('All')
    const [reportData, setReportData] = useState([])

    // Hooks
    const theme = useTheme()
    const { data: session } = useSession() || {}
    const token = session?.user?.token
    const URL = process.env.NEXT_PUBLIC_API_URL

    // Vars
    const disabledText = 'var(--mui-palette-text-disabled)'

    // Tab change
    const handleChange = (event, newValue) => {
        setValue(newValue)
    }

    // Fetch data
    const fetchGraphicalReport = async () => {
        try {
            const response = await fetch(`${URL}/company/graph/payment/report/${value}`, {
                method: "GET",
                headers: { Authorization: `Bearer ${token}` }
            })

            const result = await response.json()

            if (response.ok) {
                setReportData(result?.data || [])
            } else {
                setReportData([])
            }
        } catch (error) {
            console.error("Error fetching report:", error)
            setReportData([])
        }
    }

    useEffect(() => {
        if (URL && token && value) {
            fetchGraphicalReport()
        }
    }, [URL, token, value])

    // Tabs
    const tabData = [
        { type: 'All', avatarIcon: 'tabler-shopping-cart' },
        { type: 'Utility', avatarIcon: 'tabler-chart-bar' },
        { type: 'Common Area', avatarIcon: 'tabler-currency-dollar' },
        { type: 'Maintenance', avatarIcon: 'tabler-chart-pie-2' }
    ]

    const renderTabs = currentValue => {
        return tabData.map((item, index) => (
            <Tab
                key={index}
                value={item.type}
                className='mie-4'
                label={
                    <div
                        className={classnames(
                            'flex flex-col items-center justify-center gap-2 is-[110px] bs-[100px] border rounded-xl',
                            item.type === currentValue ? 'border-solid border-[var(--mui-palette-primary-main)]' : 'border-dashed'
                        )}
                    >
                        <CustomAvatar
                            variant='rounded'
                            skin='light'
                            size={38}
                            {...(item.type === currentValue && { color: 'primary' })}
                        >
                            <i
                                className={classnames(
                                    'text-[22px]',
                                    { 'text-textSecondary': item.type !== currentValue },
                                    item.avatarIcon
                                )}
                            />
                        </CustomAvatar>
                        <Typography className='font-medium capitalize' color='text.primary'>
                            {item.type}
                        </Typography>
                    </div>
                }
            />
        ))
    }

    const renderTabPanels = (currentValue, theme, options, colors) => {

        const max = reportData.length > 0 ? Math.max(...reportData) : 0

        const seriesIndex = reportData.indexOf(max)

        const finalColors = colors.map((color, i) =>
            seriesIndex === i ? 'var(--mui-palette-primary-main)' : color
        )

        return tabData.map((item, index) => (
            <TabPanel key={index} value={item.type} className='!p-0'>
                {item.type === currentValue && (
                    <AppReactApexCharts
                        type='bar'
                        height={233}
                        width='100%'
                        options={{ ...options, colors: finalColors }}
                        series={[{ data: reportData }]}
                    />
                )}
            </TabPanel>
        ))
    }

    // Chart config
    const colors = Array(12).fill('var(--mui-palette-primary-lightOpacity)')

    const options = {
        chart: { parentHeightOffset: 0, toolbar: { show: false } },
        plotOptions: {
            bar: {
                borderRadius: 6,
                distributed: true,
                columnWidth: '33%',
                borderRadiusApplication: 'end',
                dataLabels: { position: 'top' }
            }
        },
        legend: { show: false },
        tooltip: { enabled: false },
        dataLabels: {
            offsetY: -11,
            formatter: val => `${val}k`,
            style: {
                fontWeight: 500,
                colors: ['var(--mui-palette-text-primary)'],
                fontSize: theme.typography.body1.fontSize
            }
        },
        colors,
        states: {
            hover: { filter: { type: 'none' } },
            active: { filter: { type: 'none' } }
        },
        grid: {
            show: false,
            padding: { top: -19, left: -4, right: 0, bottom: -11 }
        },
        xaxis: {
            axisTicks: { show: false },
            axisBorder: { color: 'var(--mui-palette-divider)' },
            categories: [
                'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
            ],
            labels: {
                style: {
                    colors: disabledText,
                    fontFamily: theme.typography.fontFamily,
                    fontSize: theme.typography.body2.fontSize
                }
            }
        },
        yaxis: {
            labels: {
                offsetX: -18,
                formatter: val => `₹${val}k`,
                style: {
                    colors: disabledText,
                    fontFamily: theme.typography.fontFamily,
                    fontSize: theme.typography.body2.fontSize
                }
            }
        },
        responsive: [
            {
                breakpoint: 1450,
                options: { plotOptions: { bar: { columnWidth: '45%' } } }
            },
            {
                breakpoint: 600,
                options: {
                    dataLabels: { style: { fontSize: theme.typography.body2.fontSize } },
                    plotOptions: { bar: { columnWidth: '58%' } }
                }
            },
            {
                breakpoint: 500,
                options: { plotOptions: { bar: { columnWidth: '70%' } } }
            }
        ]
    }

    return (
        <Card>
            <CardHeader
                title='Payment Report'
                subheader='Yearly Earnings Overview'
                action={<OptionMenu options={['Last Week', 'Last Month', 'Last Year']} />}
            />
            <CardContent>
                <TabContext value={value}>
                    <TabList
                        variant='scrollable'
                        scrollButtons='auto'
                        onChange={handleChange}
                        aria-label='earning report tabs'
                        className='!border-0 mbe-10'
                        sx={{
                            '& .MuiTabs-indicator': { display: 'none !important' },
                            '& .MuiTab-root': { padding: '0 !important', border: '0 !important' }
                        }}
                    >
                        {renderTabs(value)}
                    </TabList>
                    {renderTabPanels(value, theme, options, colors)}
                </TabContext>
            </CardContent>
        </Card>
    )
}

const PaidAmountModal = ({ open, data, setIsOpen }) => {

    const [globalFilter, setGlobalFilter] = useState('')
    const [rowSelection, setRowSelection] = useState({})

    const columns = useMemo(() => {

        const baseColumns = [];

        baseColumns.splice(
            1,
            0,
            columnHelper.accessor("sn_no", {
                header: "SNo",
                cell: ({ row }) => (
                    <Typography className="capitalize" color="text.primary">
                        {row.index + 1}
                    </Typography>
                ),
            })
        );

        baseColumns.splice(
            2,
            0,
            columnHelper.accessor("user", {
                header: "User",
                cell: ({ row }) => {

                    if (data?.apartment_id?.assigned_to) {

                        return <Typography className="capitalize" color="text.primary">
                            {data.apartment_id.assigned_to.first_name} {" "} {data.apartment_id.assigned_to.last_name}
                        </Typography>
                    } else if (row?.original?.user_bill_id?.user_id) {
                        return <Typography>
                            {row?.original?.user_bill_id?.user_id?.first_name} {" "} {row?.original?.user_bill_id?.user_id?.last_name}
                        </Typography>
                    } else {
                        return ("-")
                    }

                }
            })
        );

        baseColumns.splice(
            3,
            0,
            columnHelper.accessor("Paid_amount", {
                header: "Paid amount",
                cell: ({ row }) => (
                    <Typography className="capitalize" color="text.primary">
                        {row.original.amount}
                    </Typography>
                ),
            })
        );

        baseColumns.splice(
            4,
            0,
            columnHelper.accessor("created_at", {
                header: "Payment date",
                cell: ({ row }) => (
                    <Typography className="capitalize" color="text.primary">
                        {FormatTime(row.original.created_at)}
                    </Typography>
                ),
            })
        );

        return baseColumns;
    }, [data]);

    const table = useReactTable({
        data: data?.payments || [],
        columns,
        filterFns: { fuzzy: fuzzyFilter },
        state: { globalFilter },
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
        <Dialog
            fullWidth
            maxWidth="sm"
            scroll="body"
            open={open}
            sx={{ "& .MuiDialog-paper": { overflow: "visible" } }}
        >
            <DialogCloseButton
                onClick={() => {
                    setIsOpen(false);
                }}
            >
                <i className="tabler-x" />
            </DialogCloseButton>
            {/* <DialogContent> */}
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
            {/* </DialogContent> */}
        </Dialog>

    )
}

// 🔹 Main Component

const PaymentReport = () => {
    const { data: session } = useSession() || {}
    const token = session?.user?.token
    const URL = process.env.NEXT_PUBLIC_API_URL

    const myDateRef = useRef(null);

    const [type, setType] = useState("all")
    const [value, setValue] = useState("graphical")
    const [isOpen, setIsOpen] = useState(false)
    const [filteredData, setFilteredData] = useState([])
    const [globalFilter, setGlobalFilter] = useState("")
    const [rowSelection, setRowSelection] = useState({})
    const [paidData, setPaidData] = useState(null)

    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)

    const { control, formState: { errors } } = useForm()

    const [startDateRange, setStartDateRange] = useState(
        dayjs().startOf("day").toDate()
    );

    const [endDateRange, setEndDateRange] = useState(
        dayjs().endOf("day").toDate()
    );

    const handleTabChange = (e, newValue) => {
        setValue(newValue)
    }

    const fetchTablePaymentData = async () => {
        setLoading(true)
        setError(null)

        try {
            const response = await fetch(`${URL}/company/table/payment/report/${startDateRange.toISOString()}/${endDateRange.toISOString()}/${type}`, {
                method: "GET",
                headers: { Authorization: `Bearer ${token}` },
            })

            const result = await response.json()

            if (response.ok) {

                setFilteredData(result.data || [])
            } else {
                setError(result?.message || "Something went wrong")
            }
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (startDateRange && endDateRange && type && URL && token) {
            fetchTablePaymentData()
        }
    }, [startDateRange, endDateRange, type, URL, token])

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
        ]

        baseColumns.push(
            columnHelper.accessor("bill_types", {
                header: "Bill Type",
                cell: ({ row }) => {
                    const billType = row.original.bill_data_type || []

                    if (billType == "utilityBills") {
                        return <Typography>{"Utlity Bill"}</Typography>
                    } else if (billType == "maintenance") {
                        return <Typography>{"Maintenance"}</Typography>
                    } else {
                        return <Typography>{"Common Area Bill"}</Typography>
                    }
                },
            }),
            columnHelper.accessor("paid_amount", {
                header: "Paid Amount",
                cell: ({ row }) => {
                    const totalPaid = row.original.payments?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0

                    return (
                        <Typography>
                            {totalPaid > 0 ? (
                                <Button
                                    onClick={() => {
                                        setIsOpen(true)
                                        setPaidData(row.original)
                                    }}
                                >
                                    {totalPaid}
                                </Button>
                            ) : (
                                totalPaid
                            )}
                        </Typography>
                    )
                },
            }),
        )

        return baseColumns
    }, [])

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
        getFacetedMinMaxValues: getFacetedMinMaxValues(),
    })

    return (
        <>
            <TabContext value={value}>
                <TabList variant="scrollable" onChange={handleTabChange} className="border-b px-0 pt-0">
                    <Tab key={1} label="Graphical" value="graphical" />
                    <Tab key={2} label="Tabular" value="tabular" />
                </TabList>

                <div className="pt-0 mt-4">
                    {/* Graphical */}
                    <TabPanel value="graphical" className="p-0">
                        <EarningReportsWithTabs />
                    </TabPanel>

                    {/* Tabular */}
                    <TabPanel value="tabular" className="p-0">
                        <Card>
                            <CardContent className="flex justify-between flex-col gap-4 items-start sm:flex-row sm:items-center">
                                <div className="flex items-center gap-2">
                                    <Typography>Show</Typography>
                                    <CustomTextField
                                        select
                                        value={table.getState().pagination.pageSize}
                                        onChange={(e) => table.setPageSize(Number(e.target.value))}
                                        className="max-sm:is-full sm:is-[70px]"
                                    >
                                        <MenuItem value={10}>10</MenuItem>
                                        <MenuItem value={25}>25</MenuItem>
                                        <MenuItem value={50}>50</MenuItem>
                                    </CustomTextField>
                                </div>

                                {/* Filters Row */}
                                <div className="flex gap-4 flex-row">
                                    <Controller
                                        name="date"
                                        control={control}
                                        render={({ field }) => (
                                            <AppReactDatepicker
                                                todayButton="Today"
                                                selectsRange
                                                fullWidth
                                                monthsShown={2}
                                                startDate={field.value?.[0] || startDateRange}
                                                endDate={field.value?.[1] || endDateRange}
                                                onChange={(dates) => {
                                                    const [start, end] = dates

                                                    setStartDateRange(start)
                                                    setEndDateRange(end)
                                                    field.onChange(dates) // react-hook-form को update करें
                                                }}
                                                showYearDropdown
                                                showMonthDropdown
                                                dateFormat="yyyy/MM/dd"
                                                placeholderText="YYYY/MM/DD"
                                                customInput={
                                                    <TextField
                                                        size="small"
                                                        fullWidth
                                                        style={{ width: "200px" }}
                                                        label="Date"
                                                        error={!!errors?.date}
                                                        helperText={errors?.date?.message}
                                                        inputRef={myDateRef} // ref यहां लगाएं
                                                    />
                                                }
                                            />
                                        )}
                                    />



                                    <TextField
                                        select
                                        style={{ width: "200px" }}
                                        fullWidth
                                        size="small"
                                        required
                                        label="Bill Type"
                                        value={type}
                                        onChange={(e) => setType(e.target.value)}
                                    >
                                        <MenuItem value="" disabled>
                                            Select Bill Type
                                        </MenuItem>
                                        <MenuItem value="all">All</MenuItem>
                                        <MenuItem value="utilityBills">Utility Bill</MenuItem>
                                        <MenuItem value="common-area-bill">Common Area Bill</MenuItem>
                                        <MenuItem value="maintenance">Maintenance</MenuItem>
                                    </TextField>
                                </div>
                            </CardContent>

                            {/* Table */}
                            <div className="overflow-x-auto">
                                <table className={tableStyles.table}>
                                    <thead>
                                        {table.getHeaderGroups().map((headerGroup) => (
                                            <tr key={headerGroup.id}>
                                                {headerGroup.headers.map((header) => (
                                                    <th key={header.id}>
                                                        {header.isPlaceholder ? null : (
                                                            <div
                                                                className={classnames({
                                                                    "flex items-center": header.column.getIsSorted(),
                                                                    "cursor-pointer select-none": header.column.getCanSort(),
                                                                })}
                                                                onClick={header.column.getToggleSortingHandler()}
                                                            >
                                                                {flexRender(header.column.columnDef.header, header.getContext())}
                                                                {{
                                                                    asc: <i className="tabler-chevron-up text-xl" />,
                                                                    desc: <i className="tabler-chevron-down text-xl" />,
                                                                }[header.column.getIsSorted()] ?? null}
                                                            </div>
                                                        )}
                                                    </th>
                                                ))}
                                            </tr>
                                        ))}
                                    </thead>
                                    <tbody>
                                        {loading ? (
                                            <tr>
                                                <td colSpan={table.getVisibleFlatColumns().length} className="text-center">
                                                    Loading...
                                                </td>
                                            </tr>
                                        ) : error ? (
                                            <tr>
                                                <td colSpan={table.getVisibleFlatColumns().length} className="text-center">
                                                    {error}
                                                </td>
                                            </tr>
                                        ) : table.getFilteredRowModel().rows.length === 0 ? (
                                            <tr>
                                                <td colSpan={table.getVisibleFlatColumns().length} className="text-center">
                                                    No data available
                                                </td>
                                            </tr>
                                        ) : (
                                            table.getRowModel().rows.map((row) => (
                                                <tr key={row.id} className={classnames({ selected: row.getIsSelected() })}>
                                                    {row.getVisibleCells().map((cell) => (
                                                        <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                                                    ))}
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            <TablePaginationComponent table={table} />
                        </Card>
                    </TabPanel>
                </div>
            </TabContext>

            {/* 🔹 Payment Modal */}
            {isOpen && (
                <PaidAmountModal open={isOpen} setIsOpen={setIsOpen} data={paidData} />
            )}
        </>
    )
}

export default PaymentReport
