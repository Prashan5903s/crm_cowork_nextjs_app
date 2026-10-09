'use client';

import React, { useEffect, useState, useMemo } from 'react';

import { useSession } from 'next-auth/react';

import {
    Box,
    Toolbar,
    Skeleton,
    Typography,
    Dialog,
    Table,
    IconButton,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Chip,
    Button,
    TextField,
    InputAdornment,
    Card,
    CardContent,
    DialogContent,
    DialogActions,
    DialogTitle,
} from '@mui/material';

import Grid from "@mui/material/Grid2"

import { useForm, Controller } from 'react-hook-form';

import { valibotResolver } from '@hookform/resolvers/valibot';

import { object, string, optional, pipe, minValue, minLength, transform } from 'valibot';

import {
    Dashboard as DashboardIcon,
    Inventory2 as InventoryIcon,
    BuildCircle as MaintenanceIcon,
    AssignmentTurnedIn as InspectionIcon,
    LocationOn as LocationIcon,
    Search as SearchIcon,
    Add as AddIcon,
    LaptopMac,
    Router,
    Print
} from '@mui/icons-material';

import DialogCloseButton from '@/components/dialogs/DialogCloseButton';
import { toast } from 'react-toastify';

const API_URL = process.env.NEXT_PUBLIC_API_URL

const initialFormState = {
    vendor_id: "",
    location_id: "",
    asset_category_id: "",
    name: "",
    brand: "",
    model: "",
    serial_number: "",
    purchase_date: "",
    purchase_cost: "",
    warranty_start: "",
    warranty_end: "",
    qr_code: "",
    bar_code: "",
    status: "1",
    condition: "1",
    depreciationValue: "",
    description: "",
    assigned_to: ""
};

// Define the Valibot schema for validation
const assetSchema = object({
    name: pipe(string(), minLength(1, "Asset Name is required")),
    brand: optional(string()),
    model: optional(string()),
    serial_number: pipe(string(), minLength(1, "Serial Number is required")),
    asset_category_id: pipe(string(), minLength(1, "Category is required")),
    location_id: pipe(string(), minLength(1, "Location is required")),
    vendor_id: pipe(string(), minLength(1, "Vendor is required")),
    assigned_to: optional(string()),
    purchase_cost: pipe(
        string(),
        transform(val => val === "" ? undefined : Number(val)),
        minValue(1, "Purchase cost cannot be below 1")

    ),
    warranty_start: optional(string()),
    warranty_end: optional(string()),
    status: optional(string()),
    condition: optional(string()),
    depreciationValue: optional(string()),
    description: optional(string())
});

const AssetComponent = ({ open, setOpen, assetData, selectedAsset, token, fetchData }) => {

    const { control, handleSubmit, reset, formState: { errors } } = useForm({
        resolver: valibotResolver(assetSchema),
        defaultValues: initialFormState
    });

    // Reset form values when assetData or dialog state changes
    useEffect(() => {
        if (open) {

            if (selectedAsset) {
                reset({
                    ...selectedAsset,
                    name: String(selectedAsset?.name || ""),
                    brand: String(selectedAsset?.brand || ""),
                    model: String(selectedAsset?.model || ""),
                    asset_category_id: String(selectedAsset?.asset_category_id?._id || ""),
                    location_id: String(selectedAsset?.location_id._id || ""),
                    purchase_cost: String(selectedAsset?.purchase_cost || ""),
                    warranty_end: String(selectedAsset?.warranty_end || ""),
                    depreciationValue: String(selectedAsset?.depreciationValue || ""),
                    warranty_start: String(selectedAsset?.warranty_start || "")
                });
            } else {
                reset(initialFormState);
            }
        }
    }, [selectedAsset, open]);

    const handleClose = () => {
        setOpen(false);
    };

    const onSubmit = async (data) => {

        const save_url = selectedAsset ? `asset/update/data/${selectedAsset?._id}` : `asset/save/data`
        const method = selectedAsset ? "PUT" : "POST"
        try {

            const response = await fetch(`${API_URL}/company/${save_url}`, {
                method,
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(data)
            })

            if (response.ok) {

                toast.success("Asset saved successfully", {
                    autoClose: 1000
                })
                fetchData()
                handleClose()
            }

        } catch (error) {
            throw new Error(error)
        }
    };

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            fullWidth
            maxWidth="md"
            sx={{
                '& .MuiDialog-paper': {
                    overflow: 'visible',
                    display: 'flex',
                    flexDirection: 'column',
                    maxHeight: '90vh' // Prevents the dialog from overflowing the screen
                }
            }}
        >
            <DialogTitle>
                {selectedAsset ? "Edit Asset" : "Add Asset"}
            </DialogTitle>

            <DialogCloseButton onClick={handleClose}>
                <i className='tabler-x' />
            </DialogCloseButton>

            <form onSubmit={handleSubmit(onSubmit)} noValidate style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <DialogContent dividers sx={{ overflowY: 'auto', flexGrow: 1 }}>
                    <Grid container spacing={3}>

                        {/* Asset Name */}
                        <Grid item size={{ xs: 12, md: 6 }}>
                            <Controller
                                name="name"
                                control={control}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        fullWidth
                                        label="Asset Name *"
                                        value={field.value ?? ""}
                                        error={!!errors.name}
                                        helperText={errors.name?.message}
                                    />
                                )}
                            />
                        </Grid>

                        {/* Brand */}
                        <Grid item size={{ xs: 12, md: 6 }}>
                            <Controller
                                name="brand"
                                control={control}
                                render={({ field }) => (
                                    <TextField {...field} value={field.value ?? ""} fullWidth label="Brand" />
                                )}
                            />
                        </Grid>

                        {/* Model */}
                        <Grid item size={{ xs: 12, md: 6 }}>
                            <Controller
                                name="model"
                                control={control}
                                render={({ field }) => (
                                    <TextField {...field} value={field.value ?? ""} fullWidth label="Model" />
                                )}
                            />
                        </Grid>

                        {/* Serial Number */}
                        <Grid item size={{ xs: 12, md: 6 }}>
                            <Controller
                                name="serial_number"
                                control={control}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        fullWidth
                                        value={field.value ?? ""}
                                        label="Serial Number *"
                                        error={!!errors.serial_number}
                                        helperText={errors.serial_number?.message}
                                    />
                                )}
                            />
                        </Grid>

                        {/* Category */}
                        <Grid item size={{ xs: 12, md: 6 }}>
                            <Controller
                                name="asset_category_id"
                                control={control}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        select
                                        fullWidth
                                        label="Category *"
                                        value={field.value ?? ""}
                                        error={!!errors.asset_category_id}
                                        helperText={errors.asset_category_id?.message}
                                        InputLabelProps={{ shrink: true }}
                                        SelectProps={{ native: true }}
                                    >
                                        <option value="" disabled>Select Category</option>
                                        {assetData?.category?.map((item, index) => (
                                            <option value={item?._id} key={index}>{item?.name}</option>
                                        ))}
                                    </TextField>
                                )}
                            />
                        </Grid>

                        {/* Location */}
                        <Grid item size={{ xs: 12, md: 6 }}>
                            <Controller
                                name="location_id"
                                control={control}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        select
                                        fullWidth
                                        value={field.value ?? ""}
                                        label="Location *"
                                        error={!!errors.location_id}
                                        helperText={errors.location_id?.message}
                                        InputLabelProps={{ shrink: true }}
                                        SelectProps={{ native: true }}
                                    >
                                        <option value="" disabled>Select Location</option>
                                        {assetData?.location?.map((item, index) => (
                                            <option value={item?._id} key={index}>{item?.name}</option>
                                        ))}
                                    </TextField>
                                )}
                            />
                        </Grid>

                        {/* Vendor */}
                        <Grid item size={{ xs: 12, md: 6 }}>
                            <Controller
                                name="vendor_id"
                                control={control}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        select
                                        fullWidth
                                        label="Vendor"
                                        value={field.value ?? ""}
                                        error={!!errors.vendor_id}
                                        helperText={errors.vendor_id?.message}
                                        InputLabelProps={{ shrink: true }}
                                        SelectProps={{ native: true }}
                                    >
                                        <option value="">Select Vendor</option>
                                        {assetData?.vendor?.map((item, index) => (
                                            <option value={item?._id} key={index}>{item?.company_Name}</option>
                                        ))}
                                    </TextField>
                                )}
                            />
                        </Grid>

                        {/* Assigned To */}
                        <Grid item size={{ xs: 12, md: 6 }}>
                            <Controller
                                name="assigned_to"
                                control={control}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        select
                                        fullWidth
                                        value={field.value ?? ""}
                                        label="Assigned To"
                                        InputLabelProps={{ shrink: true }}
                                        SelectProps={{ native: true }}
                                    >
                                        <option value="">Select User</option>
                                        {assetData?.users?.map((item, index) => (
                                            <option value={item?._id} key={index}>
                                                {item?.first_name} {item?.last_name} ({item?.phone})
                                            </option>
                                        ))}
                                    </TextField>
                                )}
                            />
                        </Grid>

                        {/* Purchase Date */}
                        <Grid item size={{ xs: 12, md: 6 }}>
                            <Controller
                                name="purchase_date"
                                control={control}

                                render={({ field }) => (
                                    <TextField {...field} value={field.value ?? ""} fullWidth type="date" label="Purchase Date" InputLabelProps={{ shrink: true }} />
                                )}
                            />
                        </Grid>

                        {/* Purchase Cost */}
                        <Grid item size={{ xs: 12, md: 6 }}>
                            <Controller
                                name="purchase_cost"
                                control={control}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        fullWidth
                                        value={field.value ?? ""} //
                                        label="Purchase Cost"
                                        type="number"
                                        inputProps={{ min: 1 }}
                                        error={!!errors.purchase_cost}
                                        helperText={errors.purchase_cost?.message}
                                    />
                                )}
                            />
                        </Grid>

                        {/* Warranty Start */}
                        <Grid item size={{ xs: 12, md: 6 }}>
                            <Controller
                                name="warranty_start"
                                control={control}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        value={field.value ?? ''} // Fixes the null value error
                                        fullWidth
                                        type="date"
                                        label="Warranty Start"
                                        InputLabelProps={{ shrink: true }}
                                    />
                                )}
                            />
                        </Grid>

                        {/* Warranty End */}
                        <Grid item size={{ xs: 12, md: 6 }}>
                            <Controller
                                name="warranty_end"
                                control={control}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        fullWidth
                                        value={field.value ?? ""} //
                                        type="date"
                                        label="Warranty End"
                                        InputLabelProps={{ shrink: true }}
                                        error={!!errors.warranty_end}
                                        helperText={errors.warranty_end?.message}
                                    />
                                )}
                            />
                        </Grid>

                        {/* Status */}
                        <Grid item size={{ xs: 12, md: 6 }}>
                            <Controller
                                name="status"
                                control={control}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        select
                                        value={field.value ?? ""} //
                                        fullWidth
                                        label="Status"
                                        InputLabelProps={{ shrink: true }}
                                        SelectProps={{ native: true }}
                                    >
                                        <option value="1">Active</option>
                                        <option value="2">Inactive</option>
                                        <option value="3">Under Maintenance</option>
                                        <option value="4">Disposed</option>
                                    </TextField>
                                )}
                            />
                        </Grid>

                        {/* Condition */}
                        <Grid item size={{ xs: 12, md: 6 }}>
                            <Controller
                                name="condition"
                                control={control}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        select
                                        fullWidth
                                        value={field.value ?? ""}
                                        label="Condition"
                                        InputLabelProps={{ shrink: true }}
                                        SelectProps={{ native: true }}
                                    >
                                        <option value="1">Excellent</option>
                                        <option value="2">Good</option>
                                        <option value="3">Fair</option>
                                        <option value="4">Poor</option>
                                    </TextField>
                                )}
                            />
                        </Grid>

                        {/* Depreciation Value */}
                        <Grid item size={{ xs: 12 }}>
                            <Controller
                                name="depreciationValue"
                                control={control}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        fullWidth
                                        value={field.value ?? ""}
                                        inputProps={{ min: 1 }}
                                        label="Depreciation Value"
                                        type="number"
                                    />
                                )}
                            />
                        </Grid>

                        {/* Description */}
                        <Grid item size={{ xs: 12 }}>
                            <Controller
                                name="description"
                                control={control}
                                render={({ field }) => (
                                    <TextField {...field} fullWidth value={field.value ?? ""} multiline rows={4} label="Description" />
                                )}
                            />
                        </Grid>

                    </Grid>
                </DialogContent>

                <DialogActions sx={{ px: 3, py: 2, mt: "18px", mb: "8px", gap: 2, justifyContent: 'center', flexShrink: 0 }}>
                    <Button variant="contained" type="submit">
                        Save Asset
                    </Button>
                    <Button variant="outlined" onClick={handleClose}>
                        Cancel
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    )
};

const statusMap = {
    "1": "Active",
    "2": "Inactive",
    "3": "Under Maintenance",
    "4": "Disposed"
}


const conditionMap = {
    "1": "Excellent",
    "2": "Good",
    "3": "Fair",
    "4": "Poor"
}

export default function AssetDashboard() {

    const { data: session } = useSession()
    const token = session?.user?.token

    const [assetData, setAssetData] = useState()
    const [loading, setLoading] = useState(true)

    const [openDialog, setOpenDialog] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedAsset, setSelectedAsset] = useState()

    const getStatusColor = (status) => {
        switch (status) {
            case '1': return 'success';   // Active
            case '2': return 'warning';   // Inactive
            case '3': return 'error';     // Under Maintenance
            case '4': return 'default';   // Disposed (Fixed: added missing case)
            default: return 'default';
        }
    };

    const getConditionColor = (condition) => {
        switch (condition) {
            case '1': return 'success';   // Excellent
            case '2': return 'info';      // Good
            case '3': return 'warning';   // Fair
            case '4': return 'error';     // Poor
            default: return 'default';
        }
    };

    const fetchData = async () => {
        try {
            setLoading(true)

            const response = await fetch(`${API_URL}/company/asset/fetch/data`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            })

            const result = await response.json()

            if (response.ok) {

                setAssetData(result?.data);
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

    const filteredAssets = useMemo(() => {
        if (!assetData?.assets) return [];

        const search = searchTerm.trim().toLowerCase();

        if (!search) return assetData.assets;

        return assetData.assets.filter(asset =>
            asset?.name?.toLowerCase().includes(search) ||
            asset?.brand?.toLowerCase().includes(search) ||
            asset?.model?.toLowerCase().includes(search) ||
            asset?.serial_number?.toLowerCase().includes(search) ||
            asset?.asset_category_id?.name?.toLowerCase().includes(search) ||
            asset?.location_id?.name?.toLowerCase().includes(search)
        );
    }, [assetData, searchTerm]);

    if (loading) {

        return (
            <Box>
                <Toolbar />

                {/* Header */}
                <Box
                    display="flex"
                    justifyContent="space-between"
                    alignItems="center"
                    mb={4}
                >
                    <Box>
                        <Skeleton variant="text" width={220} height={40} />
                        <Skeleton variant="text" width={150} height={24} />
                    </Box>

                    <Skeleton variant="rounded" width={160} height={42} />
                </Box>

                {/* Summary Cards */}
                <Grid container spacing={3} mb={4}>
                    {[1, 2, 3].map((item) => (
                        <Grid key={item} size={{ xs: 12, sm: 4 }}>
                            <Card elevation={0}>
                                <CardContent>
                                    <Skeleton width="60%" height={24} />
                                    <Skeleton width="40%" height={40} />
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                </Grid>

                {/* Search */}
                <Paper elevation={0} sx={{ p: 2, mb: 3 }}>
                    <Skeleton variant="rounded" height={40} />
                </Paper>

                {/* Table */}
                <TableContainer component={Paper} elevation={0}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                {Array.from({ length: 7 }).map((_, index) => (
                                    <TableCell key={index}>
                                        <Skeleton width="80%" />
                                    </TableCell>
                                ))}
                            </TableRow>
                        </TableHead>

                        <TableBody>
                            {Array.from({ length: 6 }).map((_, row) => (
                                <TableRow key={row}>
                                    {Array.from({ length: 7 }).map((_, col) => (
                                        <TableCell key={col}>
                                            <Skeleton height={30} />
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Box>
        );
    }

    return (
        <Box >

            {/* Main Dashboard Content */}
            <Box >
                <Toolbar />

                {/* Top Header & Actions */}
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
                    <Box>
                        <Typography variant="h4" fontWeight="bold" color="#0f172a">
                            Asset Inventory
                        </Typography>
                    </Box>
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => {
                            setSelectedAsset()
                            setOpenDialog(true)
                        }}
                    >
                        Add New Asset
                    </Button>
                </Box>

                {/* Quick Summary Cards */}
                <Grid container spacing={3} mb={4}>
                    <Grid item size={{ xs: 12, sm: 4 }}>
                        <Card elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2 }}>
                            <CardContent>
                                <Typography color="text.secondary" variant="subtitle2">Total Assets</Typography>
                                <Typography variant="h5" fontWeight="bold" sx={{ mt: 1 }}>{assetData?.assets?.length}</Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item size={{ xs: 12, sm: 4 }}>
                        <Card elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2 }}>
                            <CardContent>
                                <Typography color="text.secondary" variant="subtitle2">Active AMC</Typography>
                                <Typography variant="h5" fontWeight="bold" color="success.main" sx={{ mt: 1 }}>0</Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item size={{ xs: 12, sm: 4 }}>
                        <Card elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2 }}>
                            <CardContent>
                                <Typography color="text.secondary" variant="subtitle2">Under Maintenance</Typography>
                                <Typography variant="h5" fontWeight="bold" color="warning.main" sx={{ mt: 1 }}>{assetData?.assets?.filter(ad => ad.status == "3").length}</Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>

                {/* Search Bar & Filters */}
                <Paper elevation={0} sx={{ p: 2, mb: 3, border: '1px solid #e2e8f0', borderRadius: 2 }}>
                    <TextField
                        fullWidth
                        placeholder="Search by asset name, serial number, or model..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon color="action" />
                                </InputAdornment>
                            ),
                        }}
                        size="small"
                    />
                </Paper>

                {/* Data Table for Assets Schema */}
                <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2 }}>
                    <Table sx={{ minWidth: 650 }} aria-label="assets table">
                        <TableHead sx={{ backgroundColor: '#f1f5f9' }}>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 'bold' }}>Asset Name</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>Category</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>Serial Number</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>Location</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>Condition</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>Action</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {!filteredAssets || filteredAssets.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                                        <Typography variant="body1" color="text.secondary">
                                            No Data Found
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredAssets.map((asset) => (
                                    <TableRow key={asset._id} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                                        <TableCell component="th" scope="row">
                                            <Typography variant="body2" fontWeight="bold">{asset.name}</Typography>
                                            <Typography variant="caption" color="text.secondary">{asset.brand} {asset.model}</Typography>
                                        </TableCell>

                                        {/* Fixed: Changed from asset.name to asset.category (or asset.category?.name depending on your schema) */}
                                        <TableCell>{asset?.asset_category_id?.name || 'N/A'}</TableCell>

                                        <TableCell>
                                            <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>{asset.serial_number}</Typography>
                                        </TableCell>

                                        {/* Fixed: Added optional chaining to prevent crashes if location_id is null/undefined */}
                                        <TableCell>
                                            {asset?.location_id?.name || 'N/A'}
                                        </TableCell>

                                        <TableCell>
                                            <Chip label={conditionMap?.[asset.condition]} color={getConditionColor(asset.condition)} size="small" variant="outlined" />
                                        </TableCell>

                                        <TableCell>
                                            <Chip label={statusMap?.[asset.status]} color={getStatusColor(asset.status)} size="small" />
                                        </TableCell>

                                        <TableCell>
                                            <IconButton
                                                size="small"
                                                onClick={() => {
                                                    setSelectedAsset(asset);
                                                    setOpenDialog(true);
                                                }}
                                            >
                                                <i className='tabler-edit' />
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
                <AssetComponent
                    open={openDialog}
                    setOpen={setOpenDialog}
                    assetData={assetData}
                    selectedAsset={selectedAsset}
                    token={token}
                    fetchData={fetchData}
                />
            </Box>
        </Box>
    );
}
