'use client';

import React, { useEffect, useRef, useState } from 'react';

import { useRouter, useParams } from 'next/navigation';

import {
    Alert,
    Box,
    Button,
    Chip,
    CircularProgress,
    FormControl,
    IconButton,
    InputLabel,
    MenuItem,
    Paper,
    Select,
    TextField,
    Typography,
} from '@mui/material';

import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';

import { useApi } from '@/utils/api';

const formControlSx = {
    '& .MuiInputLabel-root': {
        fontSize: 15,
    },
    '& .MuiOutlinedInput-root': {
        minHeight: 52,
        borderRadius: 2,
        fontSize: 15,
        backgroundColor: '#fff',
    },
    '& .MuiOutlinedInput-input': {
        padding: '14px 14px',
    },
    '& .MuiSelect-select': {
        padding: '14px !important',
        display: 'flex',
        alignItems: 'center',
    },
    '& .MuiFormHelperText-root': {
        fontSize: 12,
        marginLeft: 0,
    },
};

const sectionSx = {
    p: { xs: 2, sm: 2.5, md: 3 },
    borderRadius: 2.5,
};

const gridSx = {
    display: 'grid',
    gridTemplateColumns: {
        xs: '1fr',
        sm: 'repeat(2, minmax(0, 1fr))',
    },
    gap: 2,
};

const CATEGORIES = [
    'ELECTRONICS',
    'FURNITURE',
    'VEHICLE',
    'MACHINERY',
    'SOFTWARE',
    'OTHER',
];

const STATUSES = [{
    label: "Active",
    value: true
},
{
    label: "Inactive",
    value: false
}];

const today = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year} -${month} -${day} `;
};

const Section = ({ title, icon, children, sx = {} }) => (
    <Paper
        variant="outlined"
        sx={{
            p: { xs: 1.5, sm: 2 },
            borderRadius: 2,
            borderColor: '#e0e3e8',
            backgroundColor: '#fff',
            boxShadow: '0 1px 3px rgba(15, 23, 42, 0.03)',
            minWidth: 0,
            ...sx,
        }}
    >
        <Typography
            sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                mb: 2.5,
                color: '#344054',
                fontSize: 16,
                fontWeight: 700,
            }}
        >
            {icon && (
                <Box
                    component="span"
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        color: "primary.main",
                    }}
                >
                    {icon}
                </Box>
            )}
            {title}
        </Typography>

        {children}
    </Paper>
);

const AssetCreatePage = ({ id, lang }) => {

    const router = useRouter();

    const { doGet, token, doPost, doPostFormData } = useApi()

    const fileRef = useRef(null);

    const [form, setForm] = useState({
        name: '',
        category: '',
        description: '',
        serialNumber: '',
        status: 'Active',
        purchaseValue: 0,
        purchaseDate: today(),
        location: '',
        assignmentType: 'Employee',
        employeeId: '',
    });

    const [files, setFiles] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [errors, setErrors] = useState({});
    const [saving, setSaving] = useState(false);
    const [serverError, setServerError] = useState('');

    const [data, setData] = useState()
    const [editData, setEditData] = useState()

    const set = (key) => (event) => {
        setForm((previous) => ({
            ...previous,
            [key]: event.target.value,
        }));

        setErrors((previous) => ({
            ...previous,
            [key]: '',
        }));

        setServerError('');
    };

    useEffect(() => {
        if (!token) return;

        const fetchData = async () => {
            try {
                const response = await doGet('company/asset/create/data');

                setData(response?.data ?? response);

                // Populate employees from the API response.
                setEmployees(
                    response?.data?.employees ??
                    response?.employees ??
                    []
                );

                if (!id) return;

                const result = await doGet(`company/asset/edit/data/${id} `);
                const asset = result?.data ?? result;

                setEditData(asset);

                // Populate the form with the existing asset.
                setForm({
                    name: asset?.name ?? '',
                    category: asset?.asset_category_id ?? '',
                    description: asset?.description ?? '',
                    serialNumber: asset?.serial_number ?? '',
                    status: String(asset?.status ?? 'ACTIVE').toUpperCase() === 'INACTIVE' ? false : true,
                    purchaseValue: asset?.purchase_cost ?? 0,
                    purchaseDate: asset?.purchaseDate ? String(asset.purchaseDate).slice(0, 10) : today().replaceAll(' ', ''),
                    location: asset?.location ?? '',
                    assignmentType: 'Employee',
                    employeeId: asset?.employeeId?._id ?? asset?.employeeId ?? '',
                });
            } catch (error) {
                console.error('Failed to load asset data:', error);
                setServerError(
                    error.message || 'Failed to load asset data.'
                );
            }
        };

        fetchData();
    }, [token, id]);

    const addFiles = (fileList) => {
        const selectedFiles = Array.from(fileList || []);

        if (!selectedFiles.length) return;

        setFiles((previous) => [...previous, ...selectedFiles]);
    };

    const validate = () => {
        const validationErrors = {};

        if (!form.name.trim()) {
            validationErrors.name = 'Asset name is required';
        }

        if (!form.category) {
            validationErrors.category = 'Please select a category';
        }

        if (
            form.purchaseValue === '' ||
            Number.isNaN(Number(form.purchaseValue)) ||
            Number(form.purchaseValue) < 0
        ) {
            validationErrors.purchaseValue =
                'Enter a valid purchase value';
        }

        setErrors(validationErrors);

        return Object.keys(validationErrors).length === 0;
    };


    const handleSave = async () => {
        if (saving || !validate()) return;

        setSaving(true);
        setServerError('');

        try {
            const body = new FormData();

            // Match the backend controller and Mongoose schema.
            body.append('name', form.name.trim());
            body.append('category', form.category);
            body.append('status', String(form.status).toUpperCase());

            body.append('purchaseValue', String(form.purchaseValue));

            if (form.description.trim()) {
                body.append('description', form.description.trim());
            }

            if (form.serialNumber.trim()) {
                body.append('serialNumber', form.serialNumber.trim());
            }

            if (form.purchaseDate) {
                body.append('purchaseDate', form.purchaseDate);
            }

            if (form.location.trim()) {
                body.append('location', form.location.trim());
            }

            if (form.employeeId) {
                body.append('employeeId', form.employeeId);
            }

            // Must match uploadAsset.array('attachments', 10).
            files.forEach((file) => {
                body.append('attachments', file);
            });

            await doPost(id ? `company/asset/update/data/${id} ` : 'company/asset/save/data', body);

            router.push(`/${lang}/apps/asset-management`);
        } catch (error) {
            setServerError(
                error.message || 'Something went wrong. Please try again.'
            );
        } finally {
            setSaving(false);
        }
    };

    return (
        <Box
            sx={{
                width: '100%',
                minWidth: 0,
                p: { xs: 1.5, sm: 2, md: 2.5 },
                boxSizing: 'border-box',
                backgroundColor: '#f8f9fb',
                minHeight: '100%',
            }}
        >
            {/* Page heading */}
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    mb: 2,
                }}
            >
                <IconButton
                    size="small"
                    onClick={() => router.replace(`/${lang}/apps/asset-management`)}
                    aria-label="Go back"
                    sx={{
                        color: '#475467',
                        border: '1px solid #e0e3e8',
                        backgroundColor: '#fff',
                        '&:hover': {
                            backgroundColor: '#f2f4f7',
                        },
                    }}
                >
                    <ArrowBackIcon fontSize="small" />
                </IconButton>

                <Box>
                    <Typography
                        variant="h6"
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                            mb: 2.5,
                            color: '#344054',
                            fontSize: 16,
                            fontWeight: 700,
                        }}
                    >
                        {id ? "Update Asset" : "Create Asset"}
                    </Typography>
                </Box>
            </Box>

            {serverError && (
                <Alert
                    severity="error"
                    onClose={() => setServerError('')}
                    sx={{
                        mb: 2,
                        borderRadius: 2,
                        fontSize: 13,
                    }}
                >
                    {serverError}
                </Alert>
            )}

            <Box
                component="form"
                onSubmit={(event) => {
                    event.preventDefault();
                    handleSave();
                }}
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 1.5,
                    width: '100%',
                    minWidth: 0,
                }}
                noValidate
            >
                {/* Basic Information */}
                <Section title="Basic Information">
                    <Box
                        sx={{
                            display: 'grid',
                            gridTemplateColumns: {
                                xs: '1fr',
                                sm: 'repeat(2, minmax(0, 1fr))',
                            },
                            gap: 1.5,
                        }}
                    >
                        <TextField
                            fullWidth
                            required
                            sx={formControlSx}
                            label="Asset Name"
                            placeholder="e.g. Office Laptop 2024"
                            value={form.name}
                            onChange={set('name')}
                            error={!!errors.name}
                            helperText={errors.name}

                        />

                        <FormControl
                            fullWidth
                            required
                            sx={formControlSx}
                            error={!!errors.category}

                        >
                            <InputLabel id="asset-category-label">
                                Category
                            </InputLabel>

                            <Select
                                labelId="asset-category-label"
                                label="Category"
                                value={form.category}
                                onChange={set('category')}
                            >
                                {data?.assetCategory?.map((category) => (
                                    <MenuItem
                                        key={category._id}
                                        value={category._id}
                                    >
                                        {category?.name}
                                    </MenuItem>
                                ))}
                            </Select>

                            {errors.category && (
                                <Typography
                                    variant="caption"
                                    color="var(--mui-palette-error-main)"
                                >
                                    {errors.category}
                                </Typography>
                            )}
                        </FormControl>

                        <TextField
                            fullWidth
                            multiline
                            minRows={3}
                            label="Description"
                            placeholder="Provide details about the asset..."
                            value={form.description}
                            onChange={set('description')}
                            sx={formControlSx}
                        />
                    </Box>
                </Section>

                {/* Details and Financial Information */}
                <Box
                    sx={{
                        display: 'grid',
                        gridTemplateColumns: {
                            xs: '1fr',
                            md: 'repeat(2, minmax(0, 1fr))',
                        },
                        gap: 1.5,
                        alignItems: 'stretch',
                    }}
                >
                    <Section title="Details & Status">
                        <Box
                            sx={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 1.5,
                            }}
                        >
                            <TextField
                                fullWidth
                                label="Serial Number"
                                placeholder="S/N or Tag ID"
                                sx={formControlSx}
                                value={form.serialNumber}
                                onChange={set('serialNumber')}

                            />

                            <FormControl
                                fullWidth
                                sx={formControlSx}

                            >
                                <InputLabel id="asset-status-label">
                                    Status
                                </InputLabel>

                                <Select
                                    labelId="asset-status-label"
                                    label="Status"
                                    value={form.status}
                                    onChange={set('status')}
                                >
                                    {STATUSES.map((status, index) => (
                                        <MenuItem
                                            key={index}
                                            value={status.value}
                                        >
                                            {status.label}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Box>
                    </Section>

                    <Section title="Financial & Location">
                        <Box
                            sx={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 1.5,
                            }}
                        >
                            <TextField
                                fullWidth
                                type="number"
                                label="Purchase Value (INR)"
                                value={form.purchaseValue}
                                onChange={set('purchaseValue')}
                                error={!!errors.purchaseValue}
                                helperText={errors.purchaseValue}
                                sx={formControlSx}
                                slotProps={{
                                    htmlInput: { min: 0, step: 'any' },
                                }}

                            />

                            <TextField
                                fullWidth
                                type="date"
                                label="Purchase Date"
                                value={form.purchaseDate}
                                sx={formControlSx}
                                onChange={set('purchaseDate')}
                                slotProps={{
                                    inputLabel: { shrink: true },
                                }}

                            />

                            <TextField
                                fullWidth
                                label="Location"
                                placeholder="e.g. Building A / Room 101"
                                value={form.location}
                                sx={formControlSx}
                                onChange={set('location')}

                            />
                        </Box>
                    </Section>
                </Box>

                {/* Initial Assignment */}
                <Section
                    title="Initial Assignment (Optional)"
                    icon={<PersonOutlineIcon fontSize="small" />}
                >
                    <Box
                        sx={{
                            display: 'grid',
                            gridTemplateColumns: {
                                xs: '1fr',
                                sm: 'repeat(2, minmax(0, 1fr))',
                            },
                            gap: 1.5,
                        }}
                    >
                        <FormControl
                            fullWidth
                            sx={formControlSx}

                        >
                            <InputLabel id="assignment-type-label">
                                Assignment Type
                            </InputLabel>

                            <Select
                                labelId="assignment-type-label"
                                label="Assignment Type"
                                value={form.assignmentType}
                                onChange={set('assignmentType')}
                            >
                                <MenuItem value="Employee">
                                    Employee
                                </MenuItem>
                            </Select>
                        </FormControl>

                        <FormControl
                            fullWidth
                            sx={formControlSx}

                        >
                            <InputLabel id="employee-select-label">
                                Select Employee
                            </InputLabel>

                            <Select
                                labelId="employee-select-label"
                                label="Select Employee"
                                value={form.employeeId}
                                onChange={set('employeeId')}
                            >
                                <MenuItem value="">
                                    <em>None</em>
                                </MenuItem>

                                {employees.map((employee) => {
                                    const id = employee._id || employee.id;

                                    const name =
                                        employee.name ||
                                        `${employee.firstName ?? ''} ${employee.lastName ?? ''
                                            } `.trim();

                                    return (
                                        <MenuItem key={id} value={id}>
                                            {name || 'Unnamed Employee'}
                                        </MenuItem>
                                    );
                                })}
                            </Select>
                        </FormControl>
                    </Box>
                </Section>

                {/* Attachments */}
                <Section
                    title="Attachments"
                    icon={<AttachFileIcon fontSize="small" />}
                >
                    <Box
                        role="button"
                        tabIndex={0}
                        onClick={() => fileRef.current?.click()}
                        onKeyDown={(event) => {
                            if (
                                event.key === 'Enter' ||
                                event.key === ' '
                            ) {
                                event.preventDefault();
                                fileRef.current?.click();
                            }
                        }}
                        onDragOver={(event) => event.preventDefault()}
                        onDrop={(event) => {
                            event.preventDefault();
                            addFiles(event.dataTransfer.files);
                        }}
                        sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 0.75,
                            minHeight: 100,
                            px: 2,
                            py: 2.5,
                            border: '1px dashed #cbd2dc',
                            borderRadius: 2,
                            backgroundColor: '#fafbfc',
                            cursor: 'pointer',
                            textAlign: 'center',
                            transition: 'all 0.2s ease',
                            '&:hover': {
                                borderColor: "primary.main",
                                backgroundColor: '#fff8f3',
                            },
                            '&:focus-visible': {
                                outline: `2px solid primary.main`,
                                outlineOffset: 2,
                            },
                        }}
                    >
                        <AttachFileIcon
                            sx={{ fontSize: 22, color: '#667085' }}
                        />

                        <Typography
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1,
                                mb: 2.5,
                                color: '#344054',
                                fontSize: 16,
                                fontWeight: 700,
                            }}
                        >
                            Click to upload or drag and drop
                        </Typography>

                        <Typography
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1,
                                mb: 2.5,
                                color: '#344054',
                                fontSize: 16,
                                fontWeight: 700,
                            }}
                        >
                            Select one or more files
                        </Typography>

                        <input
                            ref={fileRef}
                            type="file"
                            multiple
                            hidden
                            onChange={(event) => {
                                addFiles(event.target.files);
                                event.target.value = '';
                            }}
                        />
                    </Box>

                    {files.length > 0 && (
                        <Box
                            sx={{
                                display: 'flex',
                                flexWrap: 'wrap',
                                gap: 1,
                                mt: 1.5,
                            }}
                        >
                            {files.map((file, index) => (
                                <Chip
                                    key={`${file.name} -${index} `}
                                    label={file.name}
                                    size="small"
                                    variant="outlined"
                                    onDelete={() =>
                                        setFiles((previous) =>
                                            previous.filter(
                                                (_, fileIndex) =>
                                                    fileIndex !== index
                                            )
                                        )
                                    }
                                    sx={{
                                        maxWidth: '100%',
                                        borderColor: '#d8dce3',
                                        '& .MuiChip-label': {
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                        },
                                    }}
                                />
                            ))}
                        </Box>
                    )}
                </Section>

                {/* Form Actions */}
                <Box
                    sx={{
                        display: 'flex',
                        justifyContent: 'center',
                        flexWrap: 'wrap',
                        gap: 1,
                        pt: 0.5,
                    }}
                >
                    <Button
                        type="submit"
                        variant="contained"
                        disabled={saving}
                        size="large"
                        sx={{
                            minHeight: 46,
                            minWidth: 130,
                            px: 3,
                            borderRadius: 2,
                            fontSize: 14,
                            fontWeight: 600,
                            textTransform: 'none',
                        }}
                        startIcon={
                            saving ? (
                                <CircularProgress
                                    size={16}
                                    color="inherit"
                                />
                            ) : (
                                <SaveOutlinedIcon />
                            )
                        }
                    >
                        {saving ? 'Saving...' : 'Save Asset'}
                    </Button>
                    <Button
                        variant="outlined"
                        onClick={() => router.replace(`/${lang}/apps/asset-management`)}
                        size="large"
                        sx={{
                            minHeight: 46,
                            minWidth: 130,
                            px: 3,
                            borderRadius: 2,
                            fontSize: 14,
                            fontWeight: 600,
                            textTransform: 'none',
                        }}
                        disabled={saving}
                    >
                        Cancel
                    </Button>
                </Box>
            </Box>
        </Box>
    );
};

export default AssetCreatePage;

