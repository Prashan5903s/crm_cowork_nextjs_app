"use client";

import { useEffect, useState } from "react";

import { useSession } from "next-auth/react";

import {
    Card,
    CardContent,
    Typography,
    Skeleton,
    TextField,
    Button,
    Table,
    TableHead,
    TableBody,
    TableRow,
    TableCell,
    Paper,
} from "@mui/material";

import Grid from "@mui/material/Grid2";

import { toast } from "react-toastify";

const SLASetting = () => {
    const { data: session } = useSession();

    const token = session?.user?.token;
    const API_URL = process.env.NEXT_PUBLIC_API_URL;

    const [data, setData] = useState(null);
    const [slaBreachDays, setSLABreachDays] = useState("");

    const fetchSLAConfig = async () => {
        try {
            const response = await fetch(`${API_URL}/company/sla/config/data`, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            const result = await response.json();

            if (response.ok) {
                const value = result?.data;

                setData(value);

                // Set input value from API response
                setSLABreachDays(value ?? "");
            } else {
                toast.error(result?.message || "Failed to fetch SLA setting");
            }
        } catch (error) {
            console.error("Fetch SLA config error:", error);
            toast.error("Something went wrong while fetching SLA setting");
        }
    };

    const reset = () => {
        
        fetchSLAConfig();
    };

    useEffect(() => {
        if (API_URL && token) {

            setData(null);
            fetchSLAConfig();
        }
    }, [API_URL, token]);

    const handleSubmit = async () => {
        // Validation
        if (
            slaBreachDays === "" ||
            slaBreachDays === null ||
            Number(slaBreachDays) < 2
        ) {
            toast.error("Breach should be equal or greater than 2");
            return;
        }

        try {
            const payload = {
                slaBreachDays: Number(slaBreachDays),
            };

            const response = await fetch(`${API_URL}/company/sla/post/data`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(payload),
            });

            const result = await response.json();

            if (response.ok) {

                toast.success("SLA setting updated successfully", {
                    autoClose: 1000,
                });

                // Refresh saved value from API
                await fetchSLAConfig();
            } else {
                toast.error(result?.message || "Failed to update SLA setting");
            }
        } catch (error) {
            console.error("Save SLA config error:", error);
            toast.error("Something went wrong");
        }
    };

    // Loading state
    if (data === null) {
        return (
            <Card sx={{ p: 2 }}>
                <CardContent>
                    <Typography variant="h6" gutterBottom>
                        <Skeleton width="60%" />
                    </Typography>

                    <Typography variant="subtitle2" gutterBottom>
                        <Skeleton width="40%" />
                    </Typography>

                    <Grid container spacing={2} sx={{ mb: 2 }}>
                        <Grid size={{ xs: 12 }}>
                            <Skeleton variant="rectangular" height={60} />
                        </Grid>
                    </Grid>

                    <Grid container justifyContent="flex-start" sx={{ mt: 3 }}>
                        <Skeleton variant="rectangular" width={120} height={40} />
                    </Grid>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card sx={{ p: 2 }}>
            <CardContent>
                <Typography variant="h6" sx={{ mb: "2px" }} gutterBottom>
                    SLA Settings <span>*</span>
                </Typography>

                <Paper sx={{ mt: 6 }}>
                    <Table>
                        <TableHead>
                            <TableRow sx={{ backgroundColor: "#f5f6f8" }}>
                                <TableCell>
                                    <b>No of days for SLA breach</b>
                                </TableCell>
                            </TableRow>
                        </TableHead>

                        <TableBody>
                            <TableRow>
                                <TableCell>
                                    <TextField
                                        type="number"
                                        size="small"
                                        fullWidth
                                        value={slaBreachDays}
                                        onChange={(e) => {
                                            setSLABreachDays(e.target.value);
                                        }}
                                        inputProps={{
                                            min: 0,
                                        }}
                                    />
                                </TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </Paper>

                <Grid
                    container
                    gap={2}
                    justifyContent="flex-start"
                    sx={{ mt: 3 }}
                >
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={handleSubmit}
                    >
                        Save
                    </Button>

                    <Button
                        variant="outlined"
                        color="secondary"
                        onClick={reset}
                    >
                        Reset
                    </Button>
                </Grid>
            </CardContent>
        </Card>
    );
};

export default SLASetting;
