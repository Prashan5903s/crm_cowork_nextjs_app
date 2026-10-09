// MUI Imports

'use client'

import { useState, useEffect } from 'react'

import { useSession } from 'next-auth/react'

import Typography from '@mui/material/Typography'

import Grid from '@mui/material/Grid2'

import PropertyTable from './PropertyTypeTable'

import SkeletonTableComponent from '@/components/skeleton/table/page'

const PropertyTypes = () => {

  const [propertyData, setPropertyData] = useState();
  const [loading, setLoading] = useState(false);

  const URL = process.env.NEXT_PUBLIC_API_URL;

  const { data: session } = useSession() || {};

  const token = session && session.user && session?.user?.token;

  async function fetchTowerData() {

    try {
      const response = await fetch(`${URL}/company/property-type`,
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
        setPropertyData(datas?.data);
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
          Property Type List
        </Typography>
      </Grid>
      <Grid size={{ xs: 12 }}>
        {propertyData ? (
          <PropertyTable tableData={propertyData} fetchZoneData={fetchTowerData} />
        )
          : (
            <SkeletonTableComponent />
          )
        }
      </Grid>
    </Grid>
  )
}

export default PropertyTypes
