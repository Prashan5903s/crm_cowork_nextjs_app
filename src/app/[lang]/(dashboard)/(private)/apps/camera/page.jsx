'use client'

import { useEffect, useState } from "react";

import { useParams } from "next/navigation";

import { useSession } from "next-auth/react";

import {
    Card,
    CardContent,
    Typography,
    Link,
    IconButton,
} from "@mui/material";

import Grid from "@mui/material/Grid2";

import PermissionGuardClient from "@/hocs/PermissionClientGuard";

const colors = [
    "#1976d2", // blue
    "#9c27b0", // purple
    "#ff5722", // orange
    "#4caf50", // green
    "#f44336", // red
    "#00bcd4", // cyan
    "#ff9800", // amber
    "#e91e63", // pink
];

const CameraDashboard = () => {

    const { lang: locale } = useParams()

    const URL = process.env.NEXT_PUBLIC_API_URL;

    const { data: session } = useSession() || {};

    const token = session && session.user && session?.user?.token;

    const [cameraData, setCameraData] = useState();

    const fetchData = async () => {
        try {

            const response = await fetch(`${URL}/company/camera`, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token}`
                }
            })

            const result = await response.json()

            if (response.ok) {
                const value = result?.data;
                
                setCameraData(value)
            }

        } catch (error) {
            throw new Error(error)
        }
    }

    useEffect(() => {
        if (URL && token) {
            fetchData()
        }
    }, [URL, token])

    return (
        <PermissionGuardClient locale={locale} element={'hasCameraPermission'}>
            <Grid container spacing={4}>
                {cameraData?.map((camera, index) => {
                    const color = colors[index % colors.length]; // cycle through colors
                    
                    return (
                        <Grid item size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={camera.id}>
                            <Link
                                href={camera.ip}
                                color="inherit"
                                target="_blank"
                                sx={{
                                    textDecoration: "none",
                                    "&:hover": { color },
                                }}
                            >
                                <Card
                                    elevation={3}
                                    sx={{
                                        textAlign: "center",
                                        p: 2,
                                        borderRadius: 3,
                                        transition: "0.3s",
                                        "&:hover": {
                                            boxShadow: 6,
                                            transform: "translateY(-4px)",
                                        },
                                    }}
                                >
                                    <CardContent>
                                        <IconButton
                                            sx={{
                                                bgcolor: color,
                                                color: "white",
                                                width: 64,
                                                height: 64,
                                                mb: 2,
                                                "&:hover": {
                                                    bgcolor: color,
                                                    opacity: 0.9,
                                                },
                                            }}
                                        >
                                            <i className="tabler tabler-camera" style={{ fontSize: 28 }}></i>
                                        </IconButton>


                                        <Typography variant="h6" fontWeight={600}>
                                            {camera.title}
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </Link>
                        </Grid>
                    );
                })}
            </Grid >
        </PermissionGuardClient>
    );
};

export default CameraDashboard;
