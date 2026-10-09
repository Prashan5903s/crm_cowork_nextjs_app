'use client'

import { useParams } from 'next/navigation'

// MUI Imports
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import Typography from '@mui/material/Typography'
import useMediaQuery from '@mui/material/useMediaQuery'
import { useTheme } from '@mui/material/styles'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import Box from '@mui/material/Box'

// Third-party Imports
import ReactPlayer from '@/libs/ReactPlayer'

// Components Imports
import CustomAvatar from '@core/components/mui/Avatar'

import CustomIconButton from '@core/components/mui/IconButton'

const Details = ({ data }) => {
  const theme = useTheme()
  const smallScreen = useMediaQuery(theme.breakpoints.down('sm'))
  const { slug } = useParams()

  const unslugify = str =>
    str.replace(/-/g, ' ').replace(/\b\w/g, char => char.toUpperCase())

  return (
    <Card>
      {/* Header */}
      <CardContent className='flex flex-wrap items-center justify-between gap-4'>
        <div>
          <Typography variant='h5'>{unslugify(slug)}</Typography>
        </div>
      </CardContent>

      {/* Player + About Section */}
      <CardContent>
        <div className='border rounded'>
          <div className='mli-2 mbs-2 overflow-hidden rounded'>
            <ReactPlayer
              playing
              controls
              url='https://cdn.plyr.io/static/demo/View_From_A_Blue_Moon_Trailer-576p.mp4'
              height={smallScreen ? 280 : 440}
              className='bg-black !is-full'
              light={
                <img
                  src='/images/apps/academy/4.png'
                  alt='Thumbnail'
                  className='is-full bs-full object-cover bg-backgroundPaper'
                />
              }
              playIcon={
                <CustomIconButton variant='contained' color='error' className='absolute rounded-full'>
                  <i className='tabler-player-play text-2xl' />
                </CustomIconButton>
              }
            />
          </div>

          {/* About this Module */}
          <div className='flex flex-col gap-6 p-5'>
            <div className='flex flex-col gap-4'>
              <Typography variant='h5'>About this Module</Typography>
              <Typography>
                In this module the sales team members will learn about Important Qualities for sales professionals
              </Typography>
            </div>

            {/* Full-Width Activity Card */}
            <Box width='100%'>
              <Card
                variant='outlined'
                className='rounded-lg'
                sx={{
                  width: '100%',
                  transition: 'all 0.3s ease',
                  boxShadow: 'none',
                  '&:hover': {
                    boxShadow: 3,
                    transform: 'translateY(-2px)',
                    cursor: 'pointer',
                  },
                }}
              >
                <CardContent className='flex items-center justify-between gap-4 flex-wrap'>
                  {/* Icon + Info */}
                  <Stack direction='row' spacing={3} alignItems='center' className='flex-1'>
                    <Box
                      component='img'
                      src='/images/pages/yt_logo.png' // ✅ Make sure this path is correct
                      alt='YouTube'
                      sx={{ width: 50, height: 50, borderRadius: 1, objectFit: 'contain' }}
                    />
                    <Box>
                      <Typography fontWeight={600}>YouTube Videos</Typography>
                      <Stack direction='row' spacing={1} alignItems='center' mt={0.5}>
                        <Chip label='Required' size='small' color='success' variant='filled' />
                        <Typography variant='body2' color='text.secondary'>
                          05:19 Runtime
                        </Typography>
                        <Typography variant='body2' color='text.secondary'>
                          | 6 Minutes
                        </Typography>
                      </Stack>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Box>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default Details
