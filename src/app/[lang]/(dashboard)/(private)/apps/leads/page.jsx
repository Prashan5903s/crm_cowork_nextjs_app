// MUI Imports
'use client'

import { useState, useEffect } from 'react'

import { useSession } from 'next-auth/react'

import Grid from '@mui/material/Grid2'

import SkeletonTableComponent from '@/components/skeleton/table/page'

import LeadTable from "./LeadTable"

const Lead = () => {

    const [leadsData, setLeadsData] = useState([]);
    const [view, setView] = useState('kanban')
    const [isTable, setIsTable] = useState(true);
    const [selectLeadStatusId, setSelectLeadStatusId] = useState()

    const URL = process.env.NEXT_PUBLIC_API_URL;

    const { data: session } = useSession() || {};

    const token = session && session.user && session?.user?.token;

    async function fetchLeadsData() {
        try {
            

        } catch (error) {
            throw new Error(error);
        }
    }

    useEffect(() => {
        if (URL && token && view) {
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
