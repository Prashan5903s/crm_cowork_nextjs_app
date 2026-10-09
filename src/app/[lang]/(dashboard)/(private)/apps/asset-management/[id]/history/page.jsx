// app/assets/[id]/history/page.jsx
'use client';

import React from 'react';
import { Box, Typography, Paper, Chip } from '@mui/material';
import { Timeline, TimelineItem, TimelineSeparator, TimelineConnector, TimelineContent, TimelineDot } from '@mui/lab';
import { Build, ShoppingCart, Assignment, LocalShipping } from '@mui/icons-material';

const mockHistory = [
    {
        _id: 'hist_1',
        eventType: 'Maintenance',
        eventDate: '2026-02-12',
        description: 'Routine quarterly check performed. Firmware updated successfully.',
        cost: 50,
        technician: { name: 'Jane Smith' }
    },
    {
        _id: 'hist_2',
        eventType: 'Purchase',
        eventDate: '2024-01-14',
        description: 'Purchased brand new unit from TechWorld Vendors.',
        cost: 1200,
    }
];

const getEventIcon = (type) => {
    switch (type) {
        case 'Purchase': return <ShoppingCart />;
        case 'Maintenance': return <Build />;
        default: return <Assignment />;
    }
};

export default function AssetHistoryTimeline() {
    return (
        <Box sx={{ p: 3, bgcolor: '#f8f9fa', minHeight: '100vh' }}>
            <Typography variant="h5" fontWeight="bold" mb={1}>Asset Audit History (`asset_history`)</Typography>
            <Typography variant="body2" color="text.secondary" mb={3}>Chronological lifecycle events for Dell Latitude 5420</Typography>

            <Paper elevation={0} sx={{ p: 3, border: '1px solid #e2e8f0', borderRadius: 2 }}>
                <Timeline position="right">
                    {mockHistory.map((item, index) => (
                        <TimelineItem key={item._id}>
                            <TimelineSeparator>
                                <TimelineDot color="primary">{getEventIcon(item.eventType)}</TimelineDot>
                                {index < mockHistory.length - 1 && <TimelineConnector />}
                            </TimelineSeparator>
                            <TimelineContent sx={{ py: '12px', px: 2 }}>
                                <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                                    <Typography variant="subtitle1" fontWeight="bold">{item.eventType}</Typography>
                                    <Chip label={`$${item.cost}`} size="small" variant="outlined" />
                                    <Typography variant="caption" color="text.secondary">{item.eventDate}</Typography>
                                </Box>
                                <Typography variant="body2">{item.description}</Typography>
                                {item.technician && <Typography variant="caption" color="primary.main">Technician: {item.technician.name}</Typography>}
                            </TimelineContent>
                        </TimelineItem>
                    ))}
                </Timeline>
            </Paper>
        </Box>
    );
}
