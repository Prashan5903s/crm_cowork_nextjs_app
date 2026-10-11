"use client";

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import {
    Card,
    CardContent,
    Typography,
    Chip,
    Box,
    CircularProgress,
    TablePagination
} from '@mui/material';
import Grid from "@mui/material/Grid2";
import { Package, CheckCircle2, ShieldCheck, Clock, Hash, Tag } from 'lucide-react';
import formatTime from '@/utils/formatTime';
import { Password } from '@mui/icons-material';

const ParcelCard = () => {
    const URL = process.env.NEXT_PUBLIC_API_URL;
    const { data: session } = useSession() || {};
    const token = session?.user?.token;

    const [parcelData, setParcelData] = useState([]);
    const [loading, setLoading] = useState(true);

    // Pagination States
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(8);

    const fetchParcel = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${URL}/user/parcel/resident/log`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            const value = await response.json();

            if (response.ok) {
                setParcelData(value?.data || []);
            }
        } catch (error) {
            console.error("Failed to fetch parcels:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (URL && token) {
            fetchParcel();
        } else {
            setLoading(false);
        }
    }, [URL, token]);

    // Handle Page Change
    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    // Handle Rows Per Page Change
    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const statusMap = {
        "1": "Pending",
        "2": "Left at Gate",
        "3": "Delivered",
    };

    const courierData = [
        { value: '1', title: 'Amazon' },
        { value: '2', title: 'Flipkart' },
        { value: '3', title: 'Bluedart' },
        { value: '4', title: 'DHL/FedEx' },
        { value: '5', title: 'Quick Commerce (Zepto/Instamart)' },
        { value: '6', title: 'Other' }
    ];

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
                <CircularProgress color="primary" />
            </Box>
        );
    }

    if (!parcelData || parcelData.length === 0) {
        return (
            <Box
                sx={{
                    textAlign: 'center',
                    py: 8,
                    px: 4,
                    backgroundColor: 'background.paper',
                    borderRadius: 4,
                    border: '1px dashed',
                    borderColor: 'divider',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 1.5
                }}
            >
                <Box
                    sx={{
                        p: 2,
                        borderRadius: '50%',
                        backgroundColor: 'action.hover',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                >
                    <Package size={36} color="#9ca3af" />
                </Box>
                <Typography variant="h6" color="text.primary" fontWeight={600}>
                    No Parcels Found
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 300 }}>
                    You don't have any received parcel logs yet. New deliveries will appear here.
                </Typography>
            </Box>
        );
    }

    // Slice data for the current page
    const paginatedParcelData = parcelData.slice(
        page * rowsPerPage,
        page * rowsPerPage + rowsPerPage
    );

    return (
        <Box sx={{ width: '100%' }}>
            <Grid container spacing={3}>
                {paginatedParcelData.map((parcel, index) => {
                    const courier = courierData?.find(cd => cd.value == parcel?.courier_company_id);

                    return (
                        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={parcel._id || index}>
                            <Card
                                elevation={0}
                                sx={{
                                    height: '100%',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    borderRadius: 4,
                                    backgroundColor: 'background.paper',
                                    border: '1px solid',
                                    borderColor: 'divider',
                                    overflow: 'hidden',
                                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                    '&:hover': {
                                        transform: 'translateY(-4px)',
                                        boxShadow: (theme) => theme.palette.mode === 'dark'
                                            ? '0 12px 30px rgba(0,0,0,0.6)'
                                            : '0 12px 30px -10px rgba(79, 70, 229, 0.15)',
                                        borderColor: 'primary.main'
                                    }
                                }}
                            >
                                {/* Card Header with Adaptive Gradient */}
                                <Box
                                    sx={{
                                        background: (theme) => theme.palette.mode === 'dark'
                                            ? 'linear-gradient(135deg, #312e81 0%, #4c1d95 100%)'
                                            : 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                                        p: 2.5,
                                        color: '#ffffff',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        gap: 1.5
                                    }}
                                >
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0 }}>
                                        <Box
                                            sx={{
                                                p: 1.25,
                                                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                                                borderRadius: 2.5,
                                                backdropFilter: 'blur(4px)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                flexShrink: 0
                                            }}
                                        >
                                            <Package size={20} color="#ffffff" />
                                        </Box>
                                        <Box sx={{ minWidth: 0 }}>
                                            <Typography
                                                variant="caption"
                                                sx={{
                                                    color: 'rgba(255, 255, 255, 0.75)',
                                                    textTransform: 'uppercase',
                                                    fontWeight: 600,
                                                    letterSpacing: '0.05em',
                                                    display: 'block',
                                                    fontSize: '0.65rem'
                                                }}
                                            >
                                                Courier Service
                                            </Typography>
                                            <Typography
                                                variant="subtitle1"
                                                noWrap
                                                sx={{ fontWeight: 700, lineHeight: 1.2, color: '#ffffff' }}
                                            >
                                                {courier?.title || 'Unknown'}
                                            </Typography>
                                        </Box>
                                    </Box>

                                    {/* Status Badge */}
                                    <Chip
                                        icon={<CheckCircle2 size={13} color="#6ee7b7" />}
                                        label={statusMap?.[parcel?.status] || 'Unknown'}
                                        size="small"
                                        sx={{
                                            backgroundColor: 'rgba(16, 185, 129, 0.25)',
                                            color: '#ecfdf5',
                                            fontWeight: 600,
                                            fontSize: '0.7rem',
                                            height: 26,
                                            border: '1px solid rgba(52, 211, 153, 0.4)',
                                            backdropFilter: 'blur(4px)',
                                            flexShrink: 0,
                                            '& .MuiChip-icon': { ml: '6px' }
                                        }}
                                    />
                                </Box>

                                {/* Card Body */}
                                <CardContent sx={{ p: 2.5, flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 2 }}>
                                    {/* Product Content Highlight Box */}
                                    <Box
                                        sx={{
                                            backgroundColor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.015)',
                                            p: 2,
                                            borderRadius: 3,
                                            border: '1px solid',
                                            borderColor: 'divider'
                                        }}
                                    >
                                        <Typography variant="caption" color="text.secondary" fontWeight={500} sx={{ display: 'block', mb: 0.5 }}>
                                            Parcel Content
                                        </Typography>
                                        <Typography variant="body1" fontWeight={600} color="text.primary" sx={{ lineHeight: 1.4 }}>
                                            {parcel?.product_name || 'N/A'}
                                        </Typography>
                                    </Box>

                                    {/* Metadata Details */}
                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary' }}>
                                                <Password size={15} />
                                                <Typography variant="caption">OTP</Typography>
                                            </Box>
                                            <Typography variant="caption" fontWeight={600} color="text.primary" noWrap sx={{ maxWidth: '140px' }}>
                                                {parcel?.otp || 'N/A'}
                                            </Typography>
                                        </Box>
                                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary' }}>
                                                <Hash size={15} />
                                                <Typography variant="caption">Tracking ID</Typography>
                                            </Box>
                                            <Typography variant="caption" fontWeight={600} color="text.primary" noWrap sx={{ maxWidth: '140px' }}>
                                                {parcel?.trackingNumber || 'N/A'}
                                            </Typography>
                                        </Box>

                                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary' }}>
                                                <ShieldCheck size={15} />
                                                <Typography variant="caption">Received By</Typography>
                                            </Box>
                                            <Typography variant="caption" fontWeight={600} color="text.primary" noWrap sx={{ maxWidth: '140px' }}>
                                                {parcel?.securityGuardId ? `${parcel.securityGuardId.first_name || ''} ${parcel.securityGuardId.last_name || ''}`.trim() : 'N/A'}
                                            </Typography>
                                        </Box>

                                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, pt: 1, borderTop: '1px solid', borderColor: 'divider' }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary' }}>
                                                <Clock size={15} />
                                                <Typography variant="caption">Received At</Typography>
                                            </Box>
                                            <Typography variant="caption" fontWeight={600} color="text.primary">
                                                {formatTime(parcel?.createdAt)}
                                            </Typography>
                                        </Box>
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>
                    );
                })}
            </Grid>

            {/* Pagination Controls */}
            <TablePagination
                component="div"
                count={parcelData.length}
                page={page}
                onPageChange={handleChangePage}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                rowsPerPageOptions={[4, 8, 12, 24]}
                sx={{
                    mt: 3,
                    borderRadius: 3,
                    backgroundColor: 'background.paper',
                    border: '1px solid',
                    borderColor: 'divider',
                    color: 'text.secondary'
                }}
            />
        </Box>
    );
};

export default ParcelCard;
