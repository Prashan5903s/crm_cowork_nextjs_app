// MUI Imports

'use client'

import { useState, useEffect } from 'react'

import { useSession } from 'next-auth/react'

import Typography from '@mui/material/Typography'

import Grid from '@mui/material/Grid2'

import VendorCategoryTable from './VendorCategoryTable'

import SkeletonTableComponent from '@/components/skeleton/table/page'

const VendorCategory = () => {

  const [vendorCategoryData, setVendorCategoryData] = useState();
  const [loading, setLoading] = useState(false);

  const URL = process.env.NEXT_PUBLIC_API_URL;

  const { data: session } = useSession() || {};

  const token = session && session.user && session?.user?.token;

  async function fetchVendorCategory() {

    setLoading(false)
    try {
      const response = await fetch(`${URL}/company/vendor-category `,
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
        setVendorCategoryData(datas?.data);
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
      fetchVendorCategory();
    }
  }, [token])

  return (
    <Grid container spacing={6}>
      <Grid size={{ xs: 12 }}>
        <Typography variant='h4' className='mbe-1'>
          Vendor Category List
        </Typography>
      </Grid>
      <Grid size={{ xs: 12 }}>
        {loading ? (
          <VendorCategoryTable tableData={vendorCategoryData} fetchZoneData={fetchVendorCategory} />
        )
          : (
            <SkeletonTableComponent />
          )
        }
      </Grid>
    </Grid>
  )
}

export default VendorCategory
