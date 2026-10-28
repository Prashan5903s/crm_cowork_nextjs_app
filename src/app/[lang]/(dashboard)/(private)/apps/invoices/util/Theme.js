"use client";
import { createTheme } from "@mui/material/styles";

const theme = createTheme({
    palette: {
        primary: { main: "#c2570c", dark: "#a34609", light: "#f7d6bd", contrastText: "#fff" },
        error: { main: "#dc2626" },
        text: { primary: "#111827", secondary: "#6b7280" },
    },
    shape: { borderRadius: 8 },
    typography: {
        fontFamily: 'Inter, "Segoe UI", Roboto, Arial, sans-serif',
        button: { textTransform: "none", fontWeight: 600 },
    },
    components: {
        MuiButton: { defaultProps: { disableElevation: true } },
    },
});

export default theme;
