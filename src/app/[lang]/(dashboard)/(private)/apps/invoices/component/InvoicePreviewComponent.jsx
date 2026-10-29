"use client";

import { useState, useEffect } from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";

import {
    Box,
    Button,
    Divider,
    IconButton,
    Paper,
    Stack,
    Skeleton,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    Typography,
} from "@mui/material";

import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import PrintOutlinedIcon from "@mui/icons-material/PrintOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";

import { company, contacts } from "../data/page";

import { amountInWords, calcLine, calcTotals, inr } from "../util/HelperFun";

import { useApi } from "@/utils/api";


const noPrint = { "@media print": { display: "none" } };
const line = "#e5e7eb";
const num = { fontVariantNumeric: "tabular-nums" };

// First/last table cells have no outer padding so the table lines up with the dividers and text around it
const edgePadding = {
    "& th:first-of-type, & td:first-of-type": { pl: 0 },
    "& th:last-of-type, & td:last-of-type": { pr: 0 },
};

const th = {
    fontSize: 12, fontWeight: 600, color: "text.secondary",
    borderBottom: `1px solid ${line}`, py: 1.25, whiteSpace: "nowrap",
};

// Dates arrive as ISO strings ("2026-10-28T00:00:00.000Z"). Format as DD/MM/YYYY.
// UTC fields are used so a date stored at midnight UTC never shifts by timezone.
const formatDate = (value) => {
    if (!value) return "-";

    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "-";

    const dd = String(d.getUTCDate()).padStart(2, "0");
    const mm = String(d.getUTCMonth() + 1).padStart(2, "0");

    return `${dd}/${mm}/${d.getUTCFullYear()}`;
};

// status is a boolean: true = Active, false = Inactive.
// Older records may be missing it, so anything other than false is Active.
const isActive = (inv) => inv?.status !== false;
const statusLabel = (inv) => (isActive(inv) ? "Active" : "Inactive");

export default function InvoicePreviewComponent({ id, lang }) {

    const INVOICE_BASE = `/${lang}/apps/invoices`;

    const router = useRouter();
    // NOTE: assumes useApi exposes doDelete. Adjust the name if yours differs.
    const { doGet, doDelete, token } = useApi();

    const [editData, setEditData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        if (!token || !id) return;

        let active = true;

        const fetchEditData = async () => {
            setLoading(true);
            setError("");

            try {
                const response = await doGet(`company/invoice/edit/data/${id}`);
                const result = response?.data ?? response;

                if (active) setEditData(result || null);
            } catch (err) {
                console.error("Failed to fetch invoice:", err);
                if (active) {
                    setEditData(null);
                    setError("Could not load this invoice.");
                }
            } finally {
                if (active) setLoading(false);
            }
        };

        fetchEditData();

        return () => {
            active = false;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token, id]);

    const handleDelete = async () => {
        if (!window.confirm("Delete this invoice? This cannot be undone.")) return;

        setDeleting(true);

        try {
            // NOTE: assumed endpoint. Match it to your InvoiceAPIController route.
            await doDelete(`company/invoice/delete/${id}`);
            router.push(INVOICE_BASE);
        } catch (err) {
            console.error("Failed to delete invoice:", err);
            setError("Could not delete this invoice.");
            setDeleting(false);
        }
    };

    if (loading) {
        return (
            <Box sx={{ width: "100%", maxWidth: 1600, mx: "auto", p: { xs: 1.5, md: 3 } }}>
                <Skeleton variant="text" width={200} height={32} />
                <Skeleton variant="rounded" height={520} sx={{ mt: 2, borderRadius: 2 }} />
            </Box>
        );
    }

    if (!editData) {
        return (
            <Box sx={{ width: "100%", maxWidth: 1600, mx: "auto", p: { xs: 1.5, md: 3 } }}>
                <Button component={Link} href={INVOICE_BASE} startIcon={<ArrowBackIcon />}>
                    Back to invoices
                </Button>
                <Typography sx={{ mt: 2 }} color="text.secondary">
                    {error || "Invoice not found."}
                </Typography>
            </Box>
        );
    }

    const items = Array.isArray(editData.items) ? editData.items : [];
    const t = editData.totals?.total != null ? editData.totals : calcTotals(items);
    const contact = contacts.find((c) => c.value === editData.billedTo);
    const phone = contact?.sub?.startsWith("Mobile:") ? contact.sub.replace("Mobile: ", "") : "";
    const invoiceId = editData._id ?? id;

    const meta = [
        ["Invoice date", formatDate(editData.invoiceDate)],
        ["Reference", `#${editData.ref}`],
        ["Due date", formatDate(editData.dueDate)],
    ];

    return (
        <Box
            sx={{
                width: "100%",
                maxWidth: 1600,
                mx: "auto",
                p: { xs: 1.5, md: 3 },
                "@media print": { maxWidth: "none", p: 0 }
            }}
        >

            {/* Page header */}
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2, ...noPrint }}>
                <IconButton component={Link} href={INVOICE_BASE} aria-label="Back to invoices" size="small">
                    <ArrowBackIcon fontSize="small" />
                </IconButton>
                <Typography sx={{ fontSize: 18, fontWeight: 700 }}>Invoice #{editData.ref}</Typography>
                <Typography sx={{ fontSize: 12, fontWeight: 700, px: 1, py: 0.25, borderRadius: 1, bgcolor: "action.selected" }}>
                    {statusLabel(editData)}
                </Typography>
            </Stack>

            {error && (
                <Typography color="error" sx={{ mb: 2, fontSize: 13, ...noPrint }}>
                    {error}
                </Typography>
            )}

            {/* Sheet (left) + actions (right) */}
            <Box
                sx={{
                    display: "grid", gap: 3, alignItems: "start",
                    gridTemplateColumns: { xs: "minmax(0, 1fr)", lg: "minmax(0, 1fr) 340px" },
                    "@media print": { display: "block" },
                }}
            >
                {/* Invoice sheet */}
                <Paper
                    variant="outlined"
                    sx={{ p: { xs: 2.5, md: 4 }, borderRadius: 2, borderColor: line, "@media print": { border: 0, p: 0 } }}
                >
                    <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" spacing={3}>
                        <Box sx={{ maxWidth: 380 }}>
                            <Typography sx={{ fontSize: 40, fontWeight: 900, letterSpacing: -1, color: "#1e1b4b", lineHeight: 1, mb: 2 }}>
                                <Box component="span" sx={{ color: "primary.main" }}>✓</Box>DW
                            </Typography>
                            <Typography sx={{ fontSize: 14, fontWeight: 700 }}>{company.name}</Typography>
                            <Typography sx={{ fontSize: 12, color: "text.secondary", lineHeight: 1.6, mt: 0.5 }}>
                                {company.address}
                            </Typography>
                            <Typography sx={{ fontSize: 12, color: "text.secondary", mt: 0.5 }}>{company.email}</Typography>
                        </Box>

                        <Box sx={{ width: { xs: "100%", sm: 280 }, flexShrink: 0 }}>
                            <Typography sx={{ fontSize: 12, fontWeight: 600, color: "text.secondary", textAlign: { sm: "right" } }}>
                                Tax invoice
                            </Typography>
                            <Typography sx={{ fontSize: 24, fontWeight: 800, lineHeight: 1.2, mb: 2, textAlign: { sm: "right" } }}>
                                {editData.invoiceNumber || `INV-${editData.sequence ?? editData.ref}`}
                            </Typography>
                            <Box sx={{ borderTop: `1px solid ${line}`, pt: 1.5 }}>
                                {meta.map(([k, v]) => (
                                    <Stack key={k} direction="row" justifyContent="space-between" sx={{ py: 0.4, fontSize: 12 }}>
                                        <Box sx={{ color: "text.secondary" }}>{k}</Box>
                                        <Box sx={{ fontWeight: 600 }}>{v}</Box>
                                    </Stack>
                                ))}
                            </Box>
                        </Box>
                    </Stack>

                    <Divider sx={{ my: 3, borderColor: line }} />

                    <Typography sx={{ fontSize: 12, fontWeight: 600, color: "text.secondary" }}>Billed to</Typography>
                    <Typography sx={{ fontSize: 16, fontWeight: 700, mt: 0.5 }}>{editData.billedToName}</Typography>
                    {phone && <Typography sx={{ fontSize: 13, color: "text.secondary" }}>{phone}</Typography>}

                    <Divider sx={{ my: 3, borderColor: line }} />

                    <Box sx={{ overflowX: "auto" }}>
                        <Table size="small" sx={{ minWidth: 560, tableLayout: "fixed", ...edgePadding, "& td": { borderBottom: 0, fontSize: 13 } }}>
                            <colgroup>
                                <col style={{ width: "30%" }} />
                                <col style={{ width: "22%" }} />
                                <col style={{ width: "16%" }} />
                                <col style={{ width: "16%" }} />
                                <col style={{ width: "16%" }} />
                            </colgroup>
                            <TableHead>
                                <TableRow>
                                    <TableCell sx={th}>Description</TableCell>
                                    <TableCell sx={th}>Chart of account</TableCell>
                                    <TableCell sx={th} align="right">Amount</TableCell>
                                    <TableCell sx={th} align="right">GST</TableCell>
                                    <TableCell sx={th} align="right">Total</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {items.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} align="center" sx={{ py: 3, color: "text.secondary" }}>
                                            No line items
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    items.map((it, idx) => {
                                        const l = calcLine(it.amount, it.taxRate);
                                        return (
                                            <TableRow key={it._id ?? it.id ?? idx}>
                                                <TableCell sx={{ py: 1.5 }}>{it.item || it.property}</TableCell>
                                                <TableCell sx={{ color: "text.secondary" }}>{it.chartOfAccount}</TableCell>
                                                <TableCell align="right" sx={num}>{inr(it.amount)}</TableCell>
                                                <TableCell align="right" sx={num}>{inr(l.tax)}</TableCell>
                                                <TableCell align="right" sx={{ fontWeight: 600, ...num }}>{inr(l.total)}</TableCell>
                                            </TableRow>
                                        );
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </Box>

                    <Divider sx={{ my: 3, borderColor: line }} />

                    {/* Words on the left, totals on the right (no separate total row in the table, so nothing repeats) */}
                    <Stack
                        direction={{ xs: "column", sm: "row" }} justifyContent="space-between"
                        alignItems={{ xs: "flex-start", sm: "flex-end" }} spacing={3}
                    >
                        <Box sx={{ maxWidth: 380 }}>
                            <Typography sx={{ fontSize: 12, fontWeight: 600, color: "text.secondary" }}>Amount in words</Typography>
                            <Typography sx={{ fontSize: 13, fontStyle: "italic", mt: 0.5 }}>{amountInWords(t.total)}</Typography>
                        </Box>

                        <Box sx={{ width: { xs: "100%", sm: 300 } }}>
                            <Stack direction="row" justifyContent="space-between" sx={{ fontSize: 13, color: "text.secondary" }}>
                                <span>Subtotal</span>
                                <Box component="span" sx={{ color: "text.primary", fontWeight: 600, ...num }}>₹ {inr(t.sub)}</Box>
                            </Stack>
                            <Stack direction="row" justifyContent="space-between" sx={{ fontSize: 13, color: "text.secondary", mt: 0.75 }}>
                                <span>GST</span>
                                <Box component="span" sx={{ color: "text.primary", fontWeight: 600, ...num }}>₹ {inr(t.tax)}</Box>
                            </Stack>
                            <Divider sx={{ my: 1.5, borderColor: line }} />
                            <Stack direction="row" justifyContent="space-between" alignItems="baseline">
                                <Typography sx={{ fontSize: 14, fontWeight: 700 }}>Total</Typography>
                                <Typography sx={{ fontSize: 26, fontWeight: 800, ...num }}>₹ {inr(t.total)}</Typography>
                            </Stack>
                        </Box>
                    </Stack>

                    <Divider sx={{ mt: 3, mb: 1.5, borderColor: line }} />
                    <Typography sx={{ fontSize: 11, color: "text.secondary", textAlign: "center" }}>
                        This is a computer-generated invoice. For any queries, please contact support.
                    </Typography>
                </Paper>

                {/* Side column: actions */}
                <Stack spacing={2} sx={{ position: { lg: "sticky" }, top: { lg: 16 }, ...noPrint }}>
                    <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, borderColor: line }}>
                        <Stack spacing={1}>
                            <Button fullWidth variant="contained" component={Link} href={`${INVOICE_BASE}/create/${invoiceId}`}
                                startIcon={<EditOutlinedIcon />}>
                                Edit invoice
                            </Button>
                            <Button fullWidth variant="outlined" color="inherit" startIcon={<PrintOutlinedIcon />}
                                onClick={() => window.print()} sx={{ borderColor: "#d1d5db" }}>
                                Print
                            </Button>
                            <Button fullWidth variant="text" color="error" startIcon={<DeleteOutlineIcon />}
                                onClick={handleDelete} disabled={deleting}>
                                {deleting ? "Deleting..." : "Delete invoice"}
                            </Button>
                        </Stack>
                    </Paper>
                </Stack>
            </Box>
        </Box>
    );
}
