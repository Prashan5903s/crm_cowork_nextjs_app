"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { useRouter } from "next/navigation";

import {
    Autocomplete,
    Box,
    Button,
    Checkbox,
    FormControl,
    FormControlLabel,
    FormHelperText,
    IconButton,
    MenuItem,
    Paper,
    Radio,
    RadioGroup,
    Select,
    Stack,
    TextField,
    ToggleButton,
    ToggleButtonGroup,
    Tooltip,
    Typography,
} from "@mui/material";

import InsertDriveFileOutlinedIcon from "@mui/icons-material/InsertDriveFileOutlined";
import PictureAsPdfOutlinedIcon from "@mui/icons-material/PictureAsPdfOutlined";
import ImageOutlinedIcon from "@mui/icons-material/ImageOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";

import AddIcon from "@mui/icons-material/Add";
import CodeIcon from "@mui/icons-material/Code";
import FormatBoldIcon from "@mui/icons-material/FormatBold";
import FormatItalicIcon from "@mui/icons-material/FormatItalic";
import FormatListBulletedIcon from "@mui/icons-material/FormatListBulleted";
import FormatListNumberedIcon from "@mui/icons-material/FormatListNumbered";
import FormatUnderlinedIcon from "@mui/icons-material/FormatUnderlined";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import NotesIcon from "@mui/icons-material/Notes";
import PermMediaOutlinedIcon from "@mui/icons-material/PermMediaOutlined";
import SensorsIcon from "@mui/icons-material/Sensors";
import UndoIcon from "@mui/icons-material/Undo";
import RedoIcon from "@mui/icons-material/Redo";

import { useApi } from "@/utils/api";

/* ------------------------------------------------------------------ */
/* Constants                                                           */
/* ------------------------------------------------------------------ */

const ASSET_URL = process.env.NEXT_PUBLIC_ASSETS_URL

const TIME_UNITS = ["Minutes", "Hours"];

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const STATUSES = [{
    value: true,
    label: "Active"
}, {
    value: false,
    label: "Inactive"
}]

const DEVICE_OPTIONS = [
    "Main Door Biometric",
    "Meeting Room Access Controller",
    "Gym Turnstile",
    "Pool Gate Reader",
];

const DEFAULT_VALUES = {
    name: "",
    type: "",
    slotTime: 30,
    slotUnit: "Minutes",
    openTime: "09:00",
    closeTime: "21:00",
    days: ["Mon", "Tue", "Wed", "Thu", "Fri"],
    occupancy: 1,
    status: true,
    internalAccess: "all",
    publicListing: false,
    tenantQuota: false,
    tenantQuotaCount: "",
    description: "",
    devices: [],
};

const POST_URL = "company/amenity/post/data";
const PUT_URL = (id) => `company/amenity/put/data/${id}`;
const EDIT_URL = (id) => `company/amenity/edit/data/${id}`
const CREATE_DATA_URL = "company/amenity/create/data";

/* ------------------------------------------------------------------ */
/* Backend <-> form mapping                                            */
/* ------------------------------------------------------------------ */

const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

// Use this on the edit page: backend document -> form values
export const toFormValues = (a = {}) => ({
    name: a.title ?? "",
    type: a.type?._id ?? a.type ?? "",
    slotTime: a.slot_time_period ?? 30,
    slotUnit: cap(a.slot_time_unit ?? "minutes"),
    openTime: a.start_time ?? "09:00",
    closeTime: a.end_time ?? "21:00",
    days: (a.available_days ?? []).map(cap),
    occupancy: a.occupancy_per_slot ?? 1,
    status: a.status ?? true,
    internalAccess: a.internal_booking_access ?? "all",
    publicListing: !!a.is_public_listing,
    tenantQuota: !!a.has_tenant_monthly_quota,
    tenantQuotaCount: a.tenant_monthly_quota ?? "",
    description: a.description ?? "",
    devices: a.linked_devices ?? [],
});

// form values -> multipart body matching buildPayload() on the server
const buildFormData = (
    v,
    { images, documents, removeImageIds, removeDocumentIds }
) => {
    const fd = new FormData();

    fd.append("name", v.name.trim());
    fd.append("type", v.type);
    fd.append("status", String(v.status === true || v.status === "true"));
    fd.append("slot_time_period", String(v.slotTime));
    fd.append("slot_time_unit", v.slotUnit);
    fd.append("start_time", v.openTime);
    fd.append("end_time", v.closeTime);
    fd.append("available_days", JSON.stringify(v.days));
    fd.append("occupancy_per_slot", String(v.occupancy));
    fd.append("internal_booking_access", v.internalAccess);
    fd.append("is_public_listing", String(v.publicListing));
    fd.append("has_tenant_monthly_quota", String(v.tenantQuota));
    fd.append("tenant_monthly_quota", v.tenantQuota ? String(v.tenantQuotaCount) : "");
    fd.append("description", v.description);
    fd.append("linked_devices", JSON.stringify(v.devices));

    images.forEach((file) => fd.append("images", file));
    documents.forEach((file) => fd.append("documents", file));

    if (removeImageIds.length) {
        fd.append("remove_image_ids", JSON.stringify(removeImageIds));
    }
    if (removeDocumentIds.length) {
        fd.append("remove_document_ids", JSON.stringify(removeDocumentIds));
    }

    return fd;
};

/* ------------------------------------------------------------------ */
/* Styles                                                              */
/* ------------------------------------------------------------------ */

const INPUT_HEIGHT = 44;

const inputSx = {
    "& .MuiOutlinedInput-root": {
        height: 46,
        boxSizing: "border-box",
        borderRadius: "8px",
        backgroundColor: "#fff",
        display: "flex",
        alignItems: "center",

        "& fieldset": {
            borderColor: "#D9DEE7",
        },

        "&:hover fieldset": {
            borderColor: "#9CA3AF",
        },

        "&.Mui-focused fieldset": {
            borderColor: "#2563EB",
            borderWidth: "1px",
        },
    },

    // Normal text input
    "& .MuiOutlinedInput-input": {
        height: "100%",
        boxSizing: "border-box",
        padding: "0 14px",
        display: "flex",
        alignItems: "center",
        fontSize: "14px",
    },

    // Dropdown / Select
    "& .MuiSelect-select": {
        height: "46px !important",
        minHeight: "unset !important",
        boxSizing: "border-box",
        padding: "0 36px 0 14px !important",
        display: "flex",
        alignItems: "center",
        fontSize: "14px",
    },

    // Vertically center labels
    "& .MuiInputLabel-root": {
        fontSize: "14px",
        transform: "translate(14px, 14px) scale(1)",
        transformOrigin: "top left",

        "&.MuiInputLabel-shrink": {
            transform: "translate(14px, -9px) scale(0.75)",
        },
    },

    "& .MuiFormHelperText-root": {
        marginLeft: "2px",
        fontSize: "12px",
    },
};

const labelSx = {
    display: "block",
    mb: 0.75,
    fontSize: "13px",
    fontWeight: 600,
    color: "text.primary",
};

const gridSx = {
    display: "grid",
    gridTemplateColumns: {
        xs: "minmax(0, 1fr)",
        sm: "repeat(2, minmax(0, 1fr))",
        lg: "repeat(4, minmax(0, 1fr))",
    },
    gap: { xs: 2, md: 2.5 },
    alignItems: "start",
};

const choiceLabelSx = {
    alignItems: "center",
    mx: 0,
    my: 0.25,

    "& .MuiCheckbox-root": {
        alignSelf: "center",
        padding: "6px",
    },

    "& .MuiFormControlLabel-label": {
        fontSize: 13,
        lineHeight: 1.5,
        display: "flex",
        alignItems: "center",
    },
};

/* ------------------------------------------------------------------ */
/* Small presentational components                                     */
/* ------------------------------------------------------------------ */

const FieldLabel = ({ children, required }) => (
    <Typography component="label" sx={labelSx}>
        {children}
        {required && (
            <Box component="span" sx={{ color: "error.main", ml: 0.5 }}>
                *
            </Box>
        )}
    </Typography>
);

const SectionTitle = ({ icon, children, description }) => (
    <Stack direction="row" spacing={1.25} alignItems="flex-start" sx={{ mb: 2.5 }}>
        <Box
            sx={{
                width: 38,
                height: 38,
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "10px",
                bgcolor: "action.hover",
                color: "primary.main",
                fontSize: 21,
            }}
        >
            {icon}
        </Box>

        <Box sx={{ minWidth: 0, pt: 0.25 }}>
            <Typography sx={{ fontSize: 16, fontWeight: 700, lineHeight: 1.5 }}>
                {children}
            </Typography>

            {description && (
                <Typography
                    sx={{
                        mt: 0.25,
                        color: "text.secondary",
                        fontSize: 13,
                        lineHeight: 1.6,
                    }}
                >
                    {description}
                </Typography>
            )}
        </Box>
    </Stack>
);

const SectionCard = ({ children, sx = {} }) => (
    <Paper
        variant="outlined"
        sx={{
            p: { xs: 2, md: 3 },
            borderRadius: 2.5,
            borderColor: "divider",
            boxShadow: "none",
            minWidth: 0,
            ...sx,
        }}
    >
        {children}
    </Paper>
);

const OptionBox = ({ title, description, children }) => (
    <Box
        sx={{
            height: "100%",
            minWidth: 0,
            border: "1px solid",
            borderColor: "divider",
            borderRadius: 2,
            p: 2,
            bgcolor: "background.paper",
            boxSizing: "border-box",
        }}
    >
        <Typography sx={{ fontSize: 14, fontWeight: 600, mb: 0.5 }}>
            {title}
        </Typography>

        {description && (
            <Typography sx={{ color: "text.secondary", fontSize: 12, mb: 1 }}>
                {description}
            </Typography>
        )}

        {children}
    </Box>
);

/* Files that are already saved on the server (edit mode) */
const ExistingFiles = ({ files, onRemove }) => {
    if (!files?.length) return null;

    return (
        <Stack spacing={0.5} sx={{ mb: 1.5 }}>
            <Typography sx={{ fontSize: 12, color: "text.secondary" }}>
                Saved files
            </Typography>

            {files.map((file) => (
                <Stack
                    key={file._id}
                    direction="row"
                    alignItems="center"
                    spacing={1}
                    sx={{
                        p: 0.75,
                        pl: 1.25,
                        border: "1px solid",
                        borderColor: "divider",
                        borderRadius: 1.5,
                        minWidth: 0,
                    }}
                >
                    <Typography
                        component="a"
                        href={file.url}
                        target="_blank"
                        rel="noreferrer"
                        title={file.name}
                        sx={{
                            flex: 1,
                            minWidth: 0,
                            fontSize: 12,
                            fontWeight: 600,
                            color: "primary.main",
                            textDecoration: "none",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                        }}
                    >
                        {file.name}
                    </Typography>

                    <IconButton
                        size="small"
                        aria-label={`Remove ${file.name}`}
                        onClick={() => onRemove(file._id)}
                    >
                        <DeleteOutlineIcon fontSize="small" />
                    </IconButton>
                </Stack>
            ))}
        </Stack>
    );
};

const UploadZone = ({ label, hint, accept, multiple, files, onFiles }) => {
    const inputRef = useRef(null);
    const [previews, setPreviews] = useState([]);

    useEffect(() => {
        const nextPreviews = files.map((file) => ({
            file,
            url:
                file.type.startsWith("image/") || file.type === "application/pdf"
                    ? URL.createObjectURL(file)
                    : null,
        }));

        setPreviews(nextPreviews);

        return () => {
            nextPreviews.forEach(({ url }) => {
                if (url) URL.revokeObjectURL(url);
            });
        };
    }, [files]);

    const formatSize = (bytes) => {
        if (bytes < 1024 * 1024) {
            return `${Math.max(1, Math.round(bytes / 1024))} KB`;
        }

        return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    };

    const removeFile = (index) => {
        onFiles((previous) => previous.filter((_, i) => i !== index));
    };

    return (
        <Box sx={{ minWidth: 0 }}>
            <FieldLabel>{label}</FieldLabel>

            <Box
                onClick={() => inputRef.current?.click()}
                onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        inputRef.current?.click();
                    }
                }}
                role="button"
                tabIndex={0}
                sx={{
                    minHeight: 110,
                    p: 2,
                    border: "1px dashed",
                    borderColor: "divider",
                    borderRadius: 2,
                    bgcolor: "#FAFBFC",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    textAlign: "center",
                    transition: "0.2s",
                    "&:hover": {
                        borderColor: "primary.main",
                        bgcolor: "action.hover",
                    },
                }}
            >
                <AddIcon sx={{ fontSize: 28, color: "primary.main", mb: 0.5 }} />

                <Typography sx={{ fontSize: 14, fontWeight: 600 }}>
                    {hint[0]}
                </Typography>

                <Typography sx={{ fontSize: 12, color: "text.secondary", mt: 0.5 }}>
                    {hint[1] || "Click to browse files"}
                </Typography>

                <input
                    ref={inputRef}
                    type="file"
                    hidden
                    accept={accept}
                    multiple={multiple}
                    onChange={(event) => {
                        const selected = Array.from(event.target.files || []);

                        if (selected.length) {
                            onFiles((previous) =>
                                multiple ? [...previous, ...selected] : selected
                            );
                        }

                        event.target.value = "";
                    }}
                />
            </Box>

            {previews.length > 0 && (
                <Box
                    sx={{
                        display: "grid",
                        gridTemplateColumns: {
                            xs: "1fr",
                            sm: "repeat(2, minmax(0, 1fr))",
                        },
                        gap: 1.5,
                        mt: 2,
                    }}
                >
                    {previews.map(({ file, url }, index) => {
                        const isImage = file.type.startsWith("image/");
                        const isPdf =
                            file.type === "application/pdf" ||
                            file.name.toLowerCase().endsWith(".pdf");

                        return (
                            <Paper
                                key={`${file.name}-${index}`}
                                variant="outlined"
                                sx={{
                                    minWidth: 0,
                                    overflow: "hidden",
                                    borderRadius: 2,
                                    boxShadow: "none",
                                }}
                            >
                                {isImage && url && (
                                    <Box
                                        component="img"
                                        src={url}
                                        alt={file.name}
                                        sx={{
                                            display: "block",
                                            width: "100%",
                                            height: 160,
                                            objectFit: "cover",
                                            bgcolor: "action.hover",
                                        }}
                                    />
                                )}

                                {isPdf && url && (
                                    <Box
                                        sx={{
                                            height: 180,
                                            bgcolor: "#F5F6F8",
                                            overflow: "hidden",
                                        }}
                                    >
                                        <Box
                                            component="iframe"
                                            src={url}
                                            title={`Preview of ${file.name}`}
                                            sx={{
                                                width: "100%",
                                                height: "100%",
                                                border: 0,
                                            }}
                                        />
                                    </Box>
                                )}

                                {!isImage && !isPdf && (
                                    <Box
                                        sx={{
                                            height: 100,
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            bgcolor: "action.hover",
                                        }}
                                    >
                                        <InsertDriveFileOutlinedIcon
                                            sx={{ fontSize: 42, color: "text.secondary" }}
                                        />
                                    </Box>
                                )}

                                <Stack
                                    direction="row"
                                    alignItems="center"
                                    spacing={1}
                                    sx={{ p: 1.25, minWidth: 0 }}
                                >
                                    {isImage ? (
                                        <ImageOutlinedIcon color="primary" fontSize="small" />
                                    ) : isPdf ? (
                                        <PictureAsPdfOutlinedIcon color="error" fontSize="small" />
                                    ) : (
                                        <InsertDriveFileOutlinedIcon
                                            color="action"
                                            fontSize="small"
                                        />
                                    )}

                                    <Box sx={{ flex: 1, minWidth: 0 }}>
                                        <Typography
                                            title={file.name}
                                            sx={{
                                                fontSize: 12,
                                                fontWeight: 600,
                                                overflow: "hidden",
                                                textOverflow: "ellipsis",
                                                whiteSpace: "nowrap",
                                            }}
                                        >
                                            {file.name}
                                        </Typography>

                                        <Typography sx={{ fontSize: 11, color: "text.secondary" }}>
                                            {formatSize(file.size)}
                                        </Typography>
                                    </Box>

                                    <IconButton
                                        size="small"
                                        aria-label={`Remove ${file.name}`}
                                        onClick={() => removeFile(index)}
                                    >
                                        <DeleteOutlineIcon fontSize="small" />
                                    </IconButton>
                                </Stack>
                            </Paper>
                        );
                    })}
                </Box>
            )}
        </Box>
    );
};

const RichTextEditor = ({ value, onChange, placeholder }) => {
    const editorRef = useRef(null);

    useEffect(() => {
        if (editorRef.current && editorRef.current.innerHTML !== (value || "")) {
            editorRef.current.innerHTML = value || "";
        }
    }, [value]);

    const exec = (command, argument) => {
        editorRef.current?.focus();
        document.execCommand(command, false, argument);
        onChange(editorRef.current?.innerHTML || "");
    };

    const tools = [
        [
            { icon: <FormatBoldIcon />, label: "Bold", run: () => exec("bold") },
            { icon: <FormatItalicIcon />, label: "Italic", run: () => exec("italic") },
            {
                icon: <FormatUnderlinedIcon />,
                label: "Underline",
                run: () => exec("underline"),
            },
            {
                icon: <CodeIcon />,
                label: "Code",
                run: () => exec("formatBlock", "pre"),
            },
        ],
        [
            { text: "H1", label: "Heading 1", run: () => exec("formatBlock", "h1") },
            { text: "H2", label: "Heading 2", run: () => exec("formatBlock", "h2") },
            { text: "H3", label: "Heading 3", run: () => exec("formatBlock", "h3") },
        ],
        [
            {
                icon: <FormatListBulletedIcon />,
                label: "Bullet list",
                run: () => exec("insertUnorderedList"),
            },
            {
                icon: <FormatListNumberedIcon />,
                label: "Numbered list",
                run: () => exec("insertOrderedList"),
            },
            { icon: <UndoIcon />, label: "Undo", run: () => exec("undo") },
            { icon: <RedoIcon />, label: "Redo", run: () => exec("redo") },
        ],
    ];

    return (
        <Box
            sx={{
                border: "1px solid",
                borderColor: "divider",
                borderRadius: 2,
                overflow: "hidden",
                bgcolor: "#fff",
                "&:focus-within": {
                    borderColor: "primary.main",
                },
            }}
        >
            <Stack
                direction="row"
                alignItems="center"
                flexWrap="wrap"
                gap={0.5}
                sx={{
                    p: 1,
                    borderBottom: "1px solid",
                    borderColor: "divider",
                    bgcolor: "background.default",
                }}
            >
                {tools.map((group, groupIndex) => (
                    <Stack
                        key={groupIndex}
                        direction="row"
                        spacing={0.25}
                        alignItems="center"
                        sx={{
                            pr: 0.75,
                            mr: 0.25,
                            borderRight:
                                groupIndex !== tools.length - 1 ? "1px solid" : "none",
                            borderColor: "divider",
                        }}
                    >
                        {group.map((tool) => (
                            <Tooltip key={tool.label} title={tool.label}>
                                <IconButton
                                    size="small"
                                    aria-label={tool.label}
                                    onMouseDown={(event) => event.preventDefault()}
                                    onClick={tool.run}
                                    sx={{
                                        minWidth: 32,
                                        height: 32,
                                        borderRadius: 1,
                                        fontSize: 12,
                                        fontWeight: 700,
                                        "& svg": { fontSize: 18 },
                                    }}
                                >
                                    {tool.icon ?? tool.text}
                                </IconButton>
                            </Tooltip>
                        ))}
                    </Stack>
                ))}
            </Stack>

            <Box
                ref={editorRef}
                contentEditable
                suppressContentEditableWarning
                data-placeholder={placeholder}
                onInput={(event) => onChange(event.currentTarget.innerHTML)}
                sx={{
                    minHeight: 150,
                    p: 2,
                    fontSize: 14,
                    lineHeight: 1.7,
                    outline: "none",
                    overflowWrap: "anywhere",
                    "&:empty:before": {
                        content: "attr(data-placeholder)",
                        color: "text.disabled",
                        pointerEvents: "none",
                    },
                    "& h1": { fontSize: 24 },
                    "& h2": { fontSize: 20 },
                    "& h3": { fontSize: 17 },
                    "& pre": {
                        p: 1.5,
                        bgcolor: "action.hover",
                        borderRadius: 1,
                        whiteSpace: "pre-wrap",
                    },
                }}
            />
        </Box>
    );
};

/* ------------------------------------------------------------------ */
/* Main form                                                           */
/* ------------------------------------------------------------------ */

const FormComponenetPage = ({
    lang,
    id,
}) => {

    const LIST_ROUTE = `/${lang}/apps/amenity/list`;

    const initialValues = {};
    const [existingImages, setExistingImages] = useState([]);
    const [existingDocuments, setExistingDocuments] = useState([]);

    const [values, setValues] = useState(DEFAULT_VALUES);

    const router = useRouter();
    const { doGet, token, doPost, doPut } = useApi();

    const isEdit = Boolean(id);

    // New files picked in this session
    const [images, setImages] = useState([]);
    const [documents, setDocuments] = useState([]);

    // Files already saved on the server (edit mode); removed ones are sent as remove_*_ids
    const [keptImages, setKeptImages] = useState(existingImages);
    const [keptDocuments, setKeptDocuments] = useState(existingDocuments);

    const [errors, setErrors] = useState({});
    const [saving, setSaving] = useState(false);
    const [submitError, setSubmitError] = useState("");

    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState("");
    const [createData, setCreateData] = useState([]);
    const [editData, setEditData] = useState()

    // Keep kept-file lists in sync if the edit page loads the amenity after mount
    useEffect(() => {
        setKeptImages(existingImages);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [JSON.stringify(existingImages.map((f) => f._id))]);

    useEffect(() => {
        setKeptDocuments(existingDocuments);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [JSON.stringify(existingDocuments.map((f) => f._id))]);

    // Re-sync form values if initialValues arrive later (async edit page)
    useEffect(() => {
        if (!initialValues) return;
        setValues({
            ...DEFAULT_VALUES,
            ...initialValues,
            days: initialValues.days ?? DEFAULT_VALUES.days,
            devices: initialValues.devices ?? DEFAULT_VALUES.devices,
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [JSON.stringify(initialValues)]);

    const fetchCreateData = useCallback(async () => {
        if (!token) {
            setLoading(false);
            return;
        }

        setLoading(true);
        setLoadError("");

        try {
            const response = await doGet(CREATE_DATA_URL);

            const result = response?.data ?? response;
            const payload = result?.data ?? result;

            setCreateData(Array.isArray(payload) ? payload : []);
        } catch (error) {
            console.error("Failed to fetch amenity types:", error);

            setLoadError(
                error?.message || "Failed to load amenity types. Please try again."
            );
        } finally {
            setLoading(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token]);

    const fetchEditData = useCallback(async () => {
        if (!token || !id) return;

        setLoading(true);
        setLoadError("");

        try {
            const response = await doGet(EDIT_URL(id));

            const result = response?.data ?? response;
            const payload = result?.data ?? result;

            setEditData(payload);
        } catch (error) {
            console.error("Failed to fetch amenity:", error);

            setLoadError(
                error?.message || "Failed to load amenity. Please try again."
            );
        } finally {
            setLoading(false);
        }
    }, [token, id]);


    useEffect(() => {
        if (!isEdit || !editData) return;

        // Support either a direct amenity object or a nested response.
        const amenity =
            editData?.amenity ??
            editData?.amenityData ??
            editData;

        // Convert backend data into form values.
        const formValues = toFormValues(amenity);

        setValues({
            ...DEFAULT_VALUES,
            ...formValues,
            name: amenity.title ?? amenity.name ?? "",
            type: amenity.type?._id ?? amenity.type ?? "",
            status: amenity.status === true || amenity.status === "true" || amenity.status === 1,
            days: Array.isArray(amenity.available_days) ? amenity.available_days.map((day) =>
                String(day).slice(0, 1).toUpperCase() +
                String(day).slice(1).toLowerCase()
            ) : [],
            devices: Array.isArray(amenity.linked_devices) ? amenity.linked_devices.map((device) =>
                typeof device === "object"
                    ? device.name ?? device._id
                    : device
            ) : [],
        });

        // Map saved images into the ExistingFiles component format.
        const savedImages = Array.isArray(amenity.images)
            ? amenity.images.map((file) => ({
                ...file,
                _id: file._id ?? file.id,
                name: file.name ?? file.filename ?? "Image",
                url: file.url?.startsWith("http") ? file.url : `${ASSET_URL || ""}/${String(file.url || "").replace(/\\/g, "/").replace(/^\/+/, "")}`,
            })) : [];

        // Map saved documents into the ExistingFiles component format.
        const savedDocuments = Array.isArray(amenity.documents)
            ? amenity.documents.map((file) => ({
                ...file,
                _id: file._id ?? file.id,
                name: file.name ?? file.filename ?? "Document",
                url: file.url?.startsWith("http") ? file.url : `${ASSET_URL || ""}/${String(file.url || "").replace(/\\/g, "/").replace(/^\/+/, "")}`,
            })) : [];

        setExistingImages(savedImages);
        setExistingDocuments(savedDocuments);

        setKeptImages(savedImages);
        setKeptDocuments(savedDocuments);
    }, [editData, isEdit]);


    useEffect(() => {

        if (id) {

            fetchEditData()
        }

        fetchCreateData();
    }, [fetchCreateData, fetchEditData, id]);

    const onCancel = () => {
        router.replace(LIST_ROUTE);
    };

    const onSubmit = async (formData) => {
        // Do NOT set Content-Type manually; the browser adds the multipart boundary.
        if (isEdit) {
            return doPut(PUT_URL(id), formData);
        }
        return doPost(POST_URL, formData);
    };

    const set = (key) => (eventOrValue) => {
        const value = eventOrValue?.target
            ? eventOrValue.target.value
            : eventOrValue;

        setValues((previous) => ({ ...previous, [key]: value }));

        setErrors((previous) => {
            if (!previous[key]) return previous;
            const next = { ...previous };
            delete next[key];
            return next;
        });
    };

    const validate = () => {
        const next = {};

        if (!values.name.trim()) {
            next.name = "Please enter an amenity name.";
        }

        if (!values.type) {
            next.type = "Please select an amenity type.";
        }

        if (
            values.slotTime === "" ||
            !Number.isFinite(Number(values.slotTime)) ||
            Number(values.slotTime) <= 0
        ) {
            next.slotTime = "Enter a valid slot duration.";
        }

        if (!values.days.length) {
            next.days = "Select at least one available day.";
        }

        if (
            values.occupancy === "" ||
            !Number.isFinite(Number(values.occupancy)) ||
            Number(values.occupancy) < 1
        ) {
            next.occupancy = "Occupancy must be at least 1.";
        }

        if (
            values.tenantQuota &&
            (values.tenantQuotaCount === "" ||
                !Number.isFinite(Number(values.tenantQuotaCount)) ||
                Number(values.tenantQuotaCount) < 1)
        ) {
            next.tenantQuotaCount = "Enter a monthly quota of at least 1.";
        }

        setErrors(next);
        return Object.keys(next).length === 0;
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (saving) return;
        if (!validate()) return;

        setSaving(true);
        setSubmitError("");

        try {
            const removeImageIds = existingImages
                .filter((f) => !keptImages.some((k) => k._id === f._id))
                .map((f) => f._id);

            const removeDocumentIds = existingDocuments
                .filter((f) => !keptDocuments.some((k) => k._id === f._id))
                .map((f) => f._id);

            const formData = buildFormData(values, {
                images,
                documents,
                removeImageIds,
                removeDocumentIds,
            });

            await onSubmit(formData);

            router.replace(LIST_ROUTE);
        } catch (error) {
            setSubmitError(
                error?.response?.data?.message ||
                error?.message ||
                "Failed to save amenity."
            );
        } finally {
            setSaving(false);
        }
    };

    const selectSx = {
        ...inputSx,
        "& .MuiSelect-select": {
            ...inputSx["& .MuiSelect-select"],
        },
    };

    return (
        <Box
            sx={{
                width: "100%",
                minHeight: "100vh",
                boxSizing: "border-box",
                bgcolor: "#F7F8FA",
                p: { xs: 1.5, sm: 2.5, lg: 3 },
            }}
        >
            <Box sx={{ width: "100%", maxWidth: 1600, mx: "auto" }}>
                <Box sx={{ mb: 3 }}>
                    <Typography
                        sx={{
                            fontSize: { xs: 22, md: 28 },
                            fontWeight: 750,
                            letterSpacing: "-0.5px",
                            color: "text.primary",
                        }}
                    >
                        {isEdit ? "Edit Amenity" : "Add New Amenity"}
                    </Typography>

                    <Typography
                        sx={{
                            mt: 0.75,
                            fontSize: 14,
                            color: "text.secondary",
                            lineHeight: 1.7,
                        }}
                    >
                        Set up your amenity, manage booking availability, and configure
                        access options.
                    </Typography>
                </Box>

                <Paper
                    component="form"
                    onSubmit={handleSubmit}
                    noValidate
                    elevation={0}
                    sx={{
                        width: "100%",
                        minWidth: 0,
                        boxSizing: "border-box",
                        bgcolor: "transparent",
                        overflow: "visible",
                        display: "flex",
                        flexDirection: "column",
                        gap: 2.5,
                    }}
                >
                    {/* Basic Information */}
                    <SectionCard>
                        <SectionTitle
                            icon={<InfoOutlinedIcon />}
                            description="Enter the essential details and booking schedule."
                        >
                            Basic Information & Booking
                        </SectionTitle>

                        <Box sx={gridSx}>
                            <Box sx={{ gridColumn: { xs: "auto", lg: "span 2" } }}>
                                <FieldLabel required>Amenity Name</FieldLabel>
                                <TextField
                                    fullWidth
                                    sx={inputSx}
                                    placeholder="e.g. Conference Room A"
                                    value={values.name}
                                    onChange={set("name")}
                                    error={!!errors.name}
                                    helperText={errors.name}
                                    inputProps={{ "aria-label": "Amenity name" }}
                                />
                            </Box>

                            <Box>
                                <FieldLabel required>Amenity Type</FieldLabel>
                                <FormControl fullWidth error={!!errors.type}>
                                    <Select
                                        value={values.type}
                                        onChange={set("type")}
                                        sx={selectSx}
                                        displayEmpty
                                        renderValue={(selected) => {
                                            if (!selected) {
                                                return (
                                                    <Box component="span" sx={{ color: "text.disabled" }}>
                                                        {loading ? "Loading types..." : "Select amenity type"}
                                                    </Box>
                                                );
                                            }
                                            return (
                                                createData.find((cd) => cd?._id === selected)?.name ??
                                                selected
                                            );
                                        }}
                                        inputProps={{ "aria-label": "Amenity type" }}
                                    >
                                        {createData.map((cd) => (
                                            <MenuItem key={cd?._id} value={cd?._id}>
                                                {cd?.name}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                    {(errors.type || loadError) && (
                                        <FormHelperText>{errors.type || loadError}</FormHelperText>
                                    )}
                                </FormControl>
                            </Box>

                            <Box>
                                <FieldLabel required>Slot Duration</FieldLabel>
                                <Stack direction="row" spacing={1}>
                                    <TextField
                                        fullWidth
                                        type="number"
                                        sx={{ ...inputSx, flex: 1, minWidth: 0 }}
                                        value={values.slotTime}
                                        onChange={set("slotTime")}
                                        error={!!errors.slotTime}
                                        inputProps={{ min: 1, "aria-label": "Slot duration" }}
                                    />

                                    <FormControl sx={{ flex: 1, minWidth: 0 }}>
                                        <Select
                                            value={values.slotUnit}
                                            onChange={set("slotUnit")}
                                            sx={selectSx}
                                            inputProps={{ "aria-label": "Duration unit" }}
                                        >
                                            {TIME_UNITS.map((unit) => (
                                                <MenuItem key={unit} value={unit}>
                                                    {unit}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </Stack>

                                {errors.slotTime && (
                                    <FormHelperText error>{errors.slotTime}</FormHelperText>
                                )}
                            </Box>

                            <Box sx={{ gridColumn: { xs: "auto", lg: "span 2" } }}>
                                <FieldLabel>Operating Hours</FieldLabel>
                                <Stack direction="row" spacing={1.5}>
                                    <Box sx={{ flex: 1, minWidth: 0 }}>
                                        <Typography
                                            sx={{ fontSize: 12, color: "text.secondary", mb: 0.5 }}
                                        >
                                            Opens at
                                        </Typography>
                                        <TextField
                                            fullWidth
                                            type="time"
                                            sx={inputSx}
                                            value={values.openTime}
                                            onChange={set("openTime")}
                                            inputProps={{ "aria-label": "Opening time" }}
                                        />
                                    </Box>

                                    <Box sx={{ flex: 1, minWidth: 0 }}>
                                        <Typography
                                            sx={{ fontSize: 12, color: "text.secondary", mb: 0.5 }}
                                        >
                                            Closes at
                                        </Typography>
                                        <TextField
                                            fullWidth
                                            type="time"
                                            sx={inputSx}
                                            value={values.closeTime}
                                            onChange={set("closeTime")}
                                            inputProps={{ "aria-label": "Closing time" }}
                                        />
                                    </Box>
                                </Stack>
                            </Box>

                            <Box sx={{ gridColumn: { xs: "auto", lg: "span 2" } }}>
                                <FieldLabel required>Available Days</FieldLabel>
                                <ToggleButtonGroup
                                    value={values.days}
                                    onChange={(_, next) => {
                                        setValues((previous) => ({ ...previous, days: next ?? [] }));
                                        setErrors((previous) => {
                                            if (!previous.days) return previous;
                                            const rest = { ...previous };
                                            delete rest.days;
                                            return rest;
                                        });
                                    }}
                                    aria-label="Available days"
                                    sx={{
                                        width: "100%",
                                        display: "grid",
                                        gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
                                        gap: 0.5,
                                        "& .MuiToggleButtonGroup-grouped": {
                                            margin: 0,
                                            border: "1px solid #DDE3EA !important",
                                            borderRadius: "7px !important",
                                        },
                                    }}
                                >
                                    {DAYS.map((day) => (
                                        <ToggleButton
                                            key={day}
                                            value={day}
                                            sx={{
                                                minWidth: 0,
                                                minHeight: 40,
                                                px: 0.25,
                                                fontSize: 12,
                                                fontWeight: 600,
                                                textTransform: "none",
                                                color: "text.secondary",
                                                "&.Mui-selected": {
                                                    bgcolor: "primary.main",
                                                    color: "#fff",
                                                    "&:hover": {
                                                        bgcolor: "primary.dark",
                                                    },
                                                },
                                            }}
                                        >
                                            {day}
                                        </ToggleButton>
                                    ))}
                                </ToggleButtonGroup>

                                <FormHelperText error={!!errors.days} sx={{ ml: 0 }}>
                                    {errors.days || "Choose the days when bookings are allowed."}
                                </FormHelperText>
                            </Box>

                            <Box>
                                <FieldLabel required>Occupancy Per Slot</FieldLabel>
                                <TextField
                                    fullWidth
                                    type="number"
                                    sx={inputSx}
                                    value={values.occupancy}
                                    onChange={set("occupancy")}
                                    error={!!errors.occupancy}
                                    helperText={
                                        errors.occupancy || "Maximum bookings per time slot."
                                    }
                                    inputProps={{ min: 1 }}
                                />
                            </Box>

                            <Box>
                                <FieldLabel required>Status</FieldLabel>
                                <FormControl fullWidth>
                                    <Select
                                        value={values.status}
                                        onChange={set("status")}
                                        sx={selectSx}
                                        inputProps={{ "aria-label": "Amenity status" }}
                                    >
                                        {STATUSES.map((status, index) => (
                                            <MenuItem key={index} value={status?.value}>
                                                {status?.label}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                    <FormHelperText
                                        sx={{
                                            color:
                                                values.status
                                                    ? "success.main"
                                                    : "text.secondary",
                                        }}
                                    >
                                        {values.status
                                            ? "Available for bookings"
                                            : "Unavailable for bookings"}
                                    </FormHelperText>
                                </FormControl>
                            </Box>
                        </Box>
                    </SectionCard>

                    {/* Access and Listing */}
                    <SectionCard>
                        <SectionTitle
                            icon={<SensorsIcon />}
                            description="Control who can book this amenity and how it is listed."
                        >
                            Access & Listing Settings
                        </SectionTitle>

                        <Box
                            sx={{
                                display: "grid",
                                gridTemplateColumns: {
                                    xs: "minmax(0, 1fr)",
                                    md: "repeat(3, minmax(0, 1fr))",
                                },
                                gap: 2,
                                alignItems: "stretch",
                            }}
                        >
                            <OptionBox
                                title="Internal Booking Access"
                                description="Choose who can access this amenity."
                            >
                                <RadioGroup
                                    value={values.internalAccess}
                                    onChange={set("internalAccess")}
                                >
                                    <FormControlLabel
                                        value="all"
                                        control={<Radio size="small" />}
                                        label="Entire organisation"
                                        sx={choiceLabelSx}
                                    />
                                    <FormControlLabel
                                        value="groups"
                                        control={<Radio size="small" />}
                                        label="Selected property groups"
                                        sx={choiceLabelSx}
                                    />
                                </RadioGroup>
                            </OptionBox>

                            <OptionBox
                                title="Public Listing"
                                description="Allow users to discover this amenity."
                            >
                                <FormControlLabel
                                    control={
                                        <Checkbox
                                            size="small"
                                            checked={values.publicListing}
                                            onChange={(event) =>
                                                setValues((previous) => ({
                                                    ...previous,
                                                    publicListing: event.target.checked,
                                                }))
                                            }
                                        />
                                    }
                                    label="Show on public amenities page"
                                    sx={choiceLabelSx}
                                />
                            </OptionBox>

                            <OptionBox
                                title="Tenant Monthly Quota"
                                description="Limit free monthly bookings."
                            >
                                <FormControlLabel
                                    control={
                                        <Checkbox
                                            size="small"
                                            checked={values.tenantQuota}
                                            onChange={(event) =>
                                                setValues((previous) => ({
                                                    ...previous,
                                                    tenantQuota: event.target.checked,
                                                }))
                                            }
                                        />
                                    }
                                    label="Enable monthly booking limits"
                                    sx={choiceLabelSx}
                                />

                                {values.tenantQuota && (
                                    <TextField
                                        fullWidth
                                        type="number"
                                        sx={{ ...inputSx, mt: 1 }}
                                        placeholder="Bookings per month"
                                        value={values.tenantQuotaCount}
                                        onChange={set("tenantQuotaCount")}
                                        error={!!errors.tenantQuotaCount}
                                        helperText={errors.tenantQuotaCount}
                                        inputProps={{
                                            min: 1,
                                            "aria-label": "Monthly booking quota",
                                        }}
                                    />
                                )}
                            </OptionBox>
                        </Box>
                    </SectionCard>

                    {/* Description */}
                    <SectionCard>
                        <SectionTitle
                            icon={<NotesIcon />}
                            description="Add helpful information about the amenity and its usage."
                        >
                            Description
                        </SectionTitle>

                        <RichTextEditor
                            value={values.description}
                            onChange={(html) =>
                                setValues((previous) => ({ ...previous, description: html }))
                            }
                            placeholder="Describe the amenity, facilities, rules, or booking instructions..."
                        />
                    </SectionCard>

                    {/* Physical Devices */}
                    <SectionCard>
                        <SectionTitle
                            icon={<SensorsIcon />}
                            description="Connect access-control hardware where applicable."
                        >
                            Physical Devices
                        </SectionTitle>

                        <Box sx={{ maxWidth: 850 }}>
                            <FieldLabel>Linked Devices</FieldLabel>

                            <Autocomplete
                                multiple
                                options={DEVICE_OPTIONS}
                                value={values.devices}
                                onChange={(_, next) =>
                                    setValues((previous) => ({ ...previous, devices: next }))
                                }
                                sx={{
                                    width: "100%",
                                    "& .MuiOutlinedInput-root": {
                                        minHeight: INPUT_HEIGHT,
                                        borderRadius: "8px",
                                        bgcolor: "#fff",
                                        py: 0.5,
                                    },
                                    "& .MuiAutocomplete-input": {
                                        fontSize: 14,
                                    },
                                }}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        placeholder="Search and select devices..."
                                    />
                                )}
                            />

                            <FormHelperText sx={{ ml: 0, mt: 1 }}>
                                You can select more than one device.
                            </FormHelperText>
                        </Box>
                    </SectionCard>

                    {/* Media and Documents */}
                    <SectionCard>
                        <SectionTitle
                            icon={<PermMediaOutlinedIcon />}
                            description="Upload photos and supporting documents."
                        >
                            Media & Documents
                        </SectionTitle>

                        <Box
                            sx={{
                                display: "grid",
                                gridTemplateColumns: {
                                    xs: "minmax(0, 1fr)",
                                    md: "repeat(2, minmax(0, 1fr))",
                                },
                                gap: 2.5,
                            }}
                        >
                            <Box sx={{ minWidth: 0 }}>
                                <ExistingFiles
                                    files={keptImages}
                                    onRemove={(fileId) =>
                                        setKeptImages((prev) => prev.filter((f) => f._id !== fileId))
                                    }
                                />
                                <UploadZone
                                    label="Amenity Images"
                                    hint={[
                                        "Click to upload images",
                                        "JPG, PNG or WEBP, max 10MB each",
                                    ]}
                                    accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                                    multiple
                                    files={images}
                                    onFiles={setImages}
                                />
                            </Box>

                            <Box sx={{ minWidth: 0 }}>
                                <ExistingFiles
                                    files={keptDocuments}
                                    onRemove={(fileId) =>
                                        setKeptDocuments((prev) =>
                                            prev.filter((f) => f._id !== fileId)
                                        )
                                    }
                                />
                                <UploadZone
                                    label="Documents"
                                    hint={["Click to upload documents", "PDF or DOCX, max 10MB each"]}
                                    accept=".pdf,.docx"
                                    multiple
                                    files={documents}
                                    onFiles={setDocuments}
                                />
                            </Box>
                        </Box>
                    </SectionCard>

                    {/* Form Actions */}
                    <Paper
                        elevation={0}
                        sx={{
                            p: { xs: 2, md: 2.5 },
                            border: "1px solid",
                            borderColor: "divider",
                            borderRadius: 2.5,
                            bgcolor: "background.paper",
                        }}
                    >
                        {submitError && (
                            <FormHelperText error sx={{ textAlign: "center", mb: 1.5, mx: 0 }}>
                                {submitError}
                            </FormHelperText>
                        )}

                        <Stack
                            direction={{ xs: "column-reverse", sm: "row" }}
                            justifyContent="center"
                            alignItems={{ xs: "stretch", sm: "center" }}
                            spacing={1.5}
                        >
                            <Stack
                                direction={{ xs: "column-reverse", sm: "row" }}
                                spacing={1.5}
                            >
                                <Button
                                    type="submit"
                                    variant="contained"
                                    disableElevation
                                    disabled={saving}
                                >
                                    {id ? "Update Amenity" : "Save Amenity"}
                                </Button>

                                <Button
                                    type="button"
                                    variant="outlined"
                                    onClick={onCancel}
                                    disabled={saving}
                                >
                                    Cancel
                                </Button>
                            </Stack>
                        </Stack>
                    </Paper>
                </Paper>
            </Box>
        </Box>
    );
};

export default FormComponenetPage;
