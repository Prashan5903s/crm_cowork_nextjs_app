"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import {
    Autocomplete,
    Box,
    Button,
    Checkbox,
    Chip,
    CircularProgress,
    Divider,
    FormControlLabel,
    IconButton,
    Link,
    MenuItem,
    Paper,
    Select,
    Skeleton,
    Stack,
    Tab,
    Tabs,
    TextField,
    ToggleButton,
    ToggleButtonGroup,
    Tooltip,
    Typography,
    Alert,
} from "@mui/material";

import {
    ArrowBack,
    Check,
    Close,
    CloudUploadOutlined,
    Code,
    FormatBold,
    FormatItalic,
    FormatListBulleted,
    FormatListNumbered,
    FormatQuote,
    FormatStrikethrough,
    HomeOutlined,
    LocalOfferOutlined,
    Redo,
    Undo,
    VideocamOutlined,
} from "@mui/icons-material";

import { useApi } from "@/utils/api";

import { getCountries, getCountryCallingCode } from 'libphonenumber-js'

import * as Flags from 'country-flag-icons/react/3x2'

/* -------------------------------------------------------
   Constants
------------------------------------------------------- */

const LABEL_SX = {
    fontSize: 14,
    fontWeight: 600,
    color: "text.primary",
    mb: 0.8,
};

const inputSx = {
    "& .MuiOutlinedInput-root": {
        minHeight: 44,
        fontSize: 14,
        borderRadius: 1.5,
        bgcolor: "background.paper",
    },
    "& .MuiOutlinedInput-notchedOutline": {
        borderColor: "divider",
    },
    "& .MuiInputBase-input": {
        py: 1.2,
        px: 1.5,
    },
    "& .MuiInputBase-input::placeholder": {
        fontSize: 14,
        opacity: 0.75,
    },
    "& .MuiSelect-select": {
        py: 1.2,
    },
};

const grid4 = {
    display: "grid",
    gap: 2,
    gridTemplateColumns: {
        xs: "1fr",
        sm: "repeat(2, minmax(0, 1fr))",
        lg: "repeat(4, minmax(0, 1fr))",
    },
};

const grid3 = {
    display: "grid",
    gap: 2,
    gridTemplateColumns: {
        xs: "1fr",
        sm: "repeat(2, minmax(0, 1fr))",
        lg: "repeat(3, minmax(0, 1fr))",
    },
};

const STATUSES = ["Vacant", "Reserved", "Occupied", "Unavailable"];
const TAXES = ["GST 18%", "GST 12%", "GST 5%", "No Tax"];
const TERMS = ["Monthly", "Quarterly", "Half-yearly", "Yearly"];

const initialData = {
    title: "New Property - 1038",
    refNo: "",
    status: "Vacant",
    category: "",
    group: "",
    type: "",
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
    dial: "",
    phone: "",
};

const initialFiles = {
    photos: [],
    videos: [],
    ownership: [],
    other: [],
};

const regionNames = new Intl.DisplayNames(['en'], {
    type: 'region',
})

const COUNTRIES = getCountries()
    .map(iso => ({
        iso,
        name: regionNames.of(iso) || iso,
        dial: `+${getCountryCallingCode(iso)}`,
    }))
    .sort((a, b) => a.name.localeCompare(b.name))

const Flag = ({ iso }) => {
    const F = Flags[iso]

    return F ? (
        <F
            title={iso}
            style={{
                width: 22,
                height: 15,
                borderRadius: 2,
                flexShrink: 0,
                display: 'block',
            }}
        />
    ) : null
}

/* -------------------------------------------------------
   Reusable form components
------------------------------------------------------- */

const Field = ({ label, required, children, sx = {} }) => (
    <Box sx={{ minWidth: 0, ...sx }}>
        <Typography sx={LABEL_SX}>
            {label}
            {required && (
                <Box component="span" sx={{ color: "error.main", ml: 0.3 }}>
                    *
                </Box>
            )}
        </Typography>
        {children}
    </Box>
);

const TextInput = ({ sx, ...props }) => (
    <TextField
        fullWidth
        size="small"
        sx={{ ...inputSx, ...sx }}
        {...props}
    />
);

const SmartSelect = ({
    value,
    onChange,
    options = [],
    placeholder = "Select an option",
    disabled = false,
    loading = false,
    labelKey = "name",
    valueKey = "_id",
}) => {
    const isObjectOptions = options.some(
        (option) => option && typeof option === "object"
    );

    if (isObjectOptions) {
        const selectedOption =
            options.find(
                (option) => String(option?.[valueKey]) === String(value)
            ) || null;

        return (
            <Autocomplete
                fullWidth
                size="small"
                options={options}
                value={selectedOption}
                loading={loading}
                disabled={disabled}
                onChange={(_, newValue) =>
                    onChange(
                        newValue ? String(newValue[valueKey]) : ""
                    )
                }
                getOptionLabel={(option) =>
                    String(option?.[labelKey] ?? "")
                }
                isOptionEqualToValue={(option, selected) =>
                    String(option?.[valueKey]) ===
                    String(selected?.[valueKey])
                }
                renderInput={(params) => (
                    <TextField
                        {...params}
                        placeholder={placeholder}
                        sx={inputSx}
                        InputProps={{
                            ...params.InputProps,
                            endAdornment: (
                                <>
                                    {loading && (
                                        <CircularProgress size={18} color="inherit" />
                                    )}
                                    {params.InputProps.endAdornment}
                                </>
                            ),
                        }}
                    />
                )}
            />
        );
    }

    return (
        <Select
            fullWidth
            size="small"
            displayEmpty
            disabled={disabled}
            value={value ?? ""}
            onChange={(event) => onChange(event.target.value)}
            renderValue={(selected) =>
                selected || (
                    <Box sx={{ color: "text.disabled" }}>
                        {placeholder}
                    </Box>
                )
            }
            sx={{
                minHeight: 44,
                fontSize: 14,
                borderRadius: 1.5,
                bgcolor: disabled ? "action.hover" : "background.paper",
                "& .MuiOutlinedInput-notchedOutline": {
                    borderColor: "divider",
                },
            }}
        >
            {options.map((option) => (
                <MenuItem key={option} value={option} sx={{ fontSize: 14 }}>
                    {option}
                </MenuItem>
            ))}
        </Select>
    );
};


/* -------------------------------------------------------
   Skeleton components
------------------------------------------------------- */

const PropertyTypeSkeleton = () => (
    <Box
        sx={{
            display: "grid",
            gap: 2,
            gridTemplateColumns: {
                xs: "1fr",
                sm: "repeat(2, minmax(0, 1fr))",
                md: "repeat(3, minmax(0, 1fr))",
            },
        }}
    >
        {[1, 2, 3].map((item) => (
            <Paper
                key={item}
                variant="outlined"
                sx={{
                    p: 3,
                    minHeight: 240,
                    borderRadius: 2,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 2,
                }}
            >
                <Skeleton variant="rounded" width={64} height={64} />
                <Skeleton variant="text" width="65%" height={30} />
                <Skeleton variant="text" width="85%" height={22} />
                <Skeleton variant="rounded" width={100} height={28} />
            </Paper>
        ))}
    </Box>
);

const FieldSkeleton = ({ width = "100%" }) => (
    <Box sx={{ minWidth: 0 }}>
        <Skeleton variant="text" width={115} height={25} sx={{ mb: 0.5 }} />
        <Skeleton
            variant="rounded"
            width={width}
            height={44}
            sx={{ borderRadius: 1.5 }}
        />
    </Box>
);

const FormSkeleton = () => (
    <Paper variant="outlined" sx={{ borderRadius: 2, overflow: "hidden" }}>
        <Box sx={{ px: 2, borderBottom: 1, borderColor: "divider" }}>
            <Stack direction="row" spacing={3}>
                {[1, 2, 3].map((item) => (
                    <Skeleton key={item} width={130} height={54} />
                ))}
            </Stack>
        </Box>

        <Box sx={{ p: { xs: 2, sm: 3 } }}>
            <Skeleton variant="text" width={200} height={32} />
            <Skeleton variant="text" width={290} height={24} sx={{ mb: 2 }} />

            <Box sx={grid3}>
                {Array.from({ length: 7 }).map((_, index) => (
                    <FieldSkeleton key={index} />
                ))}
            </Box>

            <Divider sx={{ my: 3 }} />

            <Skeleton variant="text" width={200} height={32} />
            <Skeleton variant="text" width={280} height={24} sx={{ mb: 2 }} />

            <Box sx={grid3}>
                {Array.from({ length: 3 }).map((_, index) => (
                    <FieldSkeleton key={index} />
                ))}
            </Box>

            <Divider sx={{ my: 3 }} />

            <Skeleton variant="text" width={220} height={32} />
            <Skeleton
                variant="rounded"
                height={150}
                sx={{ mt: 1, borderRadius: 1.5 }}
            />
        </Box>

        <Divider />

        <Stack
            direction="row"
            justifyContent="space-between"
            sx={{ p: 2 }}
        >
            <Skeleton variant="rounded" width={95} height={40} />
            <Skeleton variant="rounded" width={80} height={24} />
            <Skeleton variant="rounded" width={90} height={40} />
        </Stack>
    </Paper>
);

/* -------------------------------------------------------
   Step 1: Property type selection
------------------------------------------------------- */

const SelectTypeStep = ({
    selected,
    onSelect,
    agreed,
    onAgree,
    onContinue,
    onRetry,
    createData,
    loading,
    error,
}) => {
    const propertyTypes = createData?.propertyType ?? [];

    return (
        <Paper
            variant="outlined"
            sx={{
                maxWidth: 1050,
                width: "100%",
                mx: "auto",
                mt: { xs: 1, md: 2 },
                p: { xs: 2, sm: 3, md: 4 },
                borderRadius: 2,
                borderColor: "divider",
            }}
        >
            <Typography
                align="center"
                sx={{ fontSize: { xs: 22, md: 26 }, fontWeight: 600 }}
            >
                Select Property Type
            </Typography>

            <Typography
                align="center"
                sx={{
                    color: "text.secondary",
                    mt: 1,
                    maxWidth: 550,
                    mx: "auto",
                    fontSize: 14,
                    lineHeight: 1.7,
                }}
            >
                Select the type of property you are creating. This helps customize
                the settings and layout for your needs.
            </Typography>

            <Box sx={{ mt: 3 }}>
                {loading ? (
                    <PropertyTypeSkeleton />
                ) : error ? (
                    <Box sx={{ py: 4, textAlign: "center" }}>
                        <Typography color="error" sx={{ mb: 2 }}>
                            {error}
                        </Typography>
                        <Button variant="outlined" onClick={onRetry}>
                            Retry
                        </Button>
                    </Box>
                ) : propertyTypes.length ? (
                    <Box
                        sx={{
                            display: "grid",
                            gap: 2,
                            gridTemplateColumns: {
                                xs: "1fr",
                                sm: "repeat(2, minmax(0, 1fr))",
                                md: "repeat(3, minmax(0, 1fr))",
                            },
                        }}
                    >
                        {propertyTypes.map(({ _id, name }) => {
                            const active = selected === _id;

                            return (
                                <Paper
                                    key={_id}
                                    variant="outlined"
                                    role="button"
                                    tabIndex={0}
                                    aria-pressed={active}
                                    onClick={() => onSelect(_id)}
                                    onKeyDown={(event) => {
                                        if (event.key === "Enter" || event.key === " ") {
                                            event.preventDefault();
                                            onSelect(_id);
                                        }
                                    }}
                                    sx={{
                                        cursor: "pointer",
                                        textAlign: "center",
                                        border: "1.5px solid",
                                        borderColor: active ? "primary.main" : "divider",
                                        borderRadius: 2,
                                        p: { xs: 2.5, md: 3 },
                                        minHeight: 240,
                                        display: "flex",
                                        flexDirection: "column",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        transition: "border-color 0.2s, box-shadow 0.2s",
                                        boxShadow: active ? 2 : 0,
                                        "&:hover": {
                                            borderColor: "primary.main",
                                            boxShadow: 2,
                                        },
                                        "&:focus-visible": {
                                            outline: "2px solid",
                                            outlineColor: "primary.main",
                                            outlineOffset: 2,
                                        },
                                    }}
                                >
                                    <Typography sx={{ fontSize: 18, fontWeight: 600 }}>
                                        {name}
                                    </Typography>

                                    {active && (
                                        <Chip
                                            icon={<Check sx={{ fontSize: "16px !important" }} />}
                                            label="Selected"
                                            color="primary"
                                            size="small"
                                            sx={{ mt: 2 }}
                                        />
                                    )}
                                </Paper>
                            );
                        })}
                    </Box>
                ) : (
                    <Typography
                        align="center"
                        color="text.secondary"
                        sx={{ py: 5, fontSize: 14 }}
                    >
                        No property types are available.
                    </Typography>
                )}
            </Box>

            <Divider sx={{ my: 3 }} />

            <Stack alignItems="center" spacing={2}>
                <FormControlLabel
                    sx={{
                        alignItems: "flex-start",
                        mx: 0,
                        "& .MuiFormControlLabel-label": { pt: 0.5 },
                    }}
                    control={
                        <Checkbox
                            size="small"
                            checked={agreed}
                            onChange={(event) => onAgree(event.target.checked)}
                        />
                    }
                    label={
                        <Typography sx={{ fontSize: 13, lineHeight: 1.8 }}>
                            I agree to the{" "}
                            <Link href="#" underline="hover">
                                Terms and Conditions
                            </Link>{" "}
                            and the{" "}
                            <Link href="#" underline="hover">
                                Software Subscription Agreement
                            </Link>
                            .
                        </Typography>
                    }
                />

                <Button
                    variant="contained"
                    disableElevation
                    disabled={loading || !selected || !agreed || !!error}
                    onClick={onContinue}
                    sx={{
                        minWidth: 160,
                        minHeight: 44,
                        px: 4,
                        fontSize: 14,
                        fontWeight: 600,
                        textTransform: "none",
                        borderRadius: 1.5,
                    }}
                >
                    Continue
                </Button>
            </Stack>
        </Paper>
    );
};

/* -------------------------------------------------------
   Description toolbar
------------------------------------------------------- */

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
            sx={{
                px: 1,
                py: 0.75,
                flexWrap: "wrap",
                bgcolor: "background.paper",
                borderBottom: 1,
                borderColor: "divider",
            }}
        >
            {groups.map((group, index) => (
                <Stack key={index} direction="row" spacing={0.5}>
                    {group.map((Item, itemIndex) => (
                        <Tooltip
                            key={itemIndex}
                            title={typeof Item === "string" ? Item : "Formatting"}
                        >
                            <IconButton
                                size="small"
                                type="button"
                                sx={{
                                    width: 32,
                                    height: 32,
                                    borderRadius: 1,
                                    fontSize: 12,
                                    fontWeight: 700,
                                }}
                            >
                                {typeof Item === "string" ? (
                                    Item
                                ) : (
                                    <Item sx={{ fontSize: 18 }} />
                                )}
                            </IconButton>
                        </Tooltip>
                    ))}
                </Stack>
            ))}
        </Stack>
    );
};

/* -------------------------------------------------------
   Tab 1: Basic information
------------------------------------------------------- */

const BasicInfoTab = ({ data, set, createData }) => {
    const addPricingTerm = (name) => {
        if (!name || data.terms.some((term) => term.name === name)) return;

        set("terms", [...data.terms, { name, price: "" }]);
    };


    return (
        <Stack spacing={2.5}>
            <Box>
                <Typography sx={{ fontSize: 16, fontWeight: 600, mb: 0.5 }}>
                    General Information
                </Typography>

                <Typography sx={{ fontSize: 13, color: "text.secondary", mb: 2 }}>
                    Enter the basic details of your property.
                </Typography>

                <Box sx={grid3}>
                    <Field label="Title" required>
                        <TextInput
                            value={data.title}
                            onChange={(event) => set("title", event.target.value)}
                            placeholder="Enter property title"
                        />
                    </Field>

                    <Field label="Reference No">
                        <TextInput
                            placeholder="Enter reference number"
                            value={data.refNo}
                            onChange={(event) => set("refNo", event.target.value)}
                        />
                    </Field>

                    <Field label="Status" required>
                        <SmartSelect
                            value={data.status}
                            onChange={(value) => set("status", value)}
                            options={STATUSES}
                            placeholder="Select status"
                        />
                    </Field>

                    <Field label="Category" required>
                        <SmartSelect
                            value={data.category}
                            onChange={(value) => set("category", value)}
                            options={createData?.propertyCategory ?? []}
                            placeholder="Select category"
                        />
                    </Field>

                    <Field label="Property Group" required>
                        <SmartSelect
                            value={data.group}
                            onChange={(value) => set("group", value)}
                            options={createData?.propertyGroup ?? []}
                            placeholder="Select property group"
                        />
                    </Field>

                    <Field label="Property Type" required>
                        <SmartSelect
                            value={data.type}
                            onChange={(value) => set("type", value)}
                            options={createData?.propertyType ?? []}
                            placeholder="Select property type"
                        />
                    </Field>

                    <Field label="Size" required>
                        <TextInput
                            type="number"
                            placeholder="Enter property size"
                            value={data.size}
                            onChange={(event) => set("size", event.target.value)}
                            inputProps={{ min: 0, step: "any" }}
                        />
                    </Field>
                </Box>
            </Box>

            <Divider />

            <Box>
                <Typography sx={{ fontSize: 16, fontWeight: 600, mb: 0.5 }}>
                    Pricing Information
                </Typography>

                <Typography sx={{ fontSize: 13, color: "text.secondary", mb: 2 }}>
                    Set the rental or sale price and applicable tax.
                </Typography>

                <Box
                    sx={{
                        display: "grid",
                        gap: 2,
                        gridTemplateColumns: {
                            xs: "1fr",
                            md: "repeat(2, minmax(0, 1fr))",
                        },
                    }}
                >
                    <Field label="Pricing Type">
                        <ToggleButtonGroup
                            exclusive
                            fullWidth
                            size="small"
                            value={data.pricingType}
                            onChange={(_, value) => {
                                if (value !== null) set("pricingType", value);
                            }}
                            sx={{
                                p: 0.5,
                                border: 1,
                                borderColor: "divider",
                                borderRadius: 1.5,
                                "& .MuiToggleButtonGroup-grouped": {
                                    border: 0,
                                    borderRadius: "8px !important",
                                    margin: 0,
                                },
                                "& .MuiToggleButton-root": {
                                    flex: 1,
                                    minHeight: 40,
                                    fontSize: 14,
                                    fontWeight: 500,
                                    textTransform: "none",
                                    gap: 1,
                                    color: "text.secondary",
                                },
                                "& .MuiToggleButton-root.Mui-selected": {
                                    bgcolor: "action.selected",
                                    color: "text.primary",
                                    fontWeight: 600,
                                },
                            }}
                        >
                            <ToggleButton value="rent">
                                <HomeOutlined sx={{ fontSize: 18 }} />
                                For Rent
                            </ToggleButton>

                            <ToggleButton value="sale">
                                <LocalOfferOutlined sx={{ fontSize: 18 }} />
                                For Sale
                            </ToggleButton>
                        </ToggleButtonGroup>
                    </Field>

                    <Field label="Tax" required>
                        <SmartSelect
                            value={data.tax}
                            onChange={(value) => set("tax", value)}
                            options={TAXES}
                            placeholder="Select tax"
                        />
                    </Field>
                </Box>

                {data.pricingType === "rent" && (
                    <Box sx={{ mt: 2.5, maxWidth: { md: 650 } }}>
                        <Stack
                            direction="row"
                            alignItems="center"
                            spacing={1}
                            sx={{ mb: 1 }}
                        >
                            <Typography sx={{ fontSize: 14, fontWeight: 600 }}>
                                Rental Pricing
                            </Typography>

                            <Chip
                                label={`${data.terms.length} selected`}
                                size="small"
                                sx={{
                                    height: 24,
                                    fontSize: 12,
                                    bgcolor: "#fef3c7",
                                    color: "#92400e",
                                    border: "1px solid #fcd34d",
                                }}
                            />
                        </Stack>

                        <SmartSelect
                            value=""
                            placeholder="Add another pricing term"
                            options={TERMS.filter(
                                (term) => !data.terms.some((item) => item.name === term)
                            )}
                            onChange={addPricingTerm}
                        />

                        <Stack spacing={1.5} sx={{ mt: 1.5 }}>
                            {data.terms.map((term, index) => (
                                <Paper
                                    key={term.name}
                                    variant="outlined"
                                    sx={{
                                        p: 1.5,
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 1.5,
                                        flexWrap: "wrap",
                                        borderRadius: 1.5,
                                    }}
                                >
                                    <Check color="primary" sx={{ fontSize: 18 }} />

                                    <Typography sx={{ fontSize: 14, fontWeight: 600 }}>
                                        {term.name}
                                    </Typography>

                                    {index === 0 && (
                                        <Chip
                                            label="Default"
                                            size="small"
                                            sx={{ height: 22, fontSize: 11 }}
                                        />
                                    )}

                                    <Box sx={{ flex: 1 }} />

                                    <TextField
                                        size="small"
                                        type="number"
                                        inputProps={{ min: 0, step: "0.01" }}
                                        placeholder="0.00"
                                        value={term.price}
                                        onChange={(event) =>
                                            set(
                                                "terms",
                                                data.terms.map((item, itemIndex) =>
                                                    itemIndex === index
                                                        ? { ...item, price: event.target.value }
                                                        : item
                                                )
                                            )
                                        }
                                        sx={{ width: 140, ...inputSx }}
                                        InputProps={{
                                            startAdornment: (
                                                <Typography sx={{ fontSize: 14, mr: 0.5 }}>
                                                    ₹
                                                </Typography>
                                            ),
                                        }}
                                    />

                                    <Typography sx={{ fontSize: 13, color: "text.secondary" }}>
                                        /
                                        {{
                                            Monthly: "mo",
                                            Quarterly: "quarter",
                                            "Half-yearly": "6 months",
                                            Yearly: "year",
                                        }[term.name]}
                                    </Typography>

                                    {index > 0 && (
                                        <Tooltip title="Remove pricing term">
                                            <IconButton
                                                size="small"
                                                color="error"
                                                onClick={() =>
                                                    set(
                                                        "terms",
                                                        data.terms.filter(
                                                            (_, itemIndex) => itemIndex !== index
                                                        )
                                                    )
                                                }
                                            >
                                                <Close fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                    )}
                                </Paper>
                            ))}
                        </Stack>
                    </Box>
                )}

                {data.pricingType === "sale" && (
                    <Field label="Sale Price" sx={{ mt: 2.5, maxWidth: 420 }}>
                        <TextInput
                            type="number"
                            inputProps={{ min: 0, step: "0.01" }}
                            placeholder="Enter sale price"
                            value={data.salePrice}
                            onChange={(event) => set("salePrice", event.target.value)}
                        />
                    </Field>
                )}
            </Box>

            <Divider />

            <Box>
                <Typography sx={{ fontSize: 16, fontWeight: 600, mb: 0.5 }}>
                    Property Description
                </Typography>

                <Typography sx={{ fontSize: 13, color: "text.secondary", mb: 1.5 }}>
                    Add details that help describe your property.
                </Typography>

                <Field label="Description">
                    <Paper
                        variant="outlined"
                        sx={{
                            borderColor: "divider",
                            borderRadius: 1.5,
                            overflow: "hidden",
                        }}
                    >
                        <RichToolbar />

                        <TextField
                            multiline
                            minRows={5}
                            maxRows={12}
                            fullWidth
                            placeholder="Enter property description..."
                            value={data.description}
                            onChange={(event) => set("description", event.target.value)}
                            sx={{
                                "& .MuiOutlinedInput-root": {
                                    p: 1.5,
                                    fontSize: 14,
                                    alignItems: "flex-start",
                                },
                                "& fieldset": { border: 0 },
                                "& textarea": { lineHeight: 1.8 },
                            }}
                        />
                    </Paper>
                </Field>
            </Box>
        </Stack>
    );
};

/* -------------------------------------------------------
   Tab 2: Additional data
   Country -> State -> City
------------------------------------------------------- */


const AdditionalDataTab = ({
    data,
    set,
    locationData,
    loadingLocations,
}) => {
    const countries = locationData ?? [];

    const selectedCountry =
        countries.find(
            (item) =>
                String(item.country_id) === String(data.country)
        ) ?? null;

    const states = selectedCountry?.states ?? [];

    const selectedState =
        states.find(
            (item) =>
                String(item.state_id) === String(data.state)
        ) ?? null;

    const cities = selectedState?.cities ?? [];

    return (
        <Stack spacing={3}>
            <Box>
                <Typography sx={{ fontSize: 16, fontWeight: 600, mb: 0.5 }}>
                    Contract Details
                </Typography>

                <Typography sx={{ fontSize: 13, color: "text.secondary", mb: 2 }}>
                    Select the default agreement and provide the property address.
                </Typography>

                <Field label="Full Address">
                    <TextInput
                        placeholder="Enter complete property address"
                        value={data.address}
                        onChange={(event) => set("address", event.target.value)}
                    />
                </Field>
            </Box>

            <Divider />

            <Box>
                <Typography sx={{ fontSize: 16, fontWeight: 600, mb: 0.5 }}>
                    Location Details
                </Typography>

                <Typography sx={{ fontSize: 13, color: "text.secondary", mb: 2 }}>
                    Select a country first, then its state and city.
                </Typography>

                <Box sx={grid4}>
                    <Field label="Building Name">
                        <TextInput
                            placeholder="Enter building name"
                            value={data.building}
                            onChange={(event) => set("building", event.target.value)}
                        />
                    </Field>

                    <Field label="Street">
                        <TextInput
                            placeholder="Enter street"
                            value={data.street}
                            onChange={(event) => set("street", event.target.value)}
                        />
                    </Field>

                    <Field label="Unit No">
                        <TextInput
                            placeholder="Enter unit number"
                            value={data.unit}
                            onChange={(event) => set("unit", event.target.value)}
                        />
                    </Field>

                    <Field label="Floor No">
                        <TextInput
                            placeholder="Enter floor number"
                            value={data.floor}
                            onChange={(event) => set("floor", event.target.value)}
                        />
                    </Field>

                    {/* Country dropdown */}

                    <Field label="Country" required>
                        <SmartSelect
                            value={data.country}
                            options={countries}
                            labelKey="country_name"
                            valueKey="country_id"
                            loading={loadingLocations}
                            disabled={loadingLocations}
                            placeholder={
                                loadingLocations ? "Loading countries..." : "Select country"
                            }
                            onChange={(value) => {
                                set("country", value);
                                set("state", "");
                                set("city", "");
                            }}
                        />
                    </Field>


                    {/* State dropdown: depends on selected country */}

                    <Field label="State" required>
                        <SmartSelect
                            value={data.state}
                            options={states}
                            labelKey="state_name"
                            valueKey="state_id"
                            disabled={!selectedCountry}
                            placeholder={
                                !selectedCountry ? "Select country first" : "Select state"
                            }
                            onChange={(value) => {
                                set("state", value);
                                set("city", "");
                            }}
                        />
                    </Field>


                    {/* City dropdown: depends on selected state */}

                    <Field label="City" required>
                        <SmartSelect
                            value={data.city}
                            options={cities}
                            labelKey="city_name"
                            valueKey="city_id"
                            disabled={!selectedState}
                            placeholder={
                                !selectedState ? "Select state first" : "Select city"
                            }
                            onChange={(value) => set("city", value)}
                        />
                    </Field>


                    <Field label="Govt Reference No">
                        <TextInput
                            placeholder="Government reference number"
                            value={data.govRef}
                            onChange={(event) => set("govRef", event.target.value)}
                        />
                    </Field>

                    <Field label="Latitude">
                        <TextInput
                            placeholder="Enter latitude"
                            value={data.lat}
                            onChange={(event) => set("lat", event.target.value)}
                        />
                    </Field>

                    <Field label="Longitude">
                        <TextInput
                            placeholder="Enter longitude"
                            value={data.lng}
                            onChange={(event) => set("lng", event.target.value)}
                        />
                    </Field>
                </Box>
            </Box>

            <Divider />

            <Box>
                <Typography sx={{ fontSize: 16, fontWeight: 600, mb: 0.5 }}>
                    Owner Information
                </Typography>

                <Typography sx={{ fontSize: 13, color: "text.secondary", mb: 2 }}>
                    Provide the property owner's contact details.
                </Typography>


                <Box sx={grid3}>
                    <Field label="Owner Name" required>
                        <TextInput
                            placeholder="Enter owner's full name"
                            value={data.owner}
                            onChange={(event) => set('owner', event.target.value)}
                        />
                    </Field>

                    <Field
                        label="Owner Contact Info"
                        required
                        sx={{ gridColumn: { sm: 'span 2' } }}
                    >
                        <Stack direction="row" spacing={1} alignItems="stretch">
                            <Select
                                size="small"
                                value={data.dial}
                                onChange={(event) => set('dial', event.target.value)}
                                sx={{
                                    width: 120,
                                    minWidth: 110,
                                    minHeight: 44,
                                    fontSize: 14,
                                    borderRadius: 1.5,
                                    '& .MuiOutlinedInput-notchedOutline': {
                                        borderColor: 'divider',
                                    },
                                    '& .MuiSelect-select': {
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 1,
                                        py: 1.25,
                                        px: 1.25,
                                    },
                                }}
                                renderValue={(selected) => {
                                    const country = COUNTRIES.find(
                                        (item) => item.dial === selected
                                    )

                                    if (!country) return selected

                                    return (
                                        <Stack
                                            direction="row"
                                            spacing={1}
                                            alignItems="center"
                                        >
                                            <Flag iso={country.iso} />
                                            <span>{country.dial}</span>
                                        </Stack>
                                    )
                                }}
                                MenuProps={{
                                    PaperProps: {
                                        sx: {
                                            maxHeight: 320,
                                            minWidth: 260,
                                        },
                                    },
                                }}
                            >
                                {COUNTRIES.map((country) => (
                                    <MenuItem
                                        key={country.iso}
                                        value={country.dial}
                                        sx={{
                                            display: 'flex',
                                            gap: 1.25,
                                            fontSize: 14,
                                        }}
                                    >
                                        <Flag iso={country.iso} />

                                        <Box
                                            sx={{
                                                flex: 1,
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                whiteSpace: 'nowrap',
                                            }}
                                        >
                                            {country.name}
                                        </Box>

                                        <Box
                                            component="span"
                                            sx={{
                                                color: 'text.secondary',
                                                ml: 'auto',
                                            }}
                                        >
                                            {country.dial}
                                        </Box>
                                    </MenuItem>
                                ))}
                            </Select>

                            <Box sx={{ flex: 1, minWidth: 0 }}>
                                <TextInput
                                    placeholder="Enter phone number"
                                    value={data.phone}
                                    onChange={(event) => set('phone', event.target.value)}
                                />
                            </Box>
                        </Stack>
                    </Field>
                </Box>
            </Box>
        </Stack>
    );
};

/* -------------------------------------------------------
   File upload components
------------------------------------------------------- */

const DropZone = ({
    icon: Icon,
    accept,
    multiple = false,
    centered = false,
    title,
    hint,
    files,
    onFiles,
}) => {
    const inputRef = useRef(null);
    const [over, setOver] = useState(false);

    const pick = (list) => {
        if (list?.length) onFiles(Array.from(list));
    };

    return (
        <Box>
            <Box
                role="button"
                tabIndex={0}
                onClick={() => inputRef.current?.click()}
                onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        inputRef.current?.click();
                    }
                }}
                onDragOver={(event) => {
                    event.preventDefault();
                    setOver(true);
                }}
                onDragLeave={() => setOver(false)}
                onDrop={(event) => {
                    event.preventDefault();
                    setOver(false);
                    pick(event.dataTransfer.files);
                }}
                sx={{
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: { xs: "column", sm: "row" },
                    alignItems: "center",
                    justifyContent: centered ? "center" : "flex-start",
                    textAlign: { xs: "center", sm: "left" },
                    gap: 2,
                    px: 3,
                    py: 3,
                    minHeight: 120,
                    bgcolor: over ? "action.hover" : "background.paper",
                    border: "1px dashed",
                    borderColor: over ? "primary.main" : "divider",
                    borderRadius: 1.5,
                    transition: "background 0.15s, border-color 0.15s",
                    "&:hover": {
                        borderColor: "primary.main",
                        bgcolor: "action.hover",
                    },
                    "&:focus-visible": {
                        outline: "2px solid",
                        outlineColor: "primary.main",
                    },
                }}
            >
                <Box
                    sx={{
                        width: 48,
                        height: 48,
                        flexShrink: 0,
                        borderRadius: 1.5,
                        bgcolor: "action.hover",
                        display: "grid",
                        placeItems: "center",
                    }}
                >
                    <Icon sx={{ fontSize: 25, color: "text.secondary" }} />
                </Box>

                <Box>
                    <Typography sx={{ fontSize: 14, fontWeight: 500 }}>
                        {title}{" "}
                        <Box
                            component="span"
                            sx={{ color: "primary.main", fontWeight: 600 }}
                        >
                            Browse files
                        </Box>
                    </Typography>

                    <Typography
                        sx={{
                            fontSize: 12,
                            color: "text.secondary",
                            mt: 0.5,
                            lineHeight: 1.7,
                        }}
                    >
                        {hint}
                    </Typography>
                </Box>

                <input
                    ref={inputRef}
                    hidden
                    type="file"
                    accept={accept}
                    multiple={multiple}
                    onChange={(event) => {
                        pick(event.target.files);
                        event.target.value = "";
                    }}
                />
            </Box>

            {files.length > 0 && (
                <Stack direction="row" gap={1} flexWrap="wrap" sx={{ mt: 1.5 }}>
                    {files.map((file, index) => (
                        <Chip
                            key={`${file.name}-${index}`}
                            label={file.name}
                            size="small"
                            onDelete={() => onFiles(null, index)}
                            sx={{ maxWidth: "100%", fontSize: 12 }}
                        />
                    ))}
                </Stack>
            )}
        </Box>
    );
};

const PhotosDocsTab = ({ files, setFiles }) => {
    const add = (key) => (list, removeIndex) => {
        setFiles((previous) => ({
            ...previous,
            [key]: list
                ? [...previous[key], ...list]
                : previous[key].filter((_, index) => index !== removeIndex),
        }));
    };

    return (
        <Stack spacing={3}>
            <Box>
                <Typography sx={{ fontSize: 16, fontWeight: 600, mb: 0.5 }}>
                    Property Media
                </Typography>

                <Typography sx={{ fontSize: 13, color: "text.secondary", mb: 2 }}>
                    Upload images and videos to showcase your property.
                </Typography>

                <Stack spacing={2}>
                    <Field label="Property Photos">
                        <DropZone
                            icon={CloudUploadOutlined}
                            accept="image/*"
                            multiple
                            title="Drag and drop your images here, or"
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
                            title="Drag and drop your videos here, or"
                            hint="MP4, WEBM, OGG, MOV, AVI, MKV — up to 30 MB per video"
                            files={files.videos}
                            onFiles={add("videos")}
                        />
                    </Field>
                </Stack>
            </Box>

            <Divider />

            <Box>
                <Typography sx={{ fontSize: 16, fontWeight: 600, mb: 0.5 }}>
                    Property Documents
                </Typography>

                <Typography sx={{ fontSize: 13, color: "text.secondary", mb: 2 }}>
                    Attach ownership records and any supporting documents.
                </Typography>

                <Stack spacing={2}>
                    <Field label="Ownership Document">
                        <DropZone
                            centered
                            icon={CloudUploadOutlined}
                            accept=".pdf,.doc,.docx"
                            title="Upload ownership document"
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
                            title="Upload additional documents"
                            hint="PDF, DOC, DOCX"
                            files={files.other}
                            onFiles={add("other")}
                        />
                    </Field>
                </Stack>
            </Box>
        </Stack>
    );
};


const validateProperty = (data, propertyType) => {
    const errors = [];

    const addError = (field, label, tab) => {
        errors.push({ field, label, tab });
    };

    const isEmpty = (value) =>
        value === null ||
        value === undefined ||
        String(value).trim() === "";

    const isValidNumber = (value) =>
        !isEmpty(value) &&
        Number.isFinite(Number(value));

    // ==========================================
    // TAB 1: BASIC INFORMATION
    // ==========================================

    if (isEmpty(propertyType)) {
        addError("propertyType", "Property Type", 0);
    }

    if (isEmpty(data.title)) {
        addError("title", "Property Title", 0);
    }

    if (isEmpty(data.status)) {
        addError("status", "Status", 0);
    } else if (!STATUSES.includes(data.status)) {
        addError("status", "Valid Status", 0);
    }

    if (isEmpty(data.category)) {
        addError("category", "Category", 0);
    }

    if (isEmpty(data.group)) {
        addError("group", "Property Group", 0);
    }

    if (isEmpty(data.type)) {
        addError("type", "Property Type", 0);
    }

    if (
        !isValidNumber(data.size) ||
        Number(data.size) <= 0
    ) {
        addError("size", "Property Size (greater than 0)", 0);
    }

    if (isEmpty(data.pricingType)) {
        addError("pricingType", "Pricing Type", 0);
    }

    if (isEmpty(data.tax)) {
        addError("tax", "Tax", 0);
    } else if (!TAXES.includes(data.tax)) {
        addError("tax", "Valid Tax", 0);
    }

    // Rental pricing validation
    if (data.pricingType === "rent") {
        if (!Array.isArray(data.terms) || !data.terms.length) {
            addError("terms", "At least one Rental Pricing Term", 0);
        } else {
            data.terms.forEach((term) => {
                if (!TERMS.includes(term.name)) {
                    addError("terms", "Valid Rental Pricing Term", 0);
                }

                if (
                    !isValidNumber(term.price) ||
                    Number(term.price) < 0
                ) {
                    addError(
                        "terms",
                        `${term.name} Rental Price (zero or greater)`,
                        0
                    );
                }
            });
        }
    }

    // Sale price validation
    if (data.pricingType === "sale") {
        if (
            !isValidNumber(data.salePrice) ||
            Number(data.salePrice) < 0
        ) {
            addError("salePrice", "Sale Price (zero or greater)", 0);
        }
    }

    // ==========================================
    // TAB 2: ADDITIONAL DATA
    // ==========================================

    if (isEmpty(data.country)) {
        addError("country", "Country", 1);
    }

    if (isEmpty(data.state)) {
        addError("state", "State", 1);
    }

    if (isEmpty(data.city)) {
        addError("city", "City", 1);
    }

    if (isEmpty(data.owner)) {
        addError("owner", "Owner Name", 1);
    }

    if (isEmpty(data.dial)) {
        addError("dial", "Country Dial Code", 1);
    }

    const phoneDigits = String(data.phone ?? "").replace(/\D/g, "");

    if (isEmpty(data.phone)) {
        addError("phone", "Owner Phone Number", 1);
    } else if (
        phoneDigits.length < 7 ||
        phoneDigits.length > 15
    ) {
        addError(
            "phone",
            "Valid Owner Phone Number (7–15 digits)",
            1
        );
    }

    // Optional coordinates: validate only when provided
    if (!isEmpty(data.lat)) {
        if (
            !isValidNumber(data.lat) ||
            Number(data.lat) < -90 ||
            Number(data.lat) > 90
        ) {
            addError("lat", "Latitude (-90 to 90)", 1);
        }
    }

    if (!isEmpty(data.lng)) {
        if (
            !isValidNumber(data.lng) ||
            Number(data.lng) < -180 ||
            Number(data.lng) > 180
        ) {
            addError("lng", "Longitude (-180 to 180)", 1);
        }
    }

    // ==========================================
    // RETURN VALIDATION RESULT
    // ==========================================

    return {
        missingFields: errors.map((error) => error.label),
        firstErrorTab: errors.length ? errors[0].tab : -1,
        errors,
        isValid: errors.length === 0,
    };
};


/* -------------------------------------------------------
   Main page
------------------------------------------------------- */

const AddFormPage = ({ id, lang }) => {

    const router = useRouter();
    const { doGet, token, doPostFormData } = useApi();

    const onSubmit = async (payload) => {
        try {
            setSaveError("");

            const formData = new FormData();

            // Append property fields
            Object.entries(payload).forEach(([key, value]) => {
                if (key === "files") return;

                if (value === null || value === undefined) {
                    formData.append(key, "");
                } else if (typeof value === "object") {
                    formData.append(key, JSON.stringify(value));
                } else {
                    formData.append(key, String(value));
                }
            });

            // Append property files
            const files = payload.files || {};

            ["photos", "videos", "ownership", "other"].forEach((field) => {
                (files[field] || []).forEach((file) => {
                    if (file instanceof File) {
                        formData.append(field, file);
                    }
                });
            });

            const result = await doPostFormData({
                endpoint: id
                    ? `company/property/update/data/${id}`
                    : "company/property/save/data",
                values: formData,
            });

            router.replace(`/${lang}/apps/property`);

            return result.data;
        } catch (error) {
            console.error("Property save error:", error);

            setSaveError(
                error.message || "Failed to save property."
            );

            throw error;
        }
    };

    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState("");
    const [createData, setCreateData] = useState(null);
    const [locationData, setLocationData] = useState([]);

    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState("");

    const [step, setStep] = useState(id ? "form" : "type");
    const [propertyType, setPropertyType] = useState("");
    const [agreed, setAgreed] = useState(true);
    const [tab, setTab] = useState(0);

    const [data, setData] = useState(() => ({
        ...initialData,
        terms: initialData.terms.map((term) => ({ ...term })),
    }));

    const [files, setFiles] = useState(initialFiles);

    const set = (key, value) => {
        setData((previous) => ({
            ...previous,
            [key]: value,
        }));
    };

    const getId = (value) => {
        if (!value) return "";

        if (typeof value === "object") {
            return String(value._id ?? value.id ?? value.value ?? "");
        }

        return String(value);
    };

    const mapEditPropertyToForm = (property) => {
        const terms = Array.isArray(property.terms)
            ? property.terms.map((term) => ({
                name: term.name ?? "Monthly",
                price: term.price ?? "",
            }))
            : [{ name: "Monthly", price: "" }];

        return {
            ...initialData,

            title: property.title ?? property.name ?? "",
            refNo: property.refNo ?? "",
            status: property.status ?? "Vacant",

            category: getId(property.category),
            group: getId(property.group),
            type: getId(property.type ?? property.propertyType),

            size: property.size ?? "",
            pricingType: property.pricingType ?? "rent",
            tax: property.tax ?? "",
            salePrice: property.salePrice ?? "",
            terms,

            description: property.description ?? "",
            template: getId(property.template),

            address: property.address ?? "",
            building: property.building ?? "",
            street: property.street ?? "",
            unit: property.unit ?? "",
            floor: property.floor ?? "",

            country: getId(property.country),
            state: getId(property.state),
            city: getId(property.city),

            govRef: property.govRef ?? property.govtReferenceNo ?? "",
            lat: property.lat ?? property.latitude ?? "",
            lng: property.lng ?? property.longitude ?? "",

            owner: property.owner ?? property.ownerName ?? "",
            dial: property.dial ?? property.dialCode ?? "",
            phone: property.phone ?? property.ownerPhone ?? "",
        };
    };

    const fetchCreateProperty = useCallback(async () => {
        if (!token) {
            setLoading(false);
            return;
        }

        setLoading(true);
        setLoadError("");

        try {
            // Load property types, categories, groups and locations.
            const response = await doGet("company/property/create/data");

            const result = response?.data ?? response;
            const payload = result?.data ?? result;

            if (!payload || typeof payload !== "object") {
                throw new Error("Invalid property creation data received.");
            }

            setCreateData(payload);

            const countries =
                payload.country ??
                payload.countries ??
                payload.locationData ??
                [];

            setLocationData(Array.isArray(countries) ? countries : []);

            if (!id) {
                return;
            }

            // Edit mode: fetch the existing property.
            const editResponse = await doGet(
                `company/property/edit/data/${id}`
            );

            const editResult = editResponse?.data ?? editResponse;
            const editPayload = editResult?.data ?? editResult;

            // Support common API response wrappers.
            const property =
                editPayload?.property ??
                editPayload?.data ??
                editPayload;

            if (!property || typeof property !== "object") {
                throw new Error("Property data could not be loaded.");
            }

            // Populate the form with existing values.
            setData(mapEditPropertyToForm(property));

            // Restore the selected property type.
            setPropertyType(
                getId(property.propertyType ?? property.type)
            );

            // Edit mode must never return to the type-selection step.
            setStep("form");
            setTab(0);
        } catch (error) {
            console.error("Failed to load property form data:", error);

            setLoadError(
                error?.message ||
                "Failed to load property data. Please try again."
            );
        } finally {
            setLoading(false);
        }
    }, [token, id]);

    useEffect(() => {
        fetchCreateProperty();
    }, [fetchCreateProperty]);

    const onBack = () => {
        router.replace(`/${lang}/apps/property`);
    };

    const handleBack = () => {
        if (step === "form") {
            setStep("type");
        } else {
            onBack();
        }
    };

    const handleContinue = () => {
        if (!propertyType || !agreed || loading || loadError) return;

        set("type", propertyType);
        setTab(0);
        setStep("form");
    };

    const handleSave = async () => {
        if (saving) return;

        setSaveError("");

        const validation = validateProperty(data, propertyType);

        if (!validation.isValid) {
            setTab(validation.firstErrorTab);

            setSaveError(
                `Please correct the following fields: ${validation.missingFields.join(", ")}.`
            );

            return;
        }

        setSaving(true);

        try {
            await onSubmit({
                propertyType,
                ...data,
                files,
            });
        } catch (error) {
            console.error("Failed to save property:", error);

            setSaveError(
                error?.message || "Failed to save property. Please try again."
            );
        } finally {
            setSaving(false);
        }
    };

    return (
        <Box sx={{ width: "100%", minWidth: 0, pb: 3 }}>
            <Stack
                direction="row"
                alignItems="center"
                spacing={1.5}
                sx={{ mb: 2, flexWrap: "wrap", rowGap: 1.5 }}
            >
                <Tooltip title="Back">
                    <IconButton
                        onClick={handleBack}
                        size="medium"
                        sx={{ color: "text.secondary" }}
                    >
                        <ArrowBack />
                    </IconButton>
                </Tooltip>

                <Box sx={{ flex: 1, minWidth: 150 }}>
                    <Typography
                        sx={{
                            fontSize: { xs: 19, md: 21 },
                            fontWeight: 700,
                            color: "text.primary",
                        }}
                    >
                        {id ? "Edit Property" : "Create Property"}
                    </Typography>

                    <Typography sx={{ fontSize: 13, color: "text.secondary", mt: 0.3 }}>
                        {step === "type"
                            ? "Choose a property type to get started."
                            : "Add and manage your property information."}
                    </Typography>
                </Box>

                {step === "form" && (
                    <Stack direction="row" spacing={1.5} sx={{ flexShrink: 0 }}>
                        <Button
                            variant="outlined"
                            onClick={handleBack}
                            disabled={saving}
                            sx={{
                                minHeight: 42,
                                px: 2.5,
                                fontSize: 14,
                                textTransform: "none",
                                borderRadius: 1.5,
                            }}
                        >
                            Cancel
                        </Button>

                        <Button
                            variant="contained"
                            disableElevation
                            onClick={handleSave}
                            disabled={saving || !data.title.trim()}
                            sx={{
                                minHeight: 42,
                                px: 2.5,
                                fontSize: 14,
                                fontWeight: 600,
                                textTransform: "none",
                                borderRadius: 1.5,
                            }}
                        >
                            {saving ? "Saving..." : (id ? "Update Property" : "Save Property")}
                        </Button>
                    </Stack>
                )}
            </Stack>

            {saveError && step === "form" && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {saveError}
                </Alert>
            )}

            {!id && step === "type" ? (
                <SelectTypeStep
                    selected={propertyType}
                    onSelect={setPropertyType}
                    agreed={agreed}
                    onAgree={setAgreed}
                    onContinue={handleContinue}
                    onRetry={fetchCreateProperty}
                    createData={createData}
                    loading={loading}
                    error={loadError}
                />
            ) : loading ? (
                <FormSkeleton />
            ) : (
                <Paper
                    variant="outlined"
                    sx={{
                        borderRadius: 2,
                        borderColor: "divider",
                        overflow: "hidden",
                        minWidth: 0,
                    }}
                >
                    <Box
                        sx={{
                            px: { xs: 1, md: 2 },
                            bgcolor: "background.paper",
                            borderBottom: 1,
                            borderColor: "divider",
                        }}
                    >
                        <Tabs
                            value={tab}
                            onChange={(_, value) => setTab(value)}
                            variant="scrollable"
                            scrollButtons="auto"
                            allowScrollButtonsMobile
                            sx={{
                                minHeight: 54,
                                "& .MuiTabs-indicator": {
                                    height: 3,
                                    borderRadius: "3px 3px 0 0",
                                    bgcolor: "primary.main",
                                },
                                "& .MuiTab-root": {
                                    minHeight: 54,
                                    minWidth: 0,
                                    px: { xs: 1.5, sm: 2.5 },
                                    fontSize: 14,
                                    fontWeight: 500,
                                    textTransform: "none",
                                    color: "text.secondary",
                                },
                                "& .Mui-selected": {
                                    color: "primary.main",
                                    fontWeight: 600,
                                },
                            }}
                        >
                            <Tab label="Basic Information" />
                            <Tab label="Additional Data" />
                            <Tab label="Photos & Docs" />
                        </Tabs>
                    </Box>

                    <Box sx={{ p: { xs: 2, sm: 2.5, md: 3 }, minWidth: 0 }}>
                        {tab === 0 && (
                            <BasicInfoTab
                                data={data}
                                set={set}
                                createData={createData}
                            />
                        )}

                        {tab === 1 && (
                            <AdditionalDataTab
                                data={data}
                                set={set}
                                locationData={locationData}
                                loadingLocations={loading}
                            />
                        )}

                        {tab === 2 && (
                            <PhotosDocsTab files={files} setFiles={setFiles} />
                        )}
                    </Box>

                    <Divider />

                    <Stack
                        direction="row"
                        alignItems="center"
                        justifyContent="space-between"
                        sx={{
                            px: { xs: 2, sm: 3 },
                            py: 2,
                            gap: 1.5,
                            bgcolor: "background.paper",
                        }}
                    >
                        <Button
                            variant="outlined"
                            disabled={tab === 0 || saving}
                            onClick={() => setTab((previous) => previous - 1)}
                            sx={{
                                minHeight: 40,
                                px: 2.5,
                                fontSize: 14,
                                textTransform: "none",
                                borderRadius: 1.5,
                            }}
                        >
                            Previous
                        </Button>

                        <Typography
                            sx={{
                                fontSize: 13,
                                color: "text.secondary",
                                display: { xs: "none", sm: "block" },
                            }}
                        >
                            Step {tab + 1} of 3
                        </Typography>

                        {tab < 2 ? (
                            <Button
                                variant="contained"
                                disableElevation
                                onClick={() => setTab((previous) => previous + 1)}
                                sx={{
                                    minHeight: 40,
                                    px: 3,
                                    fontSize: 14,
                                    fontWeight: 600,
                                    textTransform: "none",
                                    borderRadius: 1.5,
                                }}
                            >
                                Next
                            </Button>
                        ) : (
                            <Button
                                variant="contained"
                                disableElevation
                                onClick={handleSave}
                                disabled={saving || !data.title.trim()}
                                sx={{
                                    minHeight: 40,
                                    px: 3,
                                    fontSize: 14,
                                    fontWeight: 600,
                                    textTransform: "none",
                                    borderRadius: 1.5,
                                }}
                            >
                                {saving ? "Saving..." : "Save Property"}
                            </Button>
                        )}
                    </Stack>
                </Paper>
            )}
        </Box>
    );
};

export default AddFormPage;
