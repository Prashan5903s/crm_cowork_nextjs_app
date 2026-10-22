'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';

import {
    Alert,
    Avatar,
    Box,
    Button,
    Chip,
    CircularProgress,
    InputAdornment,
    MenuItem,
    Paper,
    Select,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    ToggleButton,
    ToggleButtonGroup,
    Typography,
} from '@mui/material';

import {
    CheckCircleOutline as CheckCircleOutlineIcon,
    Build as BuildIcon,
    DeleteOutline as DeleteOutlineIcon,
    EditOutlined,
    GridView as GridViewIcon,
    ViewList as ViewListIcon,
    Search as SearchIcon,
    Apartment as ApartmentIcon,
    Add as AddIcon,
    Description as DescriptionIcon,
} from '@mui/icons-material';

import { useApi } from '@/utils/api';

const STATUS_COLORS = {
    ACTIVE: { bg: '#dcfce7', fg: '#15803d' },
    INACTIVE: { bg: '#ffedd5', fg: '#c2410c' },
};

const STAT_CARDS = [
    {
        key: 'total',
        label: 'TOTAL Department',
        icon: DescriptionIcon,
        gradient: 'linear-gradient(135deg, #2563eb, #6366f1)',
    },
    {
        key: 'ACTIVE',
        label: 'ACTIVE',
        icon: CheckCircleOutlineIcon,
        gradient: 'linear-gradient(135deg, #16a34a, #10b981)',
    },
    {
        key: 'INACTIVE',
        label: 'INACTIVE',
        icon: BuildIcon,
        gradient: 'linear-gradient(135deg, #ea580c, #f59e0b)',
    },
];

const ASSET_URL = process.env.NEXT_PUBLIC_ASSETS_URL

function DepartmentCard({ department, onEdit }) {

    return (
        <Paper
            variant="outlined"
            sx={{
                p: 2.25,
                borderRadius: 3,
                borderColor: '#e5e7eb',
                height: '100%',
                transition: 'border-color 0.2s, box-shadow 0.2s',
                '&:hover': {
                    borderColor: '#cbd5e1',
                    boxShadow: '0 5px 16px rgba(15,23,42,0.06)',
                },
            }}
        >
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                    mb: 2,
                    minWidth: 0,
                }}
            >
                <Avatar
                    sx={{
                        width: 46,
                        height: 46,
                        flexShrink: 0,
                        bgcolor: '#eef2ff',
                        color: '#4338ca',
                        fontWeight: 700,
                    }}
                >
                    {(department?.name?.charAt(0)?.toUpperCase() || 'V')}
                </Avatar>

                <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Typography
                        sx={{
                            fontWeight: 700,
                            fontSize: 15,
                            overflowWrap: 'anywhere',
                        }}
                    >
                        {department.name}
                    </Typography>
                </Box>
                <Button
                    variant="outlined"
                    size="small"
                    startIcon={<EditOutlined />}
                    onClick={() => onEdit(department)}
                    sx={{
                        textTransform: "none",
                        flexShrink: 0,
                    }}
                >
                    Edit
                </Button>
            </Box>

            <Box
                sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: 1,
                    py: 1.25,
                    borderTop: '1px solid #f1f5f9',
                }}
            >
                <Typography variant="body2" color="text.secondary">
                    Status
                </Typography>
                <StatusChip status={department.status} />
            </Box>
        </Paper>
    );
}

function extractdepartments(response) {
    const candidates = [
        response?.departments,
        response?.data?.departments,
        response?.data?.data?.departments,
        response?.data?.data,
        response?.data,
        response,
    ];

    for (const candidate of candidates) {
        if (Array.isArray(candidate)) {
            return candidate;
        }
    }

    return null;
}

function normalizedepartment(department = {}) {

    const rawStatus = String(department.status ?? 'ACTIVE').toUpperCase();


    return {
        ...department,
        _id: department._id || department.id || '',
        id: String(department.id || department._id || ''),
        name: String(department?.name ?? "Unnamed department"),
        image: String(department?.image),
        category: String(
            typeof department.department_category_id === 'object'
                ? department.department_category_id?.name || ''
                : department.department_category_id || ''
        ),
        status: STATUS_COLORS[rawStatus] ? rawStatus : 'ACTIVE',
    };
}

function StatCard({ label, value, icon: Icon, gradient }) {
    return (
        <Paper
            elevation={0}
            sx={{
                position: 'relative',
                overflow: 'hidden',
                minHeight: 125,
                p: 2.5,
                borderRadius: 3,
                color: '#fff',
                background: gradient,
                boxShadow: '0 4px 14px rgba(0,0,0,0.10)',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                '&:hover': {
                    transform: 'translateY(-3px)',
                    boxShadow: '0 8px 20px rgba(0,0,0,0.14)',
                },
            }}
        >
            <Typography
                sx={{
                    fontSize: 12,
                    fontWeight: 700,
                    letterSpacing: 0.5,
                    opacity: 0.95,
                    color: "white"
                }}
            >
                {label}
            </Typography>

            <Typography
                sx={{
                    mt: 1.5,
                    fontSize: { xs: 30, sm: 36 },
                    fontWeight: 800,
                    lineHeight: 1.1,
                    color: "white"
                }}
            >
                {value ?? 0}
            </Typography>

            <Box
                sx={{
                    position: 'absolute',
                    right: 16,
                    bottom: 16,
                    width: 48,
                    height: 48,
                    borderRadius: '50%',
                    bgcolor: 'rgba(255,255,255,0.17)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                <Icon sx={{ fontSize: 27 }} />
            </Box>
        </Paper>
    );
}

function StatusChip({ status }) {

    const normalizedStatus = String(status ?? 'ACTIVE').toUpperCase();
    const colors = STATUS_COLORS[normalizedStatus] || STATUS_COLORS.ACTIVE;

    const label = {
        ACTIVE: 'Active',
        INACTIVE: 'Inactive',
    }[normalizedStatus] || 'Active';

    return (
        <Chip
            size="small"
            label={label}
            sx={{
                height: 27,
                bgcolor: colors.bg,
                color: colors.fg,
                fontWeight: 700,
                borderRadius: 1.5,
                '& .MuiChip-label': { px: 1.25 },
            }}
        />
    );
}

function EmptyState({ message }) {
    return (
        <Box
            sx={{
                py: 7,
                px: 2,
                textAlign: 'center',
                border: '1px dashed #d1d5db',
                borderRadius: 3,
                bgcolor: '#fafafa',
            }}
        >
            <DescriptionIcon sx={{ fontSize: 38, color: '#9ca3af', mb: 1 }} />

            <Typography fontWeight={700}>{message}</Typography>

            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                Try changing your search or filters.
            </Typography>
        </Box>
    );
}

export default function DepartmentDashboard() {

    const router = useRouter();
    const params = useParams();
    const lang = params?.lang;

    const { doGet, token } = useApi();

    const [departmentData, setDepartmentData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [view, setView] = useState('grid');
    const [search, setSearch] = useState('');
    const [status, setStatus] = useState('ALL');

    const loadDepartments = useCallback(async () => {
        if (!token) {
            setLoading(false);
            return;
        }

        setLoading(true);
        setError('');

        try {
            const response = await doGet('company/department/log/data');
            const records = extractdepartments(response);

            if (records === null) {
                throw new Error(
                    'Invalid Department API response. Expected an departments array.'
                );
            }

            setDepartmentData(records.map(normalizedepartment));
        } catch (err) {
            setError(err?.message || 'Unable to load departments.');
            setDepartmentData([]);
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        loadDepartments();
    }, [loadDepartments]);

    const counts = useMemo(() => {
        const result = {
            total: departmentData.length,
            ACTIVE: 0,
            MAINTENANCE: 0,
            DISPOSED: 0,
        };

        departmentData.forEach((department) => {
            if (Object.prototype.hasOwnProperty.call(result, department.status)) {
                result[department.status] += 1;
            }
        });

        return result;
    }, [departmentData]);

    const filteredDepartments = useMemo(() => {
        const query = search.trim().toLowerCase();

        return departmentData.filter((department) => {
            const matchesSearch =
                !query ||
                [
                    department.name,
                    department?.department_category_id?.name,
                ].some((value) =>
                    String(value || '').toLowerCase().includes(query)
                );

            const matchesStatus = status === 'ALL' || department.status === status;

            return matchesSearch && matchesStatus;
        });
    }, [departmentData, search, status]);

    const handleCreateDepartment = () => {
        router.push(`/${lang}/apps/department/create`);
    };

    const onEdit = (data) => {

        const ids = data?.id ?? data?._id

        router.push(`/${lang}/apps/department/create/${ids}`)
    }

    return (
        <Box
            sx={{
                width: '100%',
                minWidth: 0,
                p: { xs: 2, sm: 2.5, md: 3 },
                boxSizing: 'border-box',
            }}
        >
            {/* Header */}
            <Box
                sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: { xs: 'flex-start', sm: 'center' },
                    flexWrap: 'wrap',
                    gap: 2,
                    mb: 3,
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <ApartmentIcon sx={{ color: "primary.main", fontSize: 32 }} />

                    <Box>
                        <Typography
                            variant="h4"
                            sx={{
                                fontSize: { xs: 25, sm: 30 },
                                fontWeight: 800,
                                lineHeight: 1.2,
                            }}
                        >
                            Department
                        </Typography>

                        <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ mt: 0.5 }}
                        >
                            Manage and track your company departments
                        </Typography>
                    </Box>
                </Box>

                <Button
                    variant="contained"
                    size="mid"
                    startIcon={<AddIcon />}
                    onClick={handleCreateDepartment}
                >
                    Create Department
                </Button>
            </Box>

            {/* Summary cards */}
            <Box
                sx={{
                    display: 'grid',
                    gridTemplateColumns: {
                        xs: '1fr',
                        sm: 'repeat(2, minmax(0, 1fr))',
                        lg: 'repeat(4, minmax(0, 1fr))',
                    },
                    gap: 2,
                    mb: 3,
                }}
            >
                {STAT_CARDS.map(({ key, ...card }) => (
                    <StatCard
                        key={key}
                        {...card}
                        value={counts[key]}
                    />
                ))}
            </Box>

            {/* Search and filters */}
            <Paper
                variant="outlined"
                sx={{
                    p: { xs: 1.5, sm: 2 },
                    borderRadius: 3,
                    borderColor: '#e5e7eb',
                    mb: 2,
                }}
            >
                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: 1.5,
                    }}
                >
                    <TextField
                        fullWidth
                        placeholder="Search by name, department ID or serial number"
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        sx={{
                            flex: '1 1 280px',
                            '& .MuiOutlinedInput-root': {
                                minHeight: 46,
                                borderRadius: 2,
                            },
                        }}
                        slotProps={{
                            input: {
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchIcon color="action" />
                                    </InputAdornment>
                                ),
                            },
                        }}
                    />

                    <Select
                        value={status}
                        onChange={(event) => setStatus(event.target.value)}
                        displayEmpty
                        sx={{
                            minWidth: { xs: '100%', sm: 155 },
                            minHeight: 46,
                            borderRadius: 2,
                        }}
                    >
                        <MenuItem value="ALL">All Status</MenuItem>
                        <MenuItem value="ACTIVE">Active</MenuItem>
                        <MenuItem value="INACTIVE">Inactive</MenuItem>
                    </Select>

                    <ToggleButtonGroup
                        exclusive
                        value={view}
                        onChange={(_, nextView) => {
                            if (nextView) setView(nextView);
                        }}
                        sx={{
                            minHeight: 46,
                            bgcolor: '#f3f4f6',
                            borderRadius: 2,
                            p: 0.5,
                            '& .MuiToggleButton-root': {
                                border: 0,
                                borderRadius: 1.5,
                                px: 1.5,
                                color: '#64748b',
                            },
                            '& .Mui-selected': {
                                bgcolor: '#fff !important',
                                color: `primary.main !important`,
                                boxShadow: '0 1px 4px rgba(0,0,0,0.10)',
                            },
                        }}
                    >
                        <ToggleButton value="list" aria-label="List view">
                            <ViewListIcon />
                        </ToggleButton>

                        <ToggleButton value="grid" aria-label="Grid view">
                            <GridViewIcon />
                        </ToggleButton>
                    </ToggleButtonGroup>
                </Box>
            </Paper>

            {/* Results information */}
            <Box
                sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: 1,
                    mb: 2,
                }}
            >
                <Typography variant="body2" color="text.secondary">
                    Showing{' '}
                    <Box component="span" sx={{ fontWeight: 800, color: 'text.primary' }}>
                        {filteredDepartments.length}
                    </Box>{' '}
                    of{' '}
                    <Box component="span" sx={{ fontWeight: 800, color: 'text.primary' }}>
                        {departmentData.length}
                    </Box>{' '}
                    Departments
                </Typography>

                <Button
                    variant="text"
                    size="small"
                    onClick={() => {
                        setSearch('');
                        setStatus('ALL');
                    }}
                    sx={{
                        textTransform: 'none',
                        color: "primary.main",
                        fontWeight: 700,
                    }}
                >
                    Clear filters
                </Button>
            </Box>

            {/* Error state */}
            {error && (
                <Alert
                    severity="error"
                    sx={{ mb: 2, borderRadius: 2 }}
                    action={
                        <Button
                            color="inherit"
                            size="small"
                            onClick={loadDepartments}
                        >
                            Retry
                        </Button>
                    }
                >
                    {error}
                </Alert>
            )}

            {/* Loading state */}
            {loading ? (
                <Box
                    sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        py: 9,
                        gap: 2,
                    }}
                >
                    <CircularProgress sx={{ color: "primary.main" }} />

                    <Typography variant="body2" color="text.secondary">
                        Loading departments...
                    </Typography>
                </Box>
            ) : filteredDepartments.length === 0 ? (
                <EmptyState
                    message={
                        departmentData.length === 0
                            ? 'No departments found'
                            : 'No matching departments'
                    }
                />
            ) : view === 'grid' ? (
                <Box
                    sx={{
                        display: 'grid',
                        gridTemplateColumns: {
                            xs: '1fr',
                            sm: 'repeat(2, minmax(0, 1fr))',
                            lg: 'repeat(3, minmax(0, 1fr))',
                            xl: 'repeat(4, minmax(0, 1fr))',
                        },
                        gap: 2,
                        alignItems: 'stretch',
                    }}
                >
                    {filteredDepartments.map((department) => (
                        <DepartmentCard
                            key={department._id || department.id}
                            department={department}
                            onEdit={onEdit}
                        />
                    ))}
                </Box>
            ) : (
                <TableContainer
                    component={Paper}
                    variant="outlined"
                    sx={{
                        borderRadius: 3,
                        borderColor: '#e5e7eb',
                        overflowX: 'auto',
                    }}
                >
                    <Table sx={{ minWidth: 650 }}>
                        <TableHead>
                            <TableRow sx={{ bgcolor: '#f8fafc' }}>
                                {[
                                    'Department',
                                    'Status',
                                    "Action"
                                ].map((heading) => (
                                    <TableCell
                                        key={heading}
                                        sx={{
                                            py: 1.75,
                                            fontWeight: 800,
                                            color: '#475569',
                                            whiteSpace: 'nowrap',
                                        }}
                                    >
                                        {heading}
                                    </TableCell>
                                ))}
                            </TableRow>
                        </TableHead>

                        <TableBody>
                            {filteredDepartments.map((department) => (
                                <TableRow
                                    key={department._id || department.id}
                                    hover
                                >
                                    <TableCell sx={{ py: 1.75 }}>
                                        <Box
                                            sx={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 1.25,
                                            }}
                                        >
                                            <Avatar
                                                sx={{
                                                    width: 46,
                                                    height: 46,
                                                    flexShrink: 0,
                                                    bgcolor: '#eef2ff',
                                                    color: '#4338ca',
                                                    fontWeight: 700,
                                                }}
                                            >
                                                {(department?.name?.charAt(0)?.toUpperCase() || 'V')}
                                            </Avatar>

                                            <Typography fontWeight={700}>
                                                {department.name}
                                            </Typography>
                                        </Box>
                                    </TableCell>

                                    <TableCell>
                                        <StatusChip status={department.status} />
                                    </TableCell>

                                    <TableCell>
                                        <Button
                                            variant="outlined"
                                            size="small"
                                            startIcon={<EditOutlined />}
                                            onClick={() => onEdit(department)}
                                            sx={{
                                                textTransform: "none",
                                                flexShrink: 0,
                                            }}
                                        >
                                            Edit
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}
        </Box>
    );
}
