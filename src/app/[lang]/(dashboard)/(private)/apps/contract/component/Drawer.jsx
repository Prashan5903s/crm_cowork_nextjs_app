"use client";

import {
    Box,
    Button,
    Drawer as MuiDrawer,
    IconButton,
    InputAdornment,
    Stack,
    Tab,
    Tabs,
    TextField,
    Typography
} from "@mui/material";

import { alpha } from "@mui/material/styles";

import { Search, X } from "lucide-react";

// Right-side slide-over used by every dialog in the contract form
export default function Drawer({ open, onClose, title, subtitle, width = 520, footer, children }) {
    return (
        <MuiDrawer
            anchor="right"
            open={open}
            onClose={onClose}
            PaperProps={{ sx: { width: { xs: "100%", sm: width }, display: "flex", flexDirection: "column" } }}
        >
            {/* Header */}
            <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="flex-start"
                sx={{ px: 3, py: 2.5, borderBottom: 1, borderColor: "divider" }}
            >
                <Box>
                    {title && <Typography variant="h6" fontWeight={700}>{title}</Typography>}
                    {subtitle && <Typography variant="body2" color="text.secondary" mt={0.5}>{subtitle}</Typography>}
                </Box>
                <IconButton onClick={onClose} aria-label="Close" size="small" sx={{ mt: -0.5, mr: -0.5 }}>
                    <X size={18} />
                </IconButton>
            </Stack>

            {/* Body */}
            <Box sx={{ flex: 1, overflowY: "auto", px: 3, py: 2.5 }}>{children}</Box>

            {/* Footer */}
            {footer && (
                <Stack
                    direction="row"
                    justifyContent="flex-end"
                    alignItems="center"
                    spacing={1.5}
                    sx={{ borderTop: 1, borderColor: "divider", px: 3, py: 2, bgcolor: "background.paper" }}
                >
                    {footer}
                </Stack>
            )}
        </MuiDrawer>
    );
}

export const SearchBox = ({ value, onChange, placeholder = "Search" }) => (
    <TextField
        fullWidth
        size="small"
        sx={{ mb: 2, "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        InputProps={{
            startAdornment: (
                <InputAdornment position="start">
                    <Search size={16} />
                </InputAdornment>
            ),
        }}
    />
);

// Pill-style tabs that follow the theme's primary color
export const TabPills = ({ tabs, value, onChange }) => (
    <Tabs
        value={value}
        onChange={(_, v) => onChange(v)}
        variant="fullWidth"
        TabIndicatorProps={{ sx: { display: "none" } }}
        sx={{ mb: 2.5, minHeight: 40 }}
    >
        {tabs.map((t) => (
            <Tab
                key={t}
                value={t}
                label={t}
                disableRipple
                sx={(theme) => ({
                    minHeight: 40,
                    mr: 1,
                    "&:last-of-type": { mr: 0 },
                    borderRadius: 2,
                    textTransform: "none",
                    fontWeight: 600,
                    color: "text.primary",
                    bgcolor: alpha(theme.palette.primary.main, 0.08),
                    "&:hover": { bgcolor: alpha(theme.palette.primary.main, 0.16) },
                    "&.Mui-selected": { color: "#fff", bgcolor: theme.palette.primary.main },
                })}
            />
        ))}
    </Tabs>
);

export { Button };
