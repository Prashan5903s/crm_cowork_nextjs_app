'use client';

import React, { useEffect, useRef, useState } from 'react';

import { useRouter } from 'next/navigation';

import {
    Alert,
    Avatar,
    Box,
    Button,
    CircularProgress,
    FormControl,
    FormHelperText,
    IconButton,
    Stack,
    InputLabel,
    MenuItem,
    Paper,
    Select,
    TextField,
    Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';

import PhotoCameraOutlinedIcon from '@mui/icons-material/PhotoCameraOutlined';
import CloudUploadOutlinedIcon from '@mui/icons-material/CloudUploadOutlined';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

import { useApi } from '@/utils/api';

import { getCountries, getCountryCallingCode } from 'libphonenumber-js'
import * as Flags from 'country-flag-icons/react/3x2'

const regionNames = new Intl.DisplayNames(['en'], {
    type: 'region',
})

const COUNTRIES = getCountries()
    .map(iso => ({
        iso,
        name: regionNames.of(iso) || iso,
        dial: `+${getCountryCallingCode(iso)}`,
    }))
    .sort((a, b) => a.name.localeCompare(b.name))

const Flag = ({ iso }) => {
    const F = Flags[iso]

    return F ? (
        <F
            title={iso}
            style={{
                width: 22,
                height: 15,
                borderRadius: 2,
                flexShrink: 0,
                display: 'block',
            }}
        />
    ) : null
}

const fieldGridSx = {
    display: 'grid',
    gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' },
    columnGap: 2.5,
    rowGap: 3,
};

const initialForm = {
    name: '',
    category: '',
    taxNumber: '',
    contactName: '',
    email: '',
    mobileNumber: '',
    countryCode: '',
    city: '',
    state: '',
    country: '',
    address: '',
};

const ASSET_URL = process.env.NEXT_PUBLIC_ASSETS_URL

/* ---------- Layout helpers ---------- */
const Section = ({ title, description, children, last = false }) => (
    <Box
        component="section"
        sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '240px minmax(0, 1fr)' },
            columnGap: 6,
            rowGap: 2.5,
            minWidth: 0,
            py: { xs: 3.5, md: 5 },
            borderBottom: last ? 'none' : '1px solid',
            borderColor: 'divider',
        }}
    >
        <Box sx={{ maxWidth: { md: 220 } }}>
            <Typography
                component="h2"
                sx={{
                    fontSize: 16,
                    lineHeight: 1.4,
                    fontWeight: 650,
                    letterSpacing: '-0.01em',
                    color: 'text.primary',
                }}
            >
                {title}
            </Typography>
            {description && (
                <Typography sx={{ mt: 0.75, fontSize: 13, lineHeight: 1.6, color: 'text.secondary' }}>
                    {description}
                </Typography>
            )}
        </Box>
        <Box sx={{ minWidth: 0 }}>{children}</Box>
    </Box>
);

const Field = ({ label, required = false, ...props }) => (
    <TextField fullWidth label={label} required={required} size="small" {...props} />
);

/* ---------- Page ---------- */
const VendorCreatePage = ({ id, lang }) => {
    const router = useRouter();
    const { doGet, token, doPost } = useApi();
    const imageRef = useRef(null);
    const listPath = `/${lang}/apps/vendor`;

    const [form, setForm] = useState(initialForm);
    const [createData, setCreateData] = useState([]);
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState('');
    const [errors, setErrors] = useState({});
    const [saving, setSaving] = useState(false);
    const [serverError, setServerError] = useState('');

    const [countryId, setCountryId] = useState();
    const [stateData, setStateData] = useState();
    const [stateId, setStateId] = useState();
    const [cityData, setCityData] = useState();

    const set = (key) => (event) => {
        const value = event?.target?.value ?? '';
        setForm((previous) => ({ ...previous, [key]: value }));
        setErrors((previous) => ({ ...previous, [key]: '' }));
        setServerError('');
    };

    useEffect(() => {
        if (!token) return;

        const fetchData = async () => {
            try {
                const response = await doGet('company/vendor/create/data');
                const payload = response?.data ?? response;
                setCreateData(payload ?? {});

                if (!id) return;

                const result = await doGet(`company/vendor/edit/data/${id}`);
                const vendor = result?.data ?? result;
                setForm({
                    name: vendor?.company_Name ?? '',
                    category: vendor?.vendor_category_id?._id ?? vendor?.vendor_category_id ?? vendor?.category?._id ?? vendor?.category ?? '',
                    taxNumber: vendor?.gst_no ?? '',
                    contactName: vendor?.contact_name ?? '',
                    email: vendor?.email ?? '',
                    mobileNumber: vendor?.mobileNumber ?? vendor?.mobile_number ?? vendor?.phone ?? '',
                    countryCode: vendor?.country_code ?? '',
                    city: vendor?.city ?? '',
                    state: vendor?.state ?? '',
                    country: vendor?.country ?? '',
                    address: vendor?.address ?? '',
                });

                setCountryId(vendor?.country)
                setStateId(vendor?.state)
                if (vendor?.image) {
                    setImagePreview(`${ASSET_URL}/${vendor.image}` ?? "");
                }
            } catch (error) {
                setServerError(error?.message || 'Failed to load vendor details.');
            }
        };

        fetchData();
    }, [token, id]);

    useEffect(() => {
        return () => {
            if (imagePreview?.startsWith('blob:')) URL.revokeObjectURL(imagePreview);
        };
    }, [imagePreview]);

    useEffect(() => {
        if (!countryId || !createData?.country?.length) {
            setStateData([]);
            return;
        }

        const selectedCountry = createData.country.find(
            (item) => String(item.country_id) === String(countryId)
        );

        setStateData(selectedCountry?.states ?? []);
    }, [countryId, createData]);

    useEffect(() => {
        if (!stateId || !stateData?.length) {
            setCityData([]);
            return;
        }

        const selectedState = stateData.find(
            (item) => String(item.state_id) === String(stateId)
        );

        setCityData(selectedState?.cities ?? []);
    }, [stateId, stateData]);

    const handleImageChange = (event) => {
        const file = event.target.files?.[0];
        if (!file) return;
        if (file.size > 10 * 1024 * 1024) {
            setServerError('Image must be 10 MB or smaller.');
            event.target.value = '';
            return;
        }
        setImageFile(file);
        setImagePreview(URL.createObjectURL(file));
        setServerError('');
        event.target.value = '';
    };

    const validate = () => {
        const nextErrors = {};
        if (!form.name) nextErrors.name = 'Vendor name is required';
        if (!form.category) nextErrors.category = 'Please select a category';
        if (!form.taxNumber) nextErrors.taxNumber = 'Tax / GST number is required';
        if (!form.contactName) nextErrors.contactName = 'Contact name is required';
        if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
            nextErrors.email = 'Enter a valid email address';
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
            const body = new FormData();
            body.append('name', form.name);
            body.append('category', form.category);
            body.append('taxNumber', form.taxNumber);
            body.append('contactName', form.contactName);
            body.append('email', form.email);
            body.append('mobileNumber', form.mobileNumber);
            body.append('countryCode', form.countryCode);
            body.append('city', form.city);
            body.append('state', form.state);
            body.append('country', form.country);
            body.append('address', form.address);
            if (imageFile) body.append('image', imageFile);


            await doPost(
                id ? `company/vendor/update/data/${id}` : 'company/vendor/save/data',
                body
            );
            router.push(listPath);
        } catch (error) {
            setServerError(error?.message || 'Something went wrong. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const initial = form.name.charAt(0).toUpperCase() || 'V';


    const handleCountryChange = (event) => {
        const selectedCountryId = event.target.value;

        const selectedCountry = createData?.country?.find(
            (item) => String(item.country_id) === String(selectedCountryId)
        );

        setCountryId(selectedCountryId);
        setStateId('');
        setStateData(selectedCountry?.states ?? []);
        setCityData([]);

        setForm((prev) => ({
            ...prev,
            country: selectedCountryId,
            state: '',
            city: ''
        }));

        setErrors((prev) => ({
            ...prev,
            country: '',
            state: '',
            city: ''
        }));

        setServerError('');
    };

    const handleStateChange = (event) => {
        const selectedStateId = event.target.value;

        const selectedState = stateData?.find(
            (item) => String(item.state_id) === String(selectedStateId)
        );

        setStateId(selectedStateId);
        setCityData(selectedState?.cities ?? []);

        setForm((prev) => ({
            ...prev,
            state: selectedStateId,
            city: ''
        }));

        setErrors((prev) => ({
            ...prev,
            state: '',
            city: ''
        }));
    };

    const handleCityChange = (event) => {
        const selectedCityId = event.target.value;

        setForm((prev) => ({
            ...prev,
            city: selectedCityId
        }));

        setErrors((prev) => ({
            ...prev,
            city: ''
        }));
    };


    return (
        <Box sx={{ width: '100%', minWidth: 0, minHeight: '100%', boxSizing: 'border-box' }}>
            {/* ---------- Page header with back button ---------- */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.5 }}>
                <IconButton
                    aria-label="Back to vendors"
                    onClick={() => router.push(listPath)}
                    sx={{
                        width: 40,
                        height: 40,
                        border: '1px solid',
                        borderColor: 'divider',
                        bgcolor: 'background.paper',
                        color: 'text.primary',
                        '&:hover': { bgcolor: 'action.hover' },
                    }}
                >
                    <ArrowBackIcon fontSize="small" />
                </IconButton>
                <Box sx={{ minWidth: 0 }}>
                    <Typography
                        component="h1"
                        sx={{ fontSize: 20, fontWeight: 650, lineHeight: 1.3, letterSpacing: '-0.01em' }}
                    >
                        {id ? 'Edit vendor' : 'Add vendor'}
                    </Typography>
                    <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>
                        {id ? 'Update this vendor’s details.' : 'Add a new vendor to your list.'}
                    </Typography>
                </Box>
            </Box>

            {serverError && (
                <Alert
                    severity="error"
                    variant="outlined"
                    onClose={() => setServerError('')}
                    sx={{ mb: 2, borderRadius: '12px', bgcolor: 'background.paper', alignItems: 'center' }}
                >
                    {serverError}
                </Alert>
            )}

            <Paper
                component="form"
                variant="outlined"
                onSubmit={handleSave}
                noValidate
                sx={{
                    width: '100%',
                    boxSizing: 'border-box',
                    overflow: 'hidden',
                    borderRadius: '16px',
                    bgcolor: 'background.paper',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.04), 0 12px 32px -16px rgba(0,0,0,0.14)',
                }}
            >
                <Box sx={{ px: { xs: 2.5, sm: 4, md: 5 } }}>
                    {/* ---------- Vendor details ---------- */}
                    <Section
                        title="Vendor details"
                        description="The business name and registration used on purchase orders and invoices."
                    >
                        <Box
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                flexWrap: 'wrap',
                                gap: 3,
                                mb: 3.5,
                                p: 2.5,
                                borderRadius: '12px',
                                border: '1px dashed',
                                borderColor: 'divider',
                                bgcolor: 'action.hover',
                            }}
                        >
                            <Box sx={{ position: 'relative', width: 80, height: 80, flexShrink: 0 }}>
                                <Avatar
                                    src={imagePreview || undefined}
                                    sx={{
                                        width: 80,
                                        height: 80,
                                        fontSize: 28,
                                        fontWeight: 650,
                                        color: 'primary.main',
                                        bgcolor: (theme) => alpha(theme.palette.primary.main, 0.14),
                                    }}
                                >
                                    {initial}
                                </Avatar>
                                <IconButton
                                    aria-label="Upload vendor image"
                                    onClick={() => imageRef.current?.click()}
                                    size="small"
                                    sx={{
                                        position: 'absolute',
                                        right: -4,
                                        bottom: -4,
                                        width: 30,
                                        height: 30,
                                        color: 'primary.contrastText',
                                        bgcolor: 'primary.main',
                                        border: '2px solid',
                                        borderColor: 'background.paper',
                                        '&:hover': { bgcolor: 'primary.dark' },
                                    }}
                                >
                                    <PhotoCameraOutlinedIcon sx={{ fontSize: 15 }} />
                                </IconButton>
                            </Box>

                            <Box sx={{ minWidth: 0, flex: 1 }}>
                                <Typography sx={{ fontSize: 14, fontWeight: 600, color: 'text.primary', lineHeight: 1.4 }}>
                                    Vendor image
                                </Typography>
                                <Typography sx={{ color: 'text.secondary', fontSize: 12.5, lineHeight: 1.5, mt: 0.5, mb: 1.75 }}>
                                    Optional logo or photo. JPG, PNG, GIF or WebP, up to 10 MB.
                                </Typography>
                                <Button
                                    variant="outlined"
                                    size="small"
                                    onClick={() => imageRef.current?.click()}
                                    startIcon={<CloudUploadOutlinedIcon />}
                                >
                                    {imagePreview ? 'Replace image' : 'Upload image'}
                                </Button>
                            </Box>
                            <input
                                ref={imageRef}
                                hidden
                                type="file"
                                accept="image/jpeg,image/png,image/gif,image/webp"
                                onChange={handleImageChange}
                            />
                        </Box>

                        <Box sx={fieldGridSx}>
                            <Field
                                label="Vendor Name"
                                required
                                placeholder="e.g., ABC Supplies Pvt. Ltd."
                                value={form.name}
                                onChange={set('name')}
                                error={!!errors.name}
                                helperText={errors.name}
                                sx={{ gridColumn: { sm: '1 / -1' } }}
                            />
                            <FormControl fullWidth size="small" required error={!!errors.category}>
                                <InputLabel id="vendor-category-label">Category</InputLabel>
                                <Select
                                    labelId="vendor-category-label"
                                    label="Category"
                                    value={form.category}
                                    onChange={set('category')}
                                >
                                    {createData?.vendorCategory?.map((category) => (
                                        <MenuItem
                                            key={category._id ?? category.id}
                                            value={category._id ?? category.id}
                                        >
                                            {category.name}
                                        </MenuItem>
                                    ))}
                                </Select>
                                {errors.category && <FormHelperText>{errors.category}</FormHelperText>}
                            </FormControl>
                            <Field
                                label="Tax / GST Number"
                                required
                                placeholder="Registration number"
                                value={form.taxNumber}
                                onChange={set('taxNumber')}
                                error={!!errors.taxNumber}
                                helperText={errors.taxNumber}
                            />
                        </Box>
                    </Section>

                    {/* ---------- Contact ---------- */}
                    <Section
                        title="Contact information"
                        description="Who to reach when you place or follow up on an order."
                    >
                        <Box sx={fieldGridSx}>
                            <Field
                                label="Contact Name"
                                required
                                placeholder="Primary contact person"
                                value={form.contactName}
                                onChange={set('contactName')}
                                error={!!errors.contactName}
                                helperText={errors.contactName}
                            />
                            <Field
                                label="Email"
                                type="email"
                                placeholder="vendor@example.com"
                                value={form.email}
                                onChange={set('email')}
                                error={!!errors.email}
                                helperText={errors.email}
                            />

                            {/* Country code + number as two aligned fields */}

                            <Box
                                sx={{
                                    gridColumn: { sm: '1 / -1' },
                                    display: 'grid',
                                    gridTemplateColumns: {
                                        xs: '120px minmax(0, 1fr)',
                                        sm: '150px minmax(0, 1fr)',
                                    },
                                    columnGap: 1.5,
                                    alignItems: 'start',
                                }}
                            >
                                <TextField
                                    select
                                    fullWidth
                                    size="small"
                                    label="Country Code"
                                    value={form.countryCode || ''}
                                    onChange={set('countryCode')}
                                    SelectProps={{
                                        renderValue: (value) => {
                                            const country = COUNTRIES.find(
                                                item => item.dial === value
                                            )

                                            return (
                                                <Stack
                                                    direction="row"
                                                    spacing={1}
                                                    alignItems="center"
                                                >
                                                    {country && <Flag iso={country.iso} />}
                                                    <span>{value}</span>
                                                </Stack>
                                            )
                                        },
                                        MenuProps: {
                                            disableScrollLock: true,
                                            PaperProps: {
                                                sx: {
                                                    maxHeight: 320,
                                                    minWidth: 250,
                                                },
                                            },
                                        },
                                    }}
                                >
                                    {COUNTRIES.map(country => (
                                        <MenuItem
                                            key={country.iso}
                                            value={country.dial}
                                        >
                                            <Stack
                                                direction="row"
                                                spacing={1.5}
                                                alignItems="center"
                                                sx={{ width: '100%' }}
                                            >
                                                <Flag iso={country.iso} />
                                                <Box
                                                    sx={{
                                                        flex: 1,
                                                        minWidth: 0,
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis',
                                                    }}
                                                >
                                                    {country.name}
                                                </Box>
                                                <Typography
                                                    variant="body2"
                                                    color="text.secondary"
                                                >
                                                    {country.dial}
                                                </Typography>
                                            </Stack>
                                        </MenuItem>
                                    ))}
                                </TextField>

                                <Field
                                    label="Mobile Number"
                                    type="tel"
                                    placeholder="Mobile number"
                                    value={form.mobileNumber}
                                    onChange={set('mobileNumber')}
                                    inputProps={{ inputMode: 'tel' }}
                                />
                            </Box>
                        </Box>
                    </Section>

                    {/* ---------- Location ---------- */}
                    <Section
                        last
                        title="Location & address"
                        description="Where the vendor is based. Used for delivery and tax details."
                    >
                        <Box
                            sx={{
                                display: 'grid',
                                gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, minmax(0, 1fr))' },
                                columnGap: 2.5,
                                rowGap: 3,
                                mb: 3,
                            }}
                        >
                            <FormControl fullWidth size="small" error={!!errors.country}>
                                <InputLabel id="vendor-country-label">Country</InputLabel>
                                <Select
                                    labelId="vendor-country-label"
                                    label="Country"
                                    value={form.country}
                                    onChange={handleCountryChange}
                                >
                                    {createData?.country?.map((coun) => (
                                        <MenuItem
                                            key={coun.country_id ?? ''}
                                            value={coun.country_id ?? ''}
                                        >
                                            {coun.country_name}
                                        </MenuItem>
                                    ))}
                                </Select>
                                {errors.country && <FormHelperText>{errors.country}</FormHelperText>}
                            </FormControl>
                            <FormControl fullWidth size="small" error={!!errors.state}>
                                <InputLabel id="vendor-state-label">State</InputLabel>
                                <Select
                                    labelId="vendor-state-label"
                                    label="State"
                                    value={form.state}
                                    onChange={handleStateChange}
                                >
                                    {stateData?.map((coun) => (
                                        <MenuItem
                                            key={coun.state_id ?? ''}
                                            value={coun.state_id ?? ''}
                                        >
                                            {coun.state_name}
                                        </MenuItem>
                                    ))}
                                </Select>
                                {errors.state && <FormHelperText>{errors.state}</FormHelperText>}
                            </FormControl>

                            <FormControl fullWidth size="small" error={!!errors.city}>
                                <InputLabel id="vendor-city-label">City</InputLabel>
                                <Select
                                    labelId="vendor-city-label"
                                    label="City"
                                    value={form.city}
                                    onChange={handleCityChange}
                                >
                                    {cityData?.map((coun) => (
                                        <MenuItem
                                            key={coun.city_id ?? ''}
                                            value={coun.city_id ?? ''}
                                        >
                                            {coun.city_name}
                                        </MenuItem>
                                    ))}
                                </Select>
                                {errors.city && <FormHelperText>{errors.city}</FormHelperText>}
                            </FormControl>
                        </Box>
                        <TextField
                            fullWidth
                            multiline
                            minRows={3}
                            label="Address"
                            placeholder="Full address"
                            value={form.address}
                            onChange={set('address')}
                        />
                    </Section>
                </Box>

                {/* ---------- Actions ---------- */}
                <Box
                    sx={{
                        display: 'flex',
                        justifyContent: 'flex-end',
                        flexWrap: 'wrap',
                        gap: 1.5,
                        px: { xs: 2.5, sm: 4, md: 5 },
                        py: 2.25,
                        borderTop: '1px solid',
                        borderColor: 'divider',
                        bgcolor: 'action.hover',
                    }}
                >
                    <Button variant="outlined" onClick={() => router.replace(listPath)} disabled={saving}>
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        variant="contained"
                        disabled={saving}
                        disableElevation
                        sx={{ minWidth: 148 }}
                    >
                        {saving ? (
                            <CircularProgress size={18} color="inherit" />
                        ) : id ? (
                            'Update vendor'
                        ) : (
                            'Create vendor'
                        )}
                    </Button>
                </Box>
            </Paper>
        </Box>
    );
};

export default VendorCreatePage;
