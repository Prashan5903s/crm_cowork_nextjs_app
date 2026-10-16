
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { useRouter, useParams } from "next/navigation";

import {
  Add,
  Apartment,
  Chat,
  EditOutlined,
  FileDownloadOutlined,
  FileUploadOutlined,
  GridView,
  Home,
  HomeOutlined,
  LocationOnOutlined,
  Person,
  Search,
  ViewList,
  VpnKey,
} from "@mui/icons-material";

import {
  Alert,
  Box,
  Button,
  Card,
  Chip,
  Container,
  Divider,
  InputAdornment,
  MenuItem,
  Paper,
  Select,
  Skeleton,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";

import { useApi } from "@/utils/api";

const ASSET_URL = process.env.NEXT_PUBLIC_ASSETS_URL

// --------------------------------------------------
// CONSTANTS
// --------------------------------------------------

const BORDER_COLOR = "#e5e7eb";

const INITIAL_FILTERS = {
  group: "All Groups",
  category: "All Categories",
  state: "All States",
  city: "All Cities",
};

const STATUS_OPTIONS = [
  "Vacant",
  "Occupied",
  "Under Maintenance",
];

const CONTROL_SX = {
  width: "100%",
  height: 40,
  bgcolor: "#fff",
  fontSize: 13,
  "& .MuiSelect-select": {
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
};

// --------------------------------------------------
// HELPERS
// --------------------------------------------------


const formatPrice = (value) => {
  if (value === null || value === undefined || value === "") {
    return "Not specified";
  }

  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return String(value);
  }

  return `₹${amount.toLocaleString("en-IN")}`;
};

const getPropertyPrice = (property) => {

  if (property.pricingType === "sale") {
    return property.salePrice ?? "";
  }

  if (!Array.isArray(property.terms) || property.terms.length === 0) {
    return "";
  }

  return property.terms[0]?.price ?? "";
};

const getPriceLabel = (property) => {
  return property.pricingType === "sale"
    ? "Sale Price"
    : "Rental Price";
};

const escapeCsv = (value) =>
  `"${String(value ?? "").replace(/"/g, '""')}"`;

// --------------------------------------------------
// STATISTICS CARD
// --------------------------------------------------

function StatCard({ label, value, icon: Icon }) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        border: `1px solid ${BORDER_COLOR}`,
        borderRadius: 2,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        minHeight: 90,
        gap: 1,
        transition: "border-color 0.2s",
        "&:hover": {
          borderColor: "#93c5fd",
        },
      }}
    >
      <Box sx={{ minWidth: 0 }}>
        <Typography
          sx={{
            fontSize: 12,
            color: "#6b7280",
            fontWeight: 500,
            mb: 0.75,
          }}
        >
          {label}
        </Typography>

        <Typography
          sx={{
            fontSize: 28,
            fontWeight: 700,
            lineHeight: 1.2,
            color: "#1f2937",
          }}
        >
          {value}
        </Typography>
      </Box>

      <Box
        sx={{
          width: 42,
          height: 42,
          borderRadius: 2,
          bgcolor: "#eff6ff",
          color: "#2563eb",
          display: "grid",
          placeItems: "center",
          flexShrink: 0,
        }}
      >
        <Icon sx={{ fontSize: 23 }} />
      </Box>
    </Paper>
  );
}

// --------------------------------------------------
// STATUS CHIP
// --------------------------------------------------

function StatusChip({ status }) {
  const styles = {
    Vacant: {
      color: "#15803d",
      background: "#f0fdf4",
    },
    Reserved: {
      color: "#a16207",
      background: "#fefce8",
    },
    Occupied: {
      color: "#1d4ed8",
      background: "#eff6ff",
    },
    "Under Maintenance": {
      color: "#b45309",
      background: "#fffbeb",
    },
    Unavailable: {
      color: "#b91c1c",
      background: "#fef2f2",
    },
  };

  const style = styles[status] || {
    color: "#475569",
    background: "#f1f5f9",
  };

  return (
    <Chip
      label={status || "Vacant"}
      size="small"
      sx={{
        height: 25,
        borderRadius: 1.5,
        bgcolor: style.background,
        color: style.color,
        fontSize: 11,
        fontWeight: 600,
        maxWidth: "100%",
      }}
    />
  );
}

// --------------------------------------------------
// PROPERTY IMAGE PLACEHOLDER
// --------------------------------------------------

function PropertyImage({ property, height = 140 }) {
  const [imageError, setImageError] = useState(false);

  const photo = property?.files?.photos?.[0];

  const imageUrl = photo?.path
    ? photo.path.startsWith("http")
      ? photo.path
      : `${ASSET_URL}${photo.path} `
    : "";

  console.log(imageUrl);


  const showImage = Boolean(imageUrl) && !imageError;

  return (
    <Box
      sx={{
        height,
        bgcolor: "#f1f5f9",
        display: "grid",
        placeItems: "center",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {showImage ? (
        <Box
          component="img"
          src={imageUrl}
          alt={property?.name || "Property"}
          onError={() => setImageError(true)}
          sx={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: "block",
          }}
        />
      ) : (
        <HomeOutlined
          sx={{
            fontSize: 55,
            color: "#94a3b8",
          }}
        />
      )}

      <Chip
        icon={
          <VpnKey
            sx={{
              fontSize: "14px !important",
              color: "#475569 !important",
            }}
          />
        }
        label={property?.kind || "Property"}
        size="small"
        sx={{
          position: "absolute",
          top: 12,
          left: 12,
          bgcolor: "#fff",
          color: "#475569",
          fontSize: 11,
          fontWeight: 500,
          maxWidth: "85%",
        }}
      />
    </Box>
  );
}

// --------------------------------------------------
// PROPERTY CARD
// --------------------------------------------------

function PropertyCard({ property, onView, onEdit }) {

  const price = getPropertyPrice(property);

  return (
    <Card
      elevation={0}
      sx={{
        height: "100%",
        border: `1px solid ${BORDER_COLOR}`,
        borderRadius: 2.5,
        overflow: "hidden",
        transition: "border-color 0.2s, box-shadow 0.2s",
        "&:hover": {
          borderColor: "#93c5fd",
          boxShadow: "0 4px 14px rgba(15, 23, 42, 0.05)",
        },
      }}
    >
      <PropertyImage property={property} />

      <Box sx={{ p: 2 }}>
        <Typography
          title={property.name}
          sx={{
            fontSize: 15,
            fontWeight: 600,
            color: "#1f2937",
            mb: 0.75,
            overflowWrap: "anywhere",
          }}
        >
          {property.name || "Untitled Property"}
        </Typography>

        {property.refNo && (
          <Typography
            sx={{
              fontSize: 11,
              color: "#94a3b8",
              mb: 1,
            }}
          >
            Ref: {property.refNo}
          </Typography>
        )}

        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 1,
            flexWrap: "wrap",
            mb: 1.5,
          }}
        >
          <StatusChip status={property.status} />

          <Typography sx={{ fontSize: 12, color: "#6b7280" }}>
            {property.category || "Uncategorized"}
          </Typography>
        </Box>

        <Divider sx={{ borderColor: "#f1f5f9", mb: 1.5 }} />

        <Box
          sx={{
            display: "flex",
            alignItems: "flex-start",
            gap: 1,
            minHeight: 38,
            mb: 1.5,
          }}
        >
          <LocationOnOutlined
            sx={{
              fontSize: 18,
              mt: 0.1,
              color: "#64748b",
              flexShrink: 0,
            }}
          />

          <Typography
            sx={{
              fontSize: 12,
              color: "#6b7280",
              lineHeight: 1.6,
              overflowWrap: "anywhere",
            }}
          >
            {property.address || "Address not provided"}
          </Typography>
        </Box>

        {property.size !== null && property.size !== undefined && property.size !== "" && (

          <Typography
            sx={{
              fontSize: 12,
              color: "#6b7280",
              mb: 1.5,
            }}
          >
            Size: {Number(property.size).toLocaleString("en-IN")}
          </Typography>

        )}

        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 1,
            bgcolor: "#f8fafc",
            borderRadius: 1.5,
            p: 1.25,
          }}
        >
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ fontSize: 11, color: "#6b7280" }}>
              {getPriceLabel(property)}
            </Typography>

            <Typography
              sx={{
                fontSize: 15,
                fontWeight: 700,
                color: "#1f2937",
                mt: 0.25,
                overflowWrap: "anywhere",
              }}
            >
              {formatPrice(price)}
            </Typography>
          </Box>

          <Button
            variant="outlined"
            size="small"
            startIcon={<EditOutlined />}
            onClick={() => onEdit(property)}
            sx={{
              flexShrink: 0,
              minWidth: 0,
              px: 1.25,
              textTransform: "none",
              borderRadius: 1.5,
            }}
          >
            Edit
          </Button>
        </Box>
      </Box>
    </Card>
  );
}

// --------------------------------------------------
// PROPERTY LIST ITEM
// --------------------------------------------------

function PropertyListItem({ property, onView, onEdit }) {
  return (
    <Paper
      elevation={0}
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 2,
        flexWrap: "wrap",
        p: 2,
        border: `1px solid ${BORDER_COLOR}`,
        borderRadius: 2,
        transition: "border-color 0.2s",
        "&:hover": {
          borderColor: "#93c5fd",
        },
      }}
    >
      <Box
        sx={{
          width: 58,
          height: 58,
          bgcolor: "#f1f5f9",
          borderRadius: 2,
          display: "grid",
          placeItems: "center",
          flexShrink: 0,
        }}
      >
        <HomeOutlined sx={{ color: "#94a3b8", fontSize: 32 }} />
      </Box>

      <Box sx={{ flex: "1 1 180px", minWidth: 0 }}>
        <Typography
          sx={{
            fontSize: 14,
            fontWeight: 600,
            overflowWrap: "anywhere",
          }}
        >
          {property.name || "Untitled Property"}
        </Typography>

        {property.refNo && (
          <Typography
            sx={{
              fontSize: 11,
              color: "#94a3b8",
              mt: 0.25,
            }}
          >
            Ref: {property.refNo}
          </Typography>
        )}

        <Typography
          sx={{
            fontSize: 12,
            color: "#6b7280",
            mt: 0.5,
            overflowWrap: "anywhere",
          }}
        >
          {property.address || "Address not provided"}
        </Typography>

        {property.category && (
          <Typography
            sx={{
              fontSize: 11,
              color: "#64748b",
              mt: 0.5,
            }}
          >
            {property.category}
            {property.city ? ` · ${property.city}` : ""}
          </Typography>
        )}
      </Box>

      <StatusChip status={property.status} />

      <Box sx={{ minWidth: 100 }}>
        <Typography sx={{ fontSize: 11, color: "#6b7280" }}>
          {getPriceLabel(property)}
        </Typography>

        <Typography sx={{ fontSize: 14, fontWeight: 700 }}>
          {formatPrice(getPropertyPrice(property))}
        </Typography>
      </Box>

      <Button
        variant="outlined"
        size="small"
        startIcon={<EditOutlined />}
        onClick={() => onEdit(property)}
        sx={{
          textTransform: "none",
          flexShrink: 0,
        }}
      >
        Edit
      </Button>

      <Button
        size="small"
        variant="outlined"
        onClick={() => onView(property)}
        sx={{ textTransform: "none" }}
      >
        Details
      </Button>
    </Paper>
  );
}

// --------------------------------------------------
// PROPERTY LOADING SKELETON
// --------------------------------------------------

function PropertySkeleton({ view }) {
  if (view === "list") {
    return (
      <Paper
        elevation={0}
        sx={{
          p: 2,
          border: `1px solid ${BORDER_COLOR}`,
          borderRadius: 2,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Skeleton variant="rounded" width={58} height={58} />

          <Box sx={{ flex: 1 }}>
            <Skeleton width="55%" height={22} />
            <Skeleton width="80%" height={18} />
          </Box>

          <Skeleton width={80} height={28} />
          <Skeleton width={90} height={32} />
        </Box>
      </Paper>
    );
  }

  return (
    <Paper
      elevation={0}
      sx={{
        overflow: "hidden",
        border: `1px solid ${BORDER_COLOR}`,
        borderRadius: 2.5,
      }}
    >
      <Skeleton variant="rectangular" height={140} />

      <Box sx={{ p: 2 }}>
        <Skeleton width="75%" height={24} />
        <Skeleton width="50%" height={22} />
        <Divider sx={{ my: 1.5 }} />
        <Skeleton width="90%" height={20} />
        <Skeleton width="60%" height={20} />
        <Skeleton
          variant="rounded"
          height={58}
          sx={{ mt: 2 }}
        />
      </Box>
    </Paper>
  );
}

// --------------------------------------------------
// MAIN PAGE
// --------------------------------------------------

export default function PropertyPage() {

  const router = useRouter();
  const { lang } = useParams()

  const { doGet, token } = useApi();

  const [view, setView] = useState("grid");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All Statuses");

  const [filters, setFilters] = useState(INITIAL_FILTERS);

  const [page, setPage] = useState(1);
  const pageSize = 8;

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [data, setData] = useState([]);

  const [dropdownData, setDropdownData] = useState({
    propertyGroup: [],
    propertyCategory: [],
    country: [],
  })


  // ------------------------------------------------
  // FETCH PROPERTIES FROM API
  // ------------------------------------------------

  const fetchProperties = useCallback(async () => {
    if (!token) {
      setData([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setLoadError("");

    try {
      const response = await doGet("company/property/fetch/data");

      const result = response?.data ?? response;
      const payload = result?.data ?? result;

      const properties = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.data)
          ? payload.data
          : [];

      console.log("Prop", response);

      setData(properties);

      setDropdownData({
        propertyGroup: Array.isArray(response?.propertyGroup) ? response.propertyGroup : [],
        propertyCategory: Array.isArray(response?.propertyCategory) ? response?.propertyCategory : [],
        country: Array.isArray(response?.country) ? response?.country : [],
      });

      setPage(1);
    } catch (error) {
      console.error("Failed to fetch properties:", error);

      setData([]);

      setLoadError(
        error?.message ||
        "Failed to load properties. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

  // ------------------------------------------------
  // DYNAMIC FILTER OPTIONS
  // ------------------------------------------------

  const filterConfig = useMemo(() => {
    const selectedStateProperties =
      filters.state === "All States"
        ? data
        : data.filter((property) => property.state === filters.state);

    const groups = dropdownData.propertyGroup
      .map((item) => item.name)
      .filter(Boolean);

    const categories = dropdownData.propertyCategory
      .map((item) => item.name)
      .filter(Boolean);

    const states = dropdownData.country.flatMap((country) =>
      (country.states || []).map((state) => state.state_name)
    );

    const cities = dropdownData.country.flatMap((country) =>
      (country.states || [])
        .filter(
          (state) =>
            filters.state === "All States" ||
            state.state_name === filters.state
        )
        .flatMap((state) =>
          (state.cities || []).map((city) => city.city_name)
        )
    );

    return [
      {
        key: "group",
        label: "All Groups",
        options: [...new Set(groups)],
      },
      {
        key: "category",
        label: "All Categories",
        options: [...new Set(categories)],
      },
    ];
  }, [data, dropdownData, filters.state]);

  // ------------------------------------------------
  // FILTER PROPERTIES
  // ------------------------------------------------

  const filteredProperties = useMemo(() => {
    const query = search.trim().toLowerCase();

    return data.filter((property) => {
      const searchableFields = [
        property.name,
        property.refNo,
        property.address,
        property.category,
        property.group,
        property.city,
        property.state,
        property.country,
        property.owner,
        property.kind,
        property.type,
        property.status,
      ];

      const matchesSearch =
        !query ||
        searchableFields.some((value) =>
          String(value ?? "").toLowerCase().includes(query)
        );

      return (
        matchesSearch &&
        (status === "All Statuses" ||
          property.status === status) &&
        (filters.group === "All Groups" ||
          property.group === filters.group) &&
        (filters.category === "All Categories" ||
          property.category === filters.category) &&
        (filters.state === "All States" ||
          property.state === filters.state) &&
        (filters.city === "All Cities" ||
          property.city === filters.city)
      );
    });
  }, [data, search, status, filters]);

  // ------------------------------------------------
  // PAGINATION
  // ------------------------------------------------

  const pageCount = Math.max(
    1,
    Math.ceil(filteredProperties.length / pageSize)
  );

  const currentPage = Math.min(page, pageCount);

  const visibleProperties = filteredProperties.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // ------------------------------------------------
  // FILTER HANDLERS
  // ------------------------------------------------

  const updateFilter = (key, value) => {
    setFilters((previous) => ({
      ...previous,
      [key]: value,
      ...(key === "state" ? { city: "All Cities" } : {}),
    }));

    setPage(1);
  };

  const resetFilters = () => {
    setSearch("");
    setStatus("All Statuses");
    setFilters({ ...INITIAL_FILTERS });
    setPage(1);
  };

  // ------------------------------------------------
  // EXPORT CSV
  // ------------------------------------------------

  const exportProperties = () => {
    if (!filteredProperties.length) {
      window.alert("No properties available to export.");
      return;
    }

    const headers = [
      "ID",
      "Property Name",
      "Reference Number",
      "Status",
      "Property Type",
      "Category",
      "Group",
      "Address",
      "City",
      "State",
      "Country",
      "Owner",
      "Phone",
      "Pricing Type",
      "Price",
      "Size",
      "Description",
    ];

    const rows = filteredProperties.map((property) => [
      property.id,
      property.name,
      property.refNo,
      property.status,
      property.kind,
      property.category,
      property.group,
      property.address,
      property.city,
      property.state,
      property.country,
      property.owner,
      property.phone,
      property.pricingType,
      getPropertyPrice(property),
      property.size,
      property.description,
    ]);

    const csv = [headers, ...rows]
      .map((row) => row.map(escapeCsv).join(","))
      .join("\r\n");

    const blob = new Blob(["\uFEFF", csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "properties.csv";

    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);
  };

  // ------------------------------------------------
  // IMPORT FILE
  // ------------------------------------------------

  const handleImport = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    window.alert(
      `Selected ${file.name}. Connect your import API to process this file.`
    );

    event.target.value = "";
  };

  // ------------------------------------------------
  // PROPERTY DETAILS
  // ------------------------------------------------

  const handleViewProperty = (property) => {
    // Replace this with your actual property details route.
    window.alert(
      `Property: ${property.name}\nID: ${property.id}`
    );
  };

  // ------------------------------------------------
  // DYNAMIC STATISTICS
  // ------------------------------------------------

  const stats = useMemo(
    () => [
      {
        label: "All Properties",
        value: data.length,
        icon: Apartment,
      },
      {
        label: "Vacant",
        value: data.filter((p) => p.status === "Vacant").length,
        icon: Home,
      },
      {
        label: "Occupied",
        value: data.filter((p) => p.status === "Occupied").length,
        icon: Person,
      },
      {
        label: "Under Maintenance",
        value: data.filter(
          (p) => p.status === "Under Maintenance"
        ).length,
        icon: Apartment,
      },
    ],
    [data]
  );

  const handleEditProperty = (property) => {

    const propertyId = property?._id || property?.id;

    router.push(
      `/${lang}/apps/property/create/${propertyId}`
    );
  };

  // ------------------------------------------------
  // RENDER
  // ------------------------------------------------

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#f8fafc" }}>
      <Container
        maxWidth={false}
        sx={{
          maxWidth: 1800,
          py: 3.5,
          px: { xs: 2, md: 4 },
        }}
      >
        {/* PAGE HEADER */}

        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: { xs: "flex-start", md: "center" },
            flexWrap: "wrap",
            gap: 2,
            mb: 3,
          }}
        >
          <Box>
            <Typography
              sx={{
                fontSize: { xs: 24, md: 28 },
                fontWeight: 700,
                color: "#1f2937",
              }}
            >
              Properties
            </Typography>

            <Typography
              sx={{
                fontSize: 13,
                color: "#6b7280",
                mt: 0.75,
              }}
            >
              Manage and monitor all your properties.
            </Typography>
          </Box>

          <Box
            sx={{
              display: "flex",
              gap: 1,
              flexWrap: "wrap",
            }}
          >
            <Button
              variant="outlined"
              startIcon={<Chat />}
              onClick={() =>
                window.alert("Connect your public inquiry page.")
              }
            >
              Public Inquiry
            </Button>

            <Button
              variant="outlined"
              startIcon={<FileDownloadOutlined />}
              onClick={exportProperties}
              disabled={loading || filteredProperties.length === 0}
            >
              Export
            </Button>

            <Button
              variant="outlined"
              component="label"
              startIcon={<FileUploadOutlined />}
            >
              Import

              <input
                type="file"
                hidden
                accept=".csv,.xlsx,.xls"
                onChange={handleImport}
              />
            </Button>

            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => router.push("/en/apps/property/create")}
            >
              Create Property
            </Button>
          </Box>
        </Box>

        {/* STATISTICS */}

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "repeat(2, minmax(0, 1fr))",
              sm: "repeat(2, minmax(0, 1fr))",
              md: "repeat(4, minmax(0, 1fr))",
            },
            gap: 2,
            mb: 3,
          }}
        >
          {stats.map((stat) => (
            <StatCard key={stat.label} {...stat} />
          ))}
        </Box>

        {/* FILTER PANEL */}

        <Paper
          elevation={0}
          sx={{
            p: { xs: 2, md: 2.5 },
            border: `1px solid ${BORDER_COLOR}`,
            borderRadius: 2.5,
            mb: 2.5,
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 1,
              flexWrap: "wrap",
              mb: 2,
            }}
          >
            <Typography sx={{ fontSize: 16, fontWeight: 700 }}>
              Property Directory
            </Typography>

            <Button variant="outlined" onClick={resetFilters}>
              Clear Filters
            </Button>
          </Box>

          <Divider sx={{ mb: 2 }} />

          {/* SEARCH AND STATUS */}

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                sm: "2fr 1fr",
              },
              gap: 1.5,
              mb: 1.5,
            }}
          >
            <TextField
              fullWidth
              size="small"
              placeholder="Search properties..."
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              sx={CONTROL_SX}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search sx={{ fontSize: 20 }} />
                    </InputAdornment>
                  ),
                },
              }}
            />

            <Select
              fullWidth
              value={status}
              onChange={(event) => {
                setStatus(event.target.value);
                setPage(1);
              }}
              sx={CONTROL_SX}
            >
              <MenuItem value="All Statuses">
                All Statuses
              </MenuItem>

              {STATUS_OPTIONS.map((option) => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))}
            </Select>
          </Box>

          {/* DYNAMIC FILTERS */}

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "repeat(2, minmax(0, 1fr))",
                sm: "repeat(2, minmax(0, 1fr))",
                lg: "repeat(4, minmax(0, 1fr))",
              },
              gap: 1.5,
            }}
          >
            {filterConfig.map((filter) => (
              <Select
                key={filter.key}
                fullWidth
                value={filters[filter.key]}
                onChange={(event) =>
                  updateFilter(filter.key, event.target.value)
                }
                displayEmpty
                sx={CONTROL_SX}
                renderValue={(value) => value}
              >
                <MenuItem value={filter.label}>
                  {filter.label}
                </MenuItem>

                {filter.options.map((option) => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
              </Select>
            ))}
          </Box>

        </Paper>

        {/* RESULTS TOOLBAR */}

        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 1.5,
            mb: 2,
          }}
        >
          <Typography sx={{ fontSize: 13, color: "#6b7280" }}>
            Showing{" "}
            <Box
              component="span"
              sx={{ color: "#1f2937", fontWeight: 700 }}
            >
              {loading
                ? 0
                : filteredProperties.length === 0
                  ? 0
                  : (currentPage - 1) * pageSize + 1}
              {"–"}
              {loading
                ? 0
                : Math.min(
                  currentPage * pageSize,
                  filteredProperties.length
                )}
            </Box>{" "}
            of{" "}
            <Box
              component="span"
              sx={{ color: "#1f2937", fontWeight: 700 }}
            >
              {loading ? "..." : filteredProperties.length}
            </Box>{" "}
            properties
          </Typography>

          <ToggleButtonGroup
            exclusive
            size="small"
            value={view}
            onChange={(_, value) => {
              if (value) setView(value);
            }}
            sx={{
              bgcolor: "#fff",
              border: `1px solid ${BORDER_COLOR}`,
              borderRadius: 2,
              "& .MuiToggleButton-root": {
                border: 0,
                px: 1.25,
                color: "#6b7280",
                borderRadius: "7px !important",
              },
              "& .Mui-selected": {
                bgcolor: "#eff6ff !important",
                color: "#2563eb !important",
              },
            }}
          >
            <ToggleButton value="list" aria-label="List view">
              <ViewList fontSize="small" />
            </ToggleButton>

            <ToggleButton value="grid" aria-label="Grid view">
              <GridView fontSize="small" />
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>

        {/* LOADING STATE */}

        {loading && (
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns:
                view === "list"
                  ? "1fr"
                  : {
                    xs: "1fr",
                    sm: "repeat(2, minmax(0, 1fr))",
                    lg: "repeat(3, minmax(0, 1fr))",
                    xl: "repeat(4, minmax(0, 1fr))",
                  },
              gap: 2.5,
            }}
          >
            {Array.from({ length: 8 }).map((_, index) => (
              <PropertySkeleton key={index} view={view} />
            ))}
          </Box>
        )}

        {/* ERROR STATE */}

        {!loading && loadError && (
          <Paper
            elevation={0}
            sx={{
              p: 4,
              textAlign: "center",
              border: `1px solid ${BORDER_COLOR}`,
              borderRadius: 2.5,
            }}
          >
            <Alert severity="error" sx={{ mb: 2, textAlign: "left" }}>
              {loadError}
            </Alert>

            <Button variant="contained" onClick={fetchProperties}>
              Retry
            </Button>
          </Paper>
        )}

        {/* PROPERTY RESULTS */}

        {!loading && !loadError && (
          <>
            {visibleProperties.length > 0 ? (
              view === "list" ? (
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 1.5,
                  }}
                >
                  {visibleProperties.map((property) => (
                    <PropertyListItem
                      key={property.id}
                      property={property}
                      onView={handleViewProperty}
                      onEdit={handleEditProperty}
                    />
                  ))}
                </Box>
              ) : (
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: {
                      xs: "1fr",
                      sm: "repeat(2, minmax(0, 1fr))",
                      lg: "repeat(3, minmax(0, 1fr))",
                      xl: "repeat(4, minmax(0, 1fr))",
                    },
                    gap: 2.5,
                    alignItems: "stretch",
                  }}
                >
                  {visibleProperties.map((property) => (
                    <PropertyCard
                      key={property.id}
                      property={property}
                      onView={handleViewProperty}
                      onEdit={handleEditProperty}
                    />
                  ))}
                </Box>
              )
            ) : (
              <Paper
                elevation={0}
                sx={{
                  p: 6,
                  textAlign: "center",
                  border: `1px solid ${BORDER_COLOR}`,
                  borderRadius: 2.5,
                }}
              >
                <Search
                  sx={{
                    fontSize: 38,
                    mb: 1,
                    color: "#94a3b8",
                  }}
                />

                <Typography
                  sx={{
                    fontSize: 17,
                    fontWeight: 700,
                    mb: 0.5,
                  }}
                >
                  No properties found
                </Typography>

                <Typography
                  sx={{
                    fontSize: 13,
                    color: "#6b7280",
                    mb: 2,
                  }}
                >
                  {data.length === 0
                    ? "No properties have been added yet."
                    : "Try changing your search or filters."}
                </Typography>

                {data.length > 0 && (
                  <Button
                    variant="outlined"
                    onClick={resetFilters}
                  >
                    Clear Filters
                  </Button>
                )}

                {data.length === 0 && (
                  <Button
                    variant="contained"
                    startIcon={<Add />}
                    onClick={() =>
                      router.push("/en/apps/property/create")
                    }
                  >
                    Create Property
                  </Button>
                )}
              </Paper>
            )}

            {/* PAGINATION */}

            {filteredProperties.length > pageSize && (
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mt: 3,
                  gap: 1,
                  flexWrap: "wrap",
                }}
              >
                <Typography
                  sx={{ fontSize: 12, color: "#6b7280" }}
                >
                  Page {currentPage} of {pageCount}
                </Typography>

                <Box sx={{ display: "flex", gap: 1 }}>
                  <Button
                    variant="outlined"
                    disabled={currentPage === 1}
                    onClick={() =>
                      setPage((previous) =>
                        Math.max(1, previous - 1)
                      )
                    }
                    sx={{
                      borderColor: BORDER_COLOR,
                      color: "#374151",
                    }}
                  >
                    Previous
                  </Button>

                  <Button
                    variant="contained"
                    disabled={currentPage === pageCount}
                    onClick={() =>
                      setPage((previous) =>
                        Math.min(pageCount, previous + 1)
                      )
                    }
                  >
                    Next
                  </Button>
                </Box>
              </Box>
            )}
          </>
        )}
      </Container>
    </Box>
  );
}
