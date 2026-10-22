// MUI Imports

'use client'

import { useState, useEffect } from 'react'

import { useSession } from 'next-auth/react'

import Typography from '@mui/material/Typography'

import Grid from '@mui/material/Grid2'

import ContactMethodTable from './ContactMethodTable'

import SkeletonTableComponent from '@/components/skeleton/table/page'

const ContactMethod = () => {

  const [contactMethodData, setContactMethodData] = useState();
  const [loading, setLoading] = useState(false);

  const URL = process.env.NEXT_PUBLIC_API_URL;

  const { data: session } = useSession() || {};

  const token = session && session.user && session?.user?.token;

  async function fetchTowerData() {

    setLoading(false)
    try {
      const response = await fetch(`${URL}/company/contact-method`,
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
        setContactMethodData(datas?.data);
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
          Contact Method List
        </Typography>
      </Grid>
      <Grid size={{ xs: 12 }}>
        {loading ? (
          <ContactMethodTable tableData={contactMethodData} fetchZoneData={fetchTowerData} />
        )
          : (
            <SkeletonTableComponent />
          )
        }
      </Grid>
    </Grid>
  )
}

export default ContactMethod
