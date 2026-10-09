'use client'

// React Imports
import { useEffect, useState, useMemo } from 'react'

// MUI Imports
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  CircularProgress,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  OutlinedInput,
  FormHelperText,
  Checkbox,
  ListItemText,
  TextField
} from '@mui/material'

import Grid from '@mui/material/Grid2'

// Hook Form + Validation
import { useForm, useFieldArray, Controller } from 'react-hook-form'
import { valibotResolver } from '@hookform/resolvers/valibot'
import { object, string, array, pipe, minLength, maxLength, regex, description } from 'valibot'

// Components

import { useSession } from 'next-auth/react'

import { toast } from 'react-toastify'

import CustomTextField from '@core/components/mui/TextField'
import DialogCloseButton from '../DialogCloseButton'

const schema = object({
  title: pipe(string(), minLength(1, 'Title is required'), maxLength(50, 'Title max length is 50')),
  description: pipe(string(), minLength(1, 'Description is required')),
  notification_type_id: pipe(string(), minLength(1, 'Notification type is required')),
  user_type_id: pipe(string(), minLength(1, 'User type is required')),
  user_id: pipe(array(string()), minLength(1, 'Please select at least one user'))
})

const AlertNotificationDialog = ({ open, setOpen, title = '', fetchZoneData, selectedZone, typeForm, tableData }) => {
  const { data: session } = useSession()
  const token = session?.user?.token
  const API_URL = process.env.NEXT_PUBLIC_API_URL

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors }
  } = useForm({
    resolver: valibotResolver(schema),
    defaultValues: {
      title: '',
      description: '',
      user_type_id: '',
      notification_type_id: '',
      user_id: []
    }
  })

  const [loading, setLoading] = useState(false)
  const [createData, setCreateData] = useState()
  const [selectedUserType, setSelectedUserType] = useState()
  const [selectedUser, setSelectedUser] = useState([])
  const [searchUser, setSearchUser] = useState('')

  const handleClose = () => {
    reset()
    setOpen(false)
  }

  const fetchCreateData = async () => {
    try {
      const response = await fetch(`${API_URL}/company/user/push/create`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      const value = await response.json()

      if (response.ok) {
        const result = value?.data

        console.log('Result', result)

        setCreateData(result)
      }
    } catch (error) {
      throw new Error(error)
    }
  }

  useEffect(() => {
    if (API_URL && token) {
      fetchCreateData()
    }
  }, [API_URL, token])

  const submitData = async formData => {
    setLoading(true)

    try {
      const url = `${API_URL}/company/user/push/notification`

      const method = 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (response.ok) {
        fetchZoneData?.()
        toast.success(`Push Notification added successfully!`, {
          autoClose: 700
        })
        handleClose()
      } else {
        console.error('Server error:', data)
      }
    } catch (err) {
      console.error('Submit error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (selectedUserType && createData) {
      const filteredUsers = createData.user.filter(u => u.roles?.some(role => role.role_id?._id === selectedUserType))

      setSelectedUser(filteredUsers)

      // Select all users
      setValue(
        'user_id',
        filteredUsers.map(user => user._id)
      )
    } else {
      setSelectedUser([])
      setValue('user_id', [])
    }
  }, [selectedUserType, createData, setValue])

  const filteredUsers = useMemo(() => {
    return selectedUser.filter(user =>
      `${user.first_name} ${user.last_name}`.toLowerCase().includes(searchUser.toLowerCase())
    )
  }, [selectedUser, searchUser])

  return (
    <Dialog fullWidth maxWidth='md' open={open} scroll='body' sx={{ '& .MuiDialog-paper': { overflow: 'visible' } }}>
      <DialogCloseButton onClick={handleClose}>
        <i className='tabler-x' />
      </DialogCloseButton>

      <DialogTitle variant='h4' className='text-center sm:pbs-16 sm:pbe-6 sm:pli-16'>
        {'Create Push Notification'}
      </DialogTitle>

      <form onSubmit={handleSubmit(submitData)} noValidate>
        <DialogContent className='overflow-visible flex flex-col gap-6 sm:pli-16'>
          {/* User Type */}
          <Grid item size={{ xs: 12 }}>
            <Controller
              name='user_type_id'
              control={control}
              render={({ field }) => (
                <CustomTextField
                  {...field}
                  select
                  required
                  label='User Type'
                  fullWidth
                  onChange={e => {
                    field.onChange(e) // Update RHF
                    setSelectedUser([])
                    setSelectedUserType(e.target.value)
                  }}
                  error={!!errors?.user_type_id}
                  helperText={errors?.user_type_id?.message}
                >
                  <MenuItem value=''>Select User Type</MenuItem>

                  {createData?.userType?.map(u => (
                    <MenuItem key={u._id} value={u._id}>
                      {u.name}
                    </MenuItem>
                  ))}
                </CustomTextField>
              )}
            />
          </Grid>

          {/* Notification Type */}
          <Grid item size={{ xs: 12 }}>
            <Controller
              name='notification_type_id'
              control={control}
              render={({ field }) => (
                <CustomTextField
                  {...field}
                  select
                  required
                  label='Notification Type'
                  fullWidth
                  error={!!errors?.notification_type_id}
                  helperText={errors?.notification_type_id?.message}
                >
                  <MenuItem value=''>Select Notification Type</MenuItem>
                  {createData?.notificationType?.map(u => (
                    <MenuItem value={u._id}>{u.title}</MenuItem>
                  ))}
                </CustomTextField>
              )}
            />
          </Grid>
          <Grid item size={{ xs: 12 }}>
            <Controller
              name='user_id'
              control={control}
              render={({ field }) => (
                <FormControl fullWidth error={!!errors.user_id}>
                  <InputLabel>User</InputLabel>

                  <Select
                    multiple
                    value={field.value}
                    onChange={e => field.onChange(e.target.value)}
                    input={<OutlinedInput label='User' />}
                    renderValue={selected =>
                      selectedUser
                        .filter(user => selected.includes(user._id))
                        .map(user => `${user.first_name} ${user.last_name}`)
                        .join(', ')
                    }
                    MenuProps={{
                      PaperProps: {
                        style: {
                          maxHeight: 400
                        }
                      }
                    }}
                  >
                    {/* Search */}
                    <MenuItem disableRipple disableTouchRipple>
                      <TextField
                        fullWidth
                        size='small'
                        placeholder='Search user...'
                        value={searchUser}
                        onChange={e => setSearchUser(e.target.value)}
                        onKeyDown={e => e.stopPropagation()}
                      />
                    </MenuItem>

                    {filteredUsers.length === 0 ? (
                      <MenuItem disabled>No users found</MenuItem>
                    ) : (
                      filteredUsers.map(user => (
                        <MenuItem key={user._id} value={user._id}>
                          <Checkbox checked={field.value.includes(user._id)} />

                          <ListItemText primary={`${user.first_name} ${user.last_name}`} />
                        </MenuItem>
                      ))
                    )}
                  </Select>

                  <FormHelperText>{errors.user_id?.message}</FormHelperText>
                </FormControl>
              )}
            />
          </Grid>
          {/* Title */}
          <Grid item size={{ xs: 12 }}>
            <Controller
              name='title'
              control={control}
              render={({ field }) => (
                <CustomTextField
                  {...field}
                  required
                  label='Title'
                  placeholder='Enter title'
                  fullWidth
                  error={!!errors?.title}
                  helperText={errors?.title?.message}
                />
              )}
            />
          </Grid>

          {/* Description */}
          <Grid item size={{ xs: 12 }}>
            <Controller
              name='description'
              control={control}
              render={({ field }) => (
                <CustomTextField
                  {...field}
                  required
                  label='Description'
                  placeholder='Enter description'
                  fullWidth
                  multiline
                  rows={4}
                  error={!!errors?.description}
                  helperText={errors?.description?.message}
                />
              )}
            />
          </Grid>
        </DialogContent>
        <DialogActions className='justify-center sm:pbe-16 sm:pli-16'>
          <Button variant='contained' type='submit' disabled={loading}>
            {loading ? (
              <CircularProgress
                size={24}
                sx={{
                  color: 'white',
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  mt: '-12px',
                  ml: '-12px'
                }}
              />
            ) : selectedZone ? (
              'Update'
            ) : (
              'Submit'
            )}
          </Button>
          <Button variant='tonal' color='secondary' onClick={handleClose}>
            Cancel
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}

export default AlertNotificationDialog
