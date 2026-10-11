// MUI Imports

'use client'

import { useState, useEffect } from 'react'

import { useSession } from 'next-auth/react'

import Typography from '@mui/material/Typography'

import Grid from '@mui/material/Grid2'

import EscalationTable from './EscalationTable'

import SkeletonTableComponent from '@/components/skeleton/table/page'

const EscalationPage = () => {

    const [zoneData, setZoneData] = useState();
    const [loading, setLoading] = useState(false);

    const URL = process.env.NEXT_PUBLIC_API_URL;

    const { data: session } = useSession() || {};

    const token = session && session.user && session?.user?.token;

    async function fetchZoneData() {

        try {
            const response = await fetch(`${URL}/company/escalation/data`,
                {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                })

            const result = await response.json();

            if (response.ok) {

                const value = result?.data;

                setLoading(true);
                setZoneData(value);
            } else {

            }

        } catch (error) {
            throw new Error(error);
        } finally {
            setLoading(true);
        }
    }

    useEffect(() => {
        if (URL && token) {
            fetchZoneData();
        }
    }, [token])

    return (
        <Grid container spacing={6}>
            <Grid size={{ xs: 12 }}>
                <Typography variant='h4' className='mbe-1'>
                    Escalated Complain List
                </Typography>
            </Grid>
            <Grid size={{ xs: 12 }}>
                {zoneData ? (
                    <EscalationTable tableData={zoneData} fetchZoneData={fetchZoneData} />
                )
                    : (
                        <SkeletonTableComponent />
                    )
                }
            </Grid>
        </Grid>
    )
}

export default EscalationPage
