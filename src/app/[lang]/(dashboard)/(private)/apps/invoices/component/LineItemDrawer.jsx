"use client";
import { useEffect, useState } from "react";

import { Alert, Box, Button, Drawer, IconButton, Stack, TextField, Typography } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

import SearchSelect from "./SearchSelect";
import { C, Field, inputSx } from "../util/FormUI";

import { categories, chartOfAccounts, taxes } from "../data/page";
import { calcLine, inr } from "../util/HelperFun";

// crypto.randomUUID is unavailable on non-HTTPS pages, so fall back safely.
const makeId = () =>
    globalThis.crypto?.randomUUID?.() ??
    `${Date.now()}-${Math.random().toString(16).slice(2)}`;

const emptyItem = () => ({
    id: makeId(),
    category: "Property Rent",
    property: "",
    item: "",
    chartOfAccount: chartOfAccounts[0]?.value ?? "",
    amount: 0,
    taxRate: 0,
});

const btn = {
    height: 40,
    px: 2.5,
    borderRadius: "10px",
    fontSize: 14,
    fontWeight: 600,
    textTransform: "none",
};

export default function LineItemDrawer({
    open,
    initial,
    onClose,
    onSave,
    propertyOptions = [],
}) {
    const [form, setForm] = useState(emptyItem);
    const [error, setError] = useState("");

    useEffect(() => {
        if (open) {
            setForm(initial ? { ...initial } : emptyItem());
            setError("");
        }
    }, [open, initial]);

    const set = (key, val) => {
        setForm((f) => ({ ...f, [key]: val }));
        setError("");
    };

    const { total } = calcLine(Number(form.amount) || 0, Number(form.taxRate) || 0);

    const handleSave = () => {
        if (!form.chartOfAccount) {
            setError("Select a revenue account.");
            return;
        }

        if (!(Number(form.amount) > 0)) {
            setError("Enter an amount greater than 0.");
            return;
        }

        onSave({
            ...form,
            amount: Number(form.amount),
            taxRate: Number(form.taxRate) || 0,
        });
    };

    return (
        <Drawer
            anchor="right"
            open={open}
            onClose={onClose}
            slotProps={{
                paper: {
                    sx: {
                        width: { xs: "100%", sm: 480 },
                        display: "flex",
                        flexDirection: "column",
                        boxSizing: "border-box",
                    },
                },
            }}
        >
            {/* Header */}
            <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="flex-start"
                sx={{ px: 3, py: 2.5, borderBottom: `1px solid ${C.line}` }}
            >
                <Box>
                    <Typography sx={{ fontSize: 18, fontWeight: 700, color: C.heading }}>
                        {initial ? "Edit line item" : "Add line item"}
                    </Typography>
                    <Typography sx={{ mt: 0.25, fontSize: 13.5, color: C.muted }}>
                        Enter what you are charging and the tax that applies.
                    </Typography>
                </Box>
                <IconButton onClick={onClose} aria-label="Close" size="small">
                    <CloseIcon fontSize="small" />
                </IconButton>
            </Stack>

            {/* Body */}
            <Stack spacing={2.5} sx={{ flex: 1, overflowY: "auto", px: 3, py: 3 }}>
                {error && (
                    <Alert severity="error" onClose={() => setError("")} sx={{ borderRadius: "10px" }}>
                        {error}
                    </Alert>
                )}

                <Field label="Category">
                    <SearchSelect
                        value={form.category}
                        onChange={(v) => set("category", v)}
                        options={categories}
                        showSub={false}
                    />
                </Field>

                <Field label="Property">
                    <SearchSelect
                        value={form.property}
                        onChange={(v) => set("property", v)}
                        options={propertyOptions}
                        placeholder="Select a property"
                        clearable
                        showSub={false}
                    />
                </Field>

                <Field label="Item">
                    <TextField
                        fullWidth
                        placeholder="e.g. Monthly rent"
                        value={form.item}
                        onChange={(e) => set("item", e.target.value)}
                        sx={inputSx}
                    />
                </Field>

                <Field label="Revenue account" required>
                    <SearchSelect
                        value={form.chartOfAccount}
                        onChange={(v) => set("chartOfAccount", v)}
                        options={chartOfAccounts}
                        clearable
                        showSub={false}
                        error={!!error && !form.chartOfAccount}
                    />
                </Field>

                <Box sx={{ display: "grid", gridTemplateColumns: "3fr 2fr", gap: 2 }}>
                    <Field label="Amount" required>
                        <TextField
                            fullWidth
                            type="number"
                            placeholder="0.00"
                            value={form.amount || ""}
                            onChange={(e) => set("amount", parseFloat(e.target.value) || 0)}
                            error={!!error && !(Number(form.amount) > 0)}
                            slotProps={{ htmlInput: { min: 0, step: "0.01" } }}
                            sx={inputSx}
                        />
                    </Field>
                    <Field label="Tax">
                        <SearchSelect
                            value={String(form.taxRate)}
                            onChange={(v) => set("taxRate", Number(v) || 0)}
                            options={taxes}
                            showSub={false}
                        />
                    </Field>
                </Box>

                <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                    sx={{ px: 2, py: 1.75, borderRadius: "12px", bgcolor: C.brandSoft }}
                >
                    <Typography sx={{ fontSize: 14, color: C.ink }}>Amount including tax</Typography>
                    <Typography sx={{ fontSize: 20, fontWeight: 700, color: C.brand }}>
                        {inr(total)}
                    </Typography>
                </Stack>
            </Stack>

            {/* Footer */}
            <Stack
                direction="row"
                spacing={1.25}
                justifyContent="flex-end"
                sx={{ px: 3, py: 2, borderTop: `1px solid ${C.line}` }}
            >
                <Button
                    variant="outlined"
                    onClick={onClose}
                    sx={{ ...btn, color: C.ink, borderColor: C.border }}
                >
                    Cancel
                </Button>
                <Button
                    variant="contained"
                    disableElevation
                    onClick={handleSave}
                    sx={{ ...btn, bgcolor: C.brand, "&:hover": { bgcolor: C.brandHover } }}
                >
                    Save item
                </Button>
            </Stack>
        </Drawer>
    );
}
