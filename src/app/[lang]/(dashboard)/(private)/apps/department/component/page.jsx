'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    Alert,
    Box,
    Button,
    Chip,
    CircularProgress,
    FormControl,
    FormHelperText,
    IconButton,
    MenuItem,
    Paper,
    Select,
    TextField,
    Typography,
    alpha,
    useTheme,
} from '@mui/material';

import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useApi } from '@/utils/api';

const initialForm = {
    name: '',
    manager: '',
    propertyGroups: [],
    budget: '',
    status: 'active',
    description: '',
};

const statusOptions = [
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
];

/* Custom Labeled Field Component */
const LabeledField = ({ label, required = false, error, helperText, children, sx }) => (
    <Box sx={{ minWidth: 0, ...sx }}>
        <Typography
            component="label"
            sx={{
                display: 'block',
                mb: 1,
                fontSize: '0.85rem',
                fontWeight: 600,
                color: 'text.primary',
            }}
        >
            {label}
            {required && (
                <Box component="span" sx={{ color: 'error.main', ml: 0.5, fontWeight: 700 }}>
                    *
                </Box>
            )}
        </Typography>
        {children}
        {(error || helperText) && (
            <FormHelperText error={!!error} sx={{ mx: 0, mt: 0.75, fontSize: '0.75rem' }}>
                {error || helperText}
            </FormHelperText>
        )}
    </Box>
);

const DepartmentCreatePage = ({ id, lang }) => {
    const router = useRouter();
    const theme = useTheme();
    const { doGet, token, doPost } = useApi();
    const listPath = `/${lang}/apps/department`;

    const [form, setForm] = useState(initialForm);
    const [createData, setCreateData] = useState({});
    const [errors, setErrors] = useState({});
    const [saving, setSaving] = useState(false);
    const [serverError, setServerError] = useState('');

    const set = (key) => (event) => {
        const value = event?.target?.value ?? '';
        setForm((prev) => ({ ...prev, [key]: value }));
        setErrors((prev) => ({ ...prev, [key]: '' }));
        setServerError('');
    };

    useEffect(() => {
        if (!token) return;

        const fetchData = async () => {
            try {
                const response = await doGet('company/department/create/data');
                const payload = response?.data ?? response;
                setCreateData(payload ?? {});

                if (!id) return;

                const result = await doGet(`company/department/edit/data/${id}`);
                const department = result?.data ?? result;

                const groups = department?.property_groups ?? [];

                setForm({
                    name: department?.name ?? '',
                    manager: department?.manager?._id ?? department?.manager ?? '',
                    propertyGroups: Array.isArray(groups)
                        ? groups.map((g) => g?._id ?? g?.id ?? g)
                        : [],
                    budget: department?.budget ?? '',
                    status: department?.status ?? 'active',
                    description: department?.description ?? '',
                });
            } catch (error) {
                setServerError(error?.message || 'Failed to load department details.');
            }
        };

        fetchData();
    }, [token, id]);

    const validate = () => {
        const nextErrors = {};
        if (!form.name.trim()) nextErrors.name = 'Department name is required';
        if (form.budget !== '' && (isNaN(Number(form.budget)) || Number(form.budget) < 0)) {
            nextErrors.budget = 'Enter a valid positive budget';
        }
        setErrors(nextErrors);
        return Object.keys(nextErrors).length === 0;
    };

    const handleSave = async (event) => {
        event.preventDefault();
        if (saving || !validate()) return;

        setSaving(true);
        setServerError('');
        try {

            await doPost(
                id ? `company/department/update/data/${id}` : 'company/department/save/data',
                form
            );
            router.push(listPath);
        } catch (error) {
            setServerError(error?.message || 'Something went wrong. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const managers = createData?.users ?? [];
    const propertyGroups = createData?.propertyGroup ?? [];

    /* Unified input styling to guarantee identical heights across TextFields & Selects */
    const inputStyle = {
        '& .MuiOutlinedInput-root': {
            borderRadius: '8px',
            backgroundColor: theme.palette.mode === 'dark' ? alpha('#fff', 0.02) : '#fff',
            '& fieldset': {
                borderColor: theme.palette.mode === 'dark' ? alpha('#fff', 0.15) : '#cbd5e1',
            },
            '&:hover fieldset': {
                borderColor: theme.palette.text.secondary,
            },
            '&.Mui-focused fieldset': {
                borderColor: 'primary.main',
                borderWidth: '1.5px',
            },
        },
        '& .MuiInputBase-input': {
            fontSize: '0.9rem',
            padding: '10px 14px',
        },
    };

    return (
        <Box sx={{ width: '100%', pb: 6 }}>
            {/* ---------- Header Section ---------- */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <IconButton
                    aria-label="Back to departments"
                    onClick={() => router.push(listPath)}
                    size="small"
                    sx={{
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: '8px',
                        p: 1,
                        color: 'text.primary',
                        backgroundColor: 'background.paper',
                        '&:hover': {
                            backgroundColor: alpha(theme.palette.text.primary, 0.04),
                        },
                    }}
                >
                    <ArrowBackIcon fontSize="small" />
                </IconButton>
                <Box>
                    <Typography
                        component="h1"
                        sx={{ fontSize: '24px', fontWeight: 700, lineHeight: 1.2, color: 'text.primary' }}
                    >
                        {id ? 'Edit Department' : 'Create Department'}
                    </Typography>
                    <Typography sx={{ fontSize: '0.85rem', color: 'text.secondary', mt: 0.5 }}>
                        {id ? 'Update this department’s details' : 'Add a new department to your organization'}
                    </Typography>
                </Box>
            </Box>

            {serverError && (
                <Alert severity="error" variant="outlined" onClose={() => setServerError('')} sx={{ mb: 3, borderRadius: '8px' }}>
                    {serverError}
                </Alert>
            )}

            {/* ---------- Main Form Card ---------- */}
            <Paper
                component="form"
                elevation={0}
                onSubmit={handleSave}
                noValidate
                sx={{
                    width: '100%',
                    p: { xs: 3, sm: 4 },
                    borderRadius: '12px',
                    border: '1px solid',
                    borderColor: 'divider',
                    bgcolor: 'background.paper',
                    boxShadow: '0px 2px 8px rgba(0,0,0,0.02)',
                }}
            >
                <Box
                    sx={{
                        display: 'grid',
                        gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' },
                        columnGap: 4,
                        rowGap: 3,
                    }}
                >
                    {/* Department Name */}
                    <LabeledField label="Department Name" required error={errors.name}>
                        <TextField
                            fullWidth
                            size="small"
                            placeholder="e.g., Engineering"
                            value={form.name}
                            onChange={set('name')}
                            error={!!errors.name}
                            sx={inputStyle}
                        />
                    </LabeledField>

                    {/* Manager */}
                    <LabeledField label="Manager">
                        <FormControl fullWidth size="small" sx={inputStyle}>
                            <Select
                                displayEmpty
                                value={form.manager}
                                onChange={set('manager')}
                                renderValue={(value) => {
                                    if (!value) return <Box component="span" sx={{ color: 'text.disabled' }}>Select a manager</Box>;
                                    const m = managers.find((x) => (x._id ?? x.id) === value);
                                    return m?.name ?? m?.full_name ?? value;
                                }}
                            >
                                <MenuItem value="" disabled>
                                    <em>Select a manager</em>
                                </MenuItem>
                                {managers.map((m) => (
                                    <MenuItem key={m._id ?? m.id} value={m._id ?? m.id} sx={{ fontSize: '0.9rem' }}>
                                        {m.name ?? m.full_name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </LabeledField>

                    {/* Property Groups */}
                    <LabeledField label="Property Groups">
                        <FormControl fullWidth size="small" sx={inputStyle}>
                            <Select
                                multiple
                                displayEmpty
                                value={form.propertyGroups}
                                onChange={set('propertyGroups')}
                                renderValue={(selected) => {
                                    if (!selected.length) {
                                        return <Box component="span" sx={{ color: 'text.disabled' }}>Select property groups</Box>;
                                    }
                                    return (
                                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, py: 0.25 }}>
                                            {selected.map((sid) => {
                                                const g = propertyGroups.find((x) => (x._id ?? x.id) === sid);
                                                return (
                                                    <Chip
                                                        key={sid}
                                                        label={g?.name ?? sid}
                                                        size="small"
                                                        sx={{ borderRadius: '4px', height: 22, fontSize: '0.75rem' }}
                                                    />
                                                );
                                            })}
                                        </Box>
                                    );
                                }}
                            >
                                {propertyGroups.map((g) => (
                                    <MenuItem key={g._id ?? g.id} value={g._id ?? g.id} sx={{ fontSize: '0.9rem' }}>
                                        {g.name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </LabeledField>

                    {/* Budget */}
                    <LabeledField label="Budget" error={errors.budget}>
                        <TextField
                            fullWidth
                            size="small"
                            type="number"
                            placeholder="e.g., 2500000"
                            value={form.budget}
                            onChange={set('budget')}
                            error={!!errors.budget}
                            inputProps={{ min: 0 }}
                            sx={inputStyle}
                        />
                    </LabeledField>

                    {/* Status */}
                    <LabeledField label="Status">
                        <FormControl fullWidth size="small" sx={inputStyle}>
                            <Select value={form.status} onChange={set('status')}>
                                {statusOptions.map((s) => (
                                    <MenuItem key={s.value} value={s.value} sx={{ fontSize: '0.9rem' }}>
                                        {s.label}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </LabeledField>

                    {/* Description */}
                    <LabeledField label="Description" sx={{ gridColumn: { md: '1 / -1' } }}>
                        <TextField
                            fullWidth
                            multiline
                            minRows={3}
                            placeholder="Briefly describe the department's role and responsibilities..."
                            value={form.description}
                            onChange={set('description')}
                            sx={inputStyle}
                        />
                    </LabeledField>
                </Box>

                {/* ---------- Actions Bar ---------- */}
                <Box
                    sx={{
                        display: 'flex',
                        justifyContent: 'flex-end',
                        gap: 1.5,
                        mt: 4,
                        pt: 3,
                        borderTop: '1px solid',
                        borderColor: 'divider',
                    }}
                >
                    <Button
                        variant="outlined"
                        disabled={saving}
                        onClick={() => router.replace(listPath)}
                        sx={{
                            borderRadius: '8px',
                            px: 3,
                            py: 1,
                            textTransform: 'none',
                            fontWeight: 600,
                            borderColor: 'divider',
                            color: 'text.primary',
                        }}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        variant="contained"
                        disableElevation
                        disabled={saving}
                        sx={{
                            borderRadius: '8px',
                            px: 3,
                            py: 1,
                            textTransform: 'none',
                            fontWeight: 600,
                        }}
                    >
                        {saving ? (
                            <CircularProgress size={20} color="inherit" />
                        ) : id ? (
                            'Update Department'
                        ) : (
                            'Create Department'
                        )}
                    </Button>
                </Box>
            </Paper>
        </Box>
    );
};

export default DepartmentCreatePage;
