"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { useRouter } from "next/navigation";

import {
    Alert,
    Box,
    Button,
    Chip,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    IconButton,
    Paper,
    Snackbar,
    Stack,
    Tab,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    Tabs,
    Typography,
} from "@mui/material";

import { alpha } from "@mui/material/styles";

import { ArrowLeft, Building2, Pencil, Plus, Sparkles, Trash2, User } from "lucide-react";

import {
    AmenityDrawer,
    DetailsDrawer,
    PropertyDrawer,
    TenantDrawer,
    UploadDrawer,
} from "./ContractDrawer";

import {
    amenityDefaults,
    calcDetail,
    defaultTerm,
    fmtShort,
    inr,
    summarize,
} from "./ContractStore";

import { useApi } from "@/utils/api";

const BASE = "/en/apps/contract";
const TABS = ["Contract Summary", "Additional Documents"];
const twoCol = { display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", lg: "1fr 1fr" }, alignItems: "stretch" };

const AUTO_RENT_ID = "auto-property-rent";
const AUTO_AMENITY_PREFIX = "auto-amenity-";

const panelSx = { p: 2.5, borderColor: "divider", borderRadius: 3 };

// Works whether doGet/doPost return the axios response or the body
const unwrap = (r) => r?.data?.data ?? r?.data ?? r;

/* ---------- normalizers (shared by "create data" and "load contract") ---------- */
const normalizeContact = (contact) => ({
    ...contact,
    id: contact._id,
    name: contact.full_name ?? contact.name ?? "",
    email: contact.emails?.[0] ?? contact.email ?? "",
    mobile: contact.phones?.[0]
        ? `${contact.phones[0].country_code ?? ""}${contact.phones[0].number ?? ""}`
        : contact.mobile ?? "",
    type: contact.contact_type?.toLowerCase() ?? contact.type ?? "individual",
});

const normalizeProperty = (property) => {
    const monthlyTerm = property.terms?.find((t) => t.name?.toLowerCase() === "monthly");

    return {
        ...property,
        id: property._id,
        name: property?.title ?? property?.name ?? property?.full_name ?? property?.company_name ?? "",
        ref: property.refNo || "",
        rent: Number(monthlyTerm?.price ?? property.terms?.[0]?.price ?? 0),
        vacant: property.status?.toLowerCase() === "vacant",
    };
};

const normalizeAmenity = (amenity) => ({
    ...amenity,
    id: amenity._id,
    name: amenity.title ?? "",
    slotHours:
        amenity.slot_time_unit?.toLowerCase() === "minutes"
            ? Number(amenity.slot_time_period ?? 0) / 60
            : Number(amenity.slot_time_period ?? 0),
    freeSlots: Number(amenity.tenant_monthly_quota ?? 0),
});

/* ---------- small UI pieces ---------- */
const Card = ({ icon: Icon, title, color, onAdd, addLabel = "Add", children }) => (
    <Paper variant="outlined" sx={{ ...panelSx, height: "100%", display: "flex", flexDirection: "column" }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1.5} sx={{ minHeight: 32 }}>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ color }}>
                <Icon size={16} />
                <Typography variant="body2" fontWeight={600} sx={{ textTransform: "uppercase", color: "inherit" }}>{title}</Typography>
            </Stack>
            {onAdd && <Button size="small" color="success" startIcon={<Pencil size={12} />} onClick={onAdd}>{addLabel}</Button>}
        </Stack>
        <Box sx={{ flex: 1 }}>{children}</Box>
    </Paper>
);

const Empty = ({ text, label, onClick }) => (
    <Box sx={{ border: "1px dashed", borderColor: "divider", borderRadius: 3, py: 2.5, textAlign: "center" }}>
        <Typography variant="body2" color="text.secondary">{text}</Typography>
        <Button size="small" variant="outlined" color="inherit" startIcon={<Plus size={14} />} onClick={onClick} sx={{ mt: 1 }}>{label}</Button>
    </Box>
);

const Row = ({ label, value, bg = "action.hover", color, strong }) => (
    <Stack direction="row" justifyContent="space-between" sx={{ bgcolor: bg, color, borderRadius: 1.5, px: 1.5, py: 1.5, fontWeight: strong ? 700 : 400 }}>
        <Typography variant="body2" fontWeight="inherit" sx={{ color: "inherit" }}>{label}</Typography>
        <Typography variant="body2" fontWeight="inherit" sx={{ color: "inherit" }}>{value}</Typography>
    </Stack>
);

/* ================= Wrapper: loads data, then mounts the form ================= */
export default function ContractForm({ id, kind }) {
    const { doGet, token } = useApi();

    const [state, setState] = useState({ ready: false, existing: null });
    const [createData, setCreateData] = useState();

    // Lists used by the drawers
    useEffect(() => {
        if (!token) return;

        (async () => {
            try {
                const response = await doGet("company/contract/create/data");
                const result = response?.data ?? response;

                setCreateData({
                    ...result,
                    tenant: (result?.tenant ?? []).map(normalizeContact),
                    property: (result?.property ?? []).map(normalizeProperty),
                    amenity: (result?.amenity ?? []).map(normalizeAmenity),
                    contact: (result?.contact ?? []).map(normalizeContact),
                    contractDocumentType: result?.contractDocumentType ?? [],
                });
            } catch (error) {
                console.error("Failed to fetch contract create data:", error);
            }
        })();
        // eslint-disable-next-line
    }, [token]);

    // Existing contract (edit page) or a blank form (create page)
    useEffect(() => {
        if (!id) return setState({ ready: true, existing: null });
        if (!token) return;

        doGet(`company/contract/${id}`)
            .then((res) => {
                const c = unwrap(res);

                setState({
                    ready: true,
                    existing: {
                        ...c,
                        tenant: c.tenant ? normalizeContact(c.tenant) : null,
                        properties: (c.properties ?? []).map(normalizeProperty),
                        amenities: (c.amenities ?? [])
                            .filter((a) => a.amenity)
                            .map((a) => ({ ...normalizeAmenity(a.amenity), freeSlots: a.freeSlots })),
                        details: (c.details ?? []).map((d) => ({
                            ...d,
                            discountPct: d.discountPct ?? "",
                            amenityId: d.amenityId ?? "",
                        })),
                        documents: c.documents ?? [],
                    },
                });
            })
            .catch(() => setState({ ready: true, existing: null }));
        // eslint-disable-next-line
    }, [id, token]);

    if (!state.ready) return null;

    return <Form createData={createData} existing={state.existing} kind={kind} />;
}

/* ================= The form ================= */
function Form({ existing, kind, createData }) {
    const router = useRouter();
    const { doPost, token } = useApi();

    const [tab, setTab] = useState(TABS[0]);
    const [contractId, setContractId] = useState(existing?.id ?? null);
    const [status, setStatus] = useState(existing?.status ?? "Draft");
    const [tenant, setTenant] = useState(existing?.tenant ?? null);
    const [properties, setProperties] = useState(existing?.properties ?? []);
    const [amenities, setAmenities] = useState(existing?.amenities ?? []);
    const [details, setDetails] = useState(existing?.details ?? []);
    const [documents, setDocuments] = useState(existing?.documents ?? []);
    const [drawer, setDrawer] = useState(null); // tenant | property | amenity | details | upload
    const [editing, setEditing] = useState(null);
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");
    const [confirmDelete, setConfirmDelete] = useState(false);

    const creating = useRef(false);

    const sum = useMemo(() => summarize(details), [details]);
    const defaultRent = properties.reduce((a, p) => a + p.rent * 12, 0);
    const locked = status !== "Draft";

    /* ---------- 1) create the draft as soon as the form opens ---------- */
    useEffect(() => {
        if (contractId || !token || creating.current) return;
        creating.current = true;

        doPost("company/contract/create", { kind: kind ?? "org-tenant" })
            .then((res) => setContractId(unwrap(res).id))
            .catch(() => {
                creating.current = false;
                setError("Could not create the contract.");
            });
        // eslint-disable-next-line
    }, [token]);

    /* ---------- 2) one helper for every save ---------- */
    const call = async (path, body) => {
        if (!contractId) {
            setError("Contract is still being created. Try again in a moment.");
            return null;
        }

        try {
            const res = await doPost(`company/contract/${contractId}/${path}`, body);
            setError("");
            return unwrap(res) ?? {};
        } catch (e) {
            setError(e?.response?.data?.message || e?.message || "Save failed");
            return null;
        }
    };

    const payload = () => ({
        tenant: tenant?._id,
        properties: properties.map((p) => p._id),
        amenities: amenities.map((a) => ({ _id: a._id, freeSlots: a.freeSlots })),
        details,
    });

    /* ---------- Save Contract / Submit / Delete ---------- */
    const save = async () => {
        const res = await call("save", payload());
        if (res) setNotice("Contract saved");
        return res;
    };

    const submit = async () => {
        if (!tenant) return setError("Add a tenant before submitting.");
        if (!properties.length) return setError("Add at least one property before submitting.");
        if (!details.length) return setError("Add at least one detail line before submitting.");

        if (!(await save())) return; // save first
        const res = await call("submit");
        if (res) {
            setStatus("Pending");
            router.push(BASE);
        }
    };

    const remove = async () => {
        if (contractId) {
            const res = await call("delete");
            if (!res) return setConfirmDelete(false);
        }
        router.push(BASE);
    };

    /* ---------- auto lines (pure functions) ---------- */
    const withRentLine = (prev, list) => {
        const others = prev.filter((d) => d.id !== AUTO_RENT_ID);
        if (!list.length) return others;

        const yearlyRent = list.reduce((a, p) => a + (Number(p.rent) || 0) * 12, 0);
        const old = prev.find((d) => d.id === AUTO_RENT_ID);
        const term = defaultTerm();

        const line = old
            ? { ...old, rentalValue: yearlyRent }
            : {
                id: AUTO_RENT_ID, type: "Property Rent", description: "Property Rental",
                start: term.start, end: term.end, rentalValue: yearlyRent, payments: 12,
                discountPct: "", discountValue: 0, tax: "none",
            };

        return [line, ...others];
    };

    const withAmenityLines = (prev, list) => {
        const others = prev.filter((d) => !String(d.id).startsWith(AUTO_AMENITY_PREFIX));
        const rentLine = prev.find((d) => d.id === AUTO_RENT_ID);
        const term = defaultTerm();

        const lines = list.map((a) => {
            const id = `${AUTO_AMENITY_PREFIX}${a.id}`;
            const old = prev.find((d) => d.id === id);
            const d = amenityDefaults(a);

            if (old) {
                const needsFee = !Number(old.monthlyFee) && d.monthlyFee;
                return {
                    ...old,
                    description: old.description || a.name,
                    freeSlots: a.freeSlots,
                    ...(needsFee && {
                        monthlyFee: d.monthlyFee,
                        rentalValue: d.monthlyFee * (Number(old.payments) || 12),
                    }),
                };
            }

            return {
                id, type: "Amenity", amenityId: a.id, description: a.name, freeSlots: a.freeSlots,
                extraSlotPrice: "", monthlyFee: d.monthlyFee || "",
                start: rentLine?.start || term.start, end: rentLine?.end || term.end,
                payments: 12, rentalValue: d.monthlyFee * 12,
                discountPct: "", discountValue: 0, tax: "none",
            };
        });

        return [...others, ...lines];
    };

    /* ---------- drawer handlers: each one saves its section ---------- */
    const handleTenant = (t) => {
        setTenant(t);
        call("tenant", { tenant: t._id });
    };

    const handleProperties = (list) => {
        const next = withRentLine(details, list);
        setProperties(list);
        setDetails(next);
        call("properties", { properties: list.map((p) => p._id), details: next });
    };

    const handleAmenities = (list) => {
        const next = withAmenityLines(details, list);
        setAmenities(list);
        setDetails(next);
        call("amenities", { amenities: list.map((a) => ({ _id: a._id, freeSlots: a.freeSlots })), details: next });
    };

    const upsertDetail = (d) => {
        setDetails((list) => (list.some((x) => x.id === d.id) ? list.map((x) => (x.id === d.id ? d : x)) : [...list, d]));

        if (d.type === "Amenity" && d.amenityId) {
            setAmenities((list) => {
                if (list.some((a) => a.id === d.amenityId)) {
                    return list.map((a) => (a.id === d.amenityId ? { ...a, freeSlots: Number(d.freeSlots) || 0 } : a));
                }
                const found = createData?.amenity?.find((a) => a.id === d.amenityId);
                return found ? [...list, { ...found, freeSlots: Number(d.freeSlots) || 0 }] : list;
            });
        }

        call("details", { detail: d });
    };

    const handleDeleteDetail = (d) => {
        setDetails((l) => l.filter((x) => x.id !== d.id));
        if (d.amenityId) setAmenities((l) => l.filter((a) => a.id !== d.amenityId));
        call("details/delete", { detailId: d.id });
    };

    const handleUpload = async (docs) => {
        const fd = new FormData();
        fd.append("type", docs[0].type); // must come before the files
        docs.forEach((d) => fd.append("files", d.file));

        const saved = await call("documents", fd);
        if (saved?.documents) setDocuments(saved.documents);
    };

    const handleDeleteDocument = async (d) => {
        setDocuments((l) => l.filter((x) => x.id !== d.id));
        await call("documents/delete", { documentId: d.id });
    };

    /* ---------- footer buttons ---------- */
    const footer = (
        <Stack direction="row" justifyContent="flex-end" spacing={1} mt={2}>
            <Button variant="contained" color="error" startIcon={<Trash2 size={14} />} disabled={locked} onClick={() => setConfirmDelete(true)}>
                Delete Contract
            </Button>
            <Button variant="outlined" color="inherit" disabled={locked} onClick={save}>Save Contract</Button>
            <Button variant="contained" onClick={submit} disabled={locked}>Submit for Approval</Button>
        </Stack>
    );

    return (
        <Box sx={{ minHeight: "100vh" }}>
            <Stack direction="row" alignItems="center" spacing={1.5} sx={{ borderBottom: 1, borderColor: "divider", py: 2 }}>
                <IconButton aria-label="Back" onClick={() => router.push(BASE)}><ArrowLeft size={18} /></IconButton>
                <Typography variant="h6" fontWeight={700}>{contractId ?? "New"}</Typography>
                <Chip size="small" label={status} sx={{ fontWeight: 700, fontSize: 10, textTransform: "uppercase" }} />
            </Stack>

            {/* Pill-style tabs that follow the theme's primary color */}
            <Tabs
                value={tab}
                onChange={(_, v) => setTab(v)}
                variant="scrollable"
                scrollButtons="auto"
                TabIndicatorProps={{ sx: { display: "none" } }}
                sx={{ mt: 2.5, minHeight: 40 }}
            >
                {TABS.map((t) => (
                    <Tab
                        key={t}
                        value={t}
                        label={t}
                        disableRipple
                        sx={(theme) => ({
                            minHeight: 40, mr: 1, px: 2.5, borderRadius: 2, textTransform: "none", fontWeight: 600,
                            color: "text.primary",
                            bgcolor: alpha(theme.palette.primary.main, 0.08),
                            "&:hover": { bgcolor: alpha(theme.palette.primary.main, 0.16) },
                            "&.Mui-selected": { color: "#fff", bgcolor: theme.palette.primary.main },
                        })}
                    />
                ))}
            </Tabs>

            {error && <Alert severity="error" sx={{ mt: 2 }} onClose={() => setError("")}>{error}</Alert>}

            {/* ---------- SUMMARY ---------- */}
            {tab === "Contract Summary" && (
                <Stack spacing={2} mt={2}>
                    <Box sx={twoCol}>
                        <Card icon={User} title="Tenant" color="#2563eb" onAdd={tenant && !locked ? () => setDrawer("tenant") : null} addLabel="Edit">
                            {tenant ? (
                                <Box>
                                    <Typography variant="h6" fontWeight={700}>{tenant.name}</Typography>
                                    {tenant.email && <Typography variant="caption" color="text.secondary" display="block">✉ {tenant.email}</Typography>}
                                    {tenant.mobile && <Typography variant="caption" color="text.secondary" display="block">✆ {tenant.mobile}</Typography>}
                                </Box>
                            ) : <Empty text="No tenant assigned" label="Add Tenant" onClick={() => setDrawer("tenant")} />}
                        </Card>

                        <Card icon={Building2} title="Property" color="#2563eb" onAdd={!locked ? () => setDrawer("property") : null}>
                            {properties.length ? (
                                <Stack spacing={1.5}>
                                    {properties.map((p) => (
                                        <Stack key={p.id} direction="row" justifyContent="space-between" alignItems="flex-start">
                                            <Box>
                                                <Typography fontWeight={600}>{p.name}</Typography>
                                                <Typography sx={{ fontSize: 10 }} color="primary" display="block">Ref: {p.ref}</Typography>
                                                <Typography sx={{ fontSize: 10 }} color="text.secondary" display="block">
                                                    {[p.address, p.building, p.street, p.unit, p.floor].filter(Boolean).join(", ") || "Address not available"}
                                                </Typography>
                                            </Box>
                                            {!locked && (
                                                <IconButton size="small" color="error" aria-label={`Remove ${p.name}`}
                                                    onClick={() => handleProperties(properties.filter((x) => x.id !== p.id))}>
                                                    <Trash2 size={13} />
                                                </IconButton>
                                            )}
                                        </Stack>
                                    ))}
                                </Stack>
                            ) : <Empty text="No property assigned" label="Add Property" onClick={() => setDrawer("property")} />}

                            <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: "divider" }}>
                                <Stack direction="row" spacing={1} alignItems="center" mb={1.5} sx={{ color: "#9333ea" }}>
                                    <Sparkles size={16} />
                                    <Typography variant="body2" fontWeight={600} sx={{ textTransform: "uppercase", color: "inherit" }}>Amenities</Typography>
                                </Stack>
                                {amenities.length ? (
                                    <Stack spacing={0.5}>
                                        {amenities.map((a) => (
                                            <Stack key={a.id} direction="row" justifyContent="space-between">
                                                <Typography variant="body2">{a.name}</Typography>
                                                <Typography variant="body2" color="text.secondary">{a.freeSlots} free slots / month</Typography>
                                            </Stack>
                                        ))}
                                        {!locked && <Box><Button size="small" color="success" onClick={() => setDrawer("amenity")}>Edit amenities</Button></Box>}
                                    </Stack>
                                ) : <Empty text="No amenities included" label="Add Amenity" onClick={() => setDrawer("amenity")} />}
                            </Box>
                        </Card>
                    </Box>

                    {details.length > 0 && (
                        <Box sx={twoCol}>
                            <Paper variant="outlined" sx={panelSx}><Stack spacing={1}>
                                <Row label="Total Property Rental:" value={inr(sum.value)} />
                                <Row label="Total Contract Value:" value={inr(sum.value)} />
                                <Row label="Tax:" value={inr(sum.tax)} />
                                <Row label="Total Contract Value with Tax:" value={inr(sum.total)} bg="#ecfdf5" color="#047857" strong />
                            </Stack></Paper>
                            <Paper variant="outlined" sx={panelSx}><Stack spacing={1}>
                                <Row label="Duration:" value={sum.duration} bg="#eff6ff" color="#1d4ed8" strong />
                                <Row label="Total Number of Payments:" value={sum.payments} />
                            </Stack></Paper>
                        </Box>
                    )}

                    <Stack direction="row" justifyContent="flex-end">
                        {!locked && (
                            <Button variant="contained" startIcon={<Plus size={14} />} onClick={() => { setEditing(null); setDrawer("details"); }}>
                                Add Details
                            </Button>
                        )}
                    </Stack>

                    <Paper variant="outlined" sx={{ overflowX: "auto", borderColor: "divider", borderRadius: 3 }}>
                        {details.length ? (
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        {["Description", "Dates", "Value", "Tax", "Total Amount", "Actions"].map((h) => (
                                            <TableCell key={h} sx={{ fontWeight: 700 }}>{h}</TableCell>
                                        ))}
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {details.map((d) => {
                                        const c = calcDetail(d);
                                        return (
                                            <TableRow key={d.id}>
                                                <TableCell>
                                                    <Typography sx={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase" }} color="#2563eb">{d.type}</Typography>
                                                    {d.description}
                                                </TableCell>
                                                <TableCell>{fmtShort(d.start)} - {fmtShort(d.end)}</TableCell>
                                                <TableCell>{inr(c.after)}</TableCell>
                                                <TableCell>{c.tax ? inr(c.tax) : "—"}</TableCell>
                                                <TableCell>{inr(c.total)}</TableCell>
                                                <TableCell>
                                                    {!locked && (
                                                        <Stack direction="row">
                                                            <IconButton size="small" aria-label="Edit" onClick={() => { setEditing(d); setDrawer("details"); }}><Pencil size={14} /></IconButton>
                                                            <IconButton size="small" color="error" aria-label="Delete" onClick={() => handleDeleteDetail(d)}><Trash2 size={14} /></IconButton>
                                                        </Stack>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        ) : <Typography variant="body2" color="text.secondary" textAlign="center" py={2.5}>No Details</Typography>}

                        {details.length > 0 && (
                            <Typography variant="caption" component="p" sx={{ textAlign: "right", px: 2, py: 1, borderTop: 1, borderColor: "divider" }}>
                                Total Property Rental <b style={{ marginLeft: 8 }}>{inr(sum.value)}</b>
                            </Typography>
                        )}
                    </Paper>

                    {footer}
                </Stack>
            )}

            {/* ---------- DOCUMENTS ---------- */}
            {tab === "Additional Documents" && (
                <Box mt={2}>
                    <Paper variant="outlined" sx={panelSx}>
                        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ borderBottom: 1, borderColor: "divider", pb: 1.5 }}>
                            <Typography variant="h6" fontWeight={600}>Contract Documents</Typography>
                            {!locked && (
                                <Button size="small" variant="outlined" startIcon={<Plus size={14} />} onClick={() => setDrawer("upload")}>Upload Document</Button>
                            )}
                        </Stack>

                        {documents.length ? (
                            <Stack divider={<Box sx={{ borderTop: 1, borderColor: "divider" }} />}>
                                {documents.map((d) => (
                                    <Stack key={d.id} direction="row" justifyContent="space-between" alignItems="center" py={1.5}>
                                        <Typography variant="body2">
                                            <b>{createData?.contractDocumentType?.find((t) => t._id === d.type)?.name ?? d.type}</b>
                                            {" "}— {d.name}{" "}
                                            <Typography component="span" variant="caption" color="text.secondary">({(d.size / 1024).toFixed(0)} KB)</Typography>
                                        </Typography>
                                        {!locked && (
                                            <IconButton size="small" color="error" aria-label="Remove document" onClick={() => handleDeleteDocument(d)}>
                                                <Trash2 size={14} />
                                            </IconButton>
                                        )}
                                    </Stack>
                                ))}
                            </Stack>
                        ) : <Typography variant="body2" color="text.secondary" textAlign="center" py={4}>No contract documents</Typography>}
                    </Paper>
                    {footer}
                </Box>
            )}

            <Snackbar open={!!notice} autoHideDuration={2500} onClose={() => setNotice("")} message={notice} />

            <Dialog open={confirmDelete} onClose={() => setConfirmDelete(false)}>
                <DialogTitle>Delete this contract?</DialogTitle>
                <DialogContent><DialogContentText>This cannot be undone.</DialogContentText></DialogContent>
                <DialogActions>
                    <Button color="inherit" onClick={() => setConfirmDelete(false)}>Cancel</Button>
                    <Button color="error" variant="contained" onClick={remove}>Delete</Button>
                </DialogActions>
            </Dialog>

            <TenantDrawer
                open={drawer === "tenant"}
                onClose={() => setDrawer(null)}
                createData={createData}
                value={tenant}
                onSave={handleTenant}
            />
            <PropertyDrawer
                open={drawer === "property"}
                onClose={() => setDrawer(null)}
                contractId={contractId}
                createData={createData}
                value={properties}
                onSave={handleProperties}
            />
            <AmenityDrawer
                open={drawer === "amenity"}
                onClose={() => setDrawer(null)}
                value={amenities}
                createData={createData}
                onSave={handleAmenities}
            />
            <DetailsDrawer
                open={drawer === "details"}
                onClose={() => setDrawer(null)}
                timeline={sum}
                initial={editing}
                defaultRent={defaultRent}
                onSave={upsertDetail}
                properties={properties}
                createData={createData}
            />
            <UploadDrawer
                open={drawer === "upload"}
                onClose={() => setDrawer(null)}
                createData={createData}
                onSave={handleUpload}
            />
        </Box>
    );
}
