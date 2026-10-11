'use client'

import React, { useEffect, useMemo, useState } from 'react'

import { useSession } from 'next-auth/react'

import {
    Box,
    Typography,
    Card,
    CardContent,
    Button,
    Chip,
    TextField,
    Rating,
    MenuItem,
    Table,
    TableBody,
    Tooltip,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    TablePagination,
    CircularProgress
} from '@mui/material'

import Grid from '@mui/material/Grid2'

import {
    FilterList as FilterIcon,
    Refresh as RefreshIcon
} from '@mui/icons-material'

export default function ComplaintReportDashboard() {
    const { data: session } = useSession()

    const token = session?.user?.token
    const API_URL = process.env.NEXT_PUBLIC_API_URL

    const [data, setData] = useState({
        complain: [],
        towers: [],
        floors: [],
        statusData: [],
        prioritData: [],
        users: [],
        category: []
    })

    const [filters, setFilters] = useState({
        tower: '',
        floor: '',
        category: '',
        nature: '',
        status: '',
        priority: '',
        assignedTo: '',
        resident: ''
    })

    const [page, setPage] = useState(0)
    const [rowsPerPage, setRowsPerPage] = useState(10)

    const [loading, setLoading] = useState(false)

    const fetchData = async (currentFilters = filters) => {
        if (!API_URL || !token) {
            return
        }

        try {
            setLoading(true)

            const params = new URLSearchParams()

            if (currentFilters.tower) {
                params.append(
                    'tower',
                    currentFilters.tower
                )
            }

            if (currentFilters.floor) {
                params.append(
                    'floor',
                    currentFilters.floor
                )
            }

            if (currentFilters.category) {
                params.append(
                    'category',
                    currentFilters.category
                )
            }

            if (currentFilters.nature) {
                params.append(
                    'nature',
                    currentFilters.nature
                )
            }

            if (currentFilters.priority) {
                params.append(
                    'priority',
                    currentFilters.priority
                )
            }

            if (currentFilters.status) {
                params.append(
                    'status',
                    currentFilters.status
                )
            }

            if (currentFilters.assignedTo) {
                params.append(
                    'assignedTo',
                    currentFilters.assignedTo
                )
            }

            if (currentFilters.resident?.trim()) {
                params.append(
                    'resident',
                    currentFilters.resident.trim()
                )
            }

            const queryString = params.toString()

            const response = await fetch(
                `${API_URL}/company/complain/report/data${queryString
                    ? `?${queryString}`
                    : ''
                }`,
                {
                    method: 'GET',
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type':
                            'application/json'
                    },
                    cache: 'no-store'
                }
            )

            const result = await response.json()

            if (!response.ok) {
                throw new Error(
                    result?.message ||
                    'Failed to fetch complaint report'
                )
            }

            setData({
                complain: result?.data?.complain || [],
                towers: result?.data?.towers || [],
                floors: result?.data?.floors || [],
                statusData:
                    result?.data?.statusData || [],
                priorityData: result?.data?.priorityData || [],
                users: result?.data?.users || [],
                category:
                    result?.data?.category || []
            })

            setPage(0)
        } catch (error) {
            console.error(
                'Complaint report error:',
                error
            )
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (API_URL && token) {

            fetchData({
                tower: '',
                floor: '',
                category: '',
                nature: '',
                status: '',
                assignedTo: '',
                priority: '',
                resident: ''
            })
        }
    }, [API_URL, token])

    const handleFilterChange = (
        field,
        value
    ) => {

        setFilters(prev => ({
            ...prev,
            [field]: value
        }))

        setPage(0)
    }

    const handleApplyFilter = () => {
        setPage(0)
        fetchData(filters)
    }

    const resetFilters = () => {
        const emptyFilters = {
            tower: '',
            floor: '',
            category: '',
            nature: '',
            status: '',
            priority: '',
            assignedTo: '',
            resident: ''
        }

        setFilters(emptyFilters)
        setPage(0)

        fetchData(emptyFilters)
    }

    const paginatedComplaints = useMemo(() => {
        const startIndex =
            page * rowsPerPage

        return data.complain.slice(
            startIndex,
            startIndex + rowsPerPage
        )
    }, [
        data.complain,
        page,
        rowsPerPage
    ])

    const handleChangePage = (
        event,
        newPage
    ) => {

        setPage(newPage)
    }

    const handleChangeRowsPerPage = event => {

        setRowsPerPage(
            parseInt(
                event.target.value,
                10
            )
        )

        setPage(0)
    }

    const statusMap = {
        1: 'Pending',
        2: 'Assigned',
        3: 'Resolved',
        4: 'In progress'
    }

    const priorityData = {
        "1": "High",
        "2": "Medium",
        "3": "Low"
    }

    const getStatus = row => {

        const status =
            row?.latest_complain_user
                ?.complaint_status

        return (
            statusMap[status] ||
            statusMap[String(status)] ||
            '-'
        )
    }

    const getFullName = user => {

        if (!user) {
            return '-'
        }

        const name = [
            user.first_name,
            user.last_name
        ]
            .filter(Boolean)
            .join(' ')

        return name || user.email || '-'
    }

    return (
        <Box
            sx={{
                p: 3,
                bgcolor: '#f4f6f8',
                minHeight: '100vh'
            }}
        >
            <Paper
                sx={{
                    p: 3,
                    mb: 3
                }}
                elevation={0}
            >
                <Grid
                    container
                    spacing={2}
                >
                    {/* Tower */}
                    <Grid
                        size={{ xs: 12, sm: 6, md: 3 }}
                    >
                        <TextField
                            select
                            label='Tower / Block'
                            size='small'
                            fullWidth
                            value={
                                filters.tower
                            }
                            onChange={e =>
                                handleFilterChange('tower', e.target.value)
                            }
                        >
                            <MenuItem value=''>
                                All Towers
                            </MenuItem>

                            {data.towers.map(tower => (
                                <MenuItem
                                    key={tower._id}
                                    value={tower._id}
                                >
                                    {tower?.name}
                                </MenuItem>
                            )
                            )}
                        </TextField>
                    </Grid>

                    {/* Floor */}
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}
                    >
                        <TextField
                            select
                            label='Floor'
                            size='small'
                            fullWidth
                            value={filters.floor}
                            onChange={e =>
                                handleFilterChange(
                                    'floor',
                                    e.target.value
                                )
                            }
                        >
                            <MenuItem value=''>
                                All Floors
                            </MenuItem>

                            {data.floors.map(
                                floor => (
                                    <MenuItem
                                        key={floor._id}
                                        value={floor._id}
                                    >
                                        {
                                            floor.floor_name ||
                                            floor.name
                                        }
                                    </MenuItem>
                                )
                            )}
                        </TextField>
                    </Grid>

                    {/* Nature */}
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <TextField
                            select
                            label='Nature'
                            size='small'
                            fullWidth
                            value={
                                filters.nature
                            }
                            onChange={e =>
                                handleFilterChange(
                                    'nature',
                                    e.target.value
                                )
                            }
                        >
                            <MenuItem value=''>
                                All Natures
                            </MenuItem>

                            <MenuItem value='1'>
                                Normal
                            </MenuItem>

                            <MenuItem value='2'>
                                Urgent
                            </MenuItem>

                            <MenuItem value='3'>
                                Emergency
                            </MenuItem>
                        </TextField>
                    </Grid>

                    {/* Category */}
                    <Grid
                        size={{
                            xs: 12,
                            sm: 6,
                            md: 3
                        }}
                    >
                        <TextField
                            select
                            label='Category'
                            size='small'
                            fullWidth
                            value={
                                filters.category
                            }
                            onChange={e =>
                                handleFilterChange(
                                    'category',
                                    e.target.value
                                )
                            }
                        >
                            <MenuItem value=''>
                                All Categories
                            </MenuItem>

                            {data.category.map(
                                category => (
                                    <MenuItem
                                        key={
                                            category._id
                                        }
                                        value={
                                            category._id
                                        }
                                    >
                                        {
                                            category.name
                                        }
                                    </MenuItem>
                                )
                            )}
                        </TextField>
                    </Grid>

                    <Grid
                        size={{
                            xs: 12,
                            sm: 6,
                            md: 3
                        }}
                    >
                        <TextField
                            select
                            label='Priority'
                            size='small'
                            fullWidth
                            value={filters.priority}
                            onChange={e =>
                                handleFilterChange(
                                    'priority',
                                    e.target.value
                                )
                            }
                        >
                            <MenuItem value=''>
                                All Priority
                            </MenuItem>

                            {data?.priorityData?.map(priority => (
                                <MenuItem
                                    key={priority?.value}
                                    value={priority?.value}
                                >
                                    {priority?.title}
                                </MenuItem>
                            ))}
                        </TextField>
                    </Grid>

                    {/* Status */}
                    <Grid
                        size={{
                            xs: 12,
                            sm: 6,
                            md: 3
                        }}
                    >
                        <TextField
                            select
                            label='Status'
                            size='small'
                            fullWidth
                            value={
                                filters.status
                            }
                            onChange={e =>
                                handleFilterChange(
                                    'status',
                                    e.target.value
                                )
                            }
                        >
                            <MenuItem value=''>
                                All Status
                            </MenuItem>

                            {data.statusData.map(
                                status => (
                                    <MenuItem
                                        key={
                                            status.value
                                        }
                                        value={String(
                                            status.value
                                        )}
                                    >
                                        {
                                            status.title
                                        }
                                    </MenuItem>
                                )
                            )}
                        </TextField>
                    </Grid>

                    {/* Assigned To */}
                    <Grid
                        size={{
                            xs: 12,
                            sm: 6,
                            md: 3
                        }}
                    >
                        <TextField
                            select
                            label='Assigned To'
                            size='small'
                            fullWidth
                            value={
                                filters.assignedTo
                            }
                            onChange={e =>
                                handleFilterChange(
                                    'assignedTo',
                                    e.target.value
                                )
                            }
                        >
                            <MenuItem value=''>
                                All Staff
                            </MenuItem>

                            {data.users.map(
                                user => (
                                    <MenuItem
                                        key={
                                            user._id
                                        }
                                        value={
                                            user._id
                                        }
                                    >
                                        {getFullName(
                                            user
                                        )}{' '}
                                        {user.phone
                                            ? `(${user.phone})`
                                            : ''}
                                    </MenuItem>
                                )
                            )}
                        </TextField>
                    </Grid>

                    {/* Resident */}
                    <Grid
                        size={{
                            xs: 12,
                            sm: 6,
                            md: 3
                        }}
                    >
                        <TextField
                            label='Resident Name / Phone'
                            size='small'
                            fullWidth
                            value={
                                filters.resident
                            }
                            onChange={e =>
                                handleFilterChange(
                                    'resident',
                                    e.target.value
                                )
                            }
                            onKeyDown={e => {
                                if (
                                    e.key ===
                                    'Enter'
                                ) {
                                    handleApplyFilter()
                                }
                            }}
                        />
                    </Grid>

                    {/* Buttons */}
                    <Grid
                        size={{ xs: 12 }}
                        sx={{
                            display: 'flex',
                            justifyContent:
                                'flex-end',
                            gap: 1
                        }}
                    >
                        <Button
                            variant='contained'
                            startIcon={
                                loading ? (
                                    <CircularProgress
                                        size={18}
                                        color='inherit'
                                    />
                                ) : (
                                    <FilterIcon />
                                )
                            }
                            onClick={
                                handleApplyFilter
                            }
                            disabled={loading}
                        >
                            Apply Filter
                        </Button>

                        <Button
                            variant='outlined'
                            startIcon={
                                <RefreshIcon />
                            }
                            onClick={resetFilters}
                            disabled={loading}
                        >
                            Reset
                        </Button>
                    </Grid>
                </Grid>
            </Paper>

            <Grid
                container
                spacing={2}
                sx={{ mb: 3 }}
            >
                <Grid
                    size={{
                        xs: 12,
                        sm: 6,
                        md: 3
                    }}
                >
                    <Card elevation={0}>
                        <CardContent>
                            <Typography variant='body2'>
                                Total Complaints
                            </Typography>

                            <Typography variant='h5'>
                                {data.complain
                                    .length}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid
                    size={{
                        xs: 12,
                        sm: 6,
                        md: 3
                    }}
                >
                    <Card elevation={0}>
                        <CardContent>
                            <Typography variant='body2'>
                                Current Result
                            </Typography>

                            <Typography variant='h5'>
                                {data.complain
                                    .length}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* -------------------------------------------------
                TABLE
            ------------------------------------------------- */}
            <Paper elevation={0}>
                <Box
                    sx={{
                        p: 2,
                        borderBottom:
                            '1px solid #e2e8f0'
                    }}
                >
                    <Typography variant='h6'>
                        Complaint Details
                    </Typography>
                </Box>

                <TableContainer>
                    <Table size='small'>
                        <TableHead
                            sx={{
                                bgcolor: '#f8fafc'
                            }}
                        >
                            <TableRow>
                                <TableCell>
                                    Complaint No
                                </TableCell>

                                <TableCell>
                                    Resident
                                </TableCell>

                                <TableCell>
                                    Nature
                                </TableCell>

                                <TableCell>
                                    Category
                                </TableCell>

                                <TableCell>
                                    Description
                                </TableCell>

                                <TableCell>
                                    Priority
                                </TableCell>

                                <TableCell>
                                    Assigned To
                                </TableCell>

                                <TableCell>Rating</TableCell>

                                <TableCell>
                                    Status
                                </TableCell>
                            </TableRow>
                        </TableHead>

                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell
                                        colSpan={7}
                                        align='center'
                                        sx={{
                                            py: 5
                                        }}
                                    >
                                        <CircularProgress />
                                    </TableCell>
                                </TableRow>
                            ) : paginatedComplaints.length >
                                0 ? (
                                paginatedComplaints.map(
                                    row => (
                                        <TableRow
                                            key={
                                                row._id
                                            }
                                            hover
                                        >
                                            {/* Complaint No */}
                                            <TableCell
                                                sx={{
                                                    fontWeight: 600
                                                }}
                                            >
                                                {row.complain_no ||
                                                    row._id ||
                                                    '-'}
                                            </TableCell>

                                            {/* Resident */}
                                            <TableCell>
                                                {getFullName(
                                                    row.created_by
                                                )}

                                                {row
                                                    .created_by
                                                    ?.phone && (
                                                        <Typography
                                                            variant='caption'
                                                            display='block'
                                                            color='text.secondary'
                                                        >
                                                            {
                                                                row
                                                                    .created_by
                                                                    .phone
                                                            }
                                                        </Typography>
                                                    )}
                                            </TableCell>

                                            {/* Nature */}
                                            <TableCell>
                                                {row
                                                    .nature_data
                                                    ?.title ||
                                                    '-'}
                                            </TableCell>

                                            {/* Category */}
                                            <TableCell>
                                                {row
                                                    .category
                                                    ?.name ||
                                                    '-'}
                                            </TableCell>

                                            {/* Description */}
                                            <TableCell>
                                                {row.description ||
                                                    '-'}
                                            </TableCell>

                                            <TableCell>
                                                <Chip
                                                    label={priorityData?.[row?.priority || "3"]}
                                                    color={
                                                        row?.priority === "1"
                                                            ? "error"
                                                            : row?.priority === "2"
                                                                ? "warning"
                                                                : "success"
                                                    }
                                                    size="small"
                                                />
                                            </TableCell>

                                            {/* Assigned */}
                                            <TableCell>
                                                {getFullName(
                                                    row.assigned_user
                                                )}

                                                {row.assigned_user?.phone && (
                                                    <Typography
                                                        variant='caption'
                                                        display='block'
                                                        color='text.secondary'
                                                    >
                                                        {row.assigned_user.phone}
                                                    </Typography>
                                                )}
                                            </TableCell>

                                            <TableCell>
                                                {row?.feedbackLog?.rating ? (
                                                    <Rating
                                                        value={row.feedbackLog.rating}
                                                        readOnly
                                                        size="small"
                                                        sx={{
                                                            "& .MuiRating-iconFilled": {
                                                                color: "#fbc02d",
                                                            },
                                                            "& .MuiRating-iconEmpty": {
                                                                color: "rgba(255,255,255,0.3)", // if tooltip background is dark
                                                            },
                                                        }}
                                                    />
                                                ) : (
                                                    <Typography>No Rating Found</Typography>
                                                )}
                                            </TableCell>

                                            {/* Status */}
                                            <TableCell>
                                                {getStatus(
                                                    row
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    )
                                )
                            ) : (
                                <TableRow>
                                    <TableCell
                                        colSpan={7}
                                        align='center'
                                        sx={{
                                            py: 4
                                        }}
                                    >
                                        No complaints
                                        found
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>

                <TablePagination
                    component='div'
                    count={
                        data.complain.length
                    }
                    page={page}
                    onPageChange={
                        handleChangePage
                    }
                    rowsPerPage={
                        rowsPerPage
                    }
                    onRowsPerPageChange={
                        handleChangeRowsPerPage
                    }
                    rowsPerPageOptions={[
                        5,
                        10,
                        25,
                        50,
                        100
                    ]}
                />
            </Paper>
        </Box >
    )
}
