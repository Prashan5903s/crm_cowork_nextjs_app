"use client"

// MUI Imports
import Grid from '@mui/material/Grid2'

// Component Imports
import LabelFormLayout from '@components/label-form/page';
import PermissionGuard from '@/hocs/PermissionClientGuard';

export default function UserFormLayouts() {

    const { lang: locale } = useParams();

    return (
        <PermissionGuard locale={locale} element={'isCompany'}>
            <Grid container spacing={6}>
                <Grid size={{ xs: 12 }}>
                    <LabelFormLayout />
                </Grid>
            </Grid>
        </PermissionGuard>
    )
}
