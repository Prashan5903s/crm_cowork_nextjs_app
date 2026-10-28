// MUI Imports
'use client'

import { useState, useEffect } from 'react'

import { useSession } from 'next-auth/react'

import Grid from '@mui/material/Grid2'

import SkeletonTableComponent from '@/components/skeleton/table/page'

import LeadTable from "./LeadTable"

import { useApi } from '@/utils/api'

const Lead = () => {

    const [leadsData, setLeadsData] = useState([]);
    const [view, setView] = useState('kanban')
    const [isTable, setIsTable] = useState(true);
    const [selectLeadStatusId, setSelectLeadStatusId] = useState()

    const { doGet, token } = useApi()

    async function fetchLeadsData() {
        try {

            const response = await doGet(`company/leads/data/${view}`)
            const result = response.data ?? response;
            setLeadsData(result)

        } catch (error) {
            throw new Error(error);
        }
    }

    useEffect(() => {
        if (token && view) {
            fetchLeadsData();
        }
    }, [token, view])

    return (
        <Grid container spacing={6}>
            <Grid size={{ xs: 12 }}>
                {leadsData ? (
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
                )
                    : (
                        <SkeletonTableComponent />
                    )
                }
            </Grid>
        </Grid>
    )
}

export default Lead
