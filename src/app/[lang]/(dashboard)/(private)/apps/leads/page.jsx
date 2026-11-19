// MUI Imports
'use client'

import { useState, useEffect, useCallback } from 'react'

import Grid from '@mui/material/Grid2'

import LeadTable from './LeadTable'

import { useApi } from '@/utils/api'

const Lead = () => {
  const [leadsData, setLeadsData] = useState(null) // null = loading
  const [view, setView] = useState('kanban')
  const [isTable, setIsTable] = useState(true)
  const [selectLeadStatusId, setSelectLeadStatusId] = useState()

  const { doGet, token } = useApi()

  // manual refresh (after create / edit / follow up / proposal)
  const fetchLeadsData = useCallback(async () => {
    try {
      const response = await doGet(`company/leads/data/${view}`)

      setLeadsData(response.data ?? response)
    } catch (error) {
      console.error('Error fetching leads:', error)
    }
  }, [view, token])

  // fetch on mount / view change, ignoring stale responses
  useEffect(() => {
    if (!token || !view) return

    let ignore = false

      ; (async () => {
        try {
          const response = await doGet(`company/leads/data/${view}`)

          if (!ignore) setLeadsData(response.data ?? response)
        } catch (error) {
          console.error('Error fetching leads:', error)
        }
      })()

    return () => {
      ignore = true
    }
  }, [token, view])

  return (
    <Grid container spacing={6}>
      <Grid size={{ xs: 12 }}>
        {/* LeadTable stays mounted; it shows its own loading state while tableData is null */}
        <LeadTable
          isTable={isTable}
          setIsTable={setIsTable}
          tableData={leadsData}
          fetchLeadsData={fetchLeadsData}
          view={view}
          setView={setView}
          setLeadsData={setLeadsData}
          setSelectLeadStatusId={setSelectLeadStatusId}
          selectLeadStatusId={selectLeadStatusId}
        />
      </Grid>
    </Grid>
  )
}

export default Lead
