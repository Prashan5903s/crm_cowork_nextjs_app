'use client';

import React, { useEffect, useState } from 'react';

import { useSession } from 'next-auth/react';

import {
    Box,
    Card,
    CardContent,
    Typography,
    TextField,
    Skeleton,
    Button,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TablePagination,
    Paper,
    Chip,
    Alert
} from '@mui/material';

import Grid from '@mui/material/Grid2';

import { useForm, Controller } from 'react-hook-form'
import { valibotResolver } from '@hookform/resolvers/valibot'
import { object, string, minLength, pipe, optional, boolean, forward, check } from 'valibot'

import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import HistoryIcon from '@mui/icons-material/History';
import DoorFrontIcon from '@mui/icons-material/DoorFront';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';

import { toast } from 'react-toastify';


const ParcelPage = () => {

    const { data: session } = useSession()
    const token = session?.user?.token
    const API_URL = process.env.NEXT_PUBLIC_API_URL

    const [createData, setCreateData] = useState()
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState('queue');
    const [parcels, setParcels] = useState([])
    const [enteredOtp, setEnteredOtp] = useState('');
    const [selectedParcel, setSelectedParcel] = useState(null);
    const [successMsg, setSuccessMsg] = useState('');
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(3);
    const [otpSubmitting, setOtpSubmitting] = useState(false);
    const [gateUpdatingId, setGateUpdatingId] = useState(null);
    const [formData, setFormData] = useState({
        floor_id: '',
        resident_id: '',
        courier_company_id: '1',
        product_name: "",
        trackingNumber: '',
        notes: ''
    });


    const parcelSchema = object({
        product_name: pipe(
            string(),
            minLength(1, "Product name is required")
        ),
        floor_id: pipe(
            string(),
            minLength(1, 'Floor is required')
        ),
        resident_id: pipe(
            string(),
            minLength(1, 'Resident is required')
        ),
        courier_company_id: pipe(
            string(),
            minLength(1, 'Courier company is required')
        ),
        trackingNumber: pipe(
            string(),
            minLength(1, 'Tracking number is required')
        ),
        notes: optional(pipe()),
    });

    const {
        control,
        register,
        handleSubmit,
        reset,
        formState: { errors }
    } = useForm({
        resolver: valibotResolver(parcelSchema),
        defaultValues: {
            product_name: "",
            floor_id: '',
            resident_id: '',
            courier_company_id: '1',
            trackingNumber: '',
            notes: ''
        }
    });

    const fetchParcels = async () => {
        try {

            const response = await fetch(
                `${API_URL}/user/parcel/data`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            )

            const json = await response.json()

            if (response.ok) {
                setParcels(json.data)
            }

        } catch (error) {
            throw new Error(error)
        }

    }

    const fetchCreateData = async () => {
        try {
            const response = await fetch(`${API_URL}/user/parcel/create/data`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            })

            const value = await response.json()

            if (response.ok) {
                const result = value?.data;
                setCreateData(result)
            }
        } catch (error) {
            throw new Error(error)
        }
    }

    const fetchData = async () => {
        try {
            setLoading(true);

            await Promise.all([
                fetchCreateData(),
                fetchParcels()
            ]);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (API_URL && token) {
            fetchData();
        }
    }, [API_URL, token]);

    const handleLogParcel = async (data) => {
        try {

            const payload = {
                product_name: data?.product_name,
                floor_id: data.floor_id,
                resident_id: data.resident_id,
                courier_company: data.courier_company_id,
                tracking_number: data.trackingNumber,
                notes: data.notes
            }

            const response = await fetch(`${API_URL}/user/parcel/post/data`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            const json = await response.json();

            if (!response.ok) {
                return alert(json.message || "Unable to save parcel.");
            }

            toast.success("Parcel fetched successfully", {
                autoClose: 1000
            })

            reset();

            fetchParcels();
            setViewMode("queue");
        } catch (error) {
            console.error(error);
            alert("Something went wrong.");
        }
    };

    const handleVerifyOtp = async (parcelId) => {
        try {
            setOtpSubmitting(true);

            const response = await fetch(`${API_URL}/user/parcel/${parcelId}/deliver`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ otp: enteredOtp })
            });

            const json = await response.json();

            if (!response.ok) {
                toast.error(json.message || "Invalid OTP");
                return;
            }

            // Reflect the server's response instead of guessing state locally
            setParcels(prev =>
                prev.map(p => (p._id === parcelId ? json.data : p))
            );

            toast.success("Parcel delivered successfully", {
                autoClose: 1000
            });

            setEnteredOtp("");
            setSelectedParcel(null);
        } catch (error) {
            console.error(error);
            toast.error("Something went wrong while verifying OTP.");
        } finally {
            setOtpSubmitting(false);
        }
    };

    const handleLeaveAtGate = async (parcelId) => {
        try {
            setGateUpdatingId(parcelId);

            const response = await fetch(`${API_URL}/user/parcel/${parcelId}/leave-at-gate`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                }
            });

            const json = await response.json();

            if (!response.ok) {
                toast.error(json.message || "Unable to update parcel status.");
                return;
            }

            setParcels(prev =>
                prev.map(p => (p._id === parcelId ? json.data : p))
            );

            toast.success('Parcel status updated to "Left at Gate".', {
                autoClose: 1000
            });
        } catch (error) {
            console.error(error);
            toast.error("Something went wrong while updating parcel status.");
        } finally {
            setGateUpdatingId(null);
        }
    };

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const STATUS = {
        PENDING: '1',
        LEFT_AT_GATE: "2",
        DELIVERED: "3"
    };

    const statusMap = {
        "1": "Pending",
        "2": "Left at Gate",
        "3": "Delivered",
    };

    const pendingList = parcels.filter(p => p.status === '1' || p.status === '2');
    const paginatedPendingList = pendingList.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

    const historyList = parcels.filter(p => p.status === '2' || p.status === '3');
    const deliveredCount = parcels.filter(p => p.status === '3').length;

    return (
        <Box sx={{ width: '100%', pb: 6, px: { xs: 2, sm: 3 }, bgcolor: 'background.default', minHeight: '100vh', pt: 3 }}>
            {/* Top Stat Banner */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid size={{ xs: 12, sm: 4 }}>
                    <Card elevation={0} sx={{ bgcolor: 'primary.main', color: 'common.white', borderRadius: 4, boxShadow: (theme) => theme.palette.mode === 'dark' ? '0 4px 20px rgba(0,0,0,0.4)' : '0 4px 20px rgba(0,0,0,0.08)' }}>
                        <CardContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: '24px !important' }}>
                            <Box>
                                <Typography variant="caption" sx={{ color: "common.white", opacity: 0.85, fontWeight: 700, letterSpacing: 0.5 }}>PENDING PICKUPS</Typography>
                                <Typography variant="h3" fontWeight="800" sx={{ color: "common.white", mt: 0.5 }}>{pendingList.length}</Typography>
                            </Box>
                            <Box sx={{ p: 1.5, bgcolor: 'rgba(255,255,255,0.15)', borderRadius: 3, display: 'flex' }}>
                                <PendingActionsIcon sx={{ color: "common.white", fontSize: 32 }} />
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                    <Card elevation={0} sx={{ bgcolor: 'success.main', color: 'common.white', borderRadius: 4, boxShadow: (theme) => theme.palette.mode === 'dark' ? '0 4px 20px rgba(0,0,0,0.4)' : '0 4px 20px rgba(0,0,0,0.08)' }}>
                        <CardContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: '24px !important' }}>
                            <Box>
                                <Typography variant="caption" sx={{ color: "common.white", opacity: 0.85, fontWeight: 700, letterSpacing: 0.5 }}>DELIVERED TODAY</Typography>
                                <Typography variant="h3" fontWeight="800" sx={{ color: "common.white", mt: 0.5 }}>{deliveredCount}</Typography>
                            </Box>
                            <Box sx={{ p: 1.5, bgcolor: 'rgba(255,255,255,0.15)', borderRadius: 3, display: 'flex' }}>
                                <CheckCircleOutlineIcon sx={{ color: "common.white", fontSize: 32 }} />
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                    <Card elevation={0} sx={{ bgcolor: 'background.paper', borderRadius: 4, border: '1px solid', borderColor: 'divider', boxShadow: (theme) => theme.palette.mode === 'dark' ? '0 4px 20px rgba(0,0,0,0.4)' : '0 4px 20px rgba(0,0,0,0.03)' }}>
                        <CardContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: '24px !important' }}>
                            <Box>
                                <Typography variant="caption" color="text.secondary" fontWeight={700} letterSpacing={0.5}>ACTIVE STATION</Typography>
                                <Typography variant="h6" fontWeight="800" color="text.primary" sx={{ mt: 0.5 }}>Gate #1 Security Desk</Typography>
                            </Box>
                            <Box sx={{ p: 1.5, bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(25, 118, 210, 0.15)' : 'primary.light', color: 'primary.main', borderRadius: 3, display: 'flex' }}>
                                <LocalShippingIcon sx={{ fontSize: 32, color: "white" }} />
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {successMsg && (
                <Alert severity="success" onClose={() => setSuccessMsg('')} sx={{ mb: 4, borderRadius: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
                    {successMsg}
                </Alert>
            )}

            {/* Main Layout Grid */}
            <Grid container spacing={4}>
                {/* Left Column: Quick Courier Log Form */}
                <Grid size={{ xs: 12, md: 5 }}>
                    <Card elevation={0} sx={{ borderRadius: 4, height: '100%', bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', boxShadow: (theme) => theme.palette.mode === 'dark' ? '0 4px 20px rgba(0,0,0,0.4)' : '0 4px 20px rgba(0,0,0,0.03)' }}>
                        <CardContent sx={{ p: 4 }}>
                            <Typography variant="h6" fontWeight="800" gutterBottom color="text.primary" sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                <Box sx={{ p: 1, bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(25, 118, 210, 0.15)' : 'primary.light', color: 'primary.main', borderRadius: 2, display: 'flex' }}>
                                    <LocalShippingIcon fontSize="small" style={{ color: "white" }} />
                                </Box>
                                Quick Log Package
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 3.5 }}>
                                Record incoming delivery and instantly alert the resident via OTP.
                            </Typography>

                            {loading ? (
                                <>
                                    <Skeleton variant="rounded" height={45} sx={{ mb: 2 }} />
                                    <Skeleton variant="rounded" height={45} sx={{ mb: 2 }} />
                                    <Skeleton variant="rounded" height={45} sx={{ mb: 2 }} />
                                    <Skeleton variant="rounded" height={45} sx={{ mb: 2 }} />
                                    <Skeleton variant="rounded" height={90} sx={{ mb: 2 }} />
                                    <Skeleton variant="rounded" height={45} />
                                </>
                            )
                                :
                                (

                                    <Box component="form" onSubmit={handleSubmit(handleLogParcel)} sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }} noValidate>
                                        <Grid container spacing={2}>

                                            <Controller
                                                name="product_name"
                                                control={control}
                                                defaultValue=""
                                                render={({ field, fieldState: { error } }) => (
                                                    <TextField
                                                        {...field}
                                                        fullWidth
                                                        size="small"
                                                        label="Product Name"
                                                        placeholder="Enter product name"
                                                        error={!!error}
                                                        helperText={error?.message}
                                                        sx={{
                                                            "& .MuiOutlinedInput-root": {
                                                                borderRadius: 2.5,
                                                            },
                                                        }}
                                                    />
                                                )}
                                            />

                                            <Controller
                                                name="floor_id"
                                                control={control}
                                                render={({ field }) => (
                                                    <FormControl
                                                        fullWidth
                                                        required
                                                        size="small"
                                                        error={!!errors.floor_id}
                                                    >
                                                        <InputLabel>Floor</InputLabel>

                                                        <Select
                                                            {...field}
                                                            label="Floor"
                                                            sx={{ borderRadius: 2.5 }}
                                                        >
                                                            {createData?.floor?.map((item) => (
                                                                <MenuItem key={item._id} value={item._id}>
                                                                    {item.floor_name}, {item.tower_id?.name}
                                                                </MenuItem>
                                                            ))}
                                                        </Select>

                                                        {errors.floor_id && (
                                                            <Typography color="var(--mui-palette-error-main)" variant="caption">
                                                                {errors.floor_id.message}
                                                            </Typography>
                                                        )}
                                                    </FormControl>
                                                )}
                                            />

                                            <Controller
                                                name="resident_id"
                                                control={control}
                                                render={({ field }) => (
                                                    <FormControl
                                                        fullWidth
                                                        required
                                                        size="small"
                                                        error={!!errors.resident_id}
                                                    >
                                                        <InputLabel>Resident</InputLabel>

                                                        <Select
                                                            {...field}
                                                            label="Resident"
                                                        >
                                                            {createData?.users?.map((item) => (
                                                                <MenuItem key={item._id} value={item._id}>
                                                                    {item.first_name} {item.last_name} ({item.phone})
                                                                </MenuItem>
                                                            ))}
                                                        </Select>

                                                        {errors.resident_id && (
                                                            <Typography color="var(--mui-palette-error-main)" variant="caption">
                                                                {errors.resident_id.message}
                                                            </Typography>
                                                        )}
                                                    </FormControl>
                                                )}
                                            />
                                        </Grid>

                                        <Controller
                                            name="courier_company_id"
                                            control={control}
                                            render={({ field }) => (
                                                <FormControl
                                                    required
                                                    fullWidth
                                                    size="small"
                                                    error={!!errors.courier_company_id}
                                                >
                                                    <InputLabel>Courier Service</InputLabel>

                                                    <Select
                                                        {...field}
                                                        label="Courier Service"
                                                    >
                                                        {createData?.courierData?.map((item) => (
                                                            <MenuItem key={item.value} value={item.value}>
                                                                {item.title}
                                                            </MenuItem>
                                                        ))}
                                                    </Select>

                                                    {errors.courier_company_id && (
                                                        <Typography color="var(--mui-palette-error-main)" variant="caption">
                                                            {errors.courier_company_id.message}
                                                        </Typography>
                                                    )}
                                                </FormControl>
                                            )}
                                        />

                                        <TextField
                                            label="Tracking ID / Barcode (Optional)"
                                            fullWidth
                                            required
                                            size="small"
                                            {...register("trackingNumber")}
                                            error={!!errors.trackingNumber}
                                            helperText={errors.trackingNumber?.message}
                                        />

                                        <TextField
                                            label="Notes/Remarks"
                                            multiline
                                            rows={2}
                                            fullWidth
                                            size="small"
                                            {...register("notes")}
                                            error={!!errors.notes}
                                            helperText={errors.notes?.message}
                                        />

                                        <Button
                                            type="submit"
                                            variant="contained"
                                            color="primary"
                                            size="large"
                                            sx={{ mt: 1, py: 1.5, fontWeight: '700', borderRadius: 2.5, boxShadow: '0 4px 12px rgba(25, 118, 210, 0.2)' }}
                                        >
                                            Save & Send Resident OTP
                                        </Button>
                                    </Box>
                                )}

                        </CardContent>
                    </Card>
                </Grid>

                {/* Right Column: Dynamic Feed & View Switcher */}
                <Grid size={{ xs: 12, md: 7 }}>
                    <Card elevation={0} sx={{ borderRadius: 4, height: '100%', display: 'flex', flexDirection: 'column', bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', boxShadow: (theme) => theme.palette.mode === 'dark' ? '0 4px 20px rgba(0,0,0,0.4)' : '0 4px 20px rgba(0,0,0,0.03)' }}>
                        {/* Custom Navigation Toolbar */}
                        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider', display: 'flex', gap: 1.5, bgcolor: 'background.default', borderTopLeftRadius: 16, borderTopRightRadius: 16 }}>
                            <Button
                                variant={viewMode === 'queue' ? 'contained' : 'text'}
                                size="small"
                                onClick={() => setViewMode('queue')}
                                startIcon={<PendingActionsIcon />}
                                sx={{ borderRadius: 2, px: 2, fontWeight: 700, ...(viewMode !== 'queue' && { color: 'text.secondary' }) }}
                            >
                                Queue ({pendingList.length})
                            </Button>
                            <Button
                                variant={viewMode === 'gate' ? 'contained' : 'text'}
                                size="small"
                                color="warning"
                                onClick={() => setViewMode('gate')}
                                startIcon={<DoorFrontIcon />}
                                sx={{ borderRadius: 2, px: 2, fontWeight: 700, ...(viewMode !== 'gate' && { color: 'text.secondary' }) }}
                            >
                                Gate Drop
                            </Button>
                            <Button
                                variant={viewMode === 'history' ? 'contained' : 'text'}
                                size="small"
                                color="inherit"
                                onClick={() => setViewMode('history')}
                                startIcon={<HistoryIcon />}
                                sx={{ borderRadius: 2, px: 2, fontWeight: 700, ...(viewMode !== 'history' && { color: 'text.secondary' }) }}
                            >
                                History
                            </Button>
                        </Box>

                        <CardContent sx={{ p: 4, flexGrow: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                            {/* VIEW: QUEUE */}
                            {viewMode === 'queue' && (
                                <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}>
                                    <Box>
                                        <Typography variant="h6" fontWeight="800" gutterBottom color="text.primary">
                                            Pending Parcels Awaiting Collection
                                        </Typography>
                                        {pendingList.length === 0 ? (
                                            <Typography color="text.secondary" align="center" sx={{ py: 8 }}>
                                                No pending parcels right now. All caught up!
                                            </Typography>
                                        ) : (
                                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mt: 3 }}>
                                                {paginatedPendingList.map((parcel) => (
                                                    <Paper
                                                        key={parcel._id}
                                                        elevation={0}
                                                        sx={{
                                                            p: 2.5,
                                                            display: 'flex',
                                                            flexDirection: 'column',
                                                            gap: 2,
                                                            bgcolor: 'background.paper',
                                                            border: '1px solid',
                                                            borderColor: 'divider',
                                                            borderRadius: 3,
                                                            transition: 'all 0.2s ease',
                                                            '&:hover': { borderColor: 'primary.main', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }
                                                        }}
                                                    >
                                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                                                <Chip label={parcel?.floor_id?.floor_name} size="small" color="primary" sx={{ fontWeight: '800', borderRadius: 1.5 }} />
                                                                <Typography variant="subtitle1" fontWeight="800" color="text.primary">
                                                                    {parcel.resident_id?.first_name} {parcel.resident_id?.last_name}
                                                                </Typography>
                                                            </Box>
                                                            <Chip
                                                                label={statusMap?.[parcel.status]}
                                                                size="small"
                                                                color={
                                                                    parcel.status === "3"
                                                                        ? "success"
                                                                        : parcel.status === "2"
                                                                            ? "warning"
                                                                            : "default"
                                                                }
                                                                sx={{ fontWeight: 700, borderRadius: 1.5 }}
                                                            />
                                                        </Box>

                                                        <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>

                                                            {selectedParcel === parcel._id ? (
                                                                <>
                                                                    <TextField
                                                                        size="small"
                                                                        placeholder="4-digit OTP"
                                                                        inputProps={{ maxLength: 4 }}
                                                                        value={enteredOtp}
                                                                        onChange={(e) => setEnteredOtp(e.target.value)}
                                                                        disabled={otpSubmitting}
                                                                        sx={{ width: 130, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                                                                    />
                                                                    <Button
                                                                        variant="contained"
                                                                        color="success"
                                                                        size="small"
                                                                        onClick={() => handleVerifyOtp(parcel._id)}
                                                                        disabled={otpSubmitting || enteredOtp.length === 0}
                                                                        sx={{ fontWeight: 700, borderRadius: 2 }}
                                                                    >
                                                                        {otpSubmitting ? 'Verifying...' : 'Confirm'}
                                                                    </Button>
                                                                    <Button
                                                                        size="small"
                                                                        color="inherit"
                                                                        disabled={otpSubmitting}
                                                                        onClick={() => { setSelectedParcel(null); setEnteredOtp(''); }}
                                                                        sx={{ fontWeight: 600 }}
                                                                    >
                                                                        Cancel
                                                                    </Button>
                                                                </>
                                                            ) : (
                                                                <Button variant="contained" color="success" size="small" onClick={() => setSelectedParcel(parcel._id)} sx={{ fontWeight: 700, borderRadius: 2, px: 2 }}>
                                                                    Verify OTP & Hand Over
                                                                </Button>
                                                            )}
                                                        </Box>
                                                    </Paper>
                                                ))}
                                            </Box>
                                        )}
                                    </Box>

                                    {pendingList.length > 0 && (
                                        <TablePagination
                                            component="div"
                                            count={pendingList.length}
                                            page={page}
                                            onPageChange={handleChangePage}
                                            rowsPerPage={rowsPerPage}
                                            onRowsPerPageChange={handleChangeRowsPerPage}
                                            rowsPerPageOptions={[3, 5, 10]}
                                            sx={{ mt: 3, borderTop: '1px solid', borderColor: 'divider' }}
                                        />
                                    )}
                                </Box>
                            )}

                            {/* VIEW: GATE DROP */}
                            {viewMode === 'gate' && (
                                <Box>
                                    <Typography variant="h6" fontWeight="800" gutterBottom color="text.primary">
                                        Leave at Gate / Lobby Deliveries
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                                        Authorize security to leave packages at designated doorsteps or lobby lockers.
                                    </Typography>

                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                        {parcels.map((parcel) => (
                                            <Paper key={parcel._id} elevation={0} sx={{ p: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderRadius: 3, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
                                                <Box>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
                                                        <Chip label={parcel.floor_id?.floor_name} size="small" color="primary" sx={{ fontWeight: 700, borderRadius: 1.5 }} />
                                                        <Typography variant="subtitle2" fontWeight="800" color="text.primary">
                                                            {parcel.resident_id?.first_name} {parcel.resident_id?.last_name}
                                                        </Typography>
                                                    </Box>
                                                    <Typography variant="caption" color="text.secondary">
                                                        Status: <Box component="span" sx={{ fontWeight: 700, color: 'text.primary' }}>{statusMap[parcel.status]}</Box>
                                                    </Typography>
                                                </Box>
                                                {parcel.status !== '2' && parcel.status !== '3' ? (
                                                    <Button
                                                        variant="outlined"
                                                        color="warning"
                                                        size="small"
                                                        onClick={() => handleLeaveAtGate(parcel._id)}
                                                        disabled={gateUpdatingId === parcel._id}
                                                        sx={{ fontWeight: 700, borderRadius: 2 }}
                                                    >
                                                        {gateUpdatingId === parcel._id ? 'Updating...' : 'Mark Left at Gate'}
                                                    </Button>
                                                ) : (
                                                    <Chip label="Processed" size="small" variant="outlined" color="success" sx={{ fontWeight: 700, borderRadius: 1.5 }} />
                                                )}
                                            </Paper>
                                        ))}
                                    </Box>
                                </Box>
                            )}

                            {/* VIEW: HISTORY */}
                            {viewMode === 'history' && (
                                <Box>
                                    <Typography variant="h6" fontWeight="800" gutterBottom color="text.primary">
                                        Completed Deliveries & Audit Log
                                    </Typography>
                                    <TableContainer component={Paper} elevation={0} sx={{ mt: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
                                        <Table size="small">
                                            <TableHead sx={{ bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'grey.100' }}>
                                                <TableRow>
                                                    <TableCell sx={{ fontWeight: 700, py: 1.5 }}>Flat</TableCell>
                                                    <TableCell sx={{ fontWeight: 700, py: 1.5 }}>Recipient</TableCell>
                                                    <TableCell sx={{ fontWeight: 700, py: 1.5 }}>Courier</TableCell>
                                                    <TableCell sx={{ fontWeight: 700, py: 1.5 }}>Status</TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {historyList?.length === 0 ?

                                                    (
                                                        <TableRow>
                                                            <TableCell colSpan={4} align="center" sx={{ py: 5 }}>
                                                                <Typography variant="body1" color="text.secondary">
                                                                    No Data Found
                                                                </Typography>
                                                            </TableCell>
                                                        </TableRow>
                                                    )

                                                    :

                                                    historyList.map((item) => (
                                                        <TableRow key={item._id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                                                            <TableCell sx={{ py: 2 }}>
                                                                <Box component="span" sx={{ fontWeight: 800, color: 'primary.main' }}>
                                                                    {item.floor_id?.floor_name}
                                                                </Box>
                                                            </TableCell>
                                                            <TableCell sx={{ py: 2, fontWeight: 600, color: 'text.primary' }}>
                                                                {item.resident_id?.first_name} {item.resident_id?.last_name}
                                                            </TableCell>
                                                            <TableCell sx={{ py: 2, color: 'text.secondary' }}>{item.courier_company_id}</TableCell>
                                                            <TableCell sx={{ py: 2 }}>
                                                                <Chip
                                                                    label={statusMap[item.status]}
                                                                    size="small"
                                                                    color={item.status === '3' ? 'success' : 'warning'}
                                                                    sx={{ fontWeight: 700, borderRadius: 1.5 }}
                                                                />
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                </Box>
                            )}
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Box>
    );
};

export default ParcelPage;
