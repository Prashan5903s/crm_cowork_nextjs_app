'use client'

import { useParams } from 'next/navigation'

// MUI Imports
import Grid from '@mui/material/Grid2'

// Component Imports
import DistributedBarChartOrder from '@views/dashboards/crm/DistributedBarChartOrder'
import LineAreaYearlySalesChart from '@views/dashboards/crm/LineAreaYearlySalesChart'
import CardStatVertical from '@/components/card-statistics/Vertical'
import BarChartRevenueGrowth from '@views/dashboards/crm/BarChartRevenueGrowth'
import EarningReportsWithTabs from '@views/dashboards/crm/EarningReportsWithTabs'
import RadarSalesChart from '@views/dashboards/crm/RadarSalesChart'
import SalesByCountries from '@views/dashboards/crm/SalesByCountries'
import ProjectStatus from '@views/dashboards/crm/ProjectStatus'
import ActiveProjects from '@views/dashboards/crm/ActiveProjects'
import LastTransaction from '@views/dashboards/crm/LastTransaction'
import ActivityTimeline from '@views/dashboards/crm/ActivityTimeline'

// Permission Guard
import PermissionGuard from '@/hocs/PermissionClientGuard'

export default function DashboardCRM() {

  const { lang: locale } = useParams();

  return (
    <PermissionGuard locale={locale} element="isSuperAdmin">
      <Grid container spacing={6}>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <DistributedBarChartOrder />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <LineAreaYearlySalesChart />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <CardStatVertical
            title="Total Profit"
            subtitle="Last Week"
            stats="1.28k"
            avatarColor="error"
            avatarIcon="tabler-credit-card"
            avatarSkin="light"
            avatarSize={44}
            chipText="-12.2%"
            chipColor="error"
            chipVariant="tonal"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <CardStatVertical
            title="Total Sales"
            subtitle="Last Week"
            stats="24.67k"
            avatarColor="success"
            avatarIcon="tabler-currency-dollar"
            avatarSkin="light"
            avatarSize={44}
            chipText="+24.67%"
            chipColor="success"
            chipVariant="tonal"
          />
        </Grid>
        <Grid size={{ xs: 12, lg: 4, md: 8 }}>
          <BarChartRevenueGrowth />
        </Grid>
        <Grid size={{ xs: 12, lg: 8 }}>
          <EarningReportsWithTabs />
        </Grid>
        <Grid size={{ xs: 12, lg: 4, md: 6 }}>
          <RadarSalesChart />
        </Grid>
        <Grid size={{ xs: 12, lg: 4, md: 6 }}>
          <SalesByCountries />
        </Grid>
        <Grid size={{ xs: 12, lg: 4, md: 6 }}>
          <ProjectStatus />
        </Grid>
        <Grid size={{ xs: 12, lg: 4, md: 6 }}>
          <ActiveProjects />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          {/* <LastTransaction serverMode={serverMode} /> */}
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <ActivityTimeline />
        </Grid>
      </Grid>
    </PermissionGuard>
  );
}

