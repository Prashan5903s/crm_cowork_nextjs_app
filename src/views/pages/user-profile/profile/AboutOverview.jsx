// MUI Imports
import Grid from '@mui/material/Grid2'
import Card from '@mui/material/Card'
import Typography from '@mui/material/Typography'
import CardContent from '@mui/material/CardContent'

const renderList = list => {
  return (
    list.length > 0 &&
    list.map((item, index) => {
      return (
        <div key={index} className='flex items-center gap-2'>
          <i className={item.icon} />
          <div className='flex items-center flex-wrap gap-2'>
            <Typography className='font-medium'>
              {`${item.property.charAt(0).toUpperCase() + item.property.slice(1)}:`}
            </Typography>
            <Typography> {item.value.charAt(0).toUpperCase() + item.value.slice(1)}</Typography>
          </div>
        </div>
      )
    })
  )
}

const renderTeams = teams => {
  return (
    teams.length > 0 &&
    teams.map((item, index) => {
      return (
        <div key={index} className='flex items-center flex-wrap gap-2'>
          <Typography className='font-medium'>
            {item.property.charAt(0).toUpperCase() + item.property.slice(1)}
          </Typography>
          <Typography>{item.value.charAt(0).toUpperCase() + item.value.slice(1)}</Typography>
        </div>
      )
    })
  )
}

const AboutOverview = ({ data }) => {
  return (
    <Grid container spacing={6}>
      <Grid size={{ xs: 12 }}>
        <Card>
          <CardContent className='flex flex-col gap-6'>
            <div className='flex flex-col gap-4'>
              <Typography className='uppercase' variant='body2' color='text.disabled'>
                About
              </Typography>
              {data?.first_name} {data?.last_name}
            </div>
            <div className='flex flex-col gap-4'>
              <Typography className='uppercase' variant='body2' color='text.disabled'>
                Contacts
              </Typography>
              <div>
                {data?.phone}
              </div>
              {data?.email}
            </div>
            <div className='flex flex-col gap-4'>
              <Typography className='uppercase' variant='body2' color='text.disabled'>
                Address
              </Typography>
              {data?.address}
            </div>
          </CardContent>
        </Card>
      </Grid>
      {/* <Grid size={{ xs: 12 }}>
        <Card>
          <CardContent className='flex flex-col gap-6'>
            <div className='flex flex-col gap-4'>
              <Typography className='uppercase' variant='body2' color='text.disabled'>
                Overview
              </Typography>
              {data?.overview && renderList(data?.overview)}
            </div>
          </CardContent>
        </Card>
      </Grid> */}
    </Grid>
  )
}

export default AboutOverview
