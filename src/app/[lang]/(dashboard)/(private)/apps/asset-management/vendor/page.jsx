'use client';

import React, { useState, useEffect } from 'react';

import { useSession } from 'next-auth/react'

import {
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    Container,
    IconButton,
    InputAdornment,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TablePagination,
    TableRow,
    Typography,
    Avatar,
    Dialog,
    DialogContent,
    DialogActions,
    TextField,
    DialogTitle,
    Skeleton,
    MenuItem,
} from '@mui/material';

import Grid from "@mui/material/Grid2"

import { useForm, Controller } from 'react-hook-form'

import { valibotResolver } from '@hookform/resolvers/valibot'

import {
    object,
    string,
    minLength,
    transform,
    maxLength,
    pipe,
    regex,
    email,
    optional,
    boolean,

} from 'valibot'

import { toast } from 'react-toastify'

import {
    Search as SearchIcon,
    Add as AddIcon,
    FilterList as FilterListIcon,
    MoreVert as MoreVertIcon,
    Inventory2 as InventoryIcon,
    CheckCircle as ActiveIcon,
    Warning as PendingIcon,
    AttachMoney as RevenueIcon,
} from '@mui/icons-material';

import DialogCloseButton from '@/components/dialogs/DialogCloseButton';

const API_URL = process.env.NEXT_PUBLIC_API_URL

const initialState = {
    company_Name: "",
    phone: "",
    email: "",
    address: "",
    status: false,
    gst_no: ""
};

const VendorDialogComponent = ({
    open,
    setOpen,
    vendor = null,
    token,
    fetchData
}) => {

    const schema = object({
        company_Name: pipe(
            string(),
            minLength(1, 'Company Name is required'),
            maxLength(255, 'Company Name can be a maximum of 255 characters'),
            regex(
                /^[A-Za-z0-9\s&.,'-]+$/,
                'Company Name contains invalid characters'
            )
        ),
        phone: pipe(
            string(),
            minLength(10, 'Phone number must be at least 10 digits'),
            maxLength(15, 'Phone number cannot exceed 15 digits'),
            regex(
                /^[0-9]{10,15}$/,
                'Enter a valid phone number'
            )
        ),
        email: pipe(
            string(),
            minLength(1, 'Email is required'),
            email('Enter a valid email address'),
            maxLength(100, 'Email cannot exceed 100 characters')
        ),
        gst_no: pipe(
            string(),
            minLength(1, 'GST No is required'),
            regex(
                /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/,
                'Enter a valid GST Number'
            )
        ),
        status: pipe(
            boolean(),
            minLength(1, "Status is required")
        ),
        address: pipe(
            string(),
            minLength(1, 'Address is required'),
            maxLength(500, 'Address cannot exceed 500 characters')
        ),
    });

    const {
        control,
        handleSubmit,
        reset,
        formState: { errors }
    } = useForm({
        resolver: valibotResolver(schema),
        mode: 'onChange',
        defaultValues: initialState
    })

    const onClose = () => {
        setOpen(false)
    }

    useEffect(() => {
        
        if (vendor) {

            reset({
                company_Name: vendor.company_Name || "",
                phone: String(vendor.phone) || "",
                email: vendor.email || "",
                address: vendor.address || "",
                status: vendor.status ?? "",
                gst_no: vendor.gst_no || ""
            });
        } else {
            reset(initialState);
        }
    }, [vendor, open, reset]);

    const submitForm = async (data) => {
        try {

            const method = vendor ? "PUT" : "POST";
            const save_url = vendor ? `vendor/update/data/${vendor?._id}` : `vendor/post/data`

            const response = await fetch(`${API_URL}/company/${save_url}`, {
                method: method,
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(data)
            })

            if (response.ok) {

                toast.success("Vendor created successfully", {
                    autoClose: 1000
                })

                fetchData()

                onClose()

            }

        } catch (error) {
            throw new Error(error)
        }
    };

    return (
        <Dialog
            open={open}
            onClose={() => setOpen(false)}
            fullWidth
            maxWidth="md"
            sx={{
                '& .MuiDialog-paper': {
                    overflow: 'visible'
                }
            }}
        >
            <DialogTitle>
                {vendor ? "Edit Vendor" : "Add Vendor"}
            </DialogTitle>

            <DialogCloseButton onClick={onClose}>
                <i className='tabler-x' />
            </DialogCloseButton>

            <form onSubmit={handleSubmit(submitForm)} noValidate>
                <DialogContent dividers>

                    <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid item size={{ xs: 12, md: 6 }}>
                            <Controller
                                name="company_Name"
                                control={control}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        fullWidth
                                        required
                                        label="Company Name"
                                        error={!!errors.company_Name}
                                        helperText={errors.company_Name?.message}
                                    />
                                )}
                            />
                        </Grid>

                        <Grid item size={{ xs: 12, md: 6 }}>

                            <Controller
                                name="phone"
                                control={control}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        fullWidth
                                        required
                                        label="Phone"
                                        error={!!errors.phone}
                                        helperText={errors.phone?.message}
                                    />
                                )}
                            />
                        </Grid>

                        <Grid item size={{ xs: 12 }}>

                            <Controller
                                name="email"
                                control={control}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        fullWidth
                                        required
                                        label="Email"
                                        error={!!errors.email}
                                        helperText={errors.email?.message}
                                    />
                                )}
                            />
                        </Grid>

                        <Grid item size={{ xs: 12, }}>

                            <Controller
                                name="gst_no"
                                control={control}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        fullWidth
                                        required
                                        label="GST No"
                                        error={!!errors.gst_no}
                                        helperText={errors.gst_no?.message}
                                    />
                                )}
                            />
                        </Grid>


                        <Grid item size={{ xs: 12 }}>
                            <Controller
                                name="status"
                                control={control}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        select
                                        fullWidth
                                        required
                                        label="Status"
                                        error={!!errors.status}
                                        helperText={errors.status?.message}
                                    >
                                        <MenuItem value={true}>Active</MenuItem>
                                        <MenuItem value={false}>Inactive</MenuItem>
                                    </TextField>
                                )}
                            />
                        </Grid>

                        <Grid item size={{ xs: 12 }}>
                            <Controller
                                name="address"
                                control={control}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        fullWidth
                                        required
                                        label="Address"
                                        multiline
                                        rows={4}
                                        error={!!errors.address}
                                        helperText={errors.address?.message}
                                    />
                                )}
                            />
                        </Grid>
                    </Grid>
                </DialogContent>

                <DialogActions
                    style={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        marginTop: "17px"
                    }}
                >

                    <Button
                        type='submit'
                        variant="contained"
                    >
                        {vendor ? "Update" : "Save"}
                    </Button>
                    <Button variant='outlined' onClick={() => setOpen(false)}>
                        Cancel
                    </Button>
                </DialogActions>

            </form>
        </Dialog>
    );
};

export default function AssetVendorDashboard() {

    const { data: session } = useSession()
    const token = session?.user?.token

    const [vendorData, setVendorData] = useState()
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(5);
    const [openDialog, setOpenDialog] = useState(false)
    const [selectedVendor, setSelectedVendor] = useState(null);

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const fetchVendor = async () => {
        try {
            setLoading(true)

            const response = await fetch(`${API_URL}/company/vendor/log/data`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            })

            const result = await response.json();

            if (response.ok) {

                setVendorData(result?.data)
            }

        } catch (error) {
            throw new Error(error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (API_URL && token) {
            fetchVendor()
        }
    }, [API_URL, token])

    if (loading) {
        return (
            <Container
                maxWidth={false}
                sx={{
                    width: "100%",
                    px: 2,
                    height: "100%",
                }}
            >
                {/* Header */}
                <Box
                    display="flex"
                    justifyContent="space-between"
                    alignItems="center"
                    mb={4}
                >
                    <Box>
                        <Skeleton variant="text" width={220} height={45} />
                        <Skeleton variant="text" width={140} height={24} />
                    </Box>

                    <Skeleton
                        variant="rounded"
                        width={170}
                        height={42}
                    />
                </Box>

                {/* KPI Cards */}
                <Grid container spacing={3} mb={4}>
                    {[1, 2].map((item) => (
                        <Grid key={item} size={{ xs: 12, sm: 4 }}>
                            <Card
                                elevation={0}
                                sx={{
                                    border: "1px solid",
                                    borderColor: "divider",
                                    borderRadius: 3,
                                }}
                            >
                                <CardContent>
                                    <Box
                                        display="flex"
                                        justifyContent="space-between"
                                        alignItems="center"
                                    >
                                        <Box>
                                            <Skeleton width={120} height={22} />
                                            <Skeleton width={60} height={40} />
                                        </Box>

                                        <Skeleton
                                            variant="circular"
                                            width={50}
                                            height={50}
                                        />
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                </Grid>

                {/* Table */}
                <Paper
                    elevation={0}
                    sx={{
                        border: "1px solid",
                        borderColor: "divider",
                        borderRadius: 3,
                        overflow: "hidden",
                    }}
                >
                    {/* Search */}
                    <Box p={3}>
                        <Skeleton
                            variant="rounded"
                            width={320}
                            height={40}
                        />
                    </Box>

                    <TableContainer>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    {Array.from({ length: 6 }).map((_, index) => (
                                        <TableCell key={index}>
                                            <Skeleton width={90} />
                                        </TableCell>
                                    ))}
                                </TableRow>
                            </TableHead>

                            <TableBody>
                                {Array.from({ length: 5 }).map((_, row) => (
                                    <TableRow key={row}>
                                        <TableCell>
                                            <Skeleton width="70%" />
                                            <Skeleton width="45%" />
                                        </TableCell>

                                        <TableCell>
                                            <Skeleton width="80%" />
                                        </TableCell>

                                        <TableCell>
                                            <Skeleton width="70%" />
                                        </TableCell>

                                        <TableCell>
                                            <Skeleton width="90%" />
                                        </TableCell>

                                        <TableCell>
                                            <Skeleton
                                                variant="rounded"
                                                width={70}
                                                height={28}
                                            />
                                        </TableCell>

                                        <TableCell align="center">
                                            <Skeleton
                                                variant="circular"
                                                width={32}
                                                height={32}
                                            />
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Paper>
            </Container>
        );
    }

    return (
        <Container
            maxWidth={false}
            sx={{
                width: "100%",
                px: 2, // or 0
                height: "100%",
            }}
        >
            {/* Page Header */}
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
                <Box>
                    <Typography variant="h4" fontWeight="bold" gutterBottom>
                        Asset Vendors
                    </Typography>
                </Box>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    sx={{ textTransform: 'none', borderRadius: 2, px: 3 }}
                    onClick={() => {
                        setOpenDialog(true)
                        setSelectedVendor(null)
                    }}
                >
                    Add New Vendor
                </Button>
            </Box>

            {/* KPI Stat Cards */}
            <Grid container spacing={3} mb={4}>
                <Grid item size={{ xs: 12, sm: 4 }}>
                    <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
                        <CardContent display="flex">
                            <Box display="flex" alignItems="center" justifyContent="space-between">
                                <div>
                                    <Typography variant="body2" color="text.secondary" fontWeight={500}>
                                        Total Vendors
                                    </Typography>
                                    <Typography variant="h5" fontWeight="bold" sx={{ mt: 1 }}>
                                        {vendorData?.length}
                                    </Typography>
                                </div>
                                <Avatar sx={{ bgcolor: 'primary.lighter', color: 'primary.main', borderRadius: 2 }}>
                                    <InventoryIcon />
                                </Avatar>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item size={{ xs: 12, sm: 4 }}>
                    <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
                        <CardContent>
                            <Box display="flex" alignItems="center" justifyContent="space-between">
                                <div>
                                    <Typography variant="body2" color="text.secondary" fontWeight={500}>
                                        Active Creators
                                    </Typography>
                                    <Typography variant="h5" fontWeight="bold" sx={{ mt: 1 }}>
                                        {vendorData?.filter(vd => vd.status === true)?.length}
                                    </Typography>
                                </div>
                                <Avatar sx={{ bgcolor: 'success.lighter', color: 'success.main', borderRadius: 2 }}>
                                    <ActiveIcon />
                                </Avatar>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Data Table Container */}
            <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, overflow: 'hidden' }}>
                {/* Table Filters & Toolbar */}
                <Box p={3} display="flex" justifyContent="space-between" alignItems="center" gap={2} flexWrap="wrap">
                    <TextField
                        placeholder="Search vendors or categories..."
                        size="small"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        sx={{ width: { xs: '100%', sm: '320px' } }}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon color="action" />
                                </InputAdornment>
                            ),
                        }}
                    />
                </Box>

                {/* Vendors Table */}
                <TableContainer>
                    <Table sx={{ minWidth: 650 }}>
                        <TableHead sx={{ bgcolor: 'grey.50' }}>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 'bold' }}>Vendor Name</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>GST NO</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }} align="right">Phone</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }} align="right">Address</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }} align="right">Status</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }} align="center">Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {vendorData?.map((vendor) => (
                                <TableRow key={vendor._id} hover>
                                    <TableCell>
                                        <Typography variant="subtitle2" fontWeight={600}>
                                            {vendor?.company_Name}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            {vendor.email}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2">{vendor.gst_no}</Typography>
                                    </TableCell>
                                    <TableCell align="right">
                                        <Typography variant="body2" fontWeight={500}>
                                            {vendor.phone}
                                        </Typography>
                                    </TableCell>
                                    <TableCell align="right">

                                        {vendor.address}
                                    </TableCell>
                                    <TableCell align="right">
                                        <Chip
                                            label={vendor.status ? "Active" : "Inactive"}
                                            size="small"
                                            color={
                                                vendor.status
                                                    ? 'success'
                                                    : 'warning'
                                            }
                                            variant="soft"
                                            sx={{ fontWeight: 500, textTransform: 'capitalize' }}
                                        />
                                    </TableCell>
                                    <TableCell align="center">
                                        <IconButton
                                            size="small"
                                            onClick={() => {
                                                setSelectedVendor(vendor);
                                                setOpenDialog(true);
                                            }}
                                        >
                                            <MoreVertIcon />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>

                {/* Table Pagination */}
                <TablePagination
                    rowsPerPageOptions={[5, 10, 25]}
                    component="div"
                    count={vendorData?.length}
                    rowsPerPage={rowsPerPage}
                    page={page}
                    onPageChange={handleChangePage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                />
                <VendorDialogComponent
                    open={openDialog}
                    setOpen={setOpenDialog}
                    token={token}
                    fetchData={fetchVendor}
                    vendor={selectedVendor}
                />
            </Paper>
        </Container>
    );
}
