'use client'

import { useEffect, useMemo, useState } from 'react'

import {
    Drawer,
    Box,
    Typography,
    IconButton,
    InputAdornment,
    TextField,
    Button,
    MenuItem,
    Collapse,
    CircularProgress,
    RadioGroup,
    FormControlLabel,
    Radio,
    Avatar,
    Chip,
    Tabs,
    Tab
} from '@mui/material'

import Grid from '@mui/material/Grid2'

import {
    useForm,
    Controller,
    useFieldArray,
    useFormContext
} from 'react-hook-form'

import { useSession } from 'next-auth/react'

import { toast } from 'react-toastify'

import { useApi } from '@/utils/api'

import { getCountries, getCountryCallingCode } from 'libphonenumber-js'

import * as Flags from 'country-flag-icons/react/3x2'

const OPEN_STATUS_TITLE = 'open'

const EMAIL_RULE = {
    pattern: {
        value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        message: 'Enter a valid email',
    },
}
const AMOUNT_RULE = { pattern: { value: /^\d+(\.\d{1,2})?$/, message: 'Enter a valid number' } }

const regionNames = new Intl.DisplayNames(['en'], { type: 'region' })

const COUNTRIES = getCountries()
    .map(iso => ({ iso, name: regionNames.of(iso), dial: `+${getCountryCallingCode(iso)}` }))
    .sort((a, b) => a.name.localeCompare(b.name))

const Flag = ({ iso }) => {
    const F = Flags[iso]

    return F ? <F title={iso} style={{ width: 22, height: 15, borderRadius: 2, flexShrink: 0 }} /> : null
}

const leadFormDefaults = (prefill = {}, statusId = '', assignee = '') => ({
    contact: {
        contact_type: 'individual', category_id: '', reference_number: '', name: prefill.name || '', nationality: '',
        emails: [{ value: prefill.email || '' }], phones: [{ country_code: '+91', number: prefill.phone || '' }],
        address: '',
        country_id: '',
        state_id: '',
        city_id: '',
        website: '',
        emergency_contact_name: '',
        kyc: []
    },
    lead: {
        source_id: '', status_id: statusId, contact_method_id: '', type_id: '', priority_id: '', purpose_id: '',
        property_type_id: '', move_in_timeline_id: '', department_id: '', assigned_to: assignee, agent_id: '',
        commission_type: '', commission_value: '', commission_amount: ''
    }
})

/* ---------- small building blocks ---------- */

// Bordered group with its title sitting on the border (as in the design)
const Section = ({ title, children }) => (
    <Box sx={{ position: 'relative', border: 1, borderColor: 'divider', borderRadius: 2, p: 3, pt: 5, mt: 4 }}>
        <Typography
            sx={{
                position: 'absolute', top: -14, left: 14, px: 2, py: 0.5, bgcolor: 'background.paper',
                border: 1, borderColor: 'text.primary', borderRadius: 2, fontWeight: 700, fontSize: 14
            }}
        >
            {title}
        </Typography>
        {children}
    </Box>
)

// Collapsible sub-card
const Group = ({ title, children, defaultOpen = true }) => {
    const [open, setOpen] = useState(defaultOpen)

    return (
        <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 2, mb: 3 }}>
            <Box
                onClick={() => setOpen(o => !o)}
                sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 3, py: 2, cursor: 'pointer' }}
            >
                <Typography fontWeight={600} fontSize={13}>{title}</Typography>
                <i className={open ? 'tabler-chevron-up' : 'tabler-chevron-down'} />
            </Box>
            <Collapse in={open}>
                <Box sx={{ px: 3, pb: 3 }}>{children}</Box>
            </Collapse>
        </Box>
    )
}

const Field = ({
    control: suppliedControl,
    name,
    label,
    options,
    required,
    rules,
    children,
    onChange,
    ...rest
}) => {
    const form = useFormContext()
    const control = suppliedControl ?? form?.control

    if (!control) {
        console.error(
            `Field "${name}" has no React Hook Form control. ` +
            'Pass control from useForm() or wrap the form in FormProvider.'
        )
        return null
    }

    return (
        <Controller
            name={name}
            control={control}
            rules={rules}
            render={({ field, fieldState }) => (
                <TextField
                    {...field}
                    {...rest}
                    onChange={event => {
                        field.onChange(event)
                        onChange?.(event)
                    }}
                    select={!!options}
                    required={required}
                    fullWidth
                    size="small"
                    label={label}
                    error={!!fieldState.error}
                    helperText={fieldState.error?.message}
                    slotProps={{ select: { displayEmpty: false } }}
                >
                    {options
                        ? options.length
                            ? options.map(option => (
                                <MenuItem
                                    key={option._id ?? option.value}
                                    value={option._id ?? option.value}
                                >
                                    {option.title ?? option.name ?? option.label ?? option?.company_Name}
                                </MenuItem>
                            ))
                            : (
                                <MenuItem disabled value="">
                                    No options available
                                </MenuItem>
                            )
                        : null}
                    {children}
                </TextField>
            )}
        />
    )
}

/* ---------- step 1: find an existing contact / lead ---------- */

const ResultRow = ({ icon, title, subtitle, tag, onClick, accent }) => (
    <Box
        role="button"
        tabIndex={0}
        onClick={onClick}
        onKeyDown={e => e.key === 'Enter' && onClick()}
        sx={{ display: 'flex', alignItems: 'center', gap: 3, px: 3, py: 2, cursor: 'pointer', '&:hover,&:focus-visible': { bgcolor: 'action.hover' } }}
    >
        <Avatar variant="rounded" sx={{ width: 36, height: 36, bgcolor: 'action.selected', color: accent ? 'primary.main' : 'text.secondary' }}>
            <i className={icon} />
        </Avatar>
        <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography fontWeight={600} color={accent ? 'primary' : 'text.primary'} noWrap>{title}</Typography>
            <Typography variant="caption" color="text.secondary" noWrap>{subtitle}</Typography>
        </Box>
        {tag && <Chip size="small" label={tag} />}
    </Box>
)

const SearchStep = ({ onOpenLead, onPickContact, onCreateNew, onCancel, doGet, token }) => {

    const [q, setQ] = useState('')
    const [results, setResults] = useState([])
    const [busy, setBusy] = useState(false)
    const term = q.trim()


    useEffect(() => {
        if (term.trim().length < 2 || !token) {
            setResults([]);
            setBusy(false);
            return;
        }

        const ctrl = new AbortController();

        const t = setTimeout(async () => {
            setBusy(true);

            try {
                const result = await doGet(
                    "company/contacts/search",
                    { q: term.trim() },
                    { signal: ctrl.signal }
                );

                setResults(result || []);
            } catch (e) {
                if (e.name !== "AbortError") {
                    setResults([]);
                }
            } finally {
                if (!ctrl.signal.aborted) {
                    setBusy(false);
                }
            }
        }, 300);

        return () => {
            clearTimeout(t);
            ctrl.abort();
        };
    }, [term, token]);

    return (
        <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 2, p: 6 }}>
            <Typography variant="caption" fontWeight={700} sx={{ display: 'block', mb: 3 }}>
                Find an existing contact or lead
            </Typography>

            <Box sx={{ maxWidth: 580, mx: 'auto', position: 'relative' }}>
                <TextField
                    autoFocus
                    fullWidth
                    value={q}
                    onChange={e => setQ(e.target.value)}
                    placeholder="Search by name, email or phone…"
                    slotProps={{
                        input: {
                            startAdornment: <InputAdornment position="start"><i className="tabler-search" /></InputAdornment>,
                            endAdornment: busy ? <CircularProgress size={18} /> : null
                        }
                    }}
                />

                {term.length >= 2 && (
                    <Box sx={{ position: 'absolute', zIndex: 2, left: 0, right: 0, mt: 1, bgcolor: 'background.paper', border: 1, borderColor: 'divider', borderRadius: 2, boxShadow: 6, overflow: 'hidden' }}>
                        {results.map(r => (
                            <ResultRow
                                key={`${r.type}-${r._id}`}
                                icon={r.type === 'lead' ? 'tabler-trending-up' : 'tabler-user'}
                                title={r.name}
                                subtitle={`${r.type === 'lead' ? 'Lead' : 'Contact'} • ${r.phone || r.email || 'No phone'}`}
                                tag={r.type === 'lead' ? 'Lead' : 'Contact'}
                                onClick={() => (r.type === 'lead' ? onOpenLead(r) : onPickContact(r))}
                            />
                        ))}
                        <ResultRow accent icon="tabler-user-plus" title="Create new lead" subtitle={`Start with “${term}”`} onClick={() => onCreateNew(term)} />
                    </Box>
                )}
            </Box>

            <Box sx={{ textAlign: 'center', mt: 6 }}>
                <Button color="secondary" onClick={onCancel}>Cancel</Button>
            </Box>
        </Box>
    )
}

/* ---------- step 2: the form ---------- */

const ExistingContactCard = ({ contact }) => {
    const [tab, setTab] = useState(0)

    const rows = [
        ['Contact type', contact.contact_type], ['Name', contact.name],
        ['Email', contact.emails?.[0]], ['Mobile number', contact.phones?.[0] && `${contact.phones[0].country_code} ${contact.phones[0].number}`],
        ['Nationality', contact.nationality], ['State', contact.state_name], ['City', contact.city_name], ['Website', contact.website]
    ]

    return (
        <Section title="Contact information">
            <Tabs value={tab} onChange={(_, t) => setTab(t)} sx={{ mb: 3 }}>
                <Tab label="Contact information" />
                <Tab label="KYC documents" />
            </Tabs>
            {tab === 0 ? (
                <Grid container spacing={3}>
                    {rows.map(([k, val]) => (
                        <Grid key={k} size={{ xs: 12, sm: 6 }}>
                            <Typography variant="caption" color="text.secondary">{k}</Typography>
                            <Typography sx={{ textTransform: k === 'Contact type' ? 'capitalize' : 'none' }}>{val || '—'}</Typography>
                        </Grid>
                    ))}
                </Grid>
            ) : contact.kyc?.length ? (
                contact.kyc.map((d, i) => <Typography key={i}>{d.doc_type}: {d.doc_number}</Typography>)
            ) : (
                <Typography color="text.secondary">No KYC documents yet</Typography>
            )}
        </Section>
    )
}

const ContactFields = ({ control, watch, setValue, createData }) => {

    const [countryId, setCountryId] = useState();
    const [stateData, setStateData] = useState();
    const [stateId, setStateId] = useState();
    const [cityData, setCityData] = useState();

    const emails = useFieldArray({ control, name: 'contact.emails' })
    const phones = useFieldArray({ control, name: 'contact.phones' })
    const kyc = useFieldArray({ control, name: 'contact.kyc' })
    const [photo, setPhoto] = useState(null)

    useEffect(() => {
        if (countryId && createData?.country.length > 0) {
            const data = createData && createData['country'].find(item => item.country_id == countryId);
            const states = data['states'];

            setStateData(states);
        }
    }, [countryId, createData])

    useEffect(() => {
        if (stateId && stateData) {
            const data = stateData && stateData.find(item => item.state_id == stateId);
            const city = data['cities'];

            setCityData(city);
        }
    }, [stateId, stateData])

    return (
        <>
            <Section title="Contact information">
                <Group title="Basic information">
                    <Controller
                        name="contact.contact_type"
                        control={control}
                        render={({ field }) => (
                            <RadioGroup row {...field}>
                                <FormControlLabel value="individual" control={<Radio size="small" />} label="Individual" />
                                <FormControlLabel value="company" control={<Radio size="small" />} label="Company" />
                            </RadioGroup>
                        )}
                    />
                    <Grid container spacing={3} sx={{ mt: 1 }}>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <Field control={control} name="contact.category_id" label="Contact category" options={createData?.contactCategory || []} />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <Field control={control} name="contact.reference_number" label="Reference number" />
                        </Grid>
                        <Grid size={12}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                                <Avatar src={photo ? URL.createObjectURL(photo) : undefined} sx={{ width: 56, height: 56 }}>
                                    <i className="tabler-camera" />
                                </Avatar>
                                <Box>
                                    <Button component="label" size="small" variant="outlined">
                                        Upload photo
                                        <input hidden type="file" accept="image/png,image/jpeg,image/webp" onChange={e => {
                                            const f = e.target.files?.[0]

                                            if (f && f.size > 10 * 1024 * 1024) return toast.error('Photo must be under 10 MB')
                                            setPhoto(f || null)
                                            setValue('__photo', f || null)
                                        }} />
                                    </Button>
                                    <Typography variant="caption" display="block" color="text.secondary">JPG, PNG or WebP, up to 10 MB</Typography>
                                </Box>
                            </Box>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <Field control={control} name="contact.name" label="Full name" required rules={{ required: 'Full name is required' }} />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <Field control={control} name="contact.nationality" label="Nationality" />
                        </Grid>

                        <Grid size={{ xs: 12, sm: 6 }}>
                            {emails.fields.map((f, i) => (
                                <Box key={f.id} sx={{ display: 'flex', gap: 1, mb: 2 }}>
                                    <Field control={control} name={`contact.emails.${i}.value`} label="Email" placeholder="name@example.com" rules={EMAIL_RULE} />
                                    {i > 0 && <IconButton onClick={() => emails.remove(i)} aria-label="Remove email"><i className="tabler-trash" /></IconButton>}
                                </Box>
                            ))}
                            <Button size="small" onClick={() => emails.append({ value: '' })}>+ Add email</Button>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            {phones.fields.map((f, i) => (
                                <Box
                                    key={f.id}
                                    sx={{
                                        display: 'flex',
                                        alignItems: 'flex-start',
                                        gap: 1,
                                        mb: 2,
                                        width: '100%',
                                        minWidth: 0
                                    }}
                                >


                                    <Controller
                                        name={`contact.phones.${i}.country_code`}
                                        control={control}
                                        render={({ field }) => (
                                            <TextField
                                                {...field}
                                                select
                                                size="small"
                                                sx={{
                                                    flex: '0 0 125px',
                                                    width: 125,
                                                    minWidth: 125,

                                                    '& .MuiOutlinedInput-root': {
                                                        height: 40,
                                                        padding: 0,
                                                        position: 'relative'
                                                    },

                                                    '& .MuiSelect-select': {
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        boxSizing: 'border-box',
                                                        height: '40px',
                                                        padding: '8px 32px 8px 10px !important',
                                                        minWidth: '0 !important',
                                                        overflow: 'hidden',
                                                        whiteSpace: 'nowrap'
                                                    },

                                                    '& .MuiSelect-icon': {
                                                        position: 'absolute',
                                                        right: 5,
                                                        top: '50%',
                                                        transform: 'translateY(-50%)',
                                                        pointerEvents: 'none'
                                                    }
                                                }}
                                                slotProps={{
                                                    select: {
                                                        MenuProps: {
                                                            PaperProps: {
                                                                sx: { maxHeight: 320 }
                                                            }
                                                        },
                                                        renderValue: value => {
                                                            const country = COUNTRIES.find(c => c.dial === value)

                                                            return (
                                                                <Box
                                                                    sx={{
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        gap: 0.75,
                                                                        minWidth: 0,
                                                                        overflow: 'hidden'
                                                                    }}
                                                                >
                                                                    {country && <Flag iso={country.iso} />}

                                                                    <Box
                                                                        component="span"
                                                                        sx={{
                                                                            flexShrink: 0,
                                                                            whiteSpace: 'nowrap',
                                                                            lineHeight: 1.5
                                                                        }}
                                                                    >
                                                                        {value}
                                                                    </Box>
                                                                </Box>
                                                            )
                                                        }
                                                    }
                                                }}
                                            >
                                                {COUNTRIES.map(country => (
                                                    <MenuItem
                                                        key={country.iso}
                                                        value={country.dial}
                                                        sx={{ gap: 2 }}
                                                    >
                                                        <Flag iso={country.iso} />
                                                        {country.name} ({country.dial})
                                                    </MenuItem>
                                                ))}
                                            </TextField>
                                        )}
                                    />


                                    <Controller name={`contact.phones.${i}.number`} control={control}
                                        rules={{ pattern: { value: /^(\d{7,15})?$/, message: 'Enter 7–15 digits' } }}
                                        render={({ field, fieldState }) => (
                                            <TextField {...field} size="small" fullWidth label="Mobile number"
                                                onChange={e => field.onChange(e.target.value.replace(/\D/g, '').slice(0, 15))}
                                                slotProps={{ htmlInput: { inputMode: 'numeric' } }}
                                                error={!!fieldState.error} helperText={fieldState.error?.message} />
                                        )} />
                                    {i > 0 && <IconButton onClick={() => phones.remove(i)} aria-label="Remove phone"><i className="tabler-trash" /></IconButton>}
                                </Box>
                            ))}
                            <Button size="small" onClick={() => phones.append({ country_code: '+91', number: '' })}>+ Add phone number</Button>
                        </Grid>
                    </Grid>
                </Group>
            </Section>

            <Section title="KYC documents">
                {kyc.fields.length === 0 && <Typography color="text.secondary" variant="body2">No KYC documents yet</Typography>}
                {kyc.fields.map((f, i) => (
                    <Grid container spacing={2} key={f.id} sx={{ mb: 2 }} alignItems="flex-start">
                        <Grid size={{ xs: 12, sm: 5 }}>
                            <Field
                                control={control}
                                name={`contact.kyc.${i}.doc_type`}
                                label="Document type"
                                rules={{ required: 'Select a document type' }}
                                options={(createData?.leadDocumentType || []).map(c => ({
                                    _id: String(c?._id),
                                    title: c?.name
                                }))}
                            />
                        </Grid>
                        <Grid size={{ xs: 10, sm: 6 }}>
                            <Field control={control} name={`contact.kyc.${i}.doc_number`} label="Document number" rules={{ required: 'Enter the document number' }} />
                        </Grid>
                        <Grid size={{ xs: 2, sm: 1 }}>
                            <IconButton onClick={() => kyc.remove(i)} aria-label="Remove document"><i className="tabler-trash" /></IconButton>
                        </Grid>
                    </Grid>
                ))}
                <Button style={{
                    marginTop: "2px"
                }} size="small"
                    variant="contained"
                    onClick={() =>
                        kyc.append({ doc_type: '', doc_number: '' })
                    }
                >
                    + Add KYC
                </Button>
            </Section>

            <Section title="Address information">
                <Grid container spacing={3}>
                    <Grid size={12}>
                        <Field control={control} name="contact.address" label="Mailing address" multiline rows={3} placeholder="Enter mailing address" />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <Field
                            control={control}
                            name="contact.country_id"
                            label="Country"
                            options={(createData?.country || []).map(c => ({
                                _id: String(c?.country_id),
                                title: c?.country_name
                            }))}
                            onChange={e => {
                                const countryId = e.target.value;

                                setCountryId(countryId);
                                setValue('contact.country_id', countryId);
                                setValue('contact.state_id', '');
                                setValue('contact.city_id', '');
                                setStateId('');
                            }}
                        />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <Field
                            control={control}
                            name="contact.state_id"
                            label="State"
                            options={(stateData || [])?.map(s => ({ _id: String(s.state_id), title: s.state_name }))}

                            onChange={e => {
                                const selectedStateId = e.target.value

                                setStateId(selectedStateId)
                                setValue('contact.state_id', e.target.value);
                                setValue('contact.city_id', '')
                                setCityData([])
                            }}

                        />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <Field
                            control={control}
                            name="contact.city_id"
                            label="City"
                            disabled={!stateId}
                            options={cityData?.map(c => ({ _id: String(c.city_id), title: c.city_name }))}
                        />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <Field control={control} name="contact.website" label="Website" placeholder="https://www.example.com" rules={{ pattern: { value: /^(https?:\/\/\S+\.\S+)?$/, message: 'Enter a full URL, e.g. https://example.com' } }} />
                    </Grid>
                    <Grid size={12}>
                        <Field control={control} name="contact.emergency_contact_name" label="Emergency contact name" />
                    </Grid>
                </Grid>
            </Section>
        </>
    )
}

const LeadFields = ({ control, createData }) => {
    const d = createData || {}
    const sel = (name, label, options) => (
        <Grid size={{ xs: 12, sm: 6 }}><Field control={control} name={`lead.${name}`} label={label} options={options || []} /></Grid>
    )

    return (
        <Section title="Lead information">
            <Group title="Lead details">
                <Grid container spacing={3}>
                    {sel('source_id', 'Source', d.leadSource)}
                    {sel('status_id', 'Status', d.leadStatus)}
                    {sel('contact_method_id', 'Contact method', d.contactMethod)}
                    {sel('type_id', 'Type', d.leadType)}
                    {sel('priority_id', 'Priority', d.leadPriority)}
                    {sel('purpose_id', 'Purpose', d.leadPurpose)}
                </Grid>
            </Group>
            <Group title="Property preferences">
                <Grid container spacing={3}>
                    {sel('property_type_id', 'Interested property type', d.leadPropertyType)}
                    {sel('move_in_timeline_id', 'Move-in timeline', d.timelineData)}
                </Grid>
            </Group>
            <Group title="Assignment">
                <Grid container spacing={3}>
                    {sel('department_id', 'Department', d.department)}
                    {sel('assigned_to', 'Assigned to', d.role)}
                </Grid>
            </Group>
            <Group title="Source & commission">
                <Grid container spacing={3}>
                    {sel('agent_id', 'Agent / source (vendor)', d.vendor)}
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <Field control={control} name="lead.commission_type" label="Commission type"
                            options={[{ value: 'percentage', title: 'Percentage' }, { value: 'fixed', title: 'Fixed amount' }]} />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <Field control={control} name="lead.commission_value" label="Commission value" placeholder="Enter value" rules={AMOUNT_RULE} />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <Field control={control} name="lead.commission_amount" label="Commission amount (total)" placeholder="Final amount" rules={AMOUNT_RULE} />
                    </Grid>
                </Grid>
            </Group>
        </Section>
    )
}

const LeadForm = ({ existing, prefill, createData, token, onClose, onCreated, doPost }) => {
    const { data: session } = useSession()
    const [saving, setSaving] = useState(false)

    const defaultStatus = createData?.statusData?.find(s => s.name?.toLowerCase() === OPEN_STATUS_TITLE)?._id || ''
    const defaultUser = session?.user?.id || ''


    const methods = useForm({
        defaultValues: leadFormDefaults(
            prefill,
            defaultStatus,
            defaultUser
        ),
    })

    const {
        control,
        handleSubmit,
        watch,
        setValue,
        reset,
    } = methods


    // defaults arrive after createData loads
    useEffect(() => {
        if (createData && !watch('lead.status_id')) setValue('lead.status_id', defaultStatus)
    }, [createData]) // eslint-disable-line react-hooks/exhaustive-deps

    const submit = async values => {
        setSaving(true);

        try {
            const payload = existing
                ? { contact_id: existing._id, lead: values.lead }
                : { contact: values.contact, lead: values.lead };

            const clean = o =>
                Object.fromEntries(
                    Object.entries(o).filter(([, x]) => x !== '')
                );

            payload.lead = clean(payload.lead);

            const body = new FormData();
            body.append('payload', JSON.stringify(payload));

            if (values.__photo) {
                body.append('photo', values.__photo);
            }

            await doPost('company/leads/save/data', body);

            toast.success('Lead created', { autoClose: 1000 });

            await onCreated?.();
            reset();
            onClose();
        } catch (e) {
            console.error(e);
            toast.error(e.message || 'Could not reach the server. Try again.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <form onSubmit={handleSubmit(submit)} noValidate>
            {existing
                ?
                <ExistingContactCard
                    contact={existing}
                />
                :
                <ContactFields
                    control={control}
                    watch={watch}
                    setValue={setValue}
                    createData={createData}
                />
            }
            <LeadFields
                control={control}
                createData={createData}
            />
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 5 }}>
                <Button type="submit" variant="contained" disabled={saving}>
                    {saving ? <CircularProgress size={20} color="inherit" /> : 'Create lead'}
                </Button>
                <Button variant="outlined" onClick={onClose} disabled={saving}>Cancel</Button>
            </Box>
        </form>
    )
}

/* ---------- drawer ---------- */

export default function CreateLeadDrawer({
    open,
    onClose,
    createData,
    fetchLeadsData,
    onOpenLead
}) {

    const { doGet, doPost, token } = useApi()

    // step: 'search' | 'form'; existing: contact record picked from search
    const [step, setStep] = useState('search')
    const [existing, setExisting] = useState(null)
    const [prefill, setPrefill] = useState({})

    useEffect(() => {
        if (open) { setStep('search'); setExisting(null); setPrefill({}) }
    }, [open])

    const startNew = term => {
        const t = term.trim()

        setPrefill(t.includes('@') ? { email: t } : /^[\d+\s-]{7,}$/.test(t) ? { phone: t.replace(/\D/g, '') } : { name: t })
        setExisting(null)
        setStep('form')
    }

    return (
        <Drawer anchor="right" open={open} onClose={onClose} slotProps={{ paper: { sx: { width: 'min(760px, 100vw)' } } }}>
            <Box sx={{ p: 5, overflowY: 'auto' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Typography variant="h6">Create new lead</Typography>
                    <IconButton onClick={onClose} aria-label="Close"><i className="tabler-x" /></IconButton>
                </Box>

                {step === 'search' ? (
                    <SearchStep
                        token={token}
                        doGet={doGet}
                        doPost={doPost}
                        onCancel={onClose}
                        onCreateNew={startNew}
                        onOpenLead={r => { onClose(); onOpenLead?.(r) }}
                        onPickContact={c => { setExisting(c); setStep('form') }}
                    />
                ) : (
                    <LeadForm
                        key={existing?._id || 'new'}
                        existing={existing}
                        prefill={prefill}
                        createData={createData}
                        token={token}
                        doGet={doGet}
                        doPost={doPost}
                        onClose={onClose}
                        onCreated={fetchLeadsData}
                    />
                )}
            </Box>
        </Drawer>
    )
}
