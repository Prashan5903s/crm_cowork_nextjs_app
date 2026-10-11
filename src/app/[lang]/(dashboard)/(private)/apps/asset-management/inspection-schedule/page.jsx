'use client';

import React, { useState, useEffect } from 'react';

import { useSession } from 'next-auth/react';

import {
    Box,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    Skeleton,
    TableRow,
    Paper,
    TablePagination,
    Chip,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    MenuItem,
} from '@mui/material';

import Grid from "@mui/material/Grid2"

import { useForm, Controller } from 'react-hook-form';

import { valibotResolver } from '@hookform/resolvers/valibot';

import { object, string, optional, pipe, minValue, minLength, transform, number } from 'valibot';

import { toast } from 'react-toastify';

import {
    Add as AddIcon
} from '@mui/icons-material';

import DialogCloseButton from '@/components/dialogs/DialogCloseButton';
import formatTime from '@/utils/formatTime';

const API_URL = process.env.NEXT_PUBLIC_API_URL

const getStatusColor = (status) => {
    switch (status) {
        case "Pending":
            return "warning";
        case "In Progress":
            return "info";
        case "Completed":
            return "success";
        case "Cancelled":
            return "error";
        default:
            return "default";
    }
};

const InspectionScheduleComponent = ({ open, setOpen, fetchData, data, selectedScheduleData, token }) => {

    const InspectionScheduleValidationSchema = object({
        asset_id: pipe(
            string(),
            minLength(1, "Asset is required")
        ),
        inspection_template_id: pipe(
            string(),
            minLength(1, "Inspection Template is required")
        ),
        assigned_to: pipe(
            string(),
            minLength(1, "Office Bearer is required")
        ),
        frequency: pipe(
            string(),
            minLength(1, "Frequency is required")
        ),
        scheduled_date: pipe(
            string(),
            minLength(1, "Scheduled Date is required")
        ),
        due_date: pipe(
            string(),
            minLength(1, "Due Date is required")
        ),
        status: pipe(
            string(),
            minLength(1, "Status is required")
        ),
        remarks: optional(string())
    });

    const {
        control,
        handleSubmit,
        reset,
        formState: { errors, isSubmitting }
    } = useForm({
        resolver: valibotResolver(InspectionScheduleValidationSchema),
        defaultValues: {
            asset_id: "",
            inspection_template_id: "",
            assigned_to: "",
            frequency: "1",
            scheduled_date: "",
            due_date: "",
            status: "Pending",
            remarks: ""
        }
    });

    useEffect(() => {
        if (!open) {
            reset();
        }
    }, [open, reset]);

    const handleClose = () => {
        reset();
        setOpen(false);
    };
    const onSubmit = async (data) => {
        try {
            // Debug check to ensure API_URL exists
            if (!API_URL) {
                console.error("API_URL is undefined! Check your environment variables.");
                return;
            }


            const method = selectedScheduleData ? "PUT" : "POST";

            const save_url = selectedScheduleData
                ? `inspection-schedule/update/${selectedScheduleData._id}`
                : `inspection-schedule/save`;

            const response = await fetch(`${API_URL}/company/${save_url}`, {
                method,
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(data)
            });

            if (response.ok) {
                toast.success("AMC saved successfully", {
                    autoClose: 1000
                });
                fetchData();
                handleClose();
            } else {
                const errRes = await response.json();
                console.error("Server error response:", errRes);
            }

        } catch (error) {

            console.error("Fetch execution error:", error);
        }
    };
    useEffect(() => {
        if (!open) return;

        if (selectedScheduleData) {
            reset({
                asset_id: selectedScheduleData?.asset_id?._id || "",
                inspection_template_id: selectedScheduleData?.inspection_template_id?._id || "",
                assigned_to: selectedScheduleData?.assigned_to?._id || "",
                frequency: selectedScheduleData?.frequency || "1",
                scheduled_date: selectedScheduleData?.scheduled_date
                    ? selectedScheduleData.scheduled_date.split("T")[0]
                    : "",
                due_date: selectedScheduleData?.due_date
                    ? selectedScheduleData.due_date.split("T")[0]
                    : "",
                status: selectedScheduleData?.status || "Pending",
                remarks: selectedScheduleData?.remarks || ""
            });
        } else {
            reset({
                asset_id: "",
                inspection_template_id: "",
                assigned_to: "",
                frequency: "1",
                scheduled_date: "",
                due_date: "",
                status: "Pending",
                remarks: ""
            });
        }
    }, [open, selectedScheduleData, reset]);

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            maxWidth="lg"
            fullWidth
            sx={{
                '& .MuiDialog-paper': {
                    overflow: 'visible',
                    display: 'flex',
                    flexDirection: 'column',
                    maxHeight: '90vh' // Prevents the dialog from overflowing the screen
                }
            }}
        >
            <DialogTitle>{selectedScheduleData ? "Edit" : "Add"} Inspection Schedule</DialogTitle>

            <DialogCloseButton onClick={handleClose}>
                <i className='tabler-x' />
            </DialogCloseButton>
            <form onSubmit={handleSubmit(onSubmit)} noValidate>

                <DialogContent dividers>
                    <Grid container spacing={2} mt={1}>

                        <Grid item size={{ xs: 12, sm: 6 }}>
                            <Controller
                                name="asset_id"
                                control={control}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        select
                                        fullWidth
                                        size="small"
                                        required
                                        label="Asset"
                                        error={!!errors.asset_id}
                                        helperText={errors.asset_id?.message}
                                    >
                                        {data?.asset?.map(item => (
                                            <MenuItem key={item._id} value={item._id}>
                                                {item.name}
                                            </MenuItem>
                                        ))}
                                    </TextField>
                                )}
                            />
                        </Grid>

                        {/* Inspection Template */}
                        <Grid item size={{ xs: 12, sm: 6 }}>
                            <Controller
                                name="inspection_template_id"
                                control={control}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        select
                                        fullWidth
                                        size="small"
                                        required
                                        label="Inspection Template"
                                        error={!!errors.inspection_template_id}
                                        helperText={errors.inspection_template_id?.message}
                                    >
                                        {data?.inspectionTemplate?.map(item => (
                                            <MenuItem key={item._id} value={item._id}>
                                                {item.name}
                                            </MenuItem>
                                        ))}
                                    </TextField>
                                )}
                            />
                        </Grid>

                        {/* Assigned Office Bearer */}
                        <Grid item size={{ xs: 12, sm: 6 }}>
                            <Controller
                                name="assigned_to"
                                control={control}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        select
                                        fullWidth
                                        size="small"
                                        required
                                        label="Assign To"
                                        error={!!errors.assigned_to}
                                        helperText={errors.assigned_to?.message}
                                    >
                                        {data?.users?.map(user => (
                                            <MenuItem key={user._id} value={user._id}>
                                                {user.first_name} {user.last_name} ({user.phone})
                                            </MenuItem>
                                        ))}
                                    </TextField>
                                )}
                            />
                        </Grid>

                        {/* Scheduled Date */}
                        <Grid item size={{ xs: 12, sm: 6 }}>
                            <Controller
                                name="scheduled_date"
                                control={control}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        type="date"
                                        fullWidth
                                        size="small"
                                        required
                                        label="Scheduled Date"
                                        InputLabelProps={{ shrink: true }}
                                        error={!!errors.scheduled_date}
                                        helperText={errors.scheduled_date?.message}
                                    />
                                )}
                            />
                        </Grid>

                        {/* Due Date */}
                        <Grid item size={{ xs: 12, sm: 6 }}>
                            <Controller
                                name="due_date"
                                control={control}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        type="date"
                                        fullWidth
                                        size="small"
                                        required
                                        label="Due Date"
                                        InputLabelProps={{ shrink: true }}
                                        error={!!errors.due_date}
                                        helperText={errors.due_date?.message}
                                    />
                                )}
                            />
                        </Grid>

                        {/* Frequency */}
                        <Grid item size={{ xs: 12, sm: 6 }}>
                            <Controller
                                name="frequency"
                                control={control}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        select
                                        fullWidth
                                        size="small"
                                        label="Frequency"
                                    >
                                        <MenuItem value="1">Daily</MenuItem>
                                        <MenuItem value="2">Weekly</MenuItem>
                                        <MenuItem value="3">Monthly</MenuItem>
                                        <MenuItem value="4">Quarterly</MenuItem>
                                        <MenuItem value="5">Half-Yearly</MenuItem>
                                        <MenuItem value="6">Yearly</MenuItem>
                                        <MenuItem value="7">One Time</MenuItem>
                                    </TextField>
                                )}
                            />
                        </Grid>

                        {/* Status */}
                        <Grid item size={{ xs: 12, sm: 6 }}>
                            <Controller
                                name="status"
                                control={control}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        select
                                        fullWidth
                                        size="small"
                                        label="Status"
                                    >
                                        <MenuItem value="Pending">Pending</MenuItem>
                                        <MenuItem value="In Progress">In Progress</MenuItem>
                                        <MenuItem value="Completed">Completed</MenuItem>
                                        <MenuItem value="Cancelled">Cancelled</MenuItem>
                                    </TextField>
                                )}
                            />
                        </Grid>

                        {/* Remarks */}
                        <Grid item size={{ xs: 12 }}>
                            <Controller
                                name="remarks"
                                control={control}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        fullWidth
                                        multiline
                                        rows={3}
                                        size="small"
                                        label="Remarks"
                                    />
                                )}
                            />
                        </Grid>

                    </Grid>
                </DialogContent>

                <DialogActions
                    sx={{
                        justifyContent: "center",
                        py: 2,
                        mt: "18px",
                        mb: "18px"
                    }}
                >
                    <Button
                        variant="contained"
                        type="submit"
                        disabled={isSubmitting}
                    >
                        Save Inspection Schedule
                    </Button>

                    <Button
                        variant='outlined'
                        color="inherit"
                        onClick={handleClose}
                    >
                        Cancel
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    );
};

const frequencyMap =
{
    "1": "Daily",
    "2": "Weekly",
    "3": "Monthly",
    "4": "Quarterly",
    "5": "Half-Yearly",
    "6": "Yearly",
    "7": "One Time"
}

export default function AMCLogsPage() {

    const { data: session } = useSession()
    const token = session?.user?.token

    const [data, setData] = useState();
    const [openDialog, setOpenDialog] = useState(false);
    const [loading, setLoading] = useState(true);
    const [selectedScheduleData, setSelectedScheduleData] = useState()

    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    const handleOpen = () => {
        setSelectedScheduleData(null)
        setOpenDialog(true);
    }

    const fetchData = async () => {
        try {

            setLoading(true);

            const response = await fetch(`${API_URL}/company/inspection-schedule/fetch/data`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            })

            const value = await response.json();

            if (response.ok) {
                setData(value?.data)
            }

        } catch (error) {
            throw new Error(error)
        } finally {
            setLoading(false)
        }
    }


    useEffect(() => {
        if (API_URL && token) {
            fetchData()
        }
    }, [API_URL, token])


    const handleChangePage = (_, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const amcData = data?.inspectionSchedule || [];

    const paginatedData = amcData.slice(
        page * rowsPerPage,
        page * rowsPerPage + rowsPerPage
    );

    return (
        <Box sx={{ p: 3, bgcolor: '#f8f9fa', minHeight: '100vh' }}>
            {/* Header */}
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Box>
                    <Typography variant="h4" fontWeight="bold">Inspection Schedule Logs</Typography>
                    <Typography variant="body2" color="text.secondary">
                        Track annual maintenance contracts, vendors, and expiration dates.
                    </Typography>
                </Box>
                <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpen}>
                    Add Inspection Schedule
                </Button>
            </Box>

            {/* Table */}
            <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2 }}>
                <Table>
                    <TableHead sx={{ bgcolor: '#f1f5f9' }}>
                        <TableRow>
                            <TableCell sx={{ fontWeight: 'bold' }}>Asset</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Inspection template</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Assigned To</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Contact No</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Frequency</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Schedule Period</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Action</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loading ? (
                            [...Array(rowsPerPage)].map((_, index) => (
                                <TableRow key={index}>
                                    {[...Array(8)].map((_, cell) => (
                                        <TableCell key={cell}>
                                            <Skeleton variant="text" height={30} />
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : paginatedData.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={8} align="center">
                                    <Typography color="text.secondary">
                                        No Data Found
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        ) : (
                            paginatedData.map((amc) => (
                                <TableRow key={amc._id}>
                                    <TableCell sx={{ fontWeight: 500 }}>
                                        {amc?.asset_id?.name}
                                    </TableCell>
                                    <TableCell sx={{ fontWeight: 500 }}>
                                        {amc?.inspection_template_id?.name}
                                    </TableCell>

                                    <TableCell>

                                        {amc?.assigned_to ? (amc?.assigned_to?.first_name + " " + amc?.assigned_to?.last_name) : ""}

                                    </TableCell>

                                    <TableCell>
                                        {amc?.assigned_to ? amc?.assigned_to?.phone : "N/A"}
                                    </TableCell>

                                    <TableCell>
                                        <Chip
                                            label={frequencyMap[amc.frequency]}
                                            size="small"
                                            variant="outlined"
                                        />
                                    </TableCell>

                                    <TableCell>
                                        {formatTime(amc.scheduled_date)} to {formatTime(amc.due_date)}
                                    </TableCell>

                                    <TableCell>
                                        <Chip
                                            label={amc?.status}
                                            color={getStatusColor(amc?.status)}
                                            size="small"
                                        />
                                    </TableCell>

                                    <TableCell>
                                        <i
                                            className="tabler-edit"
                                            style={{ cursor: "pointer" }}
                                            onClick={() => {
                                                setSelectedScheduleData(amc);
                                                setOpenDialog(true);
                                            }}
                                        />
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
                <TablePagination
                    component="div"
                    count={amcData.length}
                    page={page}
                    onPageChange={handleChangePage}
                    rowsPerPage={rowsPerPage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                    rowsPerPageOptions={[5, 10, 25, 50]}
                />
            </TableContainer>

            {/* Add AMC Dialog Modal */}
            <InspectionScheduleComponent
                open={openDialog}
                setOpen={setOpenDialog}
                fetchData={fetchData}
                token={token}
                data={data}
                selectedScheduleData={selectedScheduleData}
            />
        </Box>
    );
}
