// MUI Imports

'use client'

import { useState, useEffect } from 'react'

import { useSession } from 'next-auth/react'

import Typography from '@mui/material/Typography'

import Grid from '@mui/material/Grid2'

import LeadPurposeTable from './LeadPurposeTable'

import SkeletonTableComponent from '@/components/skeleton/table/page'

const LeadPurpose = () => {

  const [leadPurposeData, setLeadPurposeData] = useState();
  const [loading, setLoading] = useState(false);

  const URL = process.env.NEXT_PUBLIC_API_URL;

  const { data: session } = useSession() || {};

  const token = session && session.user && session?.user?.token;

  async function fetchTowerData() {

    setLoading(false)
    try {
      const response = await fetch(`${URL}/company/lead-purpose`,
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
        setLeadPurposeData(datas?.data);
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
    <Grid container spacing={6}>
      <Grid size={{ xs: 12 }}>
        <Typography variant='h4' className='mbe-1'>
          Lead Purpose List
        </Typography>
      </Grid>
      <Grid size={{ xs: 12 }}>
        {loading ? (
          <LeadPurposeTable tableData={leadPurposeData} fetchZoneData={fetchTowerData} />
        )
          : (
            <SkeletonTableComponent />
          )
        }
      </Grid>
    </Grid>
  )
}

export default LeadPurpose
