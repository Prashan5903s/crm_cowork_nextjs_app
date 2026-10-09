// MUI Imports
import Grid from '@mui/material/Grid2'

// Component Imports
import Details from '@components/Details'

// Data Imports
import { getAcademyData } from '@/app/server/actions'

const CourseDetailsPage = async () => {

    // Vars
    const data = await getAcademyData()

    return (
        <Grid container spacing={6}>
            <Grid size={{ xs: 12 }}>
                <Details data={data?.courseDetails} />
            </Grid>
        </Grid>
    )
}

export default CourseDetailsPage
