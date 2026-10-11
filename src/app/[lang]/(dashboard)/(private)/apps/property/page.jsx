"use client";

import { useState } from "react";

import {
  AppBar,
  Avatar,
  Badge,
  Box,
  Button,
  Card,
  Chip,
  IconButton,
  InputAdornment,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  MenuItem,
  Paper,
  Select,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Toolbar,
  Typography,
} from "@mui/material";

import { alpha } from "@mui/material/styles";

import {
  Apartment,
  Bookmark,
  Business,
  ChevronLeft,
  Chat,
  Dashboard,
  FileDownloadOutlined,
  FileUploadOutlined,
  Add,
  GridView,
  Groups,
  Home,
  HomeOutlined,
  Layers,
  LocalOffer,
  LocationOnOutlined,
  Notifications,
  Person,
  PersonOutline,
  Search,
  Settings,
  SettingsOutlined,
  Schedule,
  Visibility,
  ViewList,
  AccountBalanceWallet,
  Assignment,
  AutoAwesome,
  BarChart,
  VpnKey,
  Construction,
  Apps,
  Domain,
} from "@mui/icons-material";

/* ---------- theme tokens ---------- */
const ORANGE = "#d4580f";
const PEACH = "#fff1e6";

/* ---------- static data ---------- */
const DOCK_APPS = [
  { id: "property", icon: Apartment, bg: "linear-gradient(135deg,#7c3aed,#6d28d9)", active: true },
  { id: "crm", icon: Groups, bg: "linear-gradient(135deg,#3b82f6,#2563eb)" },
  { id: "finance", icon: AccountBalanceWallet, bg: "linear-gradient(135deg,#10b981,#059669)" },
  { id: "tasks", icon: Assignment, bg: "linear-gradient(135deg,#475569,#1e293b)" },
  { id: "people", icon: PersonOutline, bg: "linear-gradient(135deg,#f97316,#ea580c)" },
  { id: "settings", icon: Settings, bg: "linear-gradient(135deg,#6366f1,#4f46e5)" },
  { id: "apps", icon: Apps, bg: "linear-gradient(135deg,#4f46e5,#4338ca)" },
];

const SIDE_NAV = [
  { id: "properties", label: "Properties", icon: Home },
  { id: "layouts", label: "Layouts", icon: Business },
  { id: "amenities", label: "Amenities", icon: AutoAwesome },
  { id: "tenants", label: "Tenants", icon: Groups },
  { id: "assets", label: "Assets", icon: Domain },
];

const STATS = [
  { label: "All Properties", value: 37, icon: Apartment, bg: "linear-gradient(90deg,#4f46e5,#7c3aed)", border: "3px solid #3b5bdb" },
  { label: "Vacant", value: 37, icon: Home, bg: "linear-gradient(90deg,#dc2626,#e11d48)" },
  { label: "Reserved", value: 0, icon: Bookmark, bg: "linear-gradient(90deg,#7c3aed,#a21caf)" },
  { label: "Occupied", value: 0, icon: Person, bg: "linear-gradient(90deg,#059669,#0d9488)" },
  { label: "Unavailable", value: 0, icon: Apartment, bg: "linear-gradient(90deg,#ea580c,#dc2626)" },
];

const FILTERS = [
  { label: "All Groups", width: 145 },
  { label: "All Types", width: 150 },
  { label: "All Categories", width: 165 },
  { label: "All States", width: 130 },
  { label: "All Cities", width: 112, disabled: true },
  { label: "All Time", width: 112 },
  { label: "All Tenants", width: 145 },
  { label: "All Rental Terms", width: 185 },
];

const PROPERTIES = [
  { id: 1, name: "New Property - 1037", status: "Vacant", kind: "Rental" },
  { id: 2, name: "New Property", status: "Vacant", kind: "Rental" },
  { id: 3, name: "New Property - 1035", status: "Vacant", kind: "Rental" },
  { id: 4, name: "New Property - 1034", status: "Vacant", kind: "Rental" },
];

/* ---------- small components ---------- */
const HelpChip = ({ small }) => (
  <Chip
    label="HELP"
    size="small"
    sx={{
      bgcolor: "#d1fae5",
      color: "#059669",
      fontWeight: 700,
      fontSize: small ? 9 : 10,
      height: small ? 18 : 22,
      borderRadius: 1,
      ml: small ? 1 : 0,
    }}
  />
);

const FilterSelect = ({ label, width, disabled }) => (
  <Select
    value=""
    displayEmpty
    disabled={disabled}
    renderValue={() => label}
    size="small"
    sx={{
      width,
      height: 42,
      borderRadius: 2.5,
      fontSize: 15,
      bgcolor: disabled ? "#f9fafb" : "#fff",
      "& .MuiOutlinedInput-notchedOutline": { borderColor: "#e5e7eb" },
    }}
  >
    <MenuItem value="all">{label}</MenuItem>
  </Select>
);

const StatCard = ({ label, value, icon: Icon, bg, border }) => (
  <Paper
    elevation={0}
    sx={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-start",
      p: "14px 16px",
      height: 96,
      color: "#fff",
      borderRadius: 3,
      background: bg,
      border,
    }}
  >
    <Box>
      <Typography sx={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase" }}>
        {label}
      </Typography>
      <Typography sx={{ fontSize: 44, fontWeight: 700, lineHeight: 1.05 }}>{value}</Typography>
    </Box>
    <Icon sx={{ fontSize: 28, opacity: 0.9 }} />
  </Paper>
);

const Tag = ({ icon: Icon, label, color, bg, border }) => (
  <Chip
    icon={<Icon sx={{ fontSize: "13px !important", color: `${color} !important` }} />}
    label={label}
    size="small"
    sx={{
      bgcolor: bg,
      color,
      border: `1px solid ${border}`,
      fontWeight: 600,
      fontSize: 12,
      borderRadius: 1.5,
      height: 24,
    }}
  />
);

const Muted = ({ icon: Icon, children }) => (
  <Box sx={{ display: "inline-flex", alignItems: "center", gap: 1, color: "#9ca3af", fontSize: 13 }}>
    {Icon && <Icon sx={{ fontSize: 15 }} />}
    {children}
  </Box>
);

const PropertyCard = ({ property }) => (
  <Card
    elevation={0}
    sx={{ border: "1.5px solid #f87171", borderRadius: 4, overflow: "hidden" }}
  >
    <Box
      sx={{
        position: "relative",
        height: 190,
        bgcolor: "#eef0ff",
        display: "grid",
        placeItems: "center",
      }}
    >
      <Box sx={{ position: "absolute", top: 12, right: 12 }}>
        <Tag icon={VpnKey} label={property.kind} color="#3730a3" bg="#e0e7ff" border="#a5b4fc" />
      </Box>
      <HomeOutlined sx={{ fontSize: 64, color: "#b7bdd6" }} />
    </Box>

    <Box sx={{ p: "16px 18px 18px", display: "flex", flexDirection: "column", gap: 1.25 }}>
      <Typography sx={{ fontSize: 16, fontWeight: 600 }}>{property.name}</Typography>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Tag icon={Home} label={property.status} color="#b91c1c" bg="#fee2e2" border="#fca5a5" />
        <Muted>-</Muted>
      </Box>
      <Muted icon={LocationOnOutlined}>-</Muted>
      <Box sx={{ display: "flex", justifyContent: "space-between" }}>
        <Muted icon={Apartment}>-</Muted>
        <Muted>-</Muted>
      </Box>
    </Box>
  </Card>
);

/* ---------- page ---------- */
const PropertyPage = () => {
  const [view, setView] = useState("grid");
  const [activeNav, setActiveNav] = useState("properties");
  const [collapsed, setCollapsed] = useState(false);

  const navItemSx = {
    borderRadius: 3,
    py: 1.5,
    px: 2,
    "&:hover": { bgcolor: alpha(ORANGE, 0.1) },
    "&.Mui-selected": {
      bgcolor: ORANGE,
      color: "#fff",
      fontWeight: 600,
      "&:hover": { bgcolor: "#b94a0b" },
      "& .MuiListItemIcon-root": { color: "#fff" },
    },
    "& .MuiListItemIcon-root": { minWidth: 36, color: "inherit" },
    "& .MuiListItemText-primary": { fontSize: 15, fontWeight: "inherit" },
  };

  const panelSx = {
    bgcolor: PEACH,
    border: "1.5px solid #1f2937",
    borderRadius: 5.5,
    p: 1.25,
  };

  return (
    <Box sx={{}}>
      {/* ===== Top bar ===== */}



      {/* ===== Main ===== */}
      <Box component="main" sx={{ flex: 1, minWidth: 0 }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 1.5, mb: 2 }}>
          <Typography variant="h4" sx={{ display: "flex", alignItems: "center", gap: 1.5, fontSize: 30, fontWeight: 700 }}>
            <HomeOutlined sx={{ fontSize: 32, color: ORANGE }} /> Properties
          </Typography>

          <Box sx={{ display: "flex", gap: 1.25, flexWrap: "wrap" }}>
            {[
              { label: "View Public Listing", icon: Visibility },
              { label: "View Public Inquiry", icon: Chat },
              { label: "Export", icon: FileDownloadOutlined },
              { label: "Import", icon: FileUploadOutlined },
            ].map(({ label, icon: Icon }) => (
              <Button
                key={label}
                variant="outlined"
                startIcon={<Icon sx={{ fontSize: "16px !important" }} />}
                sx={{ textTransform: "none", color: "text.primary", }}
              >
                {label}
              </Button>
            ))}
            <Button
              variant="contained"
              startIcon={<Add />}
              disableElevation
              href={"/en/apps/property/create"}
              sx={{ textTransform: "none", }}
            >
              Create Property
            </Button>
          </Box>
        </Box>

        {/* stats */}
        <Box
          sx={{
            display: "grid",
            gap: 2,
            mb: 2.25,
            gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)", xl: "repeat(5, 1fr)" },
          }}
        >
          {STATS.map((s) => <StatCard key={s.label} {...s} />)}
        </Box>

        {/* filters */}
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, alignItems: "center" }}>
          <ToggleButtonGroup
            exclusive
            size="small"
            value={view}
            onChange={(_, v) => v && setView(v)}
            sx={{
              bgcolor: "#f3f4f6",
              p: 0.5,
              borderRadius: 2.5,
              gap: 0.25,
              "& .MuiToggleButton-root": { border: 0, borderRadius: "8px !important", width: 40, height: 36 },
              "& .Mui-selected": { bgcolor: "#fed7aa !important", color: ORANGE },
            }}
          >
            <ToggleButton value="list"><ViewList fontSize="small" /></ToggleButton>
            <ToggleButton value="grid"><GridView fontSize="small" /></ToggleButton>
            <ToggleButton value="buildings"><Apartment fontSize="small" /></ToggleButton>
            <ToggleButton value="tags"><LocalOffer fontSize="small" /></ToggleButton>
            <ToggleButton value="layers"><Layers fontSize="small" /></ToggleButton>
            <ToggleButton value="map"><LocationOnOutlined fontSize="small" /></ToggleButton>
          </ToggleButtonGroup>

          <TextField
            size="small"
            placeholder="Search by Properties"
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start"><Search fontSize="small" /></InputAdornment>
                ),
              },
            }}
            sx={{
              width: 230,
              "& .MuiOutlinedInput-root": { height: 42, borderRadius: 2.5, fontSize: 14 },
              "& fieldset": { borderColor: "#e5e7eb" },
            }}
          />

          {FILTERS.map((f) => <FilterSelect key={f.label} {...f} />)}
        </Box>

        <Typography sx={{ fontSize: 13, color: "#374151", my: 2 }}>
          Showing <b>25</b> of <b>37</b> properties found
        </Typography>

        {/* property grid */}
        <Box
          sx={{
            display: "grid",
            gap: 3,
            gridTemplateColumns:
              view === "list"
                ? "1fr"
                : { xs: "1fr", sm: "repeat(2, 1fr)", lg: "repeat(3, 1fr)", xl: "repeat(4, 1fr)" },
          }}
        >
          {PROPERTIES.map((p) => <PropertyCard key={p.id} property={p} />)}
        </Box>
      </Box>

    </Box>
  );
};

export default PropertyPage;
