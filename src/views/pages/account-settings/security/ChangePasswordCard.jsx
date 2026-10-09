'use client'

import { useState } from 'react'

import { useSession } from 'next-auth/react'

import {
  Card,
  CardHeader,
  CardContent,
  InputAdornment,
  IconButton,
  Typography,
  Button,
  CircularProgress
} from '@mui/material'

import Grid from '@mui/material/Grid2'

import { useForm, Controller } from 'react-hook-form'
import { valibotResolver } from '@hookform/resolvers/valibot'

import { object, string, minLength, regex, pipe } from 'valibot'

import { toast } from 'react-toastify'

import CustomTextField from '@core/components/mui/TextField'

// ✅ Correct schema for older Valibot (using `.pipe()` + `refine`)
const schema = object({
  oldPassword: pipe(string(), minLength(1, 'Current password is required')),
  password: pipe(
    string(),
    minLength(8, 'Password must be at least 8 characters long'),
    regex(/[A-Z]/, 'Must contain at least one uppercase letter'),
    regex(/[a-z]/, 'Must contain at least one lowercase letter'),
    regex(/[0-9!@#$%^&*]/, 'Must contain at least one number or symbol')
  ),
  confirmPassword: pipe(string(), minLength(1, 'Confirm password is required'))
})

const ChangePasswordCard = () => {
  const [isoldPasswordShown, setIsoldPasswordShown] = useState(false)
  const [ispasswordShown, setIspasswordShown] = useState(false)
  const [isConfirmPasswordShown, setIsConfirmPasswordShown] = useState(false)
  const [loading, setLoading] = useState(false)

  const { data: session } = useSession()
  const token = session?.user?.token
  const API_URL = process.env.NEXT_PUBLIC_API_URL

  const {
    handleSubmit,
    control,
    reset,
    formState: { errors }
  } = useForm({
    resolver: valibotResolver(schema),
    defaultValues: {
      oldPassword: '',
      password: '',
      confirmPassword: ''
    }
  })

  const onSubmit = async (data) => {
    try {

      setLoading(true)

      const res = await fetch(`${API_URL}/user/change/password/data`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(data)
      })

      if (res.ok) {
        toast.success('Password changed successfully', { autoClose: 1000 })
        reset()
      } else {
        const response = await res.json()

        toast.error(response?.message || 'Error updating password')
      }
    } catch (err) {

      
      toast.error('Server error while updating password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader title='Change Password' />
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)}>
          {/* Current Password */}
          <Grid container spacing={6}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Controller
                name='oldPassword'
                control={control}
                render={({ field }) => (
                  <CustomTextField
                    {...field}
                    fullWidth
                    label='Current Password'
                    type={isoldPasswordShown ? 'text' : 'password'}
                    placeholder='············'
                    error={!!errors.oldPassword}
                    helperText={errors.oldPassword?.message}
                    slotProps={{
                      input: {
                        endAdornment: (
                          <InputAdornment position='end'>
                            <IconButton
                              edge='end'
                              onClick={() => setIsoldPasswordShown(!isoldPasswordShown)}
                              onMouseDown={(e) => e.preventDefault()}
                            >
                              <i className={isoldPasswordShown ? 'tabler-eye-off' : 'tabler-eye'} />
                            </IconButton>
                          </InputAdornment>
                        )
                      }
                    }}
                  />
                )}
              />
            </Grid>
          </Grid>

          {/* New + Confirm Password */}
          <Grid container spacing={6} className='mt-4'>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Controller
                name='password'
                control={control}
                render={({ field }) => (
                  <CustomTextField
                    {...field}
                    fullWidth
                    label='New Password'
                    type={ispasswordShown ? 'text' : 'password'}
                    placeholder='············'
                    error={!!errors.password}
                    helperText={errors.password?.message}
                    slotProps={{
                      input: {
                        endAdornment: (
                          <InputAdornment position='end'>
                            <IconButton
                              edge='end'
                              onClick={() => setIspasswordShown(!ispasswordShown)}
                              onMouseDown={(e) => e.preventDefault()}
                            >
                              <i className={ispasswordShown ? 'tabler-eye-off' : 'tabler-eye'} />
                            </IconButton>
                          </InputAdornment>
                        )
                      }
                    }}
                  />
                )}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <Controller
                name='confirmPassword'
                control={control}
                render={({ field }) => (
                  <CustomTextField
                    {...field}
                    fullWidth
                    label='Confirm New Password'
                    type={isConfirmPasswordShown ? 'text' : 'password'}
                    placeholder='············'
                    error={!!errors.confirmPassword}
                    helperText={errors.confirmPassword?.message}
                    slotProps={{
                      input: {
                        endAdornment: (
                          <InputAdornment position='end'>
                            <IconButton
                              edge='end'
                              onClick={() => setIsConfirmPasswordShown(!isConfirmPasswordShown)}
                              onMouseDown={(e) => e.preventDefault()}
                            >
                              <i className={isConfirmPasswordShown ? 'tabler-eye-off' : 'tabler-eye'} />
                            </IconButton>
                          </InputAdornment>
                        )
                      }
                    }}
                  />
                )}
              />
            </Grid>
          </Grid>

          {/* Buttons */}
          <Grid size={{ xs: 12 }} className='flex gap-4 mt-6'>
            <Button
              variant='contained'
              type='submit'
              disabled={loading}
              startIcon={loading && <CircularProgress size={16} />}
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
            <Button variant='tonal' color='secondary' onClick={() => reset()}>
              Reset
            </Button>
          </Grid>
        </form>
      </CardContent>
    </Card>
  )
}

export default ChangePasswordCard
