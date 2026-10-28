"use client";

import { Box, Typography } from "@mui/material";

export const C = {
    brand: "#6c5ce7",
    brandHover: "#5a4bd1",
    brandSoft: "#f1effe",
    ink: "#1f2937",
    heading: "#111827",
    muted: "#6b7280",
    faint: "#9ca3af",
    line: "#e5e7eb",
    border: "#d1d5db",
    surface: "#f9fafb",
    danger: "#dc2626",
};

export const CONTROL_H = 44;

/** Shared look for TextField controls so they match SearchSelect */
export const inputSx = {
    width: "100%",
    "& .MuiOutlinedInput-root": {
        minHeight: CONTROL_H,
        borderRadius: "10px",
        fontSize: 14,
        bgcolor: "#fff",
        "& fieldset": { borderColor: C.border },
        "&:hover fieldset": { borderColor: C.faint },
        "&.Mui-focused fieldset": { borderColor: C.brand, borderWidth: 1.5 },
    },
    "& .MuiInputBase-input": { fontSize: 14, py: "10px" },
    "& .MuiInputBase-input::placeholder": { color: C.faint, opacity: 1 },
    "& .MuiFormHelperText-root": { mx: 0, mt: 0.5, fontSize: 12 },
};

export const Field = ({ label, required, hint, children, sx }) => (
    <Box sx={{ minWidth: 0, ...sx }}>
        <Typography
            component="label"
            sx={{
                display: "block",
                mb: 0.75,
                fontSize: 13.5,
                fontWeight: 500,
                color: C.ink,
            }}
        >
            {label}
            {required && (
                <Box component="span" sx={{ color: C.danger, ml: 0.4 }}>
                    *
                </Box>
            )}
        </Typography>
        {children}
        {hint && (
            <Typography sx={{ mt: 0.5, fontSize: 12.5, color: C.muted }}>
                {hint}
            </Typography>
        )}
    </Box>
);

export const Section = ({ title, description, action, children, first }) => (
    <Box
        sx={{
            pt: first ? 0 : 3.5,
            mt: first ? 0 : 3.5,
            borderTop: first ? 0 : `1px solid ${C.line}`,
        }}
    >
        <Box
            sx={{
                mb: 2.5,
                display: "flex",
                alignItems: { xs: "flex-start", sm: "center" },
                justifyContent: "space-between",
                flexDirection: { xs: "column", sm: "row" },
                gap: 1.5,
            }}
        >
            <Box>
                <Typography
                    sx={{ fontSize: 16, fontWeight: 650, color: C.heading }}
                >
                    {title}
                </Typography>
                {description && (
                    <Typography sx={{ mt: 0.25, fontSize: 13.5, color: C.muted }}>
                        {description}
                    </Typography>
                )}
            </Box>
            {action}
        </Box>
        {children}
    </Box>
);

export const grid = (cols) => ({
    display: "grid",
    gap: 2.5,
    gridTemplateColumns: {
        xs: "1fr",
        sm: cols === 3 ? "repeat(2, minmax(0, 1fr))" : "repeat(2, minmax(0, 1fr))",
        md: `repeat(${cols}, minmax(0, 1fr))`,
    },
});
