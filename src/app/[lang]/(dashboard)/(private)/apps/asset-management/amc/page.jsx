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

const AMCComponent = ({ open, setOpen, fetchData, data, selectedAMCData, token }) => {

    const AMCValidationSchema = object({
        asset_id: pipe(
            string(),
            minLength(1, "Asset is required")
        ),
        vendor_id: pipe(
            string(),
            minLength(1, "Vendor is required")
        ),
        contact_no: optional(string()),
        start_date: pipe(
            string(),
            minLength(1, "Start Date is required")
        ),
        end_date: pipe(
            string(),
            minLength(1, "End Date is required")
        ),
        amount: pipe(
            string(),
            minLength(1, "Amount is required"),
            transform(Number),
            number(),
            minValue(1, "Amount must be greater than 0")
        ),
        service_frequency: pipe(
            string(),
            minLength(1, "Service Frequency is required")
        ),
        status: pipe(
            string(),
            minLength(1, "Status is required")
        )
    });

    const {
        control,
        handleSubmit,
        reset,
        formState: { errors, isSubmitting }
    } = useForm({
        resolver: valibotResolver(AMCValidationSchema),
        defaultValues: {
            asset_id: "",
            vendor_id: "",
            contact_no: "",
            start_date: "",
            end_date: "",
            amount: "",
            service_frequency: "1",
            status: "1"
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

            const method = selectedAMCData ? "PUT" : "POST";
            const save_url = selectedAMCData ? `amc/update/data/${selectedAMCData?._id}` : `amc/save/data`;

            // Clean token of any potential hidden whitespace/newlines
            const cleanToken = token ?? "";

            const response = await fetch(`${API_URL}/company/${save_url}`, {
                method,
                headers: {
                    Authorization: `Bearer ${cleanToken}`,
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
        if (open) {
            if (selectedAMCData) {
                reset({ ...selectedAMCData, asset_id: selectedAMCData?.asset_id?._id, vendor_id: selectedAMCData?.vendor_id?._id, amount: String(selectedAMCData?.amount || "") })
            } else {
                reset({
                    asset_id: "",
                    vendor_id: "",
                    contact_no: "",
                    start_date: "",
                    end_date: "",
                    amount: "",
                    service_frequency: "1",
                    status: "1"
                })
            }
        }
    }, [open, selectedAMCData])

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
            <DialogTitle>{selectedAMCData ? "Edit" : "Add"} AMC Contract</DialogTitle>

            <DialogCloseButton onClick={handleClose}>
                <i className='tabler-x' />
            </DialogCloseButton>
            <form onSubmit={handleSubmit(onSubmit)} noValidate>

                <DialogContent dividers>
                    <Grid container spacing={2} mt={1}>
                        {/* Asset */}
                        <Grid item size={{ xs: 12, sm: 6 }}>
                            <Controller
                                name="asset_id"
                                control={control}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        select
                                        fullWidth
                                        required
                                        size="small"
                                        label="Select Asset"
                                        error={!!errors.asset_id}
                                        helperText={errors.asset_id?.message}
                                    >
                                        {data?.assets?.map((asset) => (
                                            <MenuItem key={asset._id} value={asset._id}>
                                                {asset.name}
                                            </MenuItem>
                                        ))}
                                    </TextField>
                                )}
                            />
                        </Grid>

                        {/* Vendor */}
                        <Grid item size={{ xs: 12, sm: 6 }}>
                            <Controller
                                name="vendor_id"
                                control={control}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        select
                                        required
                                        fullWidth
                                        size="small"
                                        label="Select Vendor"
                                        error={!!errors.vendor_id}
                                        helperText={errors.vendor_id?.message}
                                    >
                                        {data?.vendors?.map((vendor) => (
                                            <MenuItem key={vendor._id} value={vendor._id}>
                                                {vendor.company_Name} ({vendor?.phone})
                                            </MenuItem>
                                        ))}
                                    </TextField>
                                )}
                            />
                        </Grid>

                        {/* Contact */}
                        <Grid item size={{ xs: 12, sm: 6 }}>
                            <Controller
                                name="contact_no"
                                control={control}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        fullWidth
                                        size="small"
                                        label="Contact Number"
                                        placeholder="+1-555-0192"
                                        error={!!errors.contact_no}
                                        helperText={errors.contact_no?.message}
                                    />
                                )}
                            />
                        </Grid>

                        {/* Amount */}
                        <Grid item size={{ xs: 12, sm: 6 }}>
                            <Controller
                                name="amount"
                                control={control}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        type="number"
                                        fullWidth
                                        required
                                        size="small"
                                        label="Amount (₹)"
                                        error={!!errors.amount}
                                        helperText={errors.amount?.message}
                                    />
                                )}
                            />
                        </Grid>

                        {/* Start Date */}
                        <Grid item size={{ xs: 12, sm: 6 }}>
                            <Controller
                                name="start_date"
                                control={control}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        type="date"
                                        fullWidth
                                        size="small"
                                        required
                                        label="Start Date"
                                        InputLabelProps={{ shrink: true }}
                                        error={!!errors.start_date}
                                        helperText={errors.start_date?.message}
                                    />
                                )}
                            />
                        </Grid>

                        {/* End Date */}
                        <Grid item size={{ xs: 12, sm: 6 }}>
                            <Controller
                                name="end_date"
                                control={control}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        type="date"
                                        fullWidth
                                        required
                                        size="small"
                                        label="End Date"
                                        InputLabelProps={{ shrink: true }}
                                        error={!!errors.end_date}
                                        helperText={errors.end_date?.message}
                                    />
                                )}
                            />
                        </Grid>

                        {/* Service Frequency */}
                        <Grid item size={{ xs: 12, sm: 6 }}>
                            <Controller
                                name="service_frequency"
                                control={control}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        select
                                        fullWidth
                                        size="small"
                                        label="Service Frequency"
                                        error={!!errors.service_frequency}
                                        helperText={errors.service_frequency?.message}
                                    >
                                        {[
                                            { title: "Monthly", value: "1" },
                                            { title: "Quarterly", value: "2" },
                                            { title: "Half-Yearly", value: "3" },
                                            { title: "Yearly", value: "4" },
                                        ].map((item) => (
                                            <MenuItem key={item?.value} value={item?.value}>
                                                {item?.title}
                                            </MenuItem>
                                        ))}
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
                                        error={!!errors.status}
                                        helperText={errors.status?.message}
                                    >
                                        {[{ title: "Active", value: "1" }, { title: "Expired", value: "2" }, { title: "Renewed", value: "3" }].map((item) => (
                                            <MenuItem key={item.value} value={item.value}>
                                                {item?.title}
                                            </MenuItem>
                                        ))}
                                    </TextField>
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
                        Save Contract
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
    "1": "Monthly",
    "2": "Quarterly",
    "3": "Half-Yearly",
    "4": "Yearly",
}

const statusMap = {
    "1": "Active",
    "2": "Expired",
    "3": "Renewed",
}

export default function AMCLogsPage() {

    const { data: session } = useSession()
    const token = session?.user?.token

    const [data, setData] = useState();
    const [openDialog, setOpenDialog] = useState(false);
    const [loading, setLoading] = useState(true);
    const [selectedAMCData, setSelectedAMC] = useState()

    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    const handleOpen = () => {
        setSelectedAMC(null)
        setOpenDialog(true);
    }

    const fetchData = async () => {
        try {

            setLoading(true);

            const response = await fetch(`${API_URL}/company/amc/fetch/data`, {
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

    const amcData = data?.amc || [];

    const paginatedData = amcData.slice(
        page * rowsPerPage,
        page * rowsPerPage + rowsPerPage
    );

    return (
        <Box sx={{ p: 3, bgcolor: '#f8f9fa', minHeight: '100vh' }}>
            {/* Header */}
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Box>
                    <Typography variant="h4" fontWeight="bold">AMC & Maintenance Logs</Typography>
                    <Typography variant="body2" color="text.secondary">
                        Track annual maintenance contracts, vendors, and expiration dates.
                    </Typography>
                </Box>
                <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpen}>
                    Add AMC Contract
                </Button>
            </Box>

            {/* Table */}
            <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2 }}>
                <Table>
                    <TableHead sx={{ bgcolor: '#f1f5f9' }}>
                        <TableRow>
                            <TableCell sx={{ fontWeight: 'bold' }}>Asset</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Vendor</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Contact No</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Frequency</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Contract Period</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Amount</TableCell>
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
                                        {amc.asset_id.name}
                                    </TableCell>

                                    <TableCell>
                                        {amc.vendor_id?.company_Name || "N/A"}
                                    </TableCell>

                                    <TableCell>
                                        {amc.contact_no || "N/A"}
                                    </TableCell>

                                    <TableCell>
                                        <Chip
                                            label={frequencyMap[amc.service_frequency]}
                                            size="small"
                                            variant="outlined"
                                        />
                                    </TableCell>

                                    <TableCell>
                                        {formatTime(amc.start_date)} to {formatTime(amc.end_date)}
                                    </TableCell>

                                    <TableCell>₹{amc.amount}</TableCell>

                                    <TableCell>
                                        <Chip
                                            label={statusMap[amc.status]}
                                            color={
                                                amc.status === "1"
                                                    ? "success"
                                                    : amc.status === "3"
                                                        ? "info"
                                                        : "default"
                                            }
                                            size="small"
                                        />
                                    </TableCell>

                                    <TableCell>
                                        <i
                                            className="tabler-edit"
                                            style={{ cursor: "pointer" }}
                                            onClick={() => {
                                                setSelectedAMC(amc);
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
            <AMCComponent
                open={openDialog}
                setOpen={setOpenDialog}
                fetchData={fetchData}
                token={token}
                data={data}
                selectedAMCData={selectedAMCData}
            />
        </Box>
    );
}
