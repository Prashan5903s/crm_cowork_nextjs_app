"use client";

import { useEffect, useMemo, useState } from "react";

import { useParams } from "next/navigation";

import Link from "next/link";

import {
    Box,
    Button,
    InputAdornment,
    LinearProgress,
    MenuItem,
    Paper,
    Select,
    Stack,
    TextField,
    ToggleButton,
    ToggleButtonGroup,
    IconButton,
    Table,
    TableBody,
    TableCell,
    TableHead,
    Skeleton,
    TableRow,
    Typography,
} from "@mui/material";

import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import PauseCircleOutlineIcon from "@mui/icons-material/PauseCircleOutline";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import FileUploadOutlinedIcon from "@mui/icons-material/FileUploadOutlined";
import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";
import AddIcon from "@mui/icons-material/Add";
import SearchIcon from "@mui/icons-material/Search";
import ViewListIcon from "@mui/icons-material/ViewList";
import GridViewIcon from "@mui/icons-material/GridView";
import ApartmentIcon from "@mui/icons-material/Apartment";
import LocalOfferOutlinedIcon from "@mui/icons-material/LocalOfferOutlined";
import LayersOutlinedIcon from "@mui/icons-material/LayersOutlined";
import PlaceOutlinedIcon from "@mui/icons-material/PlaceOutlined";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import InsertDriveFileOutlinedIcon from "@mui/icons-material/InsertDriveFileOutlined";
import PaidOutlinedIcon from "@mui/icons-material/PaidOutlined";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";

import {
    calcTotals,
    daysFromToday,
    inr,
    prettyDate,
    unwrapResponse,
} from "../util/HelperFun";

import { useApi } from "@/utils/api";

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

// status is a boolean: true = Active, false = Inactive.
// Older records may be missing it, so anything other than false is Active.
const isActive = (inv) => inv?.status !== false;

const statusLabel = (inv) => (isActive(inv) ? "Active" : "Inactive");

const STATUS_OPTIONS = [
    { value: "active", label: "Active" },
    { value: "inactive", label: "Inactive" },
];

const getTotal = (inv) =>
    Number(inv?.totals?.total ?? calcTotals(inv?.items ?? []).total) || 0;

const getPaid = (inv) => Number(inv?.amountPaid) || 0;

const getPaidPercent = (inv) => {
    const total = getTotal(inv);
    if (!total) return 0;
    return Math.min(100, Math.round((getPaid(inv) / total) * 100));
};

const isFullyPaid = (inv) => {
    const total = getTotal(inv);
    return total > 0 && getPaid(inv) >= total;
};

// Due or overdue: active, not fully paid, due date today or earlier.
const isDueOrOverdue = (inv) =>
    isActive(inv) && !isFullyPaid(inv) && daysFromToday(inv.dueDate) <= 0;

const buildStats = (list = []) => [
    {
        title: "Total Invoices",
        value: list.length,
        Icon: DescriptionOutlinedIcon,
        bg: "linear-gradient(135deg,#2563eb,#6366f1)",
        outline: "2px solid #1d4ed8",
    },
    {
        title: "Active",
        value: list.filter(isActive).length,
        Icon: CheckCircleOutlineIcon,
        bg: "linear-gradient(135deg,#10b981,#22c55e)",
    },
    {
        title: "Inactive",
        value: list.filter((i) => !isActive(i)).length,
        Icon: PauseCircleOutlineIcon,
        bg: "linear-gradient(135deg,#64748b,#475569)",
    },
    {
        title: "Due & Overdue",
        value: list.filter(isDueOrOverdue).length,
        Icon: WarningAmberRoundedIcon,
        bg: "linear-gradient(135deg,#f97316,#f59e0b)",
    },
    {
        title: "Paid",
        value: list.filter(isFullyPaid).length,
        Icon: AccessTimeIcon,
        bg: "linear-gradient(135deg,#8b5cf6,#a855f7)",
    },
];

const dueInfo = (inv) => {
    if (isFullyPaid(inv)) {
        return { text: "PAID IN FULL", color: "#059669" };
    }

    const d = daysFromToday(inv.dueDate);

    if (d > 0) return { text: `${d} DAYS REMAINING`, color: "#2563eb" };
    if (d === 0) return { text: "DUE TODAY", color: "#d97706" };
    return { text: `${Math.abs(d)} DAYS OVERDUE`, color: "#dc2626" };
};

/* ------------------------------------------------------------------ */
/* Pieces                                                              */
/* ------------------------------------------------------------------ */

// options: array of strings or { value, label }
const Filter = ({ label, value = "", onChange, options = [] }) => {
    const normalized = options.map((o) =>
        typeof o === "string" ? { value: o, label: o } : o
    );

    return (
        <Select
            size="small"
            displayEmpty
            value={value}
            onChange={(e) => onChange?.(e.target.value)}
            renderValue={(v) =>
                normalized.find((o) => o.value === v)?.label || label
            }
            sx={{
                minWidth: 130,
                borderRadius: 3,
                fontSize: 14,
                bgcolor: "#fff",
                "& fieldset": { borderColor: "#9ca3af" },
                "&.Mui-focused fieldset": { borderColor: "primary.main" },
            }}
        >
            <MenuItem value="">{label}</MenuItem>
            {normalized.map((o) => (
                <MenuItem key={o.value} value={o.value}>
                    {o.label}
                </MenuItem>
            ))}
        </Select>
    );
};

const InvoiceCard = ({ inv, INVOICE_BASE }) => {
    const total = getTotal(inv);
    const due = dueInfo(inv);
    const percent = getPaidPercent(inv);
    const active = isActive(inv);

    return (
        <Paper
            component={Link}
            href={`${INVOICE_BASE}/create/${inv._id}`}
            variant="outlined"
            sx={{
                display: "block",
                p: 2,
                borderRadius: 3,
                borderColor: "#6b7280",
                textDecoration: "none",
                color: "inherit",
                transition: "0.15s",
                "&:hover": { transform: "translateY(-2px)", boxShadow: 4 },
            }}
        >
            <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
            >
                <Typography
                    sx={{ fontSize: 12, fontWeight: 500, color: "primary.main" }}
                >
                    {inv.invoiceNumber || `INV-${inv.sequence}`} (Ref: #{inv.ref})
                </Typography>

                <Stack
                    direction="row"
                    spacing={0.5}
                    alignItems="center"
                    sx={{
                        bgcolor: active ? "#dcfce7" : "#f3f4f6",
                        color: active ? "#166534" : "#4b5563",
                        px: 1,
                        py: 0.5,
                        borderRadius: 1.5,
                        fontSize: 11,
                        fontWeight: 700,
                    }}
                >
                    <InsertDriveFileOutlinedIcon sx={{ fontSize: 12 }} />
                    <span>{statusLabel(inv)}</span>
                </Stack>
            </Stack>

            <Stack spacing={1.5} sx={{ mt: 2 }}>
                <Stack direction="row" spacing={1} alignItems="center">
                    <PersonOutlineIcon sx={{ fontSize: 16, color: "#6366f1" }} />
                    <Typography sx={{ fontWeight: 700, fontSize: 15 }}>
                        {inv.billedToName || "—"}
                    </Typography>
                </Stack>

                <Stack direction="row" spacing={1} alignItems="center">
                    <InsertDriveFileOutlinedIcon
                        sx={{ fontSize: 16, color: "#3b82f6" }}
                    />
                    <Typography variant="body2" color="text.secondary">
                        {inv.reference || "-"}
                    </Typography>
                </Stack>

                <Stack direction="row" spacing={1} alignItems="center">
                    <PaidOutlinedIcon sx={{ fontSize: 16, color: "#10b981" }} />
                    <Typography sx={{ fontWeight: 800, fontSize: 20 }}>
                        {inr(total)}
                    </Typography>
                </Stack>

                <Stack direction="row" spacing={1} alignItems="center">
                    <CalendarMonthOutlinedIcon
                        sx={{ fontSize: 16, color: "#f97316" }}
                    />
                    <Typography variant="body2">
                        {prettyDate(inv.dueDate)}
                    </Typography>
                </Stack>
            </Stack>

            <Box sx={{ mt: 2 }}>
                <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                    sx={{ fontSize: 10, fontWeight: 700 }}
                >
                    <Stack
                        direction="row"
                        spacing={0.5}
                        alignItems="center"
                        sx={{ color: due.color }}
                    >
                        <AccessTimeIcon sx={{ fontSize: 12 }} />
                        <span>{due.text}</span>
                    </Stack>
                    <span>{percent}%</span>
                </Stack>

                <LinearProgress
                    variant="determinate"
                    value={percent}
                    sx={{
                        mt: 0.5,
                        height: 6,
                        borderRadius: 3,
                        bgcolor: "#e5e7eb",
                        "& .MuiLinearProgress-bar": { bgcolor: "#10b981" },
                    }}
                />
            </Box>
        </Paper>
    );
};

const InvoiceSkeleton = ({ view = "grid" }) => {
    if (view === "list") {
        return (
            <Paper variant="outlined" sx={{ mt: 2, p: 2, borderRadius: 3 }}>
                {[1, 2, 3, 4, 5].map((item) => (
                    <Stack
                        key={item}
                        direction="row"
                        spacing={2}
                        alignItems="center"
                        sx={{ mb: 2 }}
                    >
                        <Skeleton variant="text" width="10%" />
                        <Skeleton variant="text" width="25%" />
                        <Skeleton variant="text" width="20%" />
                        <Skeleton variant="rounded" width="15%" height={24} />
                        <Skeleton variant="text" width="15%" />
                    </Stack>
                ))}
            </Paper>
        );
    }

    return (
        <Box
            sx={{
                display: "grid",
                gap: 2,
                mt: 2,
                gridTemplateColumns: {
                    xs: "1fr",
                    sm: "repeat(2, 1fr)",
                    lg: "repeat(3, 1fr)",
                    xl: "repeat(5, 1fr)",
                },
            }}
        >
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((item) => (
                <Paper key={item} variant="outlined" sx={{ p: 2, borderRadius: 3 }}>
                    <Skeleton variant="text" width="60%" height={24} />
                    <Skeleton variant="text" width="80%" />
                    <Skeleton variant="text" width="50%" />
                    <Skeleton variant="rounded" height={28} sx={{ mt: 2 }} />
                    <Skeleton variant="rounded" height={6} sx={{ mt: 2 }} />
                </Paper>
            ))}
        </Box>
    );
};

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

export default function InvoiceListComponent() {
    const { lang } = useParams();

    // No trailing slash: links are built as `${INVOICE_BASE}/${id}`.
    const INVOICE_BASE = `/${lang}/apps/invoices`;

    const { doGet, token } = useApi();

    const [q, setQ] = useState("");
    const [view, setView] = useState("grid");
    const [status, setStatus] = useState(""); // "", "active" or "inactive"
    const [loading, setLoading] = useState(true);
    const [invoiceData, setInvoiceData] = useState([]);

    useEffect(() => {
        if (!token) return;

        let active = true;

        const fetchInvoiceData = async () => {
            setLoading(true);

            try {
                const response = await doGet("company/invoice/get/data");
                const result = unwrapResponse(response);

                if (active) {
                    setInvoiceData(Array.isArray(result) ? result : []);
                }
            } catch (error) {
                console.error("Failed to fetch invoices:", error);
                if (active) setInvoiceData([]);
            } finally {
                if (active) setLoading(false);
            }
        };

        fetchInvoiceData();

        return () => {
            active = false;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token]);

    const filtered = useMemo(() => {
        const query = q.trim().toLowerCase();

        return invoiceData.filter((inv) => {
            const haystack =
                `ref ${inv.ref} #${inv.ref} ${inv.invoiceNumber ?? ""} ${inv.billedToName ?? ""}`.toLowerCase();

            const matchesSearch = !query || haystack.includes(query);

            const matchesStatus =
                !status ||
                (status === "active" ? isActive(inv) : !isActive(inv));

            return matchesSearch && matchesStatus;
        });
    }, [invoiceData, q, status]);

    const stats = useMemo(() => buildStats(invoiceData), [invoiceData]);

    return (
        <Box sx={{ p: 2.5 }}>
            {/* Header */}
            <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                flexWrap="wrap"
                useFlexGap
                spacing={1.5}
            >
                <Stack direction="row" spacing={1.5} alignItems="center">
                    <DescriptionOutlinedIcon
                        sx={{ fontSize: 30, color: "primary.main" }}
                    />
                    <Typography
                        variant="h4"
                        sx={{ fontWeight: 800, letterSpacing: -0.5 }}
                    >
                        Invoices
                    </Typography>
                </Stack>

                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                    <Button variant="outlined" startIcon={<FileUploadOutlinedIcon />}>
                        Import
                    </Button>
                    <Button variant="outlined" startIcon={<FileDownloadOutlinedIcon />}>
                        Export Summary
                    </Button>
                    <Button variant="outlined" startIcon={<FileDownloadOutlinedIcon />}>
                        Export Details
                    </Button>
                    <Button
                        variant="contained"
                        component={Link}
                        href={`${INVOICE_BASE}/create`}
                        startIcon={<AddIcon />}
                    >
                        Create Invoice
                    </Button>
                </Stack>
            </Stack>

            {/* Stat cards */}
            <Box
                sx={{
                    display: "grid",
                    gap: 2,
                    mt: 2.5,
                    gridTemplateColumns: { xs: "1fr 1fr", lg: "repeat(5, 1fr)" },
                }}
            >
                {stats.map(({ title, value, Icon, bg, outline }) => (
                    <Box
                        key={title}
                        sx={{
                            position: "relative",
                            height: 88,
                            p: 1.75,
                            borderRadius: 3,
                            color: "white",
                            background: bg,
                            outline,
                            outlineOffset: outline ? 1 : 0,
                            boxShadow: 2,
                        }}
                    >
                        <Typography
                            sx={{ fontSize: 14, fontWeight: 700, color: "white" }}
                        >
                            {title}
                        </Typography>
                        <Typography
                            sx={{
                                fontSize: 38,
                                fontWeight: 800,
                                lineHeight: 1.1,
                                mt: 0.5,
                                color: "white",
                            }}
                        >
                            {value}
                        </Typography>
                        <Icon
                            sx={{ position: "absolute", right: 16, bottom: 12, fontSize: 38 }}
                        />
                    </Box>
                ))}
            </Box>

            {/* Toolbar */}
            <Stack
                direction="row"
                spacing={1}
                alignItems="center"
                flexWrap="wrap"
                useFlexGap
                sx={{ mt: 2.5 }}
            >
                <ToggleButtonGroup
                    exclusive
                    size="small"
                    value={view}
                    onChange={(_, v) => v && setView(v)}
                    sx={{
                        bgcolor: "#f3f4f6",
                        p: 0.5,
                        borderRadius: 3,
                        "& .MuiToggleButton-root": {
                            border: 0,
                            borderRadius: "10px !important",
                        },
                        "& .Mui-selected": { bgcolor: "#fed7aa !important" },
                    }}
                >
                    <ToggleButton value="list" aria-label="List view">
                        <ViewListIcon fontSize="small" />
                    </ToggleButton>
                    <ToggleButton value="grid" aria-label="Grid view">
                        <GridViewIcon fontSize="small" />
                    </ToggleButton>
                </ToggleButtonGroup>

                <Stack direction="row" sx={{ bgcolor: "#f3f4f6", p: 0.5, borderRadius: 3 }}>
                    {[ApartmentIcon, LocalOfferOutlinedIcon, LayersOutlinedIcon, PlaceOutlinedIcon].map(
                        (I, i) => (
                            <IconButton key={i} size="small" sx={{ borderRadius: 2.5 }}>
                                <I fontSize="small" />
                            </IconButton>
                        )
                    )}
                </Stack>

                <TextField
                    size="small"
                    placeholder="Search by Invoice"
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    slotProps={{
                        input: {
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon fontSize="small" />
                                </InputAdornment>
                            ),
                        },
                    }}
                    sx={{
                        width: 210,
                        "& .MuiOutlinedInput-root": {
                            borderRadius: 3,
                            fontSize: 14,
                            "& fieldset": { borderColor: "#9ca3af" },
                        },
                    }}
                />

                <Filter label="All Groups" />
                <Filter label="All Types" />
                <Filter label="All Categories" />
                <Filter label="All Cities" />
                <Filter
                    label="All Status"
                    value={status}
                    onChange={setStatus}
                    options={STATUS_OPTIONS}
                />
                <Filter label="All Tenants" />
                <Filter label="All Time" />
            </Stack>

            <Typography variant="body2" sx={{ mt: 2.5 }}>
                Showing <b>{filtered.length}</b> of <b>{invoiceData.length}</b> invoices found
            </Typography>

            {/* Loading / Empty / Grid / List */}
            {loading ? (
                <InvoiceSkeleton view={view} />
            ) : filtered.length === 0 ? (
                <Paper
                    variant="outlined"
                    sx={{ mt: 3, p: 6, borderRadius: 3, textAlign: "center" }}
                >
                    <DescriptionOutlinedIcon
                        sx={{ fontSize: 48, color: "text.disabled", mb: 1 }}
                    />

                    <Typography variant="h6" fontWeight={700}>
                        No data found
                    </Typography>

                    <Typography variant="body2" color="text.secondary">
                        {invoiceData.length === 0
                            ? "No invoices are available yet."
                            : "No invoices match your search or selected filters."}
                    </Typography>
                </Paper>
            ) : view === "grid" ? (
                <Box
                    sx={{
                        display: "grid",
                        gap: 2,
                        mt: 2,
                        gridTemplateColumns: {
                            xs: "1fr",
                            sm: "repeat(2, 1fr)",
                            lg: "repeat(3, 1fr)",
                            xl: "repeat(5, 1fr)",
                        },
                    }}
                >
                    {filtered.map((inv) => (
                        <InvoiceCard key={inv._id} inv={inv} INVOICE_BASE={INVOICE_BASE} />
                    ))}
                </Box>
            ) : (
                <Paper variant="outlined" sx={{ mt: 2, borderRadius: 3, overflow: "hidden" }}>
                    <Table size="small">
                        <TableHead>
                            <TableRow
                                sx={{
                                    bgcolor: "#f9fafb",
                                    "& th": { fontWeight: 700, fontSize: 12 },
                                }}
                            >
                                <TableCell>Ref</TableCell>
                                <TableCell>Billed To</TableCell>
                                <TableCell>Due Date</TableCell>
                                <TableCell>Status</TableCell>
                                <TableCell align="right">Amount</TableCell>
                            </TableRow>
                        </TableHead>

                        <TableBody>
                            {filtered.map((inv) => (
                                <TableRow key={inv._id} hover>
                                    <TableCell>
                                        <Link
                                            href={`${INVOICE_BASE}/create/${inv._id}`}
                                            style={{
                                                color: "#c2570c",
                                                fontWeight: 600,
                                                textDecoration: "none",
                                            }}
                                        >
                                            #{inv.ref}
                                        </Link>
                                    </TableCell>

                                    <TableCell>{inv.billedToName}</TableCell>
                                    <TableCell>{prettyDate(inv.dueDate)}</TableCell>
                                    <TableCell>{statusLabel(inv)}</TableCell>

                                    <TableCell align="right" sx={{ fontWeight: 700 }}>
                                        {inr(getTotal(inv))}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </Paper>
            )}
        </Box>
    );
}
