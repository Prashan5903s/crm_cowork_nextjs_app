'use client'

// React Imports
import { useEffect, useState } from 'react'

// MUI Imports
import {
  Dialog,
  DialogTitle,
  Typography,
  CardContent,
  DialogContent,
  DialogActions,
  Button,
  CircularProgress,
  FormControlLabel,
  FormGroup,
  Skeleton,
  Checkbox
} from '@mui/material'

import Grid from '@mui/material/Grid2'

// Hook Form
import { useForm, Controller } from 'react-hook-form'

// Components
import { useSession } from 'next-auth/react'

import { toast } from 'react-toastify'

import CustomTextField from '@core/components/mui/TextField'
import DialogCloseButton from '../DialogCloseButton'

const NoticeDialog = ({ open, setOpen, selectedZone, fetchZoneData }) => {
  const { data: session } = useSession()
  const token = session?.user?.token
  const API_URL = process.env.NEXT_PUBLIC_API_URL

  const [createData, setCreateData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [imgSrc, setImgSrc] = useState('/images/avatars/11.png')
  const [file, setFile] = useState(null)

  // ------------------- Handle Image Upload -------------------
  const handleFileInputChange = event => {
    const selectedFile = event.target.files[0]

    if (!selectedFile) return

    const validTypes = ['image/jpeg', 'image/png', 'image/gif']

    if (!validTypes.includes(selectedFile.type)) {
      setError('photo', { type: 'manual', message: 'Invalid file type. Only JPG, GIF, or PNG allowed.' })

      return
    }

    if (selectedFile.size > 800 * 1024) {
      setError('photo', { type: 'manual', message: 'File size exceeds 800KB.' })

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

  // ------------------- Form -------------------
  const {
    control,
    handleSubmit,
    reset,
    setError,
    clearErrors,
    formState: { errors }
  } = useForm({
    defaultValues: {
      title: '',
      description: '',
      role_id: []
    }
  })

  // ------------------- Set Edit Data -------------------
  useEffect(() => {
    if (open && selectedZone) {
      reset({
        title: selectedZone?.title?.toString() || '',
        description: selectedZone?.description?.toString() || '',
        role_id: selectedZone?.role_id?.map(role => role._id) || []
      })
      if (selectedZone?.photo) setImgSrc(`${API_URL}/uploads/${selectedZone.photo}`)
    } else if (open && !selectedZone) {
      reset({ title: '', description: '', role_id: [] })
      setImgSrc('/images/avatars/11.png')
    }
  }, [open, selectedZone, reset, API_URL])

  const handleClose = () => {
    reset()
    setOpen(false)
  }

  // ------------------- Fetch Roles -------------------
  useEffect(() => {
    let ignore = false

    const fetchCreateData = async () => {

      try {
        const response = await fetch(`${API_URL}/company/notice/create`, {
          headers: { Authorization: `Bearer ${token}` }
        })

        const result = await response.json()

        if (response.ok && !ignore) setCreateData(result?.data)
      } catch (err) {
        console.error(err)
      }
    }

    if (API_URL && token) fetchCreateData()

    return () => { ignore = true }
  }, [API_URL, token])

  // ------------------- Submit -------------------
  const submitData = async formData => {
    if (!formData.role_id || formData.role_id.length === 0) {
      setError('role_id', { type: 'manual', message: 'At least one role is required' })

      return
    } else {
      clearErrors('role_id')
    }

    setLoading(true)

    try {
      let url = selectedZone
        ? `${API_URL}/company/notice/update/${selectedZone._id}`
        : `${API_URL}/company/notice`

      let body
      let headers = { Authorization: `Bearer ${token}` }

      if (file) {
        const form = new FormData()

        form.append('title', formData.title)
        form.append('description', formData.description)
        formData.role_id.forEach(id => form.append('role_id[]', id))
        form.append('photo', file)
        body = form
      } else {
        headers['Content-Type'] = 'application/json'
        body = JSON.stringify(formData)
      }

      const response = await fetch(url, {
        method: selectedZone ? 'PUT' : 'POST',
        headers,
        body
      })

      const data = await response.json()

      if (response.ok) {
        toast.success(`Announcement ${selectedZone ? 'updated' : 'added'} successfully!`, { autoClose: 700 })
        fetchZoneData()
        handleClose()
      } else {
        toast.error(data?.message || 'Something went wrong')
      }
    } catch (err) {
      console.error(err)
      toast.error('Failed to save announcement')
    } finally {
      setLoading(false)
    }
  }

  // ------------------- Loading Skeleton -------------------
  if (!createData) {
    return (
      <Dialog fullWidth maxWidth="md" open={open}>
        <DialogCloseButton onClick={handleClose}><i className="tabler-x" /></DialogCloseButton>
        <DialogTitle>{selectedZone ? 'Edit Announcement' : 'Add Announcement'}</DialogTitle>
        <DialogContent>
          <Skeleton variant="rectangular" height={26} sx={{ mb: 2 }} />
          <Skeleton variant="rectangular" height={26} sx={{ mb: 2 }} />
          <Skeleton variant="rectangular" height={26} />
        </DialogContent>
      </Dialog>
    )
  }

  // ------------------- UI -------------------
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

      <DialogTitle variant="h4" className="text-center sm:pbs-16 sm:pbe-6 sm:pli-16">
        {selectedZone ? 'Edit Announcement' : 'Add Announcement'}
      </DialogTitle>

      <form onSubmit={handleSubmit(submitData)} noValidate>
        <DialogContent className="overflow-visible flex flex-col gap-6 sm:pli-16">
          <Grid container spacing={3}>
            {/* Title */}
            <Grid size={{xs:12}}>
              <Controller
                name="title"
                control={control}
                rules={{ required: 'Title is required' }}
                render={({ field }) => (
                  <CustomTextField
                    fullWidth
                    {...field}
                    label="Title"
                    error={!!errors.title}
                    helperText={errors.title?.message}
                  />
                )}
              />
            </Grid>

            {/* Image Upload */}
            <Grid size={{xs:12}} sm={4}>
              <Typography variant="h6" className="mb-4">
                Announcement Photo
              </Typography>

              <CardContent className="flex flex-col sm:flex-row items-start gap-6 p-0">
                <img
                  src={imgSrc}
                  alt="Announcement"
                  className="rounded-full object-cover border"
                  style={{ width: 100, height: 100 }}
                />
                <div className="flex flex-col gap-2">
                  <Button component="label" variant="contained" fullWidth>
                    Upload Photo
                    <input hidden type="file" accept="image/png, image/jpeg" onChange={handleFileInputChange} />
                  </Button>
                  <Button variant="outlined" color="secondary" fullWidth onClick={handleFileInputReset}>
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

            {/* Description */}
            <Grid size={{xs:12}}>
              <Controller
                name="description"
                control={control}
                rules={{ required: 'Description is required' }}
                render={({ field }) => (
                  <CustomTextField
                    fullWidth
                    {...field}
                    label="Description"
                    multiline
                    rows={4}
                    error={!!errors.description}
                    helperText={errors.description?.message}
                  />
                )}
              />
            </Grid>

            {/* Roles */}
            <Grid size={{xs:12}}>
              <label className="font-medium block mb-2">Role *</label>
              <Controller
                name="role_id"
                control={control}
                render={({ field }) => (
                  <>
                    <FormGroup row>
                      {createData.map(role => (
                        <FormControlLabel
                          key={role._id}
                          control={
                            <Checkbox
                              checked={field.value?.includes(role._id)}
                              onChange={e => {
                                const newValue = e.target.checked
                                  ? [...(field.value || []), role._id]
                                  : (field.value || []).filter(r => r !== role._id)

                                field.onChange(newValue)
                              }}
                            />
                          }
                          label={role.name}
                        />
                      ))}
                    </FormGroup>
                    {errors.role_id && <p className="text-red-500 text-sm">{errors.role_id.message}</p>}
                  </>
                )}
              />
            </Grid>
          </Grid>
        </DialogContent>

        {/* Buttons */}
        <DialogActions className="justify-center sm:pbe-16 sm:pli-16">
          <Button variant="contained" type="submit" disabled={loading} color="primary">
            {loading ? (
              <CircularProgress
                size={24}
                sx={{ color: 'white', position: 'absolute', mt: '-12px', ml: '-12px' }}
              />
            ) : (
              'Save'
            )}
          </Button>
          <Button variant="outlined" color="secondary" onClick={handleClose}>
            Cancel
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}

export default NoticeDialog
