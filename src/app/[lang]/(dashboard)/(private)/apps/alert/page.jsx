// MUI Imports

'use client'

import { useState, useEffect } from 'react'

import { useParams } from 'next/navigation'

import { useSession } from 'next-auth/react'

import Typography from '@mui/material/Typography'

import Grid from '@mui/material/Grid2'

import PushNotificationTable from "./PushNotificationTable"

import SkeletonTableComponent from '@/components/skeleton/table/page'

const AlertIndexPage = () => {
  const [pushData, setPushData] = useState()
  const [loading, setLoading] = useState(false)

  const URL = process.env.NEXT_PUBLIC_API_URL

  const { data: session } = useSession() || {}

  const token = session && session.user && session?.user?.token

  async function fetchPushData () {
    try {
      setLoading(false)

      const response = await fetch(`${URL}/company/user/push/notification`, {
        method: 'GET',
        headers: {
          // "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        }
      })

      const datas = await response.json()

      if (response.ok) {
        setLoading(true)
        setPushData(datas?.data)
      } else {
      }
    } catch (error) {
      throw new Error(error)
    } finally {
      setLoading(true)
    }
  }

  useEffect(() => {
    if (URL && token) {
      fetchPushData()
    }
  }, [token])

  return (
    <Grid container spacing={6}>
      <Grid size={{ xs: 12 }}>
        <Typography variant='h4' className='mbe-1'>
          Push Notification List
        </Typography>
      </Grid>
      <Grid size={{ xs: 12 }}>
        {loading ? <PushNotificationTable tableData={pushData} fetchZoneData={fetchPushData} /> : <SkeletonTableComponent />}
      </Grid>
    </Grid>
  )
}

export default AlertIndexPage
