'use client';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    Alert,
    Avatar,
    Box,
    Button,
    CircularProgress,
    FormControl,
    FormControlLabel,
    IconButton,
    MenuItem,
    Paper,
    Radio,
    RadioGroup,
    Select,
    TextField,
    Typography,
} from '@mui/material';

import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PhotoCameraOutlinedIcon from '@mui/icons-material/PhotoCameraOutlined';
import { useApi } from '@/utils/api';

import { getCountries, getCountryCallingCode } from 'libphonenumber-js'
import * as Flags from 'country-flag-icons/react/3x2'

/* ------------------------------------------------------------------ */
/* Theme tokens                                                        */
/* ------------------------------------------------------------------ */
const BORDER = '#e4e7ec';
const TEXT = '#344054';
const MUTED = '#667085';

const labelSx = {
    fontSize: 12,
    fontWeight: 500,
    color: TEXT,
    mb: 0.5,
};
const CONTACT_TYPES = [
    { label: 'INDIVIDUAL', value: 'INDIVIDUAL' },
    { label: 'COMPANY', value: 'COMPANY' },
];
const KYC_TYPES = ['Aadhaar', 'PAN', 'Passport', 'Driving License', 'Voter ID', 'GST'];
const MAX_PHOTO_SIZE = 10 * 1024 * 1024; // 10MB
const PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const WEBSITE_RE = /^https?:\/\/.+\..+/i;

const regionNames = new Intl.DisplayNames(['en'], {
    type: 'region',
})

const COUNTRY_CODES = getCountries()
    .map(iso => ({
        iso,
        name: regionNames.of(iso) || iso,
        code: `+${getCountryCallingCode(iso)}`,
    }))
    .sort((a, b) => a.name.localeCompare(b.name))

const Flag = ({ iso, ...props }) => {
    const FlagComponent = Flags[iso]

    if (!FlagComponent) return null

    return (
        <FlagComponent
            title={iso}
            style={{
                width: 22,
                height: 15,
                borderRadius: 2,
                flexShrink: 0,
                display: 'block',
            }}
            {...props}
        />
    )
}

/* ------------------------------------------------------------------ */
/* Small helpers                                                       */
/* ------------------------------------------------------------------ */
const Section = ({ title, action, children }) => (
    <Paper
        variant="outlined"
        sx={{
            p: { xs: 1.75, sm: 2.5 },
            borderRadius: '12px',
            borderColor: '#eaecf0',
            backgroundColor: '#fff',
            boxShadow: '0 1px 2px rgba(16, 24, 40, 0.03)',
            minWidth: 0,
        }}
    >
        {(title || action) && (
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    mb: 1.5,
                }}
            >
                <Typography sx={{ fontSize: 14, fontWeight: 600 }}>{title}</Typography>
                {action}
            </Box>
        )}
        {children}
    </Paper>
);

const Field = ({ label, required, children }) => (
    <Box sx={{ minWidth: 0 }}>
        <Typography sx={labelSx}>
            {label}
            {required && <span style={{ color: '#d92d20' }}> *</span>}
        </Typography>
        {children}
    </Box>
);

const twoCol = {
    display: 'grid',
    gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' },
    gap: 1.5,
};

const emptyKyc = () => ({
    id: `${Date.now()}-${Math.random()}`,
    type: '',
    number: '',
    file: null,
});

const placeholder = (text) => <span style={{ color: '#98a2b3' }}>{text}</span>;

const ContactCreatePage = ({ id, lang }) => {

    const listPath = `/${lang}/apps/contacts`;

    const router = useRouter();
    const { doGet, token, doPost } = useApi();
    const photoRef = useRef(null);
    const kycFileRefs = useRef({});

    const [form, setForm] = useState({
        contactType: 'INDIVIDUAL',
        category: '',
        referenceNumber: '',
        fullName: '',
        country: '',
        mailingAddress: '',
        state: '',
        city: '',
        website: '',
        emergencyContactName: '',
    });

    const [emails, setEmails] = useState(['']);
    const [phones, setPhones] = useState([{ countryCode: '+91', number: '' }]);
    const [kycDocs, setKycDocs] = useState([]);
    const [photo, setPhoto] = useState(null);
    const [photoPreview, setPhotoPreview] = useState('');
    const [searchText, setSearchText] = useState('');
    const [searchOptions, setSearchOptions] = useState([]);
    const [searching, setSearching] = useState(false);
    const [data, setData] = useState();
    const [errors, setErrors] = useState({});
    const [saving, setSaving] = useState(false);
    const [serverError, setServerError] = useState('');

    const listUrl = `/${lang}/apps/contacts`;

    const set = (key) => (event) => {
        const value = event.target.value;

        setForm((prev) => {
            const next = { ...prev, [key]: value };
            if (key === 'country') {
                next.state = '';
                next.city = '';
            }
            if (key === 'state') next.city = '';
            return next;
        });
        setErrors((prev) => ({ ...prev, [key]: '' }));
        setServerError('');
    };

    useEffect(() => {

        if (!token) return;

        const load = async () => {
            try {

                const response = await doGet('company/contact/create/data');

                setData(response?.data ?? response);

                if (!id) return;

                const result = await doGet(`company/contact/edit/data/${id}`);
                const c = result?.data ?? result;

                setForm({
                    contactType: c?.contact_type ?? 'INDIVIDUAL',
                    category: c?.contact_category_id?._id ?? c?.contact_category_id ?? '',
                    referenceNumber: c?.reference_number ?? '',
                    fullName: c?.full_name ?? c?.name ?? '',
                    country: c?.country_id ?? c?.country ?? '',
                    mailingAddress: c?.mailing_address ?? '',
                    state: c?.state_id ?? c?.state ?? '',
                    city: c?.city_id ?? c?.city ?? '',
                    website: c?.website ?? '',
                    emergencyContactName: c?.emergency_contact_name ?? '',
                });

                if (Array.isArray(c?.emails) && c.emails.length) {
                    setEmails(c.emails.map((e) => e ?? ''));
                }

                if (Array.isArray(c?.phones) && c.phones.length) {
                    setPhones(
                        c.phones.map((p) => ({
                            countryCode: p.countryCode ?? p.country_code ?? '+91',
                            number: p.number ?? '',
                        }))
                    );
                }

                // NEW: load existing KYC documents
                if (Array.isArray(c?.kyc_documents)) {
                    setKycDocs(
                        c.kyc_documents.map((d) => ({
                            id: String(d._id),
                            serverId: String(d._id),
                            type: d.type ?? '',
                            number: d.number ?? '',
                            file: null,
                            existingFile: d.file || '',
                        }))
                    );
                }
            } catch (error) {
                console.error('Failed to load contact data:', error);
                setServerError(error.message || 'Failed to load contact data.');
            }
        };

        load();

    }, [token, id]);

    useEffect(() => {
        if (!token || searchText.trim().length < 2) {
            setSearchOptions([]);
            return;
        }
        const timer = setTimeout(async () => {
            try {
                setSearching(true);
                const response = await doGet(
                    `company/contact/search?q=${encodeURIComponent(searchText.trim())}`
                );
                const list = response?.data ?? response ?? [];
                setSearchOptions(Array.isArray(list) ? list : []);
            } catch (error) {
                setSearchOptions([]);
            } finally {
                setSearching(false);
            }
        }, 400);
        return () => clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchText, token]);

    const handlePhoto = (event) => {
        const file = event.target.files?.[0];
        event.target.value = '';
        if (!file) return;
        if (!PHOTO_TYPES.includes(file.type)) {
            setErrors((prev) => ({ ...prev, photo: 'Use a JPG, PNG, GIF or WebP image' }));
            return;
        }
        if (file.size > MAX_PHOTO_SIZE) {
            setErrors((prev) => ({ ...prev, photo: 'Image must be 10MB or smaller' }));
            return;
        }
        setPhoto(file);
        setPhotoPreview(URL.createObjectURL(file));
        setErrors((prev) => ({ ...prev, photo: '' }));
    };

    const removePhoto = () => {
        setPhoto(null);
        setPhotoPreview('');
    };

    useEffect(() => {
        return () => {
            if (photoPreview) URL.revokeObjectURL(photoPreview);
        };
    }, [photoPreview]);

    const updateEmail = (index, value) => {
        setEmails((prev) => prev.map((e, i) => (i === index ? value : e)));
        setErrors((prev) => ({ ...prev, emails: '' }));
    };
    const updatePhone = (index, patch) => {
        setPhones((prev) => prev.map((p, i) => (i === index ? { ...p, ...patch } : p)));
        setErrors((prev) => ({ ...prev, phones: '' }));
    };

    const updateKyc = (kycId, patch) =>
        setKycDocs((prev) => prev.map((d) => (d.id === kycId ? { ...d, ...patch } : d)));
    const removeKyc = (kycId) => setKycDocs((prev) => prev.filter((d) => d.id !== kycId));

    const validate = () => {
        const v = {};

        if (!form.fullName.trim()) {
            v.fullName = 'Full name is required';
        }

        // Validate every email field
        if (emails.some((email) => !email.trim())) {
            v.emails = 'Email is required for every field';
        } else if (emails.some((email) => !EMAIL_RE.test(email.trim()))) {
            v.emails = 'Enter a valid email address';
        }

        // Validate every phone field
        if (phones.some((phone) => !phone.number.trim())) {
            v.phones = 'Mobile number is required for every field';
        } else if (
            phones.some((phone) => !/^\d{6,15}$/.test(phone.number.trim()))
        ) {
            v.phones = 'Enter a valid mobile number';
        }

        if (
            form.website.trim() &&
            !WEBSITE_RE.test(form.website.trim())
        ) {
            v.website = 'Start with http:// or https://';
        }

        if (
            kycDocs.some(
                (d) => (d.number.trim() || d.file || d.existingFile) && !d.type
            )
        ) {
            v.kyc = 'Select a document type for each KYC entry';
        }

        setErrors(v);
        return Object.keys(v).length === 0;
    };

    const handleSave = async () => {

        if (saving || !validate()) return;

        setSaving(true);
        setServerError('');

        try {
            const body = new FormData();

            body.append('contactType', form.contactType);
            body.append('fullName', form.fullName.trim());

            if (form.category) body.append('category', form.category);
            if (form.referenceNumber.trim()) body.append('referenceNumber', form.referenceNumber.trim());
            if (form.country) body.append('country', form.country);
            if (form.mailingAddress.trim()) body.append('mailingAddress', form.mailingAddress.trim());
            if (form.state) body.append('state', form.state);
            if (form.city) body.append('city', form.city);
            if (form.website.trim()) body.append('website', form.website.trim());
            if (form.emergencyContactName.trim()) {
                body.append('emergencyContactName', form.emergencyContactName.trim());
            }

            body.append('emails', JSON.stringify(emails.map((e) => e.trim()).filter(Boolean)));
            body.append(
                'phones',
                JSON.stringify(
                    phones
                        .filter((p) => p.number.trim())
                        .map((p) => ({ countryCode: p.countryCode, number: p.number.trim() }))
                )
            );

            const validKyc = kycDocs.filter((d) => d.type || d.number || d.file || d.existingFile);

            let fileCounter = 0;

            const kycPayload = validKyc.map((d) => {
                const entry = {
                    _id: d.serverId || undefined,
                    type: d.type,
                    number: d.number.trim(),
                    fileIndex: null,
                };
                if (d.file) {
                    entry.fileIndex = fileCounter++;
                    body.append('kycFiles', d.file);
                }
                return entry;
            });

            body.append('kycDocuments', JSON.stringify(kycPayload));

            if (photo) body.append('photo', photo);

            await doPost(id ? `company/contact/update/data/${id}` : 'company/contact/save/data', body);

            router.push(listUrl);
        } catch (error) {
            setServerError(error.message || 'Something went wrong. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    /* ------------------------------ derived lists ------------------------------ */
    const countries = useMemo(
        () => (Array.isArray(data?.country) ? data.country : []),
        [data]
    );

    const stateData = useMemo(() => {
        const selected = countries.find(
            (item) => String(item.country_id) === String(form.country)
        );
        return Array.isArray(selected?.states) ? selected.states : [];
    }, [countries, form.country]);

    const cityData = useMemo(() => {
        const selected = stateData.find(
            (item) => String(item.state_id) === String(form.state)
        );
        return Array.isArray(selected?.cities) ? selected.cities : [];
    }, [stateData, form.state]);

    const categories = Array.isArray(data?.contactCategory) ? data.contactCategory : [];

    const addEmail = () => {
        if (emails.some((email) => !email.trim())) {
            setErrors((prev) => ({
                ...prev,
                emails: 'Please fill in every email field before adding another',
            }));
            return;
        }

        setEmails((prev) => [...prev, '']);
        setErrors((prev) => ({ ...prev, emails: undefined }));
    };

    const addPhone = () => {
        if (phones.some((phone) => !phone.number.trim())) {
            setErrors((prev) => ({
                ...prev,
                phones: 'Please fill in every phone field before adding another',
            }));
            return;
        }

        setPhones((prev) => [
            ...prev,
            { countryCode: '+91', number: '' },
        ]);
        setErrors((prev) => ({ ...prev, phones: undefined }));
    };

    /* ----------------------------------- UI ----------------------------------- */
    return (
        <Box sx={{ width: '100%' }}>
            {/* Title bar */}
            <Box
                sx={{
                    mb: 2,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                }}
            >
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

                <Typography sx={{ fontSize: 20, fontWeight: 700 }}>
                    {id ? 'Update Contact' : 'Create New Contact'}
                </Typography>
            </Box>

            {serverError && (
                <Alert
                    severity="error"
                    onClose={() => setServerError('')}
                    sx={{ mb: 2, borderRadius: 2, fontSize: 13 }}
                >
                    {serverError}
                </Alert>
            )}

            <Box
                component="form"
                noValidate
                onSubmit={(event) => {
                    event.preventDefault();
                    handleSave();
                }}
                sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}
            >

                {/* ---------------- Basic Information ---------------- */}
                <Section title="Basic Information">
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                        {/* Contact type */}
                        <Box>
                            <Typography sx={labelSx}>
                                Contact Type <span style={{ color: '#d92d20' }}>*</span>
                            </Typography>
                            <RadioGroup
                                row
                                value={form.contactType}
                                onChange={set('contactType')}
                                sx={{ gap: 1 }}
                            >
                                {CONTACT_TYPES.map((t) => (
                                    <FormControlLabel
                                        key={t.value}
                                        value={t.value}
                                        control={<Radio size="small" />}
                                        label={t.label}
                                        sx={{
                                            m: 0,
                                            '& .MuiFormControlLabel-label': { fontSize: 12 },
                                        }}
                                    />
                                ))}
                            </RadioGroup>
                        </Box>

                        {/* Category + reference */}
                        <Box sx={twoCol}>
                            <Field label="Contact Category">
                                <FormControl fullWidth>
                                    <Select
                                        displayEmpty
                                        value={form.category}
                                        onChange={set('category')}
                                        IconComponent={KeyboardArrowDownIcon}
                                        renderValue={(value) => {
                                            if (!value) return placeholder('Select contact category');
                                            return (
                                                categories.find((c) => String(c._id) === String(value))
                                                    ?.name ?? value
                                            );
                                        }}
                                    >
                                        {categories.map((category) => (
                                            <MenuItem
                                                key={category._id}
                                                value={category._id}
                                                sx={{ fontSize: 13 }}
                                            >
                                                {category.name}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Field>
                            <Field label="Reference Number">
                                <TextField
                                    fullWidth
                                    placeholder="Enter reference number"
                                    value={form.referenceNumber}
                                    onChange={set('referenceNumber')}
                                />
                            </Field>
                        </Box>

                        {/* Photo */}
                        <Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                <Avatar
                                    src={photoPreview || undefined}
                                    sx={{
                                        width: 40,
                                        height: 40,
                                        bgcolor: '#f9fafb',
                                        color: '#98a2b3',
                                        border: '1px dashed #cbd2dc',
                                    }}
                                >
                                    <PersonOutlineIcon fontSize="small" />
                                </Avatar>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                    <Box sx={{ display: 'flex', gap: 1 }}>
                                        <Button
                                            variant="outlined"
                                            size="small"
                                            onClick={() => photoRef.current?.click()}
                                            startIcon={<PhotoCameraOutlinedIcon sx={{ fontSize: 14 }} />}
                                        >
                                            Upload photo
                                        </Button>
                                        {photo && (
                                            <IconButton
                                                size="small"
                                                aria-label="Remove photo"
                                                onClick={removePhoto}
                                            >
                                                <DeleteOutlineIcon sx={{ fontSize: 16 }} />
                                            </IconButton>
                                        )}
                                    </Box>
                                    <Typography
                                        sx={{
                                            fontSize: 10,
                                            color: errors.photo ? '#d92d20' : MUTED,
                                        }}
                                    >
                                        {errors.photo ||
                                            'Upload an image file (JPG, PNG, GIF, or WebP). Max size: 10MB'}
                                    </Typography>
                                </Box>
                                <input
                                    ref={photoRef}
                                    type="file"
                                    hidden
                                    accept={PHOTO_TYPES.join(',')}
                                    onChange={handlePhoto}
                                />
                            </Box>
                        </Box>

                        {/* Full name */}
                        <Box>
                            <Field
                                label="Full Name"
                                required
                            >
                                <TextField
                                    fullWidth
                                    placeholder="Enter full name"
                                    value={form.fullName}
                                    onChange={set('fullName')}
                                    error={!!errors.fullName}
                                    helperText={errors.fullName}
                                />
                            </Field>
                        </Box>

                        {/* Email + phone */}
                        <Box sx={twoCol}>
                            {/* Emails */}
                            <Box sx={{ minWidth: 0 }}>
                                <Typography sx={labelSx}>Email <span style={{ color: '#d92d20' }}>*</span></Typography>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                    {emails.map((email, index) => (
                                        <Box key={index} sx={{ display: 'flex', gap: 0.5 }}>
                                            <TextField
                                                fullWidth
                                                required
                                                type="email"
                                                placeholder="name@example.com"
                                                value={email}
                                                onChange={(e) => updateEmail(index, e.target.value)}
                                                error={!!errors.emails && index === 0}
                                                helperText={index === 0 ? errors.emails : ''}
                                            />
                                            {emails.length > 1 && (
                                                <IconButton
                                                    size="small"
                                                    aria-label="Remove email"
                                                    onClick={() =>
                                                        setEmails((prev) => prev.filter((_, i) => i !== index))
                                                    }
                                                >
                                                    <CloseIcon sx={{ fontSize: 16 }} />
                                                </IconButton>
                                            )}
                                        </Box>
                                    ))}
                                </Box>
                                <Button
                                    onClick={addEmail}
                                    startIcon={<AddIcon sx={{ fontSize: 14 }} />}
                                    sx={{ mt: 0.75 }}
                                >
                                    Add email
                                </Button>
                            </Box>

                            {/* Phones */}
                            <Box sx={{ minWidth: 0 }}>
                                <Typography sx={labelSx}>
                                    Mobile Number <span style={{ color: '#d92d20' }}>*</span>
                                </Typography>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                    {phones.map((phone, index) => (
                                        <Box
                                            key={index}
                                            sx={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 0.5,
                                                width: '100%',
                                                minWidth: 0,
                                            }}
                                        >
                                            <Box
                                                sx={{
                                                    display: 'flex',
                                                    flex: 1,
                                                    minWidth: 0,
                                                    minHeight: 42,
                                                    alignItems: 'center',
                                                    border: `1px solid ${errors.phones && index === 0 ? '#d92d20' : BORDER
                                                        }`,
                                                    borderRadius: '8px',
                                                    overflow: 'hidden',
                                                    backgroundColor: '#fff',
                                                    '&:focus-within': {
                                                        borderColor: '#1976d2',
                                                    },
                                                }}
                                            >
                                                <Select
                                                    variant="standard"
                                                    disableUnderline
                                                    value={phone.countryCode}
                                                    onChange={e =>
                                                        updatePhone(index, {
                                                            countryCode: e.target.value,
                                                        })
                                                    }
                                                    IconComponent={KeyboardArrowDownIcon}
                                                    renderValue={value => {
                                                        const country = COUNTRY_CODES.find(c => c.code === value)

                                                        return country ? (
                                                            <Box
                                                                sx={{
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    justifyContent: 'center',
                                                                    gap: 0.5,
                                                                }}
                                                            >
                                                                <Flag iso={country.iso} />
                                                                <Box component="span" sx={{ fontSize: 12 }}>
                                                                    {country.code}
                                                                </Box>
                                                            </Box>
                                                        ) : (
                                                            value
                                                        )
                                                    }}
                                                    MenuProps={{
                                                        PaperProps: {
                                                            sx: {
                                                                maxHeight: 300,
                                                                minWidth: 260,
                                                            },
                                                        },
                                                    }}
                                                    sx={{
                                                        width: 105,
                                                        flexShrink: 0,
                                                        fontSize: 12,
                                                        pl: 1,
                                                        '& .MuiSelect-select': {
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            minHeight: '42px',
                                                            boxSizing: 'border-box',
                                                            py: 0,
                                                            pr: '24px !important',
                                                        },
                                                    }}
                                                >
                                                    {COUNTRY_CODES.map(country => (
                                                        <MenuItem
                                                            key={`${country.iso}-${country.code}`}
                                                            value={country.code}
                                                            sx={{
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: 1,
                                                                fontSize: 13,
                                                            }}
                                                        >
                                                            <Flag iso={country.iso} />
                                                            <Box
                                                                component="span"
                                                                sx={{ flex: 1 }}
                                                            >
                                                                {country.name}
                                                            </Box>
                                                            <Box
                                                                component="span"
                                                                sx={{
                                                                    color: 'text.secondary',
                                                                    fontSize: 12,
                                                                }}
                                                            >
                                                                {country.code}
                                                            </Box>
                                                        </MenuItem>
                                                    ))}
                                                </Select>

                                                <input
                                                    type="tel"
                                                    inputMode="numeric"
                                                    placeholder="Enter mobile number"
                                                    value={phone.number}
                                                    onChange={e =>
                                                        updatePhone(index, {
                                                            number: e.target.value.replace(/\D/g, ''),
                                                        })
                                                    }
                                                    style={{
                                                        flex: 1,
                                                        width: 0,
                                                        minWidth: 0,
                                                        border: 'none',
                                                        outline: 'none',
                                                        padding: '9px 8px',
                                                        fontSize: 13,
                                                        background: 'transparent',
                                                    }}
                                                />
                                            </Box>

                                            {phones.length > 1 && (
                                                <IconButton
                                                    size="small"
                                                    aria-label="Remove phone"
                                                    onClick={() =>
                                                        setPhones(prev =>
                                                            prev.filter((_, i) => i !== index)
                                                        )
                                                    }
                                                    sx={{ flexShrink: 0 }}
                                                >
                                                    <CloseIcon sx={{ fontSize: 16 }} />
                                                </IconButton>
                                            )}
                                        </Box>
                                    ))}
                                </Box>
                                {errors.phones && (
                                    <Typography sx={{ fontSize: 11, mt: 0.5, color: '#d92d20' }}>
                                        {errors.phones}
                                    </Typography>
                                )}
                                <Button
                                    onClick={addPhone}
                                    startIcon={<AddIcon sx={{ fontSize: 14 }} />}
                                    sx={{ mt: 0.75 }}
                                >
                                    Add phone number
                                </Button>
                            </Box>
                        </Box>
                    </Box>
                </Section>

                {/* ---------------- KYC Documents ---------------- */}
                <Section
                    title="KYC Documents"
                    action={
                        <Button
                            variant="contained"
                            size="small"
                            onClick={() => setKycDocs((prev) => [...prev, emptyKyc()])}
                            startIcon={<AddIcon sx={{ fontSize: 14 }} />}
                            sx={{ fontSize: 11, borderRadius: '6px' }}
                        >
                            Add KYC
                        </Button>
                    }
                >
                    {kycDocs.length === 0 ? (
                        <Typography sx={{ fontSize: 11 }}>No KYC documents yet</Typography>
                    ) : (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                            {kycDocs.map((doc) => (
                                <Box
                                    key={doc.id}
                                    sx={{
                                        display: 'grid',
                                        gridTemplateColumns: {
                                            xs: '1fr',
                                            sm: '1fr 1fr auto auto',
                                        },
                                        gap: 1,
                                        alignItems: 'center',
                                    }}
                                >
                                    <FormControl fullWidth required>
                                        <Select
                                            displayEmpty
                                            value={doc.type}
                                            onChange={(e) => updateKyc(doc.id, { type: e.target.value })}
                                            IconComponent={KeyboardArrowDownIcon}
                                            renderValue={(v) => v || placeholder('Document type')}
                                        >
                                            {KYC_TYPES.map((t) => (
                                                <MenuItem key={t} value={t} sx={{ fontSize: 13 }}>
                                                    {t}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                    <TextField
                                        fullWidth
                                        required
                                        placeholder="Document number"
                                        value={doc.number}
                                        onChange={(e) => updateKyc(doc.id, { number: e.target.value })}
                                    />
                                    <>
                                        <Button
                                            variant="outlined"
                                            size="small"
                                            onClick={() => kycFileRefs.current[doc.id]?.click()}
                                            sx={{
                                                fontSize: 11,
                                                borderRadius: '6px',
                                                maxWidth: 130,
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                whiteSpace: 'nowrap',
                                                display: 'block',
                                            }}
                                        >
                                            {doc.file ? doc.file.name : 'Upload file'}
                                        </Button>
                                        <input
                                            ref={(el) => { kycFileRefs.current[doc.id] = el; }}
                                            type="file"
                                            hidden
                                            accept="image/jpeg,image/png,image/gif,image/webp,.pdf,.doc,.docx"
                                            onChange={(e) => {
                                                const file = e.target.files?.[0] ?? null;
                                                e.target.value = '';
                                                if (!file) return;
                                                if (!/\.(jpe?g|png|gif|webp|bmp|tiff?|pdf|docx?)$/i.test(file.name)) {
                                                    setErrors((prev) => ({ ...prev, kyc: 'KYC files must be an image, PDF, DOC or DOCX' }));
                                                    return;
                                                }
                                                updateKyc(doc.id, { file });
                                                setErrors((prev) => ({ ...prev, kyc: '' }));
                                            }}
                                        />
                                    </>
                                    <IconButton
                                        size="small"
                                        aria-label="Remove KYC document"
                                        onClick={() => removeKyc(doc.id)}
                                    >
                                        <DeleteOutlineIcon sx={{ fontSize: 18 }} />
                                    </IconButton>
                                </Box>
                            ))}
                        </Box>
                    )}
                </Section>

                {/* ---------------- Address Information ---------------- */}
                <Section title="Address Information">
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, pb: '6px' }}>
                        <Field label="Mailing Address">
                            <TextField
                                fullWidth
                                multiline
                                minRows={3}
                                placeholder="Enter mailing address"
                                value={form.mailingAddress}
                                onChange={set('mailingAddress')}
                            />
                        </Field>
                        <Box sx={twoCol}>
                            <Field label="Country">
                                <FormControl fullWidth>
                                    <Select
                                        displayEmpty
                                        value={form.country}
                                        onChange={set('country')}
                                        IconComponent={KeyboardArrowDownIcon}
                                        renderValue={(value) => {
                                            if (!value) return placeholder('Select country');
                                            return (
                                                countries.find(
                                                    (c) => String(c.country_id) === String(value)
                                                )?.country_name ?? value
                                            );
                                        }}
                                    >
                                        {countries.map((c) => (
                                            <MenuItem
                                                key={c.country_id}
                                                value={c.country_id}
                                                sx={{ fontSize: 13 }}
                                            >
                                                {c.country_name}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Field>
                            <Field label="State">
                                <FormControl fullWidth disabled={!form.country}>
                                    <Select
                                        displayEmpty
                                        value={form.state}
                                        onChange={set('state')}
                                        IconComponent={KeyboardArrowDownIcon}
                                        renderValue={(v) =>
                                            stateData.find((s) => String(s.state_id) === String(v))
                                                ?.state_name || placeholder('Select state')
                                        }
                                    >
                                        {stateData.map((s) => (
                                            <MenuItem key={s.state_id} value={s.state_id} sx={{ fontSize: 13 }}>
                                                {s.state_name}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Field>
                            <Field label="City">
                                <FormControl fullWidth disabled={!form.state}>
                                    <Select
                                        displayEmpty
                                        value={form.city}
                                        onChange={set('city')}
                                        IconComponent={KeyboardArrowDownIcon}
                                        renderValue={(v) =>
                                            cityData.find((c) => String(c.city_id) === String(v))
                                                ?.city_name || placeholder('Select city')
                                        }
                                    >
                                        {cityData.map((c) => (
                                            <MenuItem key={c.city_id} value={c.city_id} sx={{ fontSize: 13 }}>
                                                {c.city_name}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Field>
                        </Box>
                        <Field label="Website">
                            <TextField
                                fullWidth
                                placeholder="https://www.example.com"
                                value={form.website}
                                onChange={set('website')}
                                error={!!errors.website}
                                helperText={errors.website}
                            />
                        </Field>
                        <Field label="Emergency Contact Name">
                            <TextField
                                fullWidth
                                placeholder="Enter emergency contact name"
                                value={form.emergencyContactName}
                                onChange={set('emergencyContactName')}
                            />
                        </Field>
                    </Box>
                </Section>

                {/* ---------------- Actions ---------------- */}
                <Box
                    sx={{
                        display: 'flex',
                        justifyContent: 'center',
                        gap: 3,
                        pt: 1.5,
                        borderTop: '1px solid #eaecf0',
                    }}
                >
                    <Button
                        type="submit"
                        variant="contained"
                        disabled={saving}
                        startIcon={saving ? <CircularProgress size={14} /> : null}
                    >
                        {saving ? 'Saving...' : id ? 'Update Contact' : 'Create Contact'}
                    </Button>
                    <Button
                        variant="outlined"
                        disabled={saving}
                        onClick={() => router.replace(listUrl)}
                    >
                        Cancel
                    </Button>
                </Box>
            </Box>
        </Box>
    );
};

export default ContactCreatePage;
