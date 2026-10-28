"use client";

import { useState } from "react";

import { Box, Button, Chip, Collapse, IconButton, LinearProgress, Paper, Stack, Typography } from "@mui/material";

import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import LayersOutlinedIcon from "@mui/icons-material/LayersOutlined";
import SecurityOutlinedIcon from "@mui/icons-material/SecurityOutlined";
import AccessTimeIcon from "@mui/icons-material/AccessTime";

import { C } from "../util/FormUI";

export default function ApprovalWorkflow({ title = "Approval workflow" }) {
    const [open, setOpen] = useState(true);

    return (
        <Paper
            variant="outlined"
            sx={{
                mt: 3,
                borderRadius: "16px",
                overflow: "hidden",
                borderColor: C.line,
                boxShadow: "0 1px 2px rgba(17,24,39,0.04)",
            }}
        >
            {/* Header */}
            <Stack
                direction="row"
                alignItems="center"
                flexWrap="wrap"
                useFlexGap
                spacing={1.5}
                sx={{ px: 3, py: 2, borderBottom: open ? `1px solid ${C.line}` : 0 }}
            >
                <Typography sx={{ fontSize: 16, fontWeight: 650, color: C.heading }}>
                    {title}
                </Typography>
                <Chip
                    label="Preview"
                    size="small"
                    sx={{ bgcolor: "#fef9c3", color: "#854d0e", fontSize: 12, fontWeight: 600, height: 22 }}
                />
                <Typography sx={{ fontSize: 13, color: C.muted }}>1 step</Typography>

                <Stack
                    direction="row"
                    alignItems="center"
                    spacing={1.5}
                    sx={{ ml: { sm: "auto !important" } }}
                >
                    <LinearProgress
                        variant="determinate"
                        value={0}
                        sx={{
                            width: 120,
                            height: 6,
                            borderRadius: 3,
                            bgcolor: C.line,
                            "& .MuiLinearProgress-bar": { bgcolor: C.brand },
                        }}
                    />
                    <Typography sx={{ fontSize: 13, color: C.muted }}>0%</Typography>
                    <Chip
                        label="Not started"
                        size="small"
                        sx={{ bgcolor: C.line, color: C.ink, fontSize: 12, fontWeight: 600, height: 24 }}
                    />
                    <Button
                        size="small"
                        variant="outlined"
                        startIcon={<LayersOutlinedIcon />}
                        sx={{
                            height: 34,
                            borderRadius: "10px",
                            textTransform: "none",
                            fontSize: 13,
                            fontWeight: 600,
                            color: C.ink,
                            borderColor: C.border,
                        }}
                    >
                        Side view
                    </Button>
                    <IconButton
                        size="small"
                        onClick={() => setOpen(!open)}
                        aria-label="Toggle workflow"
                        aria-expanded={open}
                    >
                        <ExpandLessIcon
                            fontSize="small"
                            sx={{ transform: open ? "none" : "rotate(180deg)", transition: "transform .2s" }}
                        />
                    </IconButton>
                </Stack>
            </Stack>

            <Collapse in={open}>
                <Box sx={{ px: 3, py: 3 }}>
                    <Stack direction="row" spacing={2} alignItems="center">
                        <Box
                            sx={{
                                width: 36,
                                height: 36,
                                flexShrink: 0,
                                borderRadius: "50%",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                bgcolor: C.surface,
                                border: `1px solid ${C.border}`,
                                color: C.muted,
                                fontSize: 14,
                                fontWeight: 600,
                            }}
                        >
                            1
                        </Box>

                        <Box
                            sx={{
                                flex: 1,
                                maxWidth: 420,
                                px: 2,
                                py: 1.5,
                                border: `1px solid ${C.line}`,
                                borderRadius: "12px",
                                bgcolor: "#fff",
                            }}
                        >
                            <Stack direction="row" justifyContent="space-between" alignItems="center">
                                <Typography sx={{ fontSize: 14, fontWeight: 650, color: C.heading }}>
                                    Final invoice
                                </Typography>
                                <Chip
                                    label="Pending"
                                    size="small"
                                    sx={{ bgcolor: C.line, color: C.ink, fontSize: 12, fontWeight: 600, height: 22 }}
                                />
                            </Stack>
                            <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mt: 0.75 }}>
                                <SecurityOutlinedIcon sx={{ fontSize: 16, color: C.muted }} />
                                <Typography sx={{ fontSize: 13, color: C.muted }}>
                                    Role-based approval
                                </Typography>
                            </Stack>
                        </Box>
                    </Stack>

                    <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mt: 2.5 }}>
                        <AccessTimeIcon sx={{ fontSize: 16, color: C.muted }} />
                        <Typography sx={{ fontSize: 13, color: C.muted }}>
                            Workflow starts once the invoice is submitted
                        </Typography>
                    </Stack>
                </Box>
            </Collapse>
        </Paper>
    );
}
