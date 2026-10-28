"use client";

import { useEffect, useMemo, useState } from "react";

import { useRouter } from "next/navigation";

import {
    Box,
    Button,
    Card,
    CardActionArea,
    Chip,
    LinearProgress,
    ListItemText,
    Menu,
    MenuItem,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    TextField,
    ToggleButton,
    ToggleButtonGroup,
    Typography,
} from "@mui/material";

import {
    ChevronDown,
    Download,
    FileText,
    Home,
    LayoutGrid,
    List,
    ScanLine,
    Upload,
    User,
    IndianRupee,
    Calendar,
    Plus,
} from "lucide-react";

import { fmtShort, inr, } from "./component/ContractStore";

import { useApi } from "@/utils/api";

const BASE = "/en/apps/contract";

const CREATE_OPTIONS = [
    { key: "org-tenant", title: "Organization → Tenant", desc: "Your organization leases space to a tenant" },
    { key: "owner-org", title: "Property owner → Organization", desc: "Head lease: you lease the building from its owner; rent is billed to you" },
    { key: "owner-tenant", title: "Property owner → Tenant", desc: "The owner leases to a tenant; you invoice the tenant and pay the owner their share" },
];
const TABS = [["all", "All"], ["org-tenant", "Organization → Tenant"], ["owner-org", "Owner → Organization"], ["owner-tenant", "Owner → Tenant"]];

const STATS = [
    { label: "Total Contracts", match: () => true, grad: "linear-gradient(to right,#2563eb,#3b82f6)" },
    { label: "Draft", match: (c) => c.status === "Draft", grad: "linear-gradient(to right,#475569,#64748b)" },
    { label: "Pending & Progress", match: (c) => c.status === "Pending", grad: "linear-gradient(to right,#f59e0b,#f97316)" },
    { label: "Active Contracts", match: (c) => c.status === "Active", grad: "linear-gradient(to right,#10b981,#059669)" },
    { label: "Closed Contracts", match: (c) => c.status === "Closed", grad: "linear-gradient(to right,#ef4444,#f43f5e)" },
];

const progress = (c) => {
    if (!c.start || !c.end) return { pct: 0, days: null };
    const now = Date.now(), s = new Date(c.start).getTime(), e = new Date(c.end).getTime();
    return { pct: Math.min(100, Math.max(0, Math.round(((now - s) / (e - s)) * 100))), days: Math.max(0, Math.ceil((e - now) / 864e5)) };
};

function CreateMenu({ onPick }) {
    const [anchor, setAnchor] = useState(null);
    return (
        <>
            <Button variant="contained" startIcon={<Plus size={14} />} endIcon={<ChevronDown size={14} />} onClick={(e) => setAnchor(e.currentTarget)}
                sx={{ boxShadow: "0 0 0 2px #fdba74" }} aria-expanded={!!anchor}>
                Create Contract
            </Button>
            <Menu anchorEl={anchor} open={!!anchor} onClose={() => setAnchor(null)} anchorOrigin={{ vertical: "bottom", horizontal: "right" }} transformOrigin={{ vertical: "top", horizontal: "right" }}
                PaperProps={{ sx: { width: 288, mt: 1 } }}>
                {CREATE_OPTIONS.map((o) => (
                    <MenuItem key={o.key} onClick={() => { setAnchor(null); onPick(o.key); }}>
                        <ListItemText primary={o.title} secondary={o.desc} primaryTypographyProps={{ fontWeight: 600, variant: "body2" }}
                            secondaryTypographyProps={{ variant: "caption", sx: { whiteSpace: "normal" } }} />
                    </MenuItem>
                ))}
            </Menu>
        </>
    );
}

function ContractList() {

    const router = useRouter();
    const { doGet, token } = useApi()

    const [tab, setTab] = useState("all");
    const [q, setQ] = useState("");
    const [status, setStatus] = useState("");
    const [view, setView] = useState("grid");
    const [data, setData] = useState();

    const fetchContractData = async () => {
        if (!token) return;

        try {

            const contractData = await doGet("company/contract/fetch/data");
            const contractFinalData = contractData?.data || contractData || ""

            setData(contractFinalData)

        } catch (error) {
            console.error("Failed to fetch contract create data:", error);
        }
    };


    useEffect(() => {

        fetchContractData()

    }, [token])

    const rows = useMemo(
        () => data?.filter((c) => (tab === "all" || c.kind === tab) && (!status || c.status === status) &&
            `${c.id} ${c.tenant?.name ?? ""} ${c.properties?.map((p) => p.name).join(" ") ?? ""}`.toLowerCase().includes(q.toLowerCase())),
        [data, tab, status, q]
    );

    const propertyLabel = (c) => (c.properties?.length > 1 ? `${c.properties.length} Properties` : c.properties?.[0]?.name ?? "-");
    const open = (c) => router.push(`${BASE}/create/${c.id}`);

    return (
        <Box >
            <Stack direction="row" flexWrap="wrap" justifyContent="space-between" alignItems="center" gap={1.5}>
                <Stack direction="row" alignItems="center" spacing={1}>
                    <FileText /><Typography variant="h5" fontWeight={700}>Contracts</Typography>
                </Stack>
                <Stack direction="row" flexWrap="wrap" gap={1}>
                    <Button variant="outlined" startIcon={<Upload size={14} />}>Import Contracts</Button>
                    <Button variant="outlined" startIcon={<Download size={14} />}>Export Contracts</Button>
                    <Button variant="outlined" startIcon={<ScanLine size={14} />}>Scan Contract</Button>
                    <CreateMenu onPick={(kind) => router.push(`${BASE}/create?kind=${kind}`)} />
                </Stack>
            </Stack>

            <Stack direction="row" flexWrap="wrap" gap={1} mt={2}>
                {TABS.map(([k, label]) => (
                    <Chip key={k} label={label} size="small" onClick={() => setTab(k)} color={tab === k ? "primary" : "default"} variant={tab === k ? "filled" : "outlined"}
                        sx={{ fontWeight: tab === k ? 700 : 400 }} />
                ))}
            </Stack>

            {/* Stat cards: color "inherit" on Typography so the white from the parent actually applies */}
            <Box sx={{ mt: 2, display: "grid", gap: 2, gridTemplateColumns: { xs: "repeat(2,1fr)", md: "repeat(3,1fr)", xl: "repeat(6,1fr)" } }}>
                {STATS.map((s) => (
                    <Box key={s.label} sx={{ background: s.grad, color: "#fff", borderRadius: 3, p: 2, boxShadow: 2 }}>
                        <Typography variant="caption" fontWeight={600} sx={{ color: "inherit", display: "block" }}>{s.label}</Typography>
                        <Typography variant="h3" fontWeight={700} mt={0.5} sx={{ color: "inherit" }}>{data?.filter(s.match).length}</Typography>
                    </Box>
                ))}
            </Box>

            <Stack direction="row" flexWrap="wrap" alignItems="center" gap={1} mt={2.5}>
                <ToggleButtonGroup size="small" exclusive value={view} onChange={(_, v) => v && setView(v)} sx={{ bgcolor: "grey.100" }}>
                    <ToggleButton value="list" aria-label="List view"><List size={16} /></ToggleButton>
                    <ToggleButton value="grid" aria-label="Grid view"><LayoutGrid size={16} /></ToggleButton>
                </ToggleButtonGroup>
                <TextField size="small" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by Contracts" sx={{ width: 224 }} />
                <TextField select size="small" value={status} onChange={(e) => setStatus(e.target.value)} sx={{ minWidth: 140 }} SelectProps={{ displayEmpty: true }}>
                    <MenuItem value="">All Status</MenuItem>
                    {["Draft", "Pending", "Active", "Closed"].map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                </TextField>
            </Stack>

            <Typography variant="caption" color="text.secondary" display="block" mt={2}>Showing <b>{rows?.length}</b> of {data?.length} contracts found</Typography>

            {!rows?.length ? (
                <Typography variant="body2" color="text.secondary" textAlign="center" py={8}>No contracts yet. Use “Create Contract” to start one.</Typography>
            ) : view === "grid" ? (
                <Box sx={{ mt: 1.5, display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", sm: "repeat(2,1fr)", lg: "repeat(4,1fr)", xl: "repeat(7,1fr)" } }}>
                    {rows?.map((c) => {
                        const p = progress(c);
                        return (
                            <Card key={c._id} variant="outlined" sx={{ borderColor: "grey.700", "&:hover": { boxShadow: 3 } }}>
                                <CardActionArea onClick={() => open(c)} sx={{ p: 2 }}>
                                    <Typography variant="caption" fontWeight={600} color="#2563eb">CONTRACT NO : <Box component="span" sx={{ color: "text.primary" }}>{c.id}</Box></Typography>
                                    <Box><Chip label={c.status} size="small" sx={{ mt: 1, height: 20, fontSize: 11, borderRadius: 1 }} /></Box>
                                    <Stack direction="row" spacing={1} alignItems="center" mt={1.5}><Home size={14} color="#3b82f6" /><Typography fontWeight={700}>{propertyLabel(c)}</Typography></Stack>
                                    <Stack direction="row" spacing={1} alignItems="center" mt={1}><User size={14} color="#6366f1" /><Typography variant="body2">{c.tenant?.name ?? "-"}</Typography></Stack>
                                    <Stack direction="row" spacing={1} alignItems="center" mt={1}><IndianRupee size={14} color="#10b981" /><Typography variant="body2">{c.value ? inr(c.value).replace("₹ ", "") : "-"}</Typography></Stack>
                                    <Stack direction="row" spacing={1} alignItems="center" mt={1}><Calendar size={14} color="#f97316" /><Typography variant="caption">{c.start ? `${fmtShort(c.start)} - ${fmtShort(c.end)}` : "-"}</Typography></Stack>
                                    <Stack direction="row" justifyContent="space-between" mt={2} sx={{ fontSize: 10, color: "text.secondary" }}>
                                        <span>{p.days != null ? `${p.days} DAYS REMAINING` : "CONTRACT PROGRESS"}</span><b>{p.pct}%</b>
                                    </Stack>
                                    <LinearProgress variant="determinate" value={p.pct} color="success" sx={{ mt: 0.5, height: 6, borderRadius: 3 }} />
                                </CardActionArea>
                            </Card>
                        );
                    })}
                </Box>
            ) : (
                <Table size="small" sx={{ mt: 1.5 }}>
                    <TableHead><TableRow>{["No", "Status", "Property", "Tenant", "Value", "Dates"].map((h) => <TableCell key={h} sx={{ fontWeight: 700 }}>{h}</TableCell>)}</TableRow></TableHead>
                    <TableBody>
                        {rows?.map((c) => (
                            <TableRow key={c._id} hover sx={{ cursor: "pointer" }} onClick={() => open(c)}>
                                <TableCell>{"CONTRACT NO:"} {c.id}</TableCell>
                                <TableCell>{c.status}</TableCell>
                                <TableCell>{propertyLabel(c)}</TableCell>
                                <TableCell>{c.tenant?.name ?? "-"}</TableCell><TableCell>{c.value ? inr(c.value) : "-"}</TableCell>
                                <TableCell>{c.start ? `${fmtShort(c.start)} - ${fmtShort(c.end)}` : "-"}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            )}
        </Box>
    );
}

export default function ContractPage() {
    return <ContractList />;
}
