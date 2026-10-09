// MUI Imports
import Grid from '@mui/material/Grid2'

// Component Imports
import TenantFormLayout from '@/components/tenant-form/page';

export default function UserFormLayouts() {
    return (
        <Grid container spacing={6}>
            <Grid size={{ xs: 12 }}>
                <TenantFormLayout />
            </Grid>
        </Grid>
    )
}
