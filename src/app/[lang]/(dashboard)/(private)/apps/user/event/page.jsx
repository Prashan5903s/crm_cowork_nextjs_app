// MUI Imports

'use client'

import { useState, useEffect } from 'react'

import { useParams } from 'next/navigation'

import { useSession } from 'next-auth/react'

import Typography from '@mui/material/Typography'

import Grid from '@mui/material/Grid2'

import EventTable from '@views/apps/MyEvent/page'

import PermissionClient from '@/hocs/PermissionClientGuard'

import SkeletonTableComponent from '@/components/skeleton/table/page'

const Events = () => {

    const [towerData, setTowerData] = useState();
    const [loading, setLoading] = useState(false);

    const URL = process.env.NEXT_PUBLIC_API_URL;

    const { data: session } = useSession() || {};

    const token = session && session.user && session?.user?.token;

    const { lang: locale } = useParams()

    async function fetchTowerData() {

        try {
            const response = await fetch(`${URL}/user/event`,
                {
                    method: "GET",
                    headers: {
                        // "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`
                    }
                })

            const datas = await response.json();

            if (response.ok) {
                setLoading(true);
                setTowerData(datas?.data);
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
            fetchTowerData();
        }
    }, [token])

    return (
        <PermissionClient locale={locale} element={'isUser'}>
            <Grid container spacing={6}>
                <Grid size={{ xs: 12 }}>
                    <Typography variant='h4' className='mbe-1'>
                        Event List
                    </Typography>
                </Grid>
                <Grid size={{ xs: 12 }}>
                    {towerData ? (
                        <EventTable tableData={towerData} fetchZoneData={fetchTowerData} />
                    )
                        : (
                            <SkeletonTableComponent />
                        )
                    }
                </Grid>
            </Grid>
        </PermissionClient>
    )
}

export default Events
