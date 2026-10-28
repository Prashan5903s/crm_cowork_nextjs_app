"use client";

import { Autocomplete, Box, TextField, Typography } from "@mui/material";

import { C, CONTROL_H, inputSx } from "../util/FormUI";

export default function SearchSelect({
    value,
    onChange,
    options = [],
    placeholder = "Select...",
    disabled = false,
    clearable = false,
    showSub = true,
    error = false,
    helperText,
    // eslint-disable-next-line no-unused-vars
    large,
}) {
    const normalizedOptions = Array.isArray(options) ? options : [];

    const selected =
        normalizedOptions.find(
            (option) =>
                String(option?.value ?? "") === String(value ?? "")
        ) ?? null;

    return (
        <Autocomplete
            fullWidth
            disabled={disabled}
            options={normalizedOptions}
            value={selected}
            disableClearable={!clearable}
            onChange={(_, option) => {
                onChange?.(option?.value ?? "");
            }}
            isOptionEqualToValue={(option, selectedOption) =>
                String(option?.value ?? "") ===
                String(selectedOption?.value ?? "")
            }
            getOptionLabel={(option) =>
                String(option?.label ?? option?.full_name ?? option?.title ?? "")
            }
            getOptionKey={(option) =>
                String(
                    option?.value ??
                    option?._id ??
                    option?.id ??
                    option?.label ??
                    option?.full_name ??
                    ""
                )
            }
            filterOptions={(opts, { inputValue }) => {
                const query = inputValue.trim().toLowerCase();

                if (!query) return opts;

                return opts.filter((option) => {
                    const label =
                        option?.label ?? option?.full_name ?? option?.title ?? "";
                    const sub = option?.sub ?? "";
                    const email = option?.emails?.[0] ?? "";
                    const phone =
                        option?.phones?.[0]?.number ??
                        option?.phones?.[0] ??
                        "";

                    return `${label} ${sub} ${email} ${phone} `
                        .toLowerCase()
                        .includes(query);
                });
            }}
            noOptionsText="No results found"
            slotProps={{
                paper: {
                    sx: {
                        mt: 0.5,
                        borderRadius: "10px",
                        border: `1px solid ${C.line} `,
                        boxShadow: "0 8px 24px rgba(17,24,39,0.10)",
                    },
                },
                listbox: {
                    sx: { py: 0.5 },
                },
            }}
            renderOption={(props, option) => {
                const { key, ...optionProps } = props;

                const label =
                    option?.label ?? option?.full_name ?? option?.title ?? "";

                const email = option?.emails?.[0];

                const phone =
                    option?.phones?.[0]?.number ??
                    option?.phones?.[0];

                const secondaryText = [email, phone]
                    .filter(Boolean)
                    .join(" · ");

                return (
                    <Box
                        key={key}
                        component="li"
                        {...optionProps}
                        sx={{
                            display: "block !important",
                            py: "9px !important",
                            px: "14px !important",
                            minHeight: 40,
                        }}
                    >
                        <Typography
                            sx={{
                                fontSize: 14,
                                fontWeight: 500,
                                color: C.heading,
                            }}
                        >
                            {label}
                        </Typography>

                        {showSub && secondaryText && (
                            <Typography
                                sx={{
                                    mt: 0.25,
                                    fontSize: 12.5,
                                    lineHeight: 1.4,
                                    color: C.muted,
                                }}
                            >
                                {secondaryText}
                            </Typography>
                        )}

                        {showSub && !secondaryText && option?.sub && (
                            <Typography
                                sx={{
                                    mt: 0.25,
                                    fontSize: 12.5,
                                    lineHeight: 1.4,
                                    color: C.muted,
                                }}
                            >
                                {option.sub}
                            </Typography>
                        )}
                    </Box>
                );
            }}
            renderInput={(params) => (
                <TextField
                    {...params}
                    placeholder={placeholder}
                    error={error}
                    helperText={helperText}
                    sx={{
                        ...inputSx,
                        "& .MuiOutlinedInput-root": {
                            ...inputSx["& .MuiOutlinedInput-root"],
                            height: CONTROL_H,
                            py: "0 !important",
                            pl: "14px !important",
                            bgcolor: disabled ? C.surface : "#fff",
                            "& .MuiAutocomplete-input": {
                                p: "0 !important",
                                height: "100%",
                                minWidth: 0,
                            },
                            "& .MuiAutocomplete-endAdornment": {
                                right: 10,
                            },
                        },
                    }}
                />
            )}
        />
    );
}

