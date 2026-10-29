"use client";
import { useEffect, useMemo, useState } from "react";

import { useParams, useRouter } from "next/navigation";

import {
    Box, Button, Card, CardContent, MenuItem, Select, Stack, Table, TableBody,
    TableCell, TableHead, TableRow, TextField, ToggleButton, ToggleButtonGroup,
    Typography, InputAdornment,
} from "@mui/material";

import ViewListIcon from "@mui/icons-material/ViewList";
import GridViewIcon from "@mui/icons-material/GridView";
import SearchIcon from "@mui/icons-material/Search";
import UploadIcon from "@mui/icons-material/FileUploadOutlined";
import DownloadIcon from "@mui/icons-material/FileDownloadOutlined";

import DescriptionIcon from "@mui/icons-material/Description";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import CreditCardIcon from "@mui/icons-material/CreditCard";
import MonetizationOnIcon from "@mui/icons-material/MonetizationOn";

import { useApi } from "@/utils/api";

const TIME_FILTERS = [
    { value: "all", label: "All Time" },
    { value: "today", label: "Today" },
    { value: "week", label: "This Week" },
    { value: "month", label: "This Month" },
    { value: "year", label: "This Year" },
];

const inRange = (dateStr, filter) => {
    if (filter === "all") return true;
    const d = new Date(dateStr);
    const now = new Date();
    if (filter === "today") return d.toDateString() === now.toDateString();
    if (filter === "week") {
        const start = new Date(now);
        start.setDate(now.getDate() - now.getDay());
        start.setHours(0, 0, 0, 0);
        return d >= start;
    }
    if (filter === "month")
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    if (filter === "year") return d.getFullYear() === now.getFullYear();
    return true;
};

const fmtDate = (s) =>
    new Date(s).toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });
const fmtDay = (s) =>
    new Date(s).toLocaleDateString("en-US", { weekday: "short" }).toUpperCase();
const fmtMoney = (n) => `₹ ${Number(n).toLocaleString("en-IN")}`;

const StatCard = ({ label, value, icon, gradient }) => (
    <Box
        sx={{
            flex: 1, p: 1.5, borderRadius: 3, color: "#fff", background: gradient,
            display: "flex", justifyContent: "space-between", minHeight: 96,
            boxShadow: "0 4px 14px rgba(0,0,0,0.15)",
        }}
    >
        <Box>
            <Typography variant="subtitle2" color="white" fontWeight={700}>{label}</Typography>
            <Typography variant="h3" color="white" fontWeight={700} sx={{ mt: 0.5 }}>{value}</Typography>
        </Box>
        <Box sx={{ alignSelf: "flex-end", "& svg": { fontSize: 40 } }}>{icon}</Box>
    </Box>
);

const PaymentListPage = () => {

    const router = useRouter();

    const { lang } = useParams()

    const { doGet, token } = useApi()

    const [view, setView] = useState("grid");
    const [search, setSearch] = useState("");
    const [timeFilter, setTimeFilter] = useState("all");
    const [payment, setPayment] = useState();

    const fetchPaymentData = async () => {
        try {

            if (!token) return;

            const response = await doGet("company/payment/get/data")
            const result = response?.data ?? response;

            setPayment(result);

        } catch (error) {
            throw new Error(error)
        }
    }

    useEffect(() => {

        if (!token) return;

        fetchPaymentData()

    }, [token])

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();

        return (Array.isArray(payment) ? payment : []).filter((p) => {
            const tenantName = p.contract_id?.tenant?.full_name ?? "";
            const method = p.payment_method ?? "";
            const receiptNo = String(p.receipt_no ?? "");

            return (
                inRange(p.payment_date, timeFilter) &&
                (
                    !q ||
                    tenantName.toLowerCase().includes(q) ||
                    method.toLowerCase().includes(q) ||
                    receiptNo.toLowerCase().includes(q)
                )
            );
        });
    }, [payment, search, timeFilter]);

    const totalAmount = filtered.reduce(
        (sum, p) => sum + Number(p.total_payment_amount || 0),
        0
    );
    const openView = (id) => router.push(`/${lang}/apps/payment/view/${id}`);

    if (!payment) {

        return (
            <>
                ....Loading
            </>
        )
    }

    return (
        <Box sx={{ p: 2.5 }}>
            {/* Header */}
            <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={1.5}>
                <Stack direction="row" alignItems="center" gap={1.5}>
                    <CreditCardIcon sx={{ color: "primary.main", fontSize: 32 }} />
                    <Typography variant="h4" fontWeight={700}>Payment</Typography>
                </Stack>
                <Stack direction="row" gap={1.5} flexWrap="wrap">
                    <Button variant="outlined" color="inherit" startIcon={<UploadIcon />} sx={{ textTransform: "none" }}>
                        Import
                    </Button>
                    <Button variant="outlined" color="inherit" startIcon={<DownloadIcon />} sx={{ textTransform: "none" }}>
                        Export
                    </Button>
                    <Button
                        variant="contained" onClick={() => router.push(`/${lang}/apps/payment/create`)}
                    >
                        + Create Payment
                    </Button>
                </Stack>
            </Stack>

            {/* Stats */}
            <Stack direction={{ xs: "column", md: "row" }} gap={2} sx={{ mt: 2.5 }}>
                <StatCard
                    label="Total payment" value={filtered?.length} icon={<DescriptionIcon fontSize="inherit" />}
                    gradient="linear-gradient(90deg,#3b63ec 0%,#6366f1 50%,#8b3fe8 100%)"
                />
                <StatCard
                    label="Total Amount" value={fmtMoney(totalAmount)} icon={<MonetizationOnIcon fontSize="inherit" />}
                    gradient="linear-gradient(90deg,#16a34a 0%,#10b981 60%,#0d9488 100%)"
                />
            </Stack>

            {/* Toolbar */}
            <Stack direction="row" alignItems="center" gap={1.5} flexWrap="wrap" sx={{ mt: 3 }}>
                <ToggleButtonGroup
                    exclusive size="small" value={view}
                    onChange={(_, v) => v && setView(v)}
                    sx={{
                        bgcolor: "#f5f5f5", p: 0.5, gap: 0.5,
                        "& .MuiToggleButton-root": { border: 0, borderRadius: "8px !important" },
                        "& .Mui-selected": { bgcolor: "#f6d9c4 !important" },
                    }}
                >
                    <ToggleButton value="list"><ViewListIcon /></ToggleButton>
                    <ToggleButton value="grid"><GridViewIcon /></ToggleButton>
                </ToggleButtonGroup>

                <TextField
                    size="small" placeholder="Search by Receive Payment" value={search}
                    onChange={(e) => setSearch(e.target.value)} sx={{ minWidth: 240 }}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment>
                        ),
                        sx: { borderRadius: 2 },
                    }}
                />
                <Select
                    size="small" value={timeFilter} onChange={(e) => setTimeFilter(e.target.value)}
                    sx={{ minWidth: 150, borderRadius: 2 }}
                >
                    {TIME_FILTERS.map((t) => (
                        <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>
                    ))}
                </Select>
            </Stack>

            <Typography variant="body2" sx={{ mt: 2.5, mb: 2 }}>
                Showing <b>{filtered?.length}</b> of <b>{payment?.length}</b> payment found
            </Typography>

            {filtered?.length === 0 ? (
                <Typography color="text.secondary" sx={{ mt: 4, textAlign: "center" }}>
                    No payment found
                </Typography>
            ) : view === "grid" ? (
                <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))" }}>
                    {filtered?.map((p) => (
                        <Card
                            key={p._id} variant="outlined" onClick={() => openView(p._id)}
                            sx={{
                                cursor: "pointer", borderWidth: 2, borderColor: "#444", borderRadius: 3,
                                "&:hover": { boxShadow: 4 },
                            }}
                        >
                            <CardContent>
                                <Stack direction="row" justifyContent="space-between">
                                    <Box>
                                        <Typography variant="body2">{fmtDate(p.payment_date)}</Typography>
                                        <Typography variant="caption" color="text.secondary">{fmtDay(p.payment_date)}</Typography>
                                    </Box>
                                    <Typography variant="body2" sx={{ color: "#2563eb" }}>#{p.receipt_no}</Typography>
                                </Stack>
                                <Stack gap={1.25} sx={{ mt: 1.5 }}>
                                    <Stack direction="row" gap={1} alignItems="center">
                                        <PersonOutlineIcon fontSize="small" sx={{ color: "#4f46e5" }} />
                                        <Typography variant="body2">{p?.contract_id?.tenant?.full_name}</Typography>
                                    </Stack>
                                    <Stack direction="row" gap={1} alignItems="center">
                                        <CreditCardIcon fontSize="small" sx={{ color: "#2563eb" }} />
                                        <Typography variant="body2">{p.payment_method}</Typography>
                                    </Stack>
                                    <Stack direction="row" gap={1} alignItems="center">
                                        <MonetizationOnIcon fontSize="small" sx={{ color: "#10b981" }} />
                                        <Typography variant="body2">{fmtMoney(p.total_payment_amount)}</Typography>
                                    </Stack>
                                </Stack>
                            </CardContent>
                        </Card>
                    ))}
                </Box>
            ) : (
                <Card variant="outlined" sx={{ borderRadius: 3, overflowX: "auto" }}>
                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell>#</TableCell>
                                <TableCell>Date</TableCell>
                                <TableCell>Payee</TableCell>
                                <TableCell>Method</TableCell>
                                <TableCell align="right">Amount</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filtered?.map((p) => (
                                <TableRow
                                    key={p._id}
                                    hover
                                    sx={{ cursor: "pointer" }}
                                    onClick={() => openView(p._id)}
                                >
                                    <TableCell>{p.receipt_no}</TableCell>
                                    <TableCell>{fmtDate(p.payment_date)}</TableCell>
                                    <TableCell>{p.contract_id?.tenant?.full_name}</TableCell>
                                    <TableCell>{p.payment_method}</TableCell>
                                    <TableCell align="right">{fmtMoney(p.total_payment_amount)}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </Card>
            )}
        </Box>
    );
};

export default PaymentListPage;
