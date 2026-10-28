"use client";

import { useParams } from "next/navigation";

import Link from "next/link";

import {
    Box, Button, Divider, IconButton, Paper, Stack, Table, TableBody, TableCell, TableHead, TableRow, Typography,
} from "@mui/material";

import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import PrintOutlinedIcon from "@mui/icons-material/PrintOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import AccessTimeIcon from "@mui/icons-material/AccessTime";

import ApprovalWorkflow from "./ApprovalWorkFlow";

import { company, contacts } from "../data/page";

import { amountInWords, calcLine, calcTotals, ddmmyyyy, inr } from "../util/HelperFun";

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

export default function InvoicePreviewComponent({ invoice }) {

    const { lang } = useParams()

    const INVOICE_BASE = `/${lang}/apps/invoices`

    const t = calcTotals(invoice.items);
    const contact = contacts.find((c) => c.value === invoice.billedTo);
    const phone = contact?.sub?.startsWith("Mobile:") ? contact.sub.replace("Mobile: ", "") : "";

    const meta = [
        ["Invoice date", ddmmyyyy(invoice.invoiceDate)],
        ["Reference", `#${invoice.ref}`],
        ["Due date", ddmmyyyy(invoice.dueDate)],
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
                <Typography sx={{ fontSize: 18, fontWeight: 700 }}>Invoice #{invoice.ref}</Typography>
                <Typography sx={{ fontSize: 12, fontWeight: 700, px: 1, py: 0.25, borderRadius: 1, bgcolor: "action.selected" }}>
                    {invoice.status}
                </Typography>
            </Stack>

            {/* Sheet (left) + actions and approval (right) */}
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
                                {invoice.status}
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
                    <Typography sx={{ fontSize: 16, fontWeight: 700, mt: 0.5 }}>{invoice.billedToName}</Typography>
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
                                    <TableCell sx={th} align="right">GST (18%)</TableCell>
                                    <TableCell sx={th} align="right">Total</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {invoice.items.map((it) => {
                                    const l = calcLine(it.amount, it.taxRate);
                                    return (
                                        <TableRow key={it.id}>
                                            <TableCell sx={{ py: 1.5 }}>{it.item || it.property}</TableCell>
                                            <TableCell sx={{ color: "text.secondary" }}>{it.chartOfAccount}</TableCell>
                                            <TableCell align="right" sx={num}>{inr(it.amount)}</TableCell>
                                            <TableCell align="right" sx={num}>{inr(l.tax)}</TableCell>
                                            <TableCell align="right" sx={{ fontWeight: 600, ...num }}>{inr(l.total)}</TableCell>
                                        </TableRow>
                                    );
                                })}
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

                {/* Side column: actions + approval workflow */}
                <Stack spacing={2} sx={{ position: { lg: "sticky" }, top: { lg: 16 }, ...noPrint }}>
                    <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, borderColor: line }}>
                        <Stack spacing={1}>
                            <Button fullWidth variant="contained" startIcon={<AccessTimeIcon />}>
                                Submit for approval
                            </Button>
                            <Button fullWidth variant="outlined" component={Link} href={`${INVOICE_BASE}/create/${invoice.id}`}
                                startIcon={<EditOutlinedIcon />}>
                                Edit invoice
                            </Button>
                            <Button fullWidth variant="outlined" color="inherit" startIcon={<PrintOutlinedIcon />}
                                onClick={() => window.print()} sx={{ borderColor: "#d1d5db" }}>
                                Print
                            </Button>
                            <Button fullWidth variant="text" color="error" startIcon={<DeleteOutlineIcon />}>
                                Delete invoice
                            </Button>
                        </Stack>
                    </Paper>

                    <ApprovalWorkflow />
                </Stack>
            </Box>
        </Box>
    );
}
