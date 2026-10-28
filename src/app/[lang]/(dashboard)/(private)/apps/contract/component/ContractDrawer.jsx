"use client";

import { useEffect, useMemo, useState } from "react";

import {
    Avatar,
    Box,
    Button,
    Card,
    CardActionArea,
    Checkbox,
    Chip,
    FormControlLabel,
    IconButton,
    List,
    ListItemAvatar,
    ListItemButton,
    ListItemText,
    MenuItem,
    Paper,
    Radio,
    Stack,
    TextField,
    Typography,
} from "@mui/material";

import { alpha } from "@mui/material/styles";

import { Building2, Check, Sparkles, Upload, User, X, Trash2 } from "lucide-react";

import Drawer, { SearchBox, TabPills } from "./Drawer";

import { TAXES, calcDetail, fmtShort, inr, defaultTerm, amenityDefaults } from "./ContractStore";

const ASSET_URL = process.env.NEXT_PUBLIC_ASSETS_URL

const contactLine = (p) => [p.email && `Email: ${p.email}`, p.mobile && `Mobile: ${p.mobile}`].filter(Boolean).join(" | ");

// Shared look for selectable cards: soft border, primary border + tint when selected
const selectableSx = (on) => (theme) => ({
    borderRadius: 3,
    borderWidth: 2,
    borderStyle: "solid",
    borderColor: on ? theme.palette.primary.main : theme.palette.divider,
    bgcolor: on ? alpha(theme.palette.primary.main, 0.05) : "background.paper",
    transition: "all .15s ease",
    "&:hover": { borderColor: theme.palette.primary.main, boxShadow: theme.shadows[2] },
});

const SectionLabel = ({ children }) => (
    <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: "uppercase", letterSpacing: 0.5, display: "block", mb: 1 }}>
        {children}
    </Typography>
);

/* ---------------- Tenant / Contact ---------------- */
export function TenantDrawer({ open, onClose, value, onSave, createData }) {
    const [tab, setTab] = useState("Tenants");
    const [q, setQ] = useState("");
    const [picked, setPicked] = useState(null);

    useEffect(() => { if (open) { setPicked(value || null); setQ(""); } }, [open, value]);


    const list = useMemo(() => {
        const source = tab === "Tenants" ? createData?.tenant : createData?.contact ?? [];

        return source?.filter((person) =>
            (person.full_name ?? person.name ?? person?.title ?? "")
                .toLowerCase()
                .includes(q.toLowerCase())
        );
    }, [tab, q, createData]);


    return (
        <Drawer open={open} onClose={onClose} width={576} title="Select Tenant" subtitle="Choose a tenant or contact for this contract."
            footer={<>
                <Button variant="outlined" color="inherit" onClick={onClose}>Cancel</Button>
                <Button variant="contained" disabled={!picked} onClick={() => { onSave(picked); onClose(); }}>Save</Button>
            </>}>
            {picked && (
                <Paper variant="outlined" sx={(theme) => ({ mb: 2.5, p: 2, borderRadius: 3, bgcolor: alpha(theme.palette.primary.main, 0.05), borderColor: alpha(theme.palette.primary.main, 0.3) })}>
                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                        <Typography fontWeight={700} variant="body2">Contact Details</Typography>
                        <IconButton aria-label="Clear" size="small" onClick={() => setPicked(null)} sx={{ bgcolor: "action.hover" }}><X size={14} /></IconButton>
                    </Stack>
                    <Typography variant="body2" mt={1}>Name: {picked.name}</Typography>
                    {picked.email && <Typography variant="body2" mt={0.5}>Email: {picked.email}</Typography>}
                    {picked.mobile && <Typography variant="body2" mt={0.5}>Mobile: {picked.mobile}</Typography>}
                    <Typography variant="body2" mt={0.5}>Contact Type: {picked.type || "individual"}</Typography>
                </Paper>
            )}

            <TabPills tabs={["Tenants", "Contacts"]} value={tab} onChange={(t) => { setTab(t); setQ(""); }} />
            <SearchBox value={q} onChange={setQ} placeholder={`Search ${tab.toLowerCase()}`} />

            <List disablePadding sx={{ display: "grid", gap: 1.5 }}>
                {list?.map((p) => {

                    const active =
                        picked?.id === (p.id ?? p._id) &&
                        (picked?.name ?? picked?.full_name) === (p.name ?? p.full_name);

                    return (
                        <ListItemButton key={`${tab}-${p?._id}`} onClick={() => setPicked(p)} sx={[selectableSx(active), { py: 1.25 }]}>
                            <ListItemAvatar>
                                <Avatar sx={(theme) => ({ width: 36, height: 36, bgcolor: active ? theme.palette.primary.main : alpha(theme.palette.primary.main, 0.1), color: active ? "#fff" : theme.palette.primary.main })}>
                                    {active ? <Check size={16} /> : <User size={16} />}
                                </Avatar>
                            </ListItemAvatar>
                            <ListItemText primary={p?.full_name} secondary={contactLine(p)} primaryTypographyProps={{ fontWeight: 600, variant: "body2" }} secondaryTypographyProps={{ variant: "caption" }} />
                        </ListItemButton>
                    );
                })}
                {!list?.length && <Typography variant="body2" color="text.secondary" textAlign="center" py={4}>No {tab.toLowerCase()} found</Typography>}
            </List>
        </Drawer>
    );
}

export function PropertyDrawer({ open, onClose, contractId, value, onSave, createData }) {

    const [sel, setSel] = useState([]);
    const [q, setQ] = useState("");
    const [vacantOnly, setVacantOnly] = useState(false);

    useEffect(() => {
        if (open) {
            setSel(value.map((p) => p.id ?? p._id));
            setQ("");
        }
    }, [open, value]);

    const shown = (createData?.property ?? []).filter(
        (p) =>
            (p.name ?? p.full_name ?? "").toLowerCase().includes(q.toLowerCase()) &&
            (!vacantOnly || p.vacant)
    );

    const toggle = (id) => setSel((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

    return (
        <Drawer open={open} onClose={onClose} width={672}
            title={`Add Properties to Contract #${contractId ?? "New"}`}
            subtitle="Select one or more properties to include in this contract."
            footer={<>
                <Typography variant="body2" color="text.secondary" sx={{ mr: "auto" }}>
                    <b>{sel.length}</b> {sel.length === 1 ? "property" : "properties"} selected
                </Typography>
                <Button variant="outlined" color="inherit" onClick={onClose}>Cancel</Button>
                <Button variant="contained" disabled={!sel.length} onClick={() => {
                    onSave(
                        createData.property.filter((p) => sel.includes(p.id))
                    );
                    onClose();
                }}>Add Property</Button>
            </>}>
            {sel.length > 0 && (
                <Stack direction="row" flexWrap="wrap" gap={1} mb={2}>
                    {createData?.property
                        ?.filter((p) => sel.includes(p.id))
                        .map((p) => (
                            <Chip
                                key={p.id}
                                size="small"
                                color="primary"
                                label={p.name}
                                onDelete={() => toggle(p.id)}
                            />
                        ))}
                </Stack>
            )}

            <SearchBox value={q} onChange={setQ} placeholder="Search properties" />
            <FormControlLabel sx={{ mb: 1.5, ml: 0 }} label={<Typography variant="body2">Show vacant only</Typography>}
                control={<Checkbox size="small" checked={vacantOnly} onChange={(e) => setVacantOnly(e.target.checked)} />} />

            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
                {shown?.map((p) => {
                    const on = sel.includes(p._id);
                    return (
                        <Card
                            key={p.id}
                            variant="outlined"
                            sx={[selectableSx(on), { overflow: "hidden", height: "100%" }]}
                        >
                            <CardActionArea
                                onClick={() => toggle(p.id)}
                                sx={{
                                    height: "100%",
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "stretch",
                                    justifyContent: "flex-start",
                                }}
                            >
                                <Box sx={{ position: "relative", height: 112, bgcolor: "action.hover", display: "flex", alignItems: "center", justifyContent: "center", color: "text.disabled" }}>

                                    {p?.files?.photos?.[0] ? (
                                        <img
                                            src={`${ASSET_URL}/${p?.files.photos?.[0]?.path}`}
                                            alt={p?.title ?? p?.name ?? "Property"}
                                            className="h-full w-full object-cover"
                                        />
                                    ) : (
                                        <Building2 size={36} strokeWidth={1.5} />
                                    )}
                                    <Chip size="small" label={p.vacant ? "Vacant" : "Occupied"} color={p.vacant ? "success" : "warning"}
                                        sx={{ position: "absolute", left: 8, top: 8, height: 22, fontSize: 11, fontWeight: 600 }} />
                                    {on && (
                                        <Box sx={{ position: "absolute", right: 8, top: 8, width: 24, height: 24, borderRadius: "50%", bgcolor: "primary.main", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: 2 }}>
                                            <Check size={14} />
                                        </Box>
                                    )}
                                </Box>
                                <Box sx={{ p: 1.5 }}>
                                    <Typography
                                        variant="body2"
                                        fontWeight={700}
                                    >
                                        {p.name}
                                    </Typography>
                                    <Typography
                                        variant="caption" color="text.secondary" display="block">{p.ref}</Typography>
                                    <Typography
                                        variant="body2" fontWeight={700} color="primary" mt={0.5}>{inr(p.rent)} <Typography component="span" variant="caption" color="text.secondary">/ month</Typography></Typography>
                                </Box>
                            </CardActionArea>
                        </Card>
                    );
                })}
            </Box>
            {!shown?.length && <Typography variant="body2" color="text.secondary" textAlign="center" py={4}>No properties found</Typography>}
        </Drawer>
    );
}

/* ---------------- Amenities ---------------- */
export function AmenityDrawer({ open, onClose, value, onSave, createData }) {
    const [slots, setSlots] = useState({}); // id -> free slots; presence = selected
    const [q, setQ] = useState("");

    useEffect(() => {
        if (open) {
            setSlots(
                Object.fromEntries(
                    value.map((amenity) => [
                        amenity.id ?? amenity._id,
                        amenity.freeSlots ?? 0,
                    ])
                )
            );
            setQ("");
        }
    }, [open, value]);


    const list = (createData?.amenity ?? []).filter((amenity) =>
        amenity.name.toLowerCase().includes(q.toLowerCase())
    );

    const selected = Object.keys(slots);

    const toggle = (id) =>
        setSlots((current) => {
            const next = { ...current };

            if (id in next) {
                delete next[id];
            } else {
                next[id] = 0;
            }

            return next;
        });


    return (
        <Drawer open={open} onClose={onClose} width={576} title="Add Amenities to Contract"
            subtitle="Select the amenities included in this contract and set the free slots per month for each."
            footer={<>
                <Typography variant="body2" color="text.secondary" sx={{ mr: "auto" }}><b>{selected.length}</b> selected</Typography>
                <Button variant="outlined" color="inherit" onClick={onClose}>Cancel</Button>
                <Button variant="contained" disabled={!selected.length} startIcon={<Check size={14} />}
                    onClick={() => {
                        onSave(
                            createData.amenity
                                .filter((a) => a.id in slots)
                                .map((a) => ({
                                    ...a,
                                    freeSlots: Number(slots[a.id]) || 0,
                                }))
                        );
                        onClose();
                    }}
                >
                    Add Amenity
                </Button>
            </>}>
            <SearchBox value={q} onChange={setQ} placeholder="Search amenities" />
            <Stack spacing={1.5}>
                {list?.map((a) => {
                    const on = a.id in slots;

                    return (
                        <Paper
                            key={a.id}
                            variant="outlined"
                            sx={[selectableSx(on), { p: 1.5 }]}
                        >
                            <Stack
                                direction="row"
                                alignItems="center"
                                spacing={1.5}
                                onClick={() => toggle(a.id)}
                                sx={{ cursor: "pointer" }}
                            >
                                {/* Keep your existing checkbox and avatar. */}
                                <Typography fontWeight={600} variant="body2">
                                    {a.name}
                                </Typography>
                            </Stack>

                            {on && (
                                <TextField
                                    type="number"
                                    size="small"
                                    label="Free slots per month"
                                    inputProps={{ min: 0 }}
                                    value={slots[a.id]}
                                    onChange={(e) =>
                                        setSlots((current) => ({
                                            ...current,
                                            [a.id]: e.target.value,
                                        }))
                                    }
                                />
                            )}
                        </Paper>
                    );
                })}
                {!list?.length && <Typography variant="body2" color="text.secondary" textAlign="center" py={4}>No amenities found</Typography>}
            </Stack>
        </Drawer>
    );
}

/* ---------------- Add / edit details ---------------- */
const TYPES = ["Property Rent", "Deposit", "Other", "Amenity"];

export function DetailsDrawer({ open, onClose, timeline, initial, defaultRent, onSave, properties = [], createData }) {
    const amenityList = createData?.amenity ?? [];

    const makeBlank = () => {
        const term = defaultTerm();
        return {
            type: "Property Rent", description: "Property Rental",
            start: timeline.start || term.start,
            end: timeline.end || term.end,
            rentalValue: defaultRent || 0, payments: 12,
            discountPct: "", discountValue: 0, tax: "none",
            amenityId: "", freeSlots: "", extraSlotPrice: "", monthlyFee: "",
        };
    };

    const [f, setF] = useState(makeBlank);

    useEffect(() => { if (open) setF(initial ? { ...makeBlank(), ...initial } : makeBlank()); /* eslint-disable-next-line */ }, [open, initial]);

    // One place that keeps the derived numbers consistent
    const set = (patch) => setF((p) => {
        const n = { ...p, ...patch };
        if (n.type === "Amenity") n.rentalValue = (Number(n.monthlyFee) || 0) * (Number(n.payments) || 0);
        if (n.discountPct !== "" && !("discountValue" in patch)) {
            n.discountValue = Math.round(((Number(n.rentalValue) || 0) * (Number(n.discountPct) || 0)) / 100);
        }
        return n;
    });

    const isAmenity = f.type === "Amenity";
    const isRent = f.type === "Property Rent";
    const amenity = amenityList.find((a) => a.id === f.amenityId);
    const defaults = amenityDefaults(amenity);

    const changeType = (t) => {
        if (t === "Property Rent") return set({ type: t, description: "Property Rental", rentalValue: defaultRent || f.rentalValue });
        if (t === "Amenity") return set({ type: t, description: amenity?.name ?? "" });
        set({ type: t, description: isRent || isAmenity ? "" : f.description });
    };

    const pickAmenity = (id) => {
        const a = amenityList.find((x) => x.id === id);
        if (!a) return;
        const d = amenityDefaults(a);
        set({ amenityId: id, description: a.name, freeSlots: "", extraSlotPrice: d.extraSlotPrice || "", monthlyFee: d.monthlyFee || "" });
    };

    const c = calcDetail(f);
    const valid =
        f.description && f.start && f.end && f.end >= f.start && Number(f.payments) > 0 &&
        (!isAmenity || f.amenityId);
    const dateProps = { type: "date", size: "small", InputLabelProps: { shrink: true } };
    const perPayment = Number(f.payments) > 0 ? (Number(f.monthlyFee) || 0) : 0;

    const save = () => {
        const out = { ...f, id: f.id ?? Date.now() };
        if (isAmenity && out.freeSlots === "") out.freeSlots = defaults.freeSlots; // "leave empty = amenity default"
        onSave(out);
        onClose();
    };

    const timelineRows = (
        <>
            <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2" color="text.secondary">Contract Timeline</Typography>
                <Typography variant="body2" fontWeight={700}>{timeline.start ? `${fmtShort(timeline.start)} - ${fmtShort(timeline.end)}` : "Not set"}</Typography>
            </Stack>
            <Stack direction="row" justifyContent="space-between" mt={1}>
                <Typography variant="body2" color="text.secondary">Latest Schedule End</Typography>
                <Typography variant="body2" fontWeight={700}>{fmtShort(timeline.end)}</Typography>
            </Stack>
        </>
    );

    const typeButtons = (
        <>
            <SectionLabel>Type</SectionLabel>
            <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1.5, mb: 2.5 }}>
                {TYPES.map((t) => {
                    const on = f.type === t;
                    return (
                        <Button key={t} onClick={() => changeType(t)} color="inherit" variant="outlined"
                            startIcon={<Radio checked={on} size="small" sx={{ p: 0, pointerEvents: "none" }} />}
                            sx={(theme) => ({
                                justifyContent: "flex-start", borderRadius: 2, textTransform: "none", fontWeight: 600,
                                borderColor: on ? theme.palette.primary.main : theme.palette.divider,
                                bgcolor: on ? alpha(theme.palette.primary.main, 0.06) : "transparent",
                            })}>
                            {t}
                        </Button>
                    );
                })}
            </Box>
        </>
    );

    return (
        <Drawer open={open} onClose={onClose} width={576} title={initial ? "Edit Details" : "Add Details"} subtitle="Describe the charge and its payment schedule."
            footer={<>
                <Button variant="outlined" color="inherit" onClick={onClose}>Cancel</Button>
                <Button variant="contained" disabled={!valid} startIcon={<Check size={14} />} onClick={save}>Save</Button>
            </>}>

            {/* Property Rent: property status card + timeline */}
            {isRent && (
                <Paper variant="outlined" sx={{ mb: 2.5, p: 2, borderRadius: 3 }}>
                    <SectionLabel>Property Status</SectionLabel>
                    <Stack spacing={1.5} mb={2}>
                        {properties.map((p) => (
                            <Stack key={p.id} direction="row" spacing={1.5} alignItems="center"
                                sx={{ border: 1, borderColor: "divider", borderRadius: 2, p: 1 }}>
                                <Avatar variant="rounded" src={p?.files?.photos?.[0] ? `${ASSET_URL}/${p.files.photos[0].path}` : undefined}
                                    sx={{ width: 44, height: 44 }}>
                                    <Building2 size={20} />
                                </Avatar>
                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                    <Chip size="small" color="secondary" variant="outlined"
                                        label={String(p.status ?? (p.vacant ? "Vacant" : "Occupied")).toUpperCase()}
                                        sx={{ height: 18, fontSize: 10, fontWeight: 700, mb: 0.5 }} />
                                    <Typography variant="body2" fontWeight={700} noWrap>{p.name}</Typography>
                                    <Typography variant="caption" color="text.secondary" display="block">{p.ref}</Typography>
                                    <Typography variant="caption" fontWeight={600} color="primary">{inr(p.rent)} / Month</Typography>
                                </Box>
                            </Stack>
                        ))}
                        {!properties.length && <Typography variant="body2" color="text.secondary">No property selected</Typography>}
                    </Stack>
                    {timelineRows}
                </Paper>
            )}

            {/* Deposit / Other: timeline only */}
            {!isRent && !isAmenity && (
                <Paper variant="outlined" sx={{ mb: 2.5, p: 2, borderRadius: 3 }}>{timelineRows}</Paper>
            )}

            {typeButtons}

            <Stack spacing={2}>
                <TextField size="small" label="Description" value={f.description} onChange={(e) => set({ description: e.target.value })} />

                {/* Amenity block */}
                {isAmenity && (
                    <Paper variant="outlined" sx={{ p: 2, borderRadius: 3 }}>
                        <Stack spacing={2}>
                            <TextField select size="small" label="Amenity" value={f.amenityId} onChange={(e) => pickAmenity(e.target.value)}
                                helperText={amenity ? `1 slot = ${amenity.slotHours ?? 1} hour(s)` : "Select an amenity"}>
                                {amenityList.map((a) => <MenuItem key={a.id} value={a.id}>{a.name}</MenuItem>)}
                            </TextField>

                            <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
                                <TextField type="number" size="small" label="Free slots per month" inputProps={{ min: 0 }}
                                    placeholder={String(defaults.freeSlots)}
                                    value={f.freeSlots ?? ""} onChange={(e) => set({ freeSlots: e.target.value })}
                                    helperText="Leave empty to use the amenity's default." InputLabelProps={{ shrink: true }} />
                                <TextField type="number" size="small" label="Price per extra slot" inputProps={{ min: 0 }}
                                    value={f.extraSlotPrice ?? ""} onChange={(e) => set({ extraSlotPrice: e.target.value })}
                                    helperText="Charged for slots beyond the free slots. Leave empty to allow no paid slots." />
                                <TextField type="number" size="small" label="Monthly fee" inputProps={{ min: 0 }}
                                    value={f.monthlyFee ?? ""} onChange={(e) => set({ monthlyFee: e.target.value })}
                                    helperText="Optional. Tax can be set later on the line." />
                                <TextField type="number" size="small" label="No. of Payments" inputProps={{ min: 1 }}
                                    value={f.payments} onChange={(e) => set({ payments: e.target.value })}
                                    helperText={`Fee billed in ${Number(f.payments) || 0} payment(s) of ${inr(perPayment)}.`} />
                            </Box>
                        </Stack>
                    </Paper>
                )}

                <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
                    {isAmenity ? (
                        <Box sx={{ gridColumn: "1 / -1" }}>
                            <TextField fullWidth size="small" label="Value Before Tax" value={f.rentalValue} InputProps={{ readOnly: true }} />
                        </Box>
                    ) : null}

                    <TextField {...dateProps} label="Start Date" value={f.start} onChange={(e) => set({ start: e.target.value })} />
                    <TextField {...dateProps} label="End Date" inputProps={{ min: f.start }} value={f.end} onChange={(e) => set({ end: e.target.value })} />

                    {!isAmenity && (
                        <>
                            <TextField type="number" size="small" label="Rental Value" inputProps={{ min: 0 }} value={f.rentalValue} onChange={(e) => set({ rentalValue: e.target.value })} />
                            <TextField type="number" size="small" label="No. of Payments" inputProps={{ min: 1 }} value={f.payments} onChange={(e) => set({ payments: e.target.value })} />
                        </>
                    )}

                    <TextField type="number" size="small" label="Discount (%)" inputProps={{ min: 0, max: 100 }} value={f.discountPct} onChange={(e) => set({ discountPct: e.target.value })} />
                    <TextField type="number" size="small" label="Discount Value" inputProps={{ min: 0 }} value={f.discountValue} onChange={(e) => set({ discountValue: e.target.value, discountPct: "" })} />
                </Box>

                <TextField select size="small" label="Tax" value={f.tax} onChange={(e) => set({ tax: e.target.value })}>
                    {TAXES.map((t) => <MenuItem key={t.id} value={t.id}>{t.label}</MenuItem>)}
                </TextField>
            </Stack>

            <Paper variant="outlined" sx={(theme) => ({ mt: 3, p: 2, borderRadius: 3, bgcolor: alpha(theme.palette.primary.main, 0.04) })}>
                <Typography variant="body2" fontWeight={700} pb={1}>Summary</Typography>
                {[
                    [isRent ? "Rental Value" : "Charges Value", c.rent],
                    ["Discount", c.discount],
                    [isRent ? "Value After Discount" : "Charges After Discount", c.after],
                    ["Tax", c.tax],
                ].map(([k, v]) => (
                    <Stack key={k} direction="row" justifyContent="space-between" py={0.75}>
                        <Typography variant="body2" color="text.secondary">{k}</Typography>
                        <Typography variant="body2">{inr(v)}</Typography>
                    </Stack>
                ))}
                <Stack direction="row" justifyContent="space-between" mt={1} pt={1.5} sx={{ borderTop: 1, borderColor: "divider" }}>
                    <Typography variant="body2" fontWeight={700}>Total with Tax</Typography>
                    <Typography variant="body2" fontWeight={700} color="primary">{inr(c.total)}</Typography>
                </Stack>
            </Paper>
        </Drawer>
    );
}

/* ---------------- Upload documents (multiple) ---------------- */
const MAX_SIZE = 30 * 1024 * 1024;

export function UploadDrawer({ open, onClose, onSave, createData }) {
    const [type, setType] = useState("");
    const [files, setFiles] = useState([]);
    const [err, setErr] = useState("");
    useEffect(() => { if (open) { setType(""); setFiles([]); setErr(""); } }, [open]);

    const pick = (e) => {
        const picked = Array.from(e.target.files || []);
        e.target.value = ""; // allow re-selecting the same file later

        const tooBig = picked.filter((f) => f.size > MAX_SIZE);
        const ok = picked.filter((f) => f.size <= MAX_SIZE);
        setErr(tooBig.length ? `Skipped (over 30 MB): ${tooBig.map((f) => f.name).join(", ")}` : "");

        setFiles((prev) => {
            const seen = new Set(prev.map((f) => `${f.name}-${f.size}`));
            return [...prev, ...ok.filter((f) => !seen.has(`${f.name}-${f.size}`))];
        });
    };

    const removeFile = (idx) => setFiles((l) => l.filter((_, i) => i !== idx));

    const upload = () => {
        const stamp = Date.now();
        onSave(files.map((file, i) => ({ id: `${stamp}-${i}`, type, name: file.name, size: file.size, file })));
        onClose();
    };

    return (
        <Drawer open={open} onClose={onClose} width={576} title="Upload Documents" subtitle="Choose a document type and attach one or more files."
            footer={<>
                {files.length > 0 && (
                    <Typography variant="body2" color="text.secondary" sx={{ mr: "auto" }}>
                        <b>{files.length}</b> {files.length === 1 ? "file" : "files"} selected
                    </Typography>
                )}
                <Button variant="outlined" color="inherit" onClick={onClose}>Cancel</Button>
                <Button variant="contained" disabled={!type || !files.length} onClick={upload}>
                    Upload{files.length > 1 ? ` (${files.length})` : ""}
                </Button>
            </>}>
            <Stack spacing={2.5}>
                <TextField select required size="small" label="Select Document Type" value={type} onChange={(e) => setType(e.target.value)}
                    helperText={files.length > 1 ? "Applies to all selected files" : undefined}>
                    {createData?.contractDocumentType?.map((t) => <MenuItem key={t._id} value={t._id}>{t.name}</MenuItem>)}
                </TextField>

                <Box>
                    <Box component="label" sx={(theme) => ({
                        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 0.5, py: 4, px: 2, cursor: "pointer",
                        border: "2px dashed", borderColor: files.length ? theme.palette.primary.main : theme.palette.divider, borderRadius: 3,
                        bgcolor: files.length ? alpha(theme.palette.primary.main, 0.05) : "transparent", transition: "all .15s ease",
                        "&:hover": { borderColor: theme.palette.primary.main, bgcolor: alpha(theme.palette.primary.main, 0.05) },
                    })}>
                        <Upload size={28} />
                        <Typography variant="body2" fontWeight={600}>{files.length ? "Click to add more files" : "Click to select files *"}</Typography>
                        <Typography variant="caption" color="text.secondary">Maximum file size: 30 MB each</Typography>
                        <input type="file" multiple hidden onChange={pick} />
                    </Box>
                </Box>
                {err && <Typography variant="caption" color="error">{err}</Typography>}

                {files.length > 0 && (
                    <List disablePadding sx={{ display: "grid", gap: 1 }}>
                        {files.map((f, i) => (
                            <Paper key={`${f.name}-${f.size}`} variant="outlined" sx={{ borderRadius: 2, pl: 1.5, pr: 0.5, py: 0.5, display: "flex", alignItems: "center" }}>
                                <ListItemText
                                    primary={f.name}
                                    secondary={`${(f.size / 1024).toFixed(0)} KB`}
                                    primaryTypographyProps={{ variant: "body2", fontWeight: 600, noWrap: true }}
                                    secondaryTypographyProps={{ variant: "caption" }}
                                />
                                <IconButton size="small" color="error" aria-label={`Remove ${f.name}`} onClick={() => removeFile(i)}>
                                    <Trash2 size={14} />
                                </IconButton>
                            </Paper>
                        ))}
                    </List>
                )}
            </Stack>
        </Drawer>
    );
}
