"use client"

import { useRef, useState } from "react";

import {
  Autocomplete,
  Box,
  Button,
  Checkbox,
  Chip,
  Divider,
  FormControlLabel,
  IconButton,
  Link,
  MenuItem,
  Paper,
  Select,
  Stack,
  Tab,
  Tabs,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from "@mui/material";

import {
  ArrowBack,
  Apartment,
  CloudOutlined,
  CloudUploadOutlined,
  Check,
  FormatBold,
  FormatItalic,
  FormatListBulleted,
  FormatListNumbered,
  FormatStrikethrough,
  Code,
  GridViewOutlined,
  HomeOutlined,
  LocalOfferOutlined,
  Redo,
  Undo,
  VideocamOutlined,
  FormatQuote,
} from "@mui/icons-material";

/* ---------- tokens ---------- */
const LINE = "#e5e7eb";
const LABEL_SX = { fontSize: 12, fontWeight: 500, color: "#111827", mb: 0.5 };

/* ---------- static data ---------- */
const PROPERTY_TYPES = [
  {
    id: "office",
    title: "Office / Building",
    price: "₹ 349 per office/month",
    desc: "Manage multi-unit buildings, commercial towers, floors, and traditional leases.",
    icon: Apartment,
    tint: "#e8efff",
    color: "#3b5bdb",
  },
  {
    id: "coworking",
    title: "Space / Coworking",
    price: "₹ 149 per space/month",
    desc: "Manage flexible desk space layouts, meeting rooms, booking packages, and daily/monthly passes.",
    icon: GridViewOutlined,
    tint: "#e6f8ef",
    color: "#059669",
  },
  {
    id: "virtual",
    title: "Virtual",
    price: "₹ 75 per office/month",
    desc: "Manage virtual offices that give clients a professional business address for registration and correspondence.",
    icon: CloudOutlined,
    tint: "#f3f4f6",
    color: "#374151",
  },
];

const STATUSES = ["Vacant", "Reserved", "Occupied", "Unavailable"];
const CATEGORIES = ["Co-Working Space", "Commercial", "Residential", "Industrial"];
const GROUPS = ["Jalandhar", "Ludhiana", "Amritsar", "Chandigarh"];
const TYPES = ["Office", "Shop", "Showroom", "Warehouse", "Desk"];
const TAXES = ["GST 18%", "GST 12%", "GST 5%", "No Tax"];
const TERMS = ["Monthly", "Quarterly", "Half-yearly", "Yearly"];
const STATES = ["Punjab", "Haryana", "Delhi", "Himachal Pradesh"];
const CITIES = { Punjab: ["Ludhiana", "Jalandhar", "Amritsar"], Haryana: ["Gurugram", "Panipat"] };
const TEMPLATES = ["Standard Lease", "Co-working Agreement", "Virtual Office Agreement"];

/* ---------- shared bits ---------- */
const Field = ({ label, required, children, sx }) => (
  <Box sx={sx}>
    <Typography sx={LABEL_SX}>
      {label}
      {required && <Box component="span" sx={{ color: "#dc2626", ml: 0.25 }}>*</Box>}
    </Typography>
    {children}
  </Box>
);

const inputSx = {
  "& .MuiOutlinedInput-root": { height: 34, fontSize: 12, borderRadius: 1.5, bgcolor: "#fff" },
  "& .MuiOutlinedInput-notchedOutline": { borderColor: "#9ca3af" },
  "& .MuiInputBase-input::placeholder": { fontSize: 12, opacity: 0.7 },
};

const orangeInputSx = {
  ...inputSx,
};

const TextInput = ({ highlight, ...props }) => (
  <TextField fullWidth size="small" sx={highlight ? orangeInputSx : inputSx} {...props} />
);

const SimpleSelect = ({ value, onChange, options, placeholder, disabled }) => (
  <Select
    fullWidth
    size="small"
    displayEmpty
    disabled={disabled}
    value={value}
    onChange={(e) => onChange(e.target.value)}
    renderValue={(v) => (v ? v : <Box sx={{ color: "#9ca3af" }}>{placeholder}</Box>)}
    sx={{
      height: 34,
      fontSize: 12,
      borderRadius: 1.5,
      bgcolor: disabled ? "#f9fafb" : "#fff",
      "& .MuiOutlinedInput-notchedOutline": { borderColor: "#9ca3af" },
    }}
  >
    {options.map((o) => (
      <MenuItem key={o} value={o} sx={{ fontSize: 13 }}>
        {o}
      </MenuItem>
    ))}
  </Select>
);

const ClearableSelect = ({ value, onChange, options }) => (
  <Autocomplete
    size="small"
    options={options}
    value={value}
    onChange={(_, v) => onChange(v)}
    renderInput={(params) => <TextField {...params} sx={orangeInputSx} />}
    slotProps={{ paper: { sx: { fontSize: 13 } } }}
  />
);

const grid4 = { display: "grid", gap: 1.5, gridTemplateColumns: { xs: "1fr", sm: "repeat(2,1fr)", lg: "repeat(4,1fr)" } };

/* =====================================================
   Step 1 — select property type
   ===================================================== */
const SelectTypeStep = ({ selected, onSelect, agreed, onAgree, onContinue }) => (
  <Paper
    variant="outlined"
    sx={{ maxWidth: 1024, mx: "auto", mt: 2, p: { xs: 2, md: 6 }, borderRadius: 3, borderColor: "#1f2937" }}
  >
    <Typography align="center" sx={{ fontSize: 24, fontWeight: 600 }}>
      Select Property Type
    </Typography>
    <Typography align="center" sx={{ color: "#4b5563", mt: 1, maxWidth: 520, mx: "auto" }}>
      Select the type of property you are creating. This helps customize the settings and layout
      designer specifically for your needs.
    </Typography>

    <Box
      sx={{
        display: "grid",
        gap: 4,
        mt: 5,
        gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" },
      }}
    >
      {PROPERTY_TYPES.map(({ id, title, price, desc, icon: Icon, tint, color }) => {
        const active = selected === id;

        return (
          <Box
            key={id}
            role="button"
            tabIndex={0}
            onClick={() => onSelect(id)}
            onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onSelect(id)}
            sx={{
              cursor: "pointer",
              textAlign: "center",
              border: `2px solid black`,
              borderRadius: 4,
              p: 3,
              minHeight: 330,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              outline: "none",
              transition: "box-shadow .15s, transform .15s",
            }}
          >
            <Box sx={{ width: 80, height: 80, borderRadius: 3, bgcolor: tint, display: "grid", placeItems: "center", mb: 2 }}>
              <Icon sx={{ fontSize: 42, color }} />
            </Box>
            <Typography sx={{ fontSize: 20, fontWeight: 700 }}>{title}</Typography>
            <Typography sx={{ fontSize: 13, fontWeight: 600, color: "#2563eb", mt: 1 }}>{price}</Typography>
            <Typography sx={{ fontSize: 13.5, color: "#6b7280", mt: 1.5, lineHeight: 1.7 }}>{desc}</Typography>
          </Box>
        );
      })}
    </Box>

    <Stack alignItems="center" spacing={2} sx={{ mt: 5 }}>
      <FormControlLabel
        control={<Checkbox size="small" checked={agreed} onChange={(e) => onAgree(e.target.checked)} />}
        label={
          <Typography sx={{ fontSize: 13 }}>
            I agree to the{" "}
            <Link href="#" underline="hover" sx={{ fontWeight: 600, color: "#4f46e5" }}>Terms and Conditions</Link>{" "}
            and the{" "}
            <Link href="#" underline="hover" sx={{ fontWeight: 600, color: "#4f46e5" }}>Software Subscription Agreement</Link>.
          </Typography>
        }
      />
      <Button
        variant="contained"
        disableElevation
        disabled={!selected || !agreed}
        onClick={onContinue}
      >
        Continue
      </Button>
    </Stack>
  </Paper>
);

/* =====================================================
   Tab 1 — Basic information
   ===================================================== */
const RichToolbar = () => {
  const groups = [
    [FormatBold, FormatItalic, FormatStrikethrough, Code],
    ["H1", "H2", "H3"],
    [FormatListBulleted, FormatListNumbered, FormatQuote],
    [Undo, Redo],
  ];

  return (

    <Stack
      direction="row"
      alignItems="center"
      spacing={1}
      divider={<Divider orientation="vertical" flexItem />}
      sx={{ p: 1, }}
    >
      {groups.map((g, i) => (
        <Stack key={i} direction="row" spacing={0.5}>
          {g.map((Item, j) => (
            <IconButton
              key={j}
              size="small"
              sx={{ width: 28, height: 28, fontSize: 11, fontWeight: 700, }}
            >
              {typeof Item === "string" ? Item : <Item sx={{ fontSize: 15 }} />}
            </IconButton>
          ))}
        </Stack>
      ))}
    </Stack>
  );
};

const BasicInfoTab = ({ data, set }) => (
  <Stack spacing={1.5}>
    <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: { xs: "1fr", md: "1fr 1fr 1fr" } }}>
      <Field label="Title" required>
        <TextInput value={data.title} onChange={(e) => set("title", e.target.value)} />
      </Field>
      <Field label="Reference No">
        <TextInput placeholder="Enter reference number" value={data.refNo} onChange={(e) => set("refNo", e.target.value)} />
      </Field>
      <Field label="Status">
        <ClearableSelect value={data.status} onChange={(v) => set("status", v)} options={STATUSES} />
      </Field>
    </Box>

    <Box sx={grid4}>
      <Field label="Category">
        <ClearableSelect value={data.category} onChange={(v) => set("category", v)} options={CATEGORIES} />
      </Field>
      <Field label="Property Group">
        <ClearableSelect value={data.group} onChange={(v) => set("group", v)} options={GROUPS} />
      </Field>
      <Field label="Property Type">
        <ClearableSelect value={data.type} onChange={(v) => set("type", v)} options={TYPES} />
      </Field>
      <Field label="Size">
        <TextInput placeholder="Enter property size" value={data.size} onChange={(e) => set("size", e.target.value)} />
      </Field>
    </Box>

    <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" } }}>
      <Field label="Pricing Type">
        <ToggleButtonGroup
          exclusive
          fullWidth
          size="small"
          value={data.pricingType}
          onChange={(_, v) => v && set("pricingType", v)}
          sx={{
            border: "1px solid #9ca3af",
            borderRadius: 1.5,
            p: "2px",
            "& .MuiToggleButton-root": { border: 0, borderRadius: 1, height: 30, fontSize: 11, fontWeight: 600, textTransform: "none", gap: 0.75 },
            "& .Mui-selected": { bgcolor: "#f9d3b3 !important", color: "#111827" },
          }}
        >
          <ToggleButton value="rent"><HomeOutlined sx={{ fontSize: 14 }} /> For Rent</ToggleButton>
          <ToggleButton value="sale"><LocalOfferOutlined sx={{ fontSize: 14 }} /> For Sale</ToggleButton>
        </ToggleButtonGroup>
      </Field>
      <Field label="Tax">
        <SimpleSelect value={data.tax} onChange={(v) => set("tax", v)} options={TAXES} placeholder="Select Tax" />
      </Field>
    </Box>

    {data.pricingType === "rent" && (
      <Box sx={{ maxWidth: { md: "50%" }, pr: { md: 0.75 } }}>
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
          <Typography sx={{ fontSize: 12, fontWeight: 500 }}>Pricing</Typography>
          <Chip label={`${data.terms.length} selected`} size="small" sx={{ height: 18, fontSize: 10, bgcolor: "#fef3c7", color: "#92400e", border: "1px solid #fcd34d" }} />
        </Stack>

        <SimpleSelect
          value=""
          placeholder="Add another term..."
          options={TERMS.filter((t) => !data.terms.some((x) => x.name === t))}
          onChange={(name) => set("terms", [...data.terms, { name, price: "" }])}
        />

        <Stack spacing={1} sx={{ mt: 1 }}>
          {data.terms.map((t, i) => (
            <Paper
              key={t.name}
              variant="outlined"
              sx={{ display: "flex", alignItems: "center", gap: 1, p: 1.5, borderColor: "#9ca3af", borderRadius: 2 }}
            >
              <Check sx={{ fontSize: 14, }} />
              <Typography sx={{ fontSize: 12, fontWeight: 500 }}>{t.name}</Typography>
              {i === 0 && <Chip label="Default" size="small" sx={{ height: 18, fontSize: 10, fontWeight: 600 }} />}
              <Box sx={{ flex: 1 }} />
              <TextField
                size="small"
                placeholder="0.00"
                value={t.price}
                onChange={(e) =>
                  set("terms", data.terms.map((x, k) => (k === i ? { ...x, price: e.target.value } : x)))
                }
                slotProps={{ input: { startAdornment: <Typography sx={{ fontSize: 12, mr: 0.5 }}>₹</Typography> } }}
                sx={{ width: 100, ...inputSx }}
              />
              <Typography sx={{ fontSize: 11, color: "#6b7280" }}>/mo</Typography>
              {i > 0 && (
                <Button size="small" color="error" onClick={() => set("terms", data.terms.filter((_, k) => k !== i))} sx={{ textTransform: "none", fontSize: 11, minWidth: 0 }}>
                  Remove
                </Button>
              )}
            </Paper>
          ))}
        </Stack>
      </Box>
    )}

    {data.pricingType === "sale" && (
      <Field label="Sale Price" sx={{ maxWidth: 320 }}>
        <TextInput placeholder="0.00" value={data.salePrice} onChange={(e) => set("salePrice", e.target.value)} />
      </Field>
    )}

    <Field label="Description">
      <Paper variant="outlined" sx={{ borderColor: "#9ca3af", borderRadius: 1.5, overflow: "hidden" }}>
        <RichToolbar />
        <TextField
          multiline
          minRows={4}
          fullWidth
          placeholder="Enter property description"
          value={data.description}
          onChange={(e) => set("description", e.target.value)}
          sx={{ "& fieldset": { border: 0 }, "& textarea": { fontSize: 12 } }}
        />
      </Paper>
    </Field>
  </Stack>
);

/* =====================================================
   Tab 2 — Additional data
   ===================================================== */
const AdditionalDataTab = ({ data, set }) => (
  <Stack spacing={1.5} sx={{ pt: 1.5 }}>
    <Field label="Default Contract Template" sx={{ maxWidth: { md: "32%" } }}>
      <SimpleSelect value={data.template} onChange={(v) => set("template", v)} options={TEMPLATES} placeholder="Select Template" />
    </Field>

    <Field label="Full Address">
      <TextInput placeholder="Enter full address" value={data.address} onChange={(e) => set("address", e.target.value)} />
    </Field>

    <Box sx={grid4}>
      <Field label="Building Name">
        <TextInput placeholder="Enter building name" value={data.building} onChange={(e) => set("building", e.target.value)} />
      </Field>
      <Field label="Street">
        <TextInput placeholder="Enter street name" value={data.street} onChange={(e) => set("street", e.target.value)} />
      </Field>
      <Field label="Unit No">
        <TextInput placeholder="Enter unit number" value={data.unit} onChange={(e) => set("unit", e.target.value)} />
      </Field>
      <Field label="Floor No">
        <TextInput placeholder="Enter floor number" value={data.floor} onChange={(e) => set("floor", e.target.value)} />
      </Field>

      <Field label="State">
        <SimpleSelect
          value={data.state}
          onChange={(v) => { set("state", v); set("city", ""); }}
          options={STATES}
          placeholder="Enter state"
        />
      </Field>
      <Field label="City">
        <SimpleSelect
          value={data.city}
          onChange={(v) => set("city", v)}
          options={CITIES[data.state] || []}
          placeholder="Enter city"
          disabled={!data.state}
        />
      </Field>
      <Field label="Country">
        <TextInput placeholder="Enter country" value={data.country} onChange={(e) => set("country", e.target.value)} />
      </Field>
      <Field label="Govt Reference No">
        <TextInput placeholder="Enter government reference number" value={data.govRef} onChange={(e) => set("govRef", e.target.value)} />
      </Field>

      <Field label="Latitude">
        <TextInput placeholder="Enter latitude" value={data.lat} onChange={(e) => set("lat", e.target.value)} />
      </Field>
      <Field label="Longitude">
        <TextInput placeholder="Enter longitude" value={data.lng} onChange={(e) => set("lng", e.target.value)} />
      </Field>
      <Field label="Owner Name">
        <TextInput placeholder="Enter owner's full name" value={data.owner} onChange={(e) => set("owner", e.target.value)} />
      </Field>
      <Field label="Owner Contact Info">
        <Stack direction="row" spacing={0.75}>
          <Select
            size="small"
            value={data.dial}
            onChange={(e) => set("dial", e.target.value)}
            sx={{ width: 90, height: 34, fontSize: 12, borderRadius: 1.5, "& fieldset": { borderColor: "#9ca3af" } }}
          >
            <MenuItem value="+91">🇮🇳 +91</MenuItem>
            <MenuItem value="+1">🇺🇸 +1</MenuItem>
            <MenuItem value="+44">🇬🇧 +44</MenuItem>
            <MenuItem value="+971">🇦🇪 +971</MenuItem>
          </Select>
          <TextInput placeholder="Enter phone number" value={data.phone} onChange={(e) => set("phone", e.target.value)} />
        </Stack>
      </Field>
    </Box>
  </Stack>
);

/* =====================================================
   Tab 3 — Photos & docs
   ===================================================== */
const DropZone = ({ icon: Icon, accept, multiple, centered, title, hint, files, onFiles }) => {
  const inputRef = useRef(null);
  const [over, setOver] = useState(false);

  const pick = (list) => list?.length && onFiles(Array.from(list));

  return (
    <Box>
      <Box
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setOver(true); }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => { e.preventDefault(); setOver(false); pick(e.dataTransfer.files); }}
        sx={{
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: centered ? "center" : "flex-start",
          gap: 1.5,
          px: 2,
          height: 54,
          bgcolor: over ? "#fff7ed" : "#fff",
          borderRadius: 1.5,
          transition: "background .15s, border-color .15s",
        }}
      >
        <Icon sx={{ fontSize: 16, color: "#9ca3af" }} />
        <Box>
          <Typography sx={{ fontSize: 11 }}>{title}</Typography>
          <Typography sx={{ fontSize: 9.5, color: "#6b7280" }}>{hint}</Typography>
        </Box>
        <input
          ref={inputRef}
          hidden
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={(e) => { pick(e.target.files); e.target.value = ""; }}
        />
      </Box>

      {files.length > 0 && (
        <Stack direction="row" gap={0.75} flexWrap="wrap" sx={{ mt: 1 }}>
          {files.map((f, i) => (
            <Chip
              key={`${f.name}-${i}`}
              label={f.name}
              size="small"
              onDelete={() => onFiles(null, i)}
              sx={{ fontSize: 11 }}
            />
          ))}
        </Stack>
      )}
    </Box>
  );
};

const PhotosDocsTab = ({ files, setFiles }) => {
  const add = (key) => (list, removeIndex) =>
    setFiles((prev) => ({
      ...prev,
      [key]: list ? [...prev[key], ...list] : prev[key].filter((_, i) => i !== removeIndex),
    }));

  const browse = (txt) => (
    <>
      {txt}{" "}
      <Box component="span" sx={{ color: "#2563eb" }}>browse</Box>
    </>
  );

  return (
    <Stack spacing={2} sx={{ pt: 1.5 }}>
      <Field label="Property Photos">
        <DropZone
          icon={CloudUploadOutlined}
          accept="image/*"
          multiple
          title={browse("Drag and drop images here, or")}
          hint="Supported formats: JPG, PNG, GIF, WEBP, BMP, SVG"
          files={files.photos}
          onFiles={add("photos")}
        />
      </Field>
      <Field label="Property Videos">
        <DropZone
          icon={VideocamOutlined}
          accept="video/*"
          multiple
          title={browse("Drag and drop videos here, or")}
          hint="MP4, WEBM, OGG, MOV, AVI, MKV — up to 30 MB per video"
          files={files.videos}
          onFiles={add("videos")}
        />
      </Field>
      <Field label="Ownership Document">
        <DropZone
          centered
          icon={CloudUploadOutlined}
          accept=".pdf,.doc,.docx"
          title="Click to upload document"
          hint="PDF, DOC, DOCX"
          files={files.ownership}
          onFiles={add("ownership")}
        />
      </Field>
      <Field label="Other Documents">
        <DropZone
          centered
          icon={CloudUploadOutlined}
          accept=".pdf,.doc,.docx"
          multiple
          title="Click to upload document"
          hint="PDF, DOC, DOCX"
          files={files.other}
          onFiles={add("other")}
        />
      </Field>
    </Stack>
  );
};

/* =====================================================
   Page
   ===================================================== */
const initialData = {
  title: "New Property - 1038",
  refNo: "",
  status: "Vacant",
  category: "Co-Working Space",
  group: "Jalandhar",
  type: "Office",
  size: "",
  pricingType: "rent",
  tax: "",
  salePrice: "",
  terms: [{ name: "Monthly", price: "" }],
  description: "",
  template: "",
  address: "",
  building: "",
  street: "",
  unit: "",
  floor: "",
  state: "",
  city: "",
  country: "",
  govRef: "",
  lat: "",
  lng: "",
  owner: "",
  dial: "+91",
  phone: "",
};

const AddFormPage = ({ onBack, onSubmit }) => {
  const [step, setStep] = useState("type"); // "type" | "form"
  const [propertyType, setPropertyType] = useState("");
  const [agreed, setAgreed] = useState(true);
  const [tab, setTab] = useState(0);
  const [data, setData] = useState(initialData);
  const [files, setFiles] = useState({ photos: [], videos: [], ownership: [], other: [] });

  const set = (key, value) => setData((d) => ({ ...d, [key]: value }));

  const handleBack = () => {
    if (step === "form") setStep("type");
    else onBack?.();
  };

  const handleSave = () => onSubmit?.({ propertyType, ...data, files });

  return (
    <Box sx={{ width: "100%" }}>
      {/* header */}
      <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 1.5 }}>
        <Tooltip title="Back">
          <IconButton onClick={handleBack} size="small"><ArrowBack /></IconButton>
        </Tooltip>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>Create Property</Typography>
        {step === "form" && (
          <Stack direction="row" spacing={1} sx={{ ml: "auto !important" }}>
            <Button variant="outlined" onClick={handleBack} >
              Cancel
            </Button>
            <Button
              variant="contained"
              disableElevation
              onClick={handleSave}
              disabled={!data.title.trim()}
            >
              Save Property
            </Button>
          </Stack>
        )}
      </Stack>

      {step === "type" ? (
        <SelectTypeStep
          selected={propertyType}
          onSelect={setPropertyType}
          agreed={agreed}
          onAgree={setAgreed}
          onContinue={() => setStep("form")}
        />
      ) : (
        <Paper variant="outlined" sx={{ borderRadius: 2, borderColor: "#1f2937", px: 2, pb: 2.5 }}>
          <Tabs
            value={tab}
            onChange={(_, v) => setTab(v)}
            sx={{
              minHeight: 40,
              borderBottom: `1px solid ${LINE}`,
              mb: 1.5,
              "& .MuiTabs-indicator": { bgcolor: "#2563eb" },
              "& .MuiTab-root": { textTransform: "none", fontSize: 11, minHeight: 40, minWidth: 0, px: 1.5, color: "#374151" },
              "& .Mui-selected": { color: "#2563eb !important" },
            }}
          >
            <Tab label="Basic Information" />
            <Tab label="Additional Data" />
            <Tab label="Photos & Docs" />
          </Tabs>

          {tab === 0 && <BasicInfoTab data={data} set={set} />}
          {tab === 1 && <AdditionalDataTab data={data} set={set} />}
          {tab === 2 && <PhotosDocsTab files={files} setFiles={setFiles} />}
        </Paper>
      )}
    </Box>
  );
};

export default AddFormPage;
