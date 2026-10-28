"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { useRouter } from "next/navigation";

import Link from "next/link";

import {
    Alert,
    Box,
    Button,
    IconButton,
    Paper,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    Tooltip,
    Typography,
} from "@mui/material";

import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import AddIcon from "@mui/icons-material/Add";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import UploadFileOutlinedIcon from "@mui/icons-material/UploadFileOutlined";
import ReceiptLongOutlinedIcon from "@mui/icons-material/ReceiptLongOutlined";
import InsertDriveFileOutlinedIcon from "@mui/icons-material/InsertDriveFileOutlined";

import SearchSelect from "./SearchSelect";
import LineItemDrawer from "./LineItemDrawer";

import {
    C,
    CONTROL_H,
    Field,
    Section,
    grid,
    inputSx,
} from "../util/FormUI";

import { chartOfAccounts } from "../data/page";

import {
    calcLine,
    calcTotals,
    inr,
    unwrapResponse,
    toDateInput,
    todayISO,
} from "../util/HelperFun";

import { useApi } from "@/utils/api";

/* ------------------------------------------------------------------ */
/* Constants + helpers                                                 */
/* ------------------------------------------------------------------ */

const MAX_FILE_MB = 30; // keep in sync with invoiceUpload on the server
const ACCEPT = ".jpg,.jpeg,.png,.gif,.webp,.bmp,.tif,.tiff,.pdf,.doc,.docx";

const STATUS_OPTIONS = [
    { value: "true", label: "Active" },
    { value: "false", label: "Inactive" },
];

const makeId = () =>
    globalThis.crypto?.randomUUID?.() ??
    `${Date.now()}-${Math.random().toString(16).slice(2)}`;

const ReadOnlyBox = ({ children, color }) => (
    <Box
        sx={{
            minHeight: CONTROL_H,
            px: 1.75,
            display: "flex",
            alignItems: "center",
            borderRadius: "10px",
            bgcolor: C.surface,
            border: `1px solid ${C.line}`,
            fontSize: 14,
            fontWeight: 500,
            color: color || C.heading,
            minWidth: 0,
        }}
    >
        {children}
    </Box>
);

const actionBtn = {
    width: 32,
    height: 32,
    borderRadius: "8px",
    border: `1px solid ${C.line}`,
    color: C.muted,
};

const btnBase = {
    minHeight: 40,
    px: 2.25,
    borderRadius: "10px",
    fontSize: 14,
    fontWeight: 600,
    textTransform: "none",
    whiteSpace: "nowrap",
};

const FileRow = ({ name, onRemove, disabled }) => (
    <Stack
        direction="row"
        alignItems="center"
        spacing={1}
        sx={{
            pl: 1.25,
            pr: 0.5,
            py: 0.25,
            border: `1px solid ${C.line}`,
            borderRadius: "8px",
            minWidth: 0,
        }}
    >
        <InsertDriveFileOutlinedIcon sx={{ fontSize: 18, color: C.muted }} />

        <Typography
            title={name}
            sx={{
                flex: 1,
                minWidth: 0,
                fontSize: 13,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
            }}
        >
            {name}
        </Typography>

        <IconButton
            size="small"
            aria-label={`Remove ${name}`}
            disabled={disabled}
            onClick={onRemove}
        >
            <DeleteOutlineIcon sx={{ fontSize: 18 }} />
        </IconButton>
    </Stack>
);

const getContactOptions = (data) => {
    const source = Array.isArray(data?.contact)
        ? data.contact
        : Array.isArray(data?.contacts)
            ? data.contacts
            : [];

    return source
        .map((contact) => ({
            ...contact,
            value: contact?.value ?? contact?._id ?? contact?.id ?? "",
            label:
                contact?.label ??
                contact?.full_name ??
                contact?.name ??
                contact?.company_name ??
                "",
        }))
        .filter((contact) => contact.value && contact.label);
};

// Property documents come straight from Mongo (_id, name...), so map them
// to the { value, label } shape SearchSelect expects.
const getPropertyOptions = (data) => {
    const source = Array.isArray(data?.property)
        ? data.property
        : Array.isArray(data?.properties)
            ? data.properties
            : [];

    return source
        .map((property) => ({
            ...property,
            value: String(property?.value ?? property?._id ?? property?.id ?? ""),
            label:
                property?.label ??
                property?.name ??
                property?.title ??
                property?.property_name ??
                property?.propertyName ??
                "",
        }))
        .filter((property) => property.value && property.label);
};

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

export default function InvoiceFormComponent({ invoiceId, lang }) {
    const { doGet, doPost, token } = useApi();
    const router = useRouter();

    const INVOICE_BASE = `/${lang}/apps/invoices/`;

    const [editData, setEditData] = useState();
    const [billedTo, setBilledTo] = useState("");
    const [invoiceDate, setInvoiceDate] = useState(todayISO());
    const [dueDate, setDueDate] = useState(todayISO());
    const [reference, setReference] = useState("");
    const [remarks, setRemarks] = useState("");
    const [items, setItems] = useState([]);
    const [files, setFiles] = useState([]); // new uploads (File objects)
    const [existingFiles, setExistingFiles] = useState([]); // already on the invoice
    const [removedFileIds, setRemovedFileIds] = useState([]);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [status, setStatus] = useState(true); // true = Active, false = Inactive
    const [error, setError] = useState("");
    const [createData, setCreateData] = useState(null);
    const [loadingData, setLoadingData] = useState(false);
    const [saving, setSaving] = useState(false);

    const isEdit = Boolean(invoiceId);

    /* ---------------- Load create data (+ invoice when editing) ---------------- */

    useEffect(() => {
        if (!token) {
            setCreateData(null);
            setEditData(undefined);
            return;
        }

        let active = true;

        const fetchData = async () => {
            setLoadingData(true);
            setError("");

            try {
                const [createResponse, editResponse] = await Promise.all([
                    doGet("company/invoice/create/data"),
                    invoiceId
                        ? doGet(`company/invoice/edit/data/${invoiceId}`)
                        : Promise.resolve(null),
                ]);

                if (!active) return;

                setCreateData(unwrapResponse(createResponse) ?? {});

                if (!invoiceId) {
                    setEditData(undefined);
                    return;
                }

                const editResult = unwrapResponse(editResponse);

                if (!editResult?._id) {
                    throw new Error("Invoice not found.");
                }

                setEditData(editResult);
            } catch (err) {
                if (active) {
                    setError(
                        err?.response?.data?.message ||
                        err?.message ||
                        "Unable to load invoice data."
                    );
                    setEditData(undefined);
                }
            } finally {
                if (active) setLoadingData(false);
            }
        };

        fetchData();

        return () => {
            active = false;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token, invoiceId]);

    /* ---------------- Populate the form when editing ---------------- */

    useEffect(() => {
        if (!invoiceId || !editData) return;

        setBilledTo(
            typeof editData.billedTo === "object"
                ? String(editData.billedTo?._id ?? "")
                : String(editData.billedTo ?? "")
        );

        setInvoiceDate(toDateInput(editData.invoiceDate));
        setDueDate(toDateInput(editData.dueDate));
        setReference(editData.reference ?? "");
        setStatus(editData.status !== false);
        setRemarks(editData.remarks ?? "");

        setItems(
            Array.isArray(editData.items)
                ? editData.items.map((item) => ({
                    ...item,
                    id: item._id ?? item.id ?? makeId(),
                }))
                : []
        );

        setExistingFiles(Array.isArray(editData.files) ? editData.files : []);
        setRemovedFileIds([]);
        setFiles([]);
        setError("");
        setDrawerOpen(false);
        setEditing(null);
    }, [invoiceId, editData]);

    /* ---------------- Derived data ---------------- */

    // The server assigns the real sequence; this is only the preview.
    const sequence = editData?.sequence ?? createData?.nextSequence ?? 1;

    const totals = useMemo(() => calcTotals(items), [items]);

    const contactOptions = useMemo(() => getContactOptions(createData), [createData]);
    const propertyOptions = useMemo(() => getPropertyOptions(createData), [createData]);

    const propertyLabels = useMemo(
        () => new Map(propertyOptions.map((p) => [String(p.value), p.label])),
        [propertyOptions]
    );

    const accountLabels = useMemo(
        () =>
            new Map(
                chartOfAccounts.map((a) => [String(a.value), a.label ?? a.value])
            ),
        []
    );

    const busy = saving || loadingData || (isEdit && !editData?._id);

    /* ---------------- Line items ---------------- */

    const openDrawer = useCallback((item = null) => {
        setEditing(item);
        setDrawerOpen(true);
        setError("");
    }, []);

    const closeDrawer = useCallback(() => {
        setDrawerOpen(false);
        setEditing(null);
    }, []);

    const saveItem = useCallback((item) => {
        if (!item) return;

        setItems((previous) => {
            const itemId = item.id ?? item._id;

            const index = previous.findIndex(
                (row) => (row.id ?? row._id) === itemId
            );

            if (index === -1) {
                return [...previous, { ...item, id: itemId ?? makeId() }];
            }

            return previous.map((row, rowIndex) =>
                rowIndex === index ? { ...row, ...item } : row
            );
        });

        setDrawerOpen(false);
        setEditing(null);
        setError("");
    }, []);

    const removeItem = (item) => {
        const itemId = item.id ?? item._id;

        setItems((previous) =>
            previous.filter((row) => (row.id ?? row._id) !== itemId)
        );
    };

    /* ---------------- Files ---------------- */

    const handleFiles = (event) => {
        const picked = Array.from(event.target.files ?? []);

        const tooBig = picked.filter((f) => f.size > MAX_FILE_MB * 1024 * 1024);
        const accepted = picked.filter((f) => f.size <= MAX_FILE_MB * 1024 * 1024);

        if (tooBig.length) {
            setError(
                `${tooBig.map((f) => f.name).join(", ")} exceeds the ${MAX_FILE_MB} MB limit.`
            );
        }

        setFiles((previous) => [...previous, ...accepted]);

        // Allow selecting the same file again.
        event.target.value = "";
    };

    const removeFile = (index) => {
        setFiles((previous) => previous.filter((_, i) => i !== index));
    };

    const removeExistingFile = (file) => {
        setExistingFiles((previous) => previous.filter((f) => f._id !== file._id));
        setRemovedFileIds((previous) => [...previous, file._id]);
    };

    /* ---------------- Save ---------------- */

    const submit = async () => {
        if (saving) return;

        if (isEdit && !editData?._id) {
            setError("Invoice details have not finished loading.");
            return;
        }

        if (!billedTo) {
            setError("Select who this invoice is billed to.");
            return;
        }

        if (!invoiceDate) {
            setError("Choose an invoice date.");
            return;
        }

        if (!dueDate) {
            setError("Choose a payment due date.");
            return;
        }

        if (dueDate < invoiceDate) {
            setError("Payment due date cannot be before the invoice date.");
            return;
        }

        if (!items.length) {
            setError("Add at least one line item before saving.");
            return;
        }

        setError("");
        setSaving(true);

        // The server assigns the sequence and computes totals, so neither is sent.
        const payload = {
            billedTo,
            invoiceDate,
            dueDate,
            reference: reference.trim(),
            remarks: remarks.trim(),
            items: items.map(
                // eslint-disable-next-line no-unused-vars
                ({ id, _id, taxAmount, total, ...item }) => ({
                    ...item,
                    amount: Number(item.amount) || 0,
                    taxRate: Number(item.taxRate) || 0,
                })
            ),
            removedFileIds,
            status, // true = Active, false = Inactive
        };

        // Plain JSON when there is nothing to upload; otherwise multipart with
        // the same JSON in a single "payload" field next to the files.
        let body = payload;

        if (files.length) {
            body = new FormData();
            body.append("payload", JSON.stringify(payload));
            files.forEach((file) => body.append("files", file));
        }

        try {
            const response = isEdit
                ? await doPost(`company/invoice/update/data/${invoiceId}`, body)
                : await doPost("company/invoice/save/data", body);

            const result = unwrapResponse(response);

            if (response?.success === false || result?.success === false) {
                throw new Error(
                    response?.message || result?.message || "Unable to save invoice."
                );
            }

            if (!isEdit && !result?._id) {
                throw new Error("The API response did not contain the saved invoice ID.");
            }

            // Return to the invoice list only after a successful save.
            router.push(INVOICE_BASE);
            router.refresh();
        } catch (err) {
            setError(
                err?.response?.data?.message ||
                err?.message ||
                "Unable to save the invoice."
            );
        } finally {
            setSaving(false);
        }
    };

    /* ---------------- Delete ---------------- */

    const handleDelete = async () => {
        if (saving || !isEdit) return;

        if (!window.confirm("Delete this invoice? This cannot be undone.")) return;

        setSaving(true);
        setError("");

        try {
            const response = await doPost(
                `company/invoice/delete/data/${invoiceId}`,
                {}
            );

            if (response?.success === false) {
                throw new Error(response?.message || "Unable to delete invoice.");
            }

            router.push(INVOICE_BASE);
            router.refresh();
        } catch (err) {
            setError(
                err?.response?.data?.message ||
                err?.message ||
                "Unable to delete the invoice."
            );
        } finally {
            setSaving(false);
        }
    };

    /* ---------------- Render ---------------- */

    return (
        <Box sx={{ width: "100%", minWidth: 0, pb: 4, color: C.ink }}>
            {/* Page header */}
            <Stack
                direction={{ xs: "column", sm: "row" }}
                justifyContent="space-between"
                alignItems={{ xs: "flex-start", sm: "flex-end" }}
                spacing={1.5}
                sx={{ mb: 3 }}
            >
                <Box>
                    <Typography
                        component="h1"
                        sx={{
                            fontSize: { xs: 22, sm: 26 },
                            fontWeight: 700,
                            letterSpacing: "-0.4px",
                            lineHeight: 1.25,
                            color: C.heading,
                        }}
                    >
                        {isEdit ? "Edit invoice" : "New invoice"}
                    </Typography>

                    <Typography sx={{ mt: 0.5, fontSize: 14, color: C.muted }}>
                        {isEdit
                            ? "Update the details, line items and documents for this invoice."
                            : "Add the billing details and line items, then save."}
                    </Typography>
                </Box>

                <Button
                    component={Link}
                    href={INVOICE_BASE}
                    startIcon={<ArrowBackIcon sx={{ fontSize: 18 }} />}
                    sx={{
                        ...btnBase,
                        minHeight: 36,
                        color: C.brand,
                        "&:hover": { bgcolor: C.brandSoft },
                    }}
                >
                    Back to invoices
                </Button>
            </Stack>

            <Paper
                variant="outlined"
                sx={{
                    p: { xs: 2, md: 3 },
                    borderRadius: "16px",
                    borderColor: C.line,
                    bgcolor: "#fff",
                    boxShadow: "0 1px 2px rgba(17,24,39,0.04)",
                }}
            >
                {error && (
                    <Alert
                        severity="error"
                        onClose={() => setError("")}
                        sx={{ mb: 3, borderRadius: "10px" }}
                    >
                        {error}
                    </Alert>
                )}

                {/* Billing */}
                <Section
                    first
                    title="Billing"
                    description="Who is being billed and where they should pay."
                >
                    <Stack spacing={2}>
                        <Field label="Billed to" required>
                            <SearchSelect
                                clearable
                                value={billedTo}
                                onChange={(value) => {
                                    setBilledTo(value);
                                    setError("");
                                }}
                                options={contactOptions}
                                placeholder={
                                    loadingData
                                        ? "Loading contacts..."
                                        : "Search for a contact or tenant"
                                }
                                disabled={loadingData}
                                error={!!error && !billedTo}
                            />
                        </Field>
                    </Stack>
                </Section>

                {/* Invoice details */}
                <Section title="Invoice details">
                    <Stack spacing={2}>
                        <Box sx={grid(3)}>
                            <Field label="Invoice date" required>
                                <TextField
                                    fullWidth
                                    type="date"
                                    value={invoiceDate}
                                    onChange={(event) => {
                                        setInvoiceDate(event.target.value);
                                        setError("");
                                    }}
                                    slotProps={{
                                        htmlInput: { max: dueDate || undefined },
                                    }}
                                    sx={inputSx}
                                />
                            </Field>

                            <Field label="Payment due date" required>
                                <TextField
                                    fullWidth
                                    type="date"
                                    value={dueDate}
                                    onChange={(event) => {
                                        setDueDate(event.target.value);
                                        setError("");
                                    }}
                                    slotProps={{
                                        htmlInput: { min: invoiceDate || undefined },
                                    }}
                                    error={!!error && (!dueDate || dueDate < invoiceDate)}
                                    sx={inputSx}
                                />
                            </Field>

                            <Field label="Reference number">
                                <TextField
                                    fullWidth
                                    placeholder="e.g. PO-2041"
                                    value={reference}
                                    onChange={(event) => setReference(event.target.value)}
                                    sx={inputSx}
                                />
                            </Field>
                        </Box>

                        <Box sx={grid(3)}>
                            <Field
                                label="Invoice number"
                                hint={
                                    editData?.invoiceNumber
                                        ? "Assigned automatically"
                                        : `Next number: INV-${sequence}`
                                }
                            >
                                <ReadOnlyBox color={C.brand}>
                                    {editData?.invoiceNumber ?? `INV-${sequence}`}
                                </ReadOnlyBox>
                            </Field>

                            <Field label="Sequence">
                                <ReadOnlyBox>{sequence}</ReadOnlyBox>
                            </Field>

                            <Field label="Status" required>
                                <SearchSelect
                                    value={status ? "true" : "false"}
                                    onChange={(value) => setStatus(value === "true")}
                                    options={STATUS_OPTIONS}
                                    placeholder="Select status"
                                    clearable={false}
                                    showSub={false}
                                />
                            </Field>
                        </Box>
                    </Stack>
                </Section>

                {/* Line items */}
                <Section
                    title="Line items"
                    description={`${items.length} ${items.length === 1 ? "item" : "items"} added`}
                    action={
                        <Button
                            variant="contained"
                            disableElevation
                            startIcon={<AddIcon sx={{ fontSize: 18 }} />}
                            disabled={!billedTo || saving}
                            onClick={() => openDrawer(null)}
                            sx={{
                                ...btnBase,
                                bgcolor: C.brand,
                                "&:hover": { bgcolor: C.brandHover },
                                "&.Mui-disabled": {
                                    bgcolor: "#d9d5fb",
                                    color: "#fff",
                                },
                            }}
                        >
                            Add line item
                        </Button>
                    }
                >
                    {!billedTo && (
                        <Alert severity="info" sx={{ mb: 2, borderRadius: "10px" }}>
                            Select who this invoice is billed to before adding line items.
                        </Alert>
                    )}

                    {items.length === 0 ? (
                        <Box
                            sx={{
                                py: 4,
                                px: 2,
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                gap: 0.75,
                                textAlign: "center",
                                border: `1px dashed ${C.border}`,
                                borderRadius: "12px",
                                bgcolor: C.surface,
                            }}
                        >
                            <ReceiptLongOutlinedIcon sx={{ fontSize: 28, color: C.faint }} />

                            <Typography sx={{ fontSize: 14, fontWeight: 600, color: C.ink }}>
                                No line items yet
                            </Typography>

                            <Typography sx={{ fontSize: 13.5, color: C.muted }}>
                                Add rent, deposits or charges to build this invoice.
                            </Typography>
                        </Box>
                    ) : (
                        <>
                            <TableContainer
                                sx={{
                                    border: `1px solid ${C.line}`,
                                    borderRadius: "12px",
                                    overflowX: "auto",
                                }}
                            >
                                <Table
                                    sx={{
                                        minWidth: 680,
                                        "& th": {
                                            py: 1.25,
                                            px: 2,
                                            bgcolor: C.surface,
                                            color: C.muted,
                                            fontSize: 13,
                                            fontWeight: 600,
                                            whiteSpace: "nowrap",
                                            borderBottom: `1px solid ${C.line}`,
                                        },
                                        "& td": {
                                            py: 1.5,
                                            px: 2,
                                            fontSize: 14,
                                            borderBottom: `1px solid ${C.line}`,
                                        },
                                        "& tbody tr:last-child td": { borderBottom: 0 },
                                        "& tbody tr:hover": { bgcolor: "#fafafa" },
                                    }}
                                >
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>Item</TableCell>
                                            <TableCell>Revenue account</TableCell>
                                            <TableCell align="right">Amount</TableCell>
                                            <TableCell align="right">GST</TableCell>
                                            <TableCell align="right">Total</TableCell>
                                            <TableCell align="right" sx={{ width: 96 }} />
                                        </TableRow>
                                    </TableHead>

                                    <TableBody>
                                        {items.map((item, index) => {
                                            const { tax, total } = calcLine(
                                                Number(item.amount) || 0,
                                                Number(item.taxRate) || 0
                                            );

                                            return (
                                                <TableRow key={item.id ?? item._id ?? index}>
                                                    <TableCell sx={{ fontWeight: 600, color: C.heading }}>
                                                        {item.item ||
                                                            propertyLabels.get(String(item.property)) ||
                                                            "—"}
                                                    </TableCell>

                                                    <TableCell sx={{ color: C.muted }}>
                                                        {accountLabels.get(String(item.chartOfAccount)) ||
                                                            item.chartOfAccount ||
                                                            "—"}
                                                    </TableCell>

                                                    <TableCell align="right">
                                                        {inr(Number(item.amount) || 0)}
                                                    </TableCell>

                                                    <TableCell align="right">{inr(tax)}</TableCell>

                                                    <TableCell align="right" sx={{ fontWeight: 650 }}>
                                                        {inr(total)}
                                                    </TableCell>

                                                    <TableCell align="right">
                                                        <Stack
                                                            direction="row"
                                                            spacing={0.75}
                                                            justifyContent="flex-end"
                                                        >
                                                            <Tooltip title="Edit">
                                                                <span>
                                                                    <IconButton
                                                                        aria-label="Edit line item"
                                                                        disabled={saving}
                                                                        onClick={() => openDrawer(item)}
                                                                        sx={{
                                                                            ...actionBtn,
                                                                            "&:hover": {
                                                                                color: C.brand,
                                                                                borderColor: C.brand,
                                                                                bgcolor: C.brandSoft,
                                                                            },
                                                                        }}
                                                                    >
                                                                        <EditOutlinedIcon sx={{ fontSize: 17 }} />
                                                                    </IconButton>
                                                                </span>
                                                            </Tooltip>

                                                            <Tooltip title="Remove">
                                                                <span>
                                                                    <IconButton
                                                                        aria-label="Delete line item"
                                                                        disabled={saving}
                                                                        onClick={() => removeItem(item)}
                                                                        sx={{
                                                                            ...actionBtn,
                                                                            "&:hover": {
                                                                                color: C.danger,
                                                                                borderColor: C.danger,
                                                                                bgcolor: "#fef2f2",
                                                                            },
                                                                        }}
                                                                    >
                                                                        <DeleteOutlineIcon sx={{ fontSize: 17 }} />
                                                                    </IconButton>
                                                                </span>
                                                            </Tooltip>
                                                        </Stack>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            </TableContainer>

                            {/* Totals */}
                            <Box sx={{ mt: 2, display: "flex", justifyContent: "flex-end" }}>
                                <Box
                                    sx={{
                                        width: { xs: "100%", sm: 320 },
                                        p: 2,
                                        borderRadius: "12px",
                                        bgcolor: C.surface,
                                        border: `1px solid ${C.line}`,
                                    }}
                                >
                                    {[
                                        ["Subtotal", totals.sub],
                                        ["Total GST", totals.tax],
                                    ].map(([label, amount]) => (
                                        <Stack
                                            key={label}
                                            direction="row"
                                            justifyContent="space-between"
                                            sx={{ mb: 1 }}
                                        >
                                            <Typography sx={{ fontSize: 14, color: C.muted }}>
                                                {label}
                                            </Typography>

                                            <Typography sx={{ fontSize: 14, fontWeight: 600 }}>
                                                {inr(amount)}
                                            </Typography>
                                        </Stack>
                                    ))}

                                    <Stack
                                        direction="row"
                                        justifyContent="space-between"
                                        alignItems="center"
                                        sx={{
                                            pt: 1.5,
                                            mt: 1.5,
                                            borderTop: `1px solid ${C.line}`,
                                        }}
                                    >
                                        <Typography
                                            sx={{ fontSize: 14, fontWeight: 650, color: C.heading }}
                                        >
                                            Grand total
                                        </Typography>

                                        <Typography
                                            sx={{ fontSize: 20, fontWeight: 700, color: C.brand }}
                                        >
                                            {inr(totals.total)}
                                        </Typography>
                                    </Stack>
                                </Box>
                            </Box>
                        </>
                    )}
                </Section>

                {/* Notes and documents */}
                <Section title="Notes and documents">
                    <Box sx={grid(2)}>
                        <Field label="Remarks">
                            <TextField
                                fullWidth
                                multiline
                                minRows={4}
                                maxRows={6}
                                placeholder="Add any notes for the tenant or your team"
                                value={remarks}
                                onChange={(event) => setRemarks(event.target.value)}
                                sx={{
                                    ...inputSx,
                                    "& .MuiOutlinedInput-root": {
                                        ...inputSx["& .MuiOutlinedInput-root"],
                                        alignItems: "flex-start",
                                        py: 1.25,
                                        px: 1.75,
                                    },
                                    "& .MuiInputBase-input": { p: 0 },
                                }}
                            />
                        </Field>

                        <Field label="Documents">
                            <Box
                                component="label"
                                sx={{
                                    minHeight: 112,
                                    px: 2,
                                    py: 2,
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    gap: 0.5,
                                    border: `1px dashed ${C.border}`,
                                    borderRadius: "10px",
                                    cursor: "pointer",
                                    bgcolor: C.surface,
                                    transition: "background-color .15s, border-color .15s",
                                    "&:hover": {
                                        bgcolor: C.brandSoft,
                                        borderColor: C.brand,
                                    },
                                    "&:focus-within": { borderColor: C.brand },
                                }}
                            >
                                <UploadFileOutlinedIcon sx={{ fontSize: 24, color: C.muted }} />

                                <Typography sx={{ fontSize: 14, fontWeight: 600, color: C.ink }}>
                                    {files.length
                                        ? `${files.length} ${files.length === 1 ? "new file" : "new files"} selected`
                                        : "Click to upload"}
                                </Typography>

                                <Typography sx={{ fontSize: 12.5, color: C.muted }}>
                                    Images, PDF or Word files up to {MAX_FILE_MB} MB each
                                </Typography>

                                <Box
                                    component="input"
                                    type="file"
                                    accept={ACCEPT}
                                    multiple
                                    hidden
                                    onChange={handleFiles}
                                />
                            </Box>

                            {(existingFiles.length > 0 || files.length > 0) && (
                                <Stack spacing={0.75} sx={{ mt: 1.25 }}>
                                    {existingFiles.map((file) => (
                                        <FileRow
                                            key={file._id}
                                            name={file.name}
                                            disabled={saving}
                                            onRemove={() => removeExistingFile(file)}
                                        />
                                    ))}

                                    {files.map((file, index) => (
                                        <FileRow
                                            key={`${file.name}-${file.size}-${index}`}
                                            name={file.name}
                                            disabled={saving}
                                            onRemove={() => removeFile(index)}
                                        />
                                    ))}
                                </Stack>
                            )}
                        </Field>
                    </Box>
                </Section>

                {/* Footer actions */}
                <Stack
                    direction={{ xs: "column-reverse", sm: "row" }}
                    justifyContent="space-between"
                    alignItems={{ xs: "stretch", sm: "center" }}
                    spacing={1.5}
                    sx={{
                        mt: 3,
                        pt: 2.5,
                        borderTop: `1px solid ${C.line}`,
                    }}
                >
                    {isEdit ? (
                        <Button
                            variant="text"
                            color="error"
                            startIcon={<DeleteOutlineIcon />}
                            disabled={busy}
                            onClick={handleDelete}
                            sx={btnBase}
                        >
                            Delete invoice
                        </Button>
                    ) : (
                        <Box />
                    )}

                    <Stack direction={{ xs: "column-reverse", sm: "row" }} spacing={1}>
                        <Button
                            variant="outlined"
                            disabled={saving}
                            onClick={() => router.push(INVOICE_BASE)}
                            sx={btnBase}
                        >
                            Cancel
                        </Button>

                        <Button
                            variant="contained"
                            disableElevation
                            disabled={busy}
                            onClick={submit}
                            sx={btnBase}
                        >
                            {saving ? "Saving..." : "Save"}
                        </Button>
                    </Stack>
                </Stack>
            </Paper>

            <LineItemDrawer
                open={drawerOpen}
                propertyOptions={propertyOptions}
                initial={editing}
                onClose={closeDrawer}
                onSave={saveItem}
            />
        </Box>
    );
}
