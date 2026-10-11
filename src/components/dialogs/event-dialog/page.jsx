'use client'

// React Imports
import { useEffect, useState } from 'react'

// Components
import { useSession } from 'next-auth/react'

// MUI Imports
import {
  Dialog,
  DialogTitle,
  CardContent,
  DialogContent,
  DialogActions,
  Button,
  CircularProgress,
  MenuItem,
  Skeleton,
  Checkbox,
  FormGroup,
  Radio,
  Typography,
  RadioGroup,
  FormControlLabel
} from '@mui/material'

import Grid from '@mui/material/Grid2'

// Hook Form + Validation
import { useForm, Controller, useFieldArray } from 'react-hook-form'
import { valibotResolver } from '@hookform/resolvers/valibot'
import { object, string, minLength, pipe, optional, number, array, maxLength, minValue, description } from 'valibot'

import { toast } from 'react-toastify'

import CustomTextField from '@core/components/mui/TextField'

import DialogCloseButton from '../DialogCloseButton'

const EventDialog = ({ open, setOpen, selectedZone, fetchZoneData }) => {
  const { data: session } = useSession()
  const token = session?.user?.token
  const API_URL = process.env.NEXT_PUBLIC_API_URL

  // ✅ Validation Schema
  const schema = object({
    event_name: pipe(string(), minLength(1, 'Event name is required')),
    venue: pipe(string(), minLength(1, 'Venue is required')),
    photo: optional(string()),
    description: pipe(string(), minLength(1, 'Description is required')),
    start_on_date: pipe(string(), minLength(1, 'Start date is required')),
    start_on_time: pipe(string(), minLength(1, 'Start time is required')),
    end_on_date: pipe(string(), minLength(1, 'End date is required')),
    end_on_time: pipe(string(), minLength(1, 'End time is required')),
    status: pipe(string(), minLength(1, 'Status is required')),
    role_or_user: pipe(string(), minLength(1, 'Please select Role or User')),
    role_id: array(string(), minLength(1, 'Please select Role or User'), [
      maxLength(255)
    ]),
    user_id: array(string(), minLength(1, 'Please select Role or User'), [
      maxLength(255)
    ])
  })

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    setError,
    clearErrors,
    formState: { errors }
  } = useForm({
    resolver: valibotResolver(schema),
    defaultValues: {
      event_name: '',
      venue: '',
      photo: '',
      description: '',
      start_on_date: '',
      start_on_time: '',
      end_on_date: '',
      end_on_time: '',
      status: '',
      role_or_user: 'user',
      role_id: [],
      user_id: []
    }
  })

  const [imgSrc, setImgSrc] = useState('/images/avatars/11.png')
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [roleUser, setRoleUser] = useState('user')
  const [createData, setCreateData] = useState(null)

  // ✅ Handle file input
  const handleFileInputChange = event => {
    const selectedFile = event.target.files[0]

    if (!selectedFile) return

    const validTypes = ['image/jpeg', 'image/png', 'image/gif']

    if (!validTypes.includes(selectedFile.type)) {
      setError('photo', {
        type: 'manual',
        message: 'Invalid file type. Only JPG, GIF, or PNG allowed.'
      })

      return
    }

    if (selectedFile.size > 800 * 1024) {
      setError('photo', {
        type: 'manual',
        message: 'File size exceeds 800KB.'
      })

      return
    }

    clearErrors('photo')
    setFile(selectedFile)
    const reader = new FileReader()

    reader.onload = () => setImgSrc(reader.result)
    reader.readAsDataURL(selectedFile)
  }

  const handleFileInputReset = () => {
    setFile(null)
    setImgSrc('/images/avatars/11.png')
    setValue('photo', '')
  }

  // ✅ Fetch role/user data
  useEffect(() => {
    if (!API_URL || !token) return
    let ignore = false

    const fetchCreateData = async () => {
      try {
        const response = await fetch(`${API_URL}/company/event/create`, {
          headers: { Authorization: `Bearer ${token}` }
        })

        const result = await response.json()

        if (response.ok && !ignore) {
          setCreateData(result?.data)
        }
      } catch (err) {
        console.error(err)
      }
    }

    fetchCreateData()

    return () => {
      ignore = true
    }
  }, [API_URL, token])

  // ✅ Populate form on edit
  useEffect(() => {
    if (open && selectedZone) {
      setRoleUser(selectedZone?.role_id?.length ? 'role' : 'user')

      reset({
        event_name: selectedZone?.event_name || '',
        venue: selectedZone?.venue || '',
        description: selectedZone?.description || '',
        start_on_date: selectedZone?.start_on_date || '',
        start_on_time: selectedZone?.start_on_time || '',
        end_on_date: selectedZone?.end_on_date || '',
        end_on_time: selectedZone?.end_on_time || '',
        status: selectedZone?.status?.toString() || '',
        role_or_user: selectedZone?.role_id?.length ? 'role' : 'user',
        role_id: selectedZone?.role_id || [],
        user_id: selectedZone?.user_id?.map(u => u._id || u) || []
      })

      if (selectedZone?.photo) {
        setImgSrc(`${process.env.NEXT_PUBLIC_ASSETS_URL}/${selectedZone.photo}`)
      }
    }
  }, [open, selectedZone, reset])

  // ✅ Reset on close
  const handleClose = () => {
    reset()
    setImgSrc('/images/avatars/11.png')
    setFile(null)
    setOpen(false)
  }

  // ✅ Submit Form
  const submitData = async formData => {
    setLoading(true)

    try {
      if (roleUser === 'role' && (!formData.role_id || formData.role_id.length === 0)) {
        setError('role_id', { type: 'manual', message: 'At least one role is required' })
        setLoading(false)

        return
      }

      if (roleUser === 'user' && (!formData.user_id || formData.user_id.length === 0)) {
        setError('user_id', { type: 'manual', message: 'At least one user is required' })
        setLoading(false)

        return
      }

      clearErrors(['role_id', 'user_id'])

      const url = selectedZone
        ? `${API_URL}/company/event/update/${selectedZone._id}`
        : `${API_URL}/company/event`

      const method = selectedZone ? 'PUT' : 'POST'

      const body = new FormData()

      Object.entries(formData).forEach(([key, value]) => {

        if (Array.isArray(value)) value.forEach(v => body.append(`${key}[]`, v))

        else body.append(key, value)
      })
      if (file) body.append('photo', file)

      const response = await fetch(url, {
        method,
        headers: { Authorization: `Bearer ${token}` },
        body
      })

      const data = await response.json()

      if (response.ok) {
        toast.success(`Event ${selectedZone ? 'updated' : 'created'} successfully!`, {
          autoClose: 800
        })
        await fetchZoneData()
        handleClose()
      } else {
        toast.error(data?.message || 'Something went wrong')
      }
    } catch (e) {
      console.error(e)
      toast.error('Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  // ✅ Keep IDs clean based on role toggle
  useEffect(() => {
    if (roleUser === 'user') setValue('role_id', [])
    else setValue('user_id', [])
  }, [roleUser, setValue])

  if (!createData) {
    return (
      <Dialog fullWidth maxWidth="md" open={open}>
        <DialogTitle>Loading...</DialogTitle>
        <DialogContent>
          <Skeleton height={30} />
          <Skeleton height={30} />
          <Skeleton height={30} />
        </DialogContent>
      </Dialog>
    )
  }

  // ✅ Render Dialog
  return (
    <Dialog
      fullWidth
      maxWidth="md"
      open={open}
      scroll="body"
      sx={{ '& .MuiDialog-paper': { overflow: 'visible' } }}
    >
      <DialogCloseButton onClick={handleClose}>
        <i className="tabler-x" />
      </DialogCloseButton>

      <DialogTitle variant="h4" className="text-center">
        {selectedZone ? 'Edit Event' : 'Add Event'}
      </DialogTitle>

      <form onSubmit={handleSubmit(submitData)} noValidate>
        <DialogContent>
          <Grid container spacing={3}>
            {/* ✅ Event Name */}
            <Grid item size={{ xs: 12, sm: 6 }}>
              <Controller
                name="event_name"
                control={control}
                render={({ field }) => (
                  <CustomTextField
                    {...field}
                    label="Event Name"
                    fullWidth
                    required
                    error={!!errors.event_name}
                    helperText={errors.event_name?.message}
                  />
                )}
              />
            </Grid>

            {/* ✅ Venue */}
            <Grid item size={{ xs: 12, sm: 6 }}>
              <Controller
                name="venue"
                control={control}
                render={({ field }) => (
                  <CustomTextField
                    {...field}
                    label="Venue"
                    fullWidth
                    required
                    error={!!errors.venue}
                    helperText={errors.venue?.message}
                  />
                )}
              />
            </Grid>

            {/* ✅ Photo Upload */}
            <Grid item size={{ xs: 12, sm: 4 }}>
              <Typography variant="h6" className="mb-4">
                Event Photo
              </Typography>

              <CardContent className="flex flex-col sm:flex-row items-start gap-6 p-0">
                <img
                  src={imgSrc}
                  alt="Event"
                  className="rounded-full object-cover border"
                  style={{ width: 100, height: 100 }}
                />
                <div className="flex flex-col gap-2">
                  <Button component="label" variant="contained" fullWidth>
                    Upload Photo
                    <input
                      hidden
                      type="file"
                      accept="image/png, image/jpeg"
                      onChange={handleFileInputChange}
                    />
                  </Button>
                  <Button
                    variant="outlined"
                    color="secondary"
                    fullWidth
                    onClick={handleFileInputReset}
                  >
                    Reset
                  </Button>
                  {errors.photo && (
                    <Typography variant="body2" color="error">
                      {errors.photo.message}
                    </Typography>
                  )}
                </div>
              </CardContent>
            </Grid>

            {/* ✅ Description */}
            <Grid item size={{ xs: 12 }}>
              <Controller
                name="description"
                control={control}
                render={({ field }) => (
                  <CustomTextField
                    {...field}
                    label="Description"
                    multiline
                    rows={3}
                    fullWidth
                    required
                    error={!!errors.description}
                    helperText={errors.description?.message}
                  />
                )}
              />
            </Grid>

            {/* ✅ Dates and Times */}
            {[
              ['start_on_date', 'Starts On Date', 'date'],
              ['start_on_time', 'Starts On Time', 'time'],
              ['end_on_date', 'Ends On Date', 'date'],
              ['end_on_time', 'Ends On Time', 'time']
            ].map(([name, label, type]) => (
              <Grid item size={{ xs: 12, sm: 6 }} key={name}>
                <Controller
                  name={name}
                  control={control}
                  render={({ field }) => (
                    <CustomTextField
                      {...field}
                      type={type}
                      label={label}
                      fullWidth
                      required
                      InputLabelProps={{ shrink: true }}
                      error={!!errors[name]}
                      helperText={errors[name]?.message}
                    />
                  )}
                />
              </Grid>
            ))}

            {/* ✅ Status */}
            <Grid item size={{ xs: 12 }}>
              <Controller
                name="status"
                control={control}
                render={({ field }) => (
                  <CustomTextField
                    {...field}
                    select
                    fullWidth
                    label="Status"
                    required
                    error={!!errors.status}
                    helperText={errors.status?.message}
                  >
                    <MenuItem value="">Select Status</MenuItem>
                    <MenuItem value="1">Pending</MenuItem>
                    <MenuItem value="2">Completed</MenuItem>
                    <MenuItem value="3">Cancelled</MenuItem>
                  </CustomTextField>
                )}
              />
            </Grid>

            {/* ✅ Role or User */}
            <Grid item size={{ xs: 12 }}>
              <Typography variant="subtitle1">Send To</Typography>
              <Controller
                name="role_or_user"
                control={control}
                render={({ field }) => (
                  <RadioGroup
                    row
                    {...field}
                    onChange={e => {
                      field.onChange(e)
                      setRoleUser(e.target.value)
                    }}
                  >
                    <FormControlLabel value="role" control={<Radio />} label="Role" />
                    <FormControlLabel value="user" control={<Radio />} label="User" />
                  </RadioGroup>
                )}
              />
            </Grid>

            {/* ✅ Roles */}
            {roleUser === 'role' && (
              <Grid item size={{ xs: 12 }}>
                <label className="font-medium block mb-2">Select Roles *</label>
                <Controller
                  name="role_id"
                  control={control}
                  render={({ field }) => (
                    <>
                      <FormGroup row>
                        {createData?.role?.map(role => (
                          <FormControlLabel
                            key={role._id}
                            control={
                              <Checkbox
                                checked={field.value.includes(role._id)}
                                onChange={e => {
                                  const newVal = e.target.checked
                                    ? [...field.value, role._id]
                                    : field.value.filter(id => id !== role._id)

                                  field.onChange(newVal)
                                }}
                              />
                            }
                            label={role.name}
                          />
                        ))}
                      </FormGroup>
                      {errors.role_id && (
                        <p className="text-red-500 text-sm">{errors.role_id.message}</p>
                      )}
                    </>
                  )}
                />
              </Grid>
            )}

            {/* ✅ Users */}
            {roleUser === 'user' && (
              <Grid item size={{ xs: 12 }}>
                <Controller
                  name="user_id"
                  control={control}
                  render={({ field }) => (
                    <CustomTextField
                      {...field}
                      select
                      fullWidth
                      label="Select Users *"
                      SelectProps={{ multiple: true }}
                    >
                      {createData?.user?.map(user => (
                        <MenuItem key={user._id} value={user._id}>
                          {user.first_name} {user.last_name}
                        </MenuItem>
                      ))}
                    </CustomTextField>
                  )}
                />
                {errors.user_id && (
                  <p className="text-red-500 text-sm">{errors.user_id.message}</p>
                )}
              </Grid>
            )}
          </Grid>
        </DialogContent>

        <DialogActions sx={{ justifyContent: 'center' }}>
          <Button variant="contained" type="submit" disabled={loading}>
            {loading ? <CircularProgress size={24} sx={{ color: 'white' }} /> : 'Save'}
          </Button>
          <Button variant="tonal" color="secondary" onClick={handleClose}>
            Cancel
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}

export default EventDialog
