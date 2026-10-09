// MUI Imports

import Grid from '@mui/material/Grid2'

import TenantFormLayout from '@/components/tenant-form/page';

const UserFormLayouts = () => {
    return (
        <Grid container spacing={6}>
            <Grid size={{ xs: 12 }}>
                <TenantFormLayout />
            </Grid>
        </Grid>
    )
}

export default UserFormLayouts
