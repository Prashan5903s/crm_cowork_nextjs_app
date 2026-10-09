'use client'

// React Imports
import { useEffect, useState } from 'react'

// MUI Imports
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Autocomplete,
  CircularProgress,
  MenuItem,
  Skeleton,
  Typography,
  Avatar,
  IconButton
} from '@mui/material'

import { useDropzone } from 'react-dropzone'
import Grid from '@mui/material/Grid2'

// Hook Form + Validation
import { useForm, Controller, useFieldArray } from 'react-hook-form'
import { valibotResolver } from '@hookform/resolvers/valibot'
import { object, string, minLength, pipe, optional, number, array, maxLength, minValue } from 'valibot'

// Components
import { useSession } from 'next-auth/react'

import { toast } from 'react-toastify'

import CustomTextField from '@core/components/mui/TextField'
import DialogCloseButton from '../DialogCloseButton'
import AppReactDropzone from '@/libs/styles/AppReactDropzone'

//  Month / Year Data (always defined)
const months = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

const currentYear = new Date().getFullYear()
const years = Array.from({ length: 20 }, (_, i) => currentYear - 10 + i) // 10 years back & forward
const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD

const BillDialog = ({ open, setOpen, selectedZone, fetchZoneData, type }) => {

  //  Validation Schema
  const schema = object({
    apartment_id: type === 'utilityBills'
      ? pipe(string(), minLength(1, 'Apartment is required'))
      : optional(string()),

    bill_type: type === 'utilityBills' || type === 'common-area-bill'
      ? pipe(string(), minLength(1, 'Bill type is required'))
      : optional(string()),

    bill_amount: type === 'utilityBills' || type === 'common-area-bill'
      ? pipe(string(), minLength(1, 'Bill amount is required'))
      : optional(string()),

    bill_date: type === 'utilityBills' || type === 'common-area-bill'
      ? pipe(string(), minLength(1, 'Bill date is required'))
      : optional(string()),

    bill_due_date: type === 'utilityBills' || type === 'common-area-bill'
      ? pipe(string(), minLength(1, 'Bill due date is required'))
      : optional(string()),

    payment_due_date: type === 'maintenance'
      ? pipe(string(), minLength(1, 'Payment due date is required'))
      : optional(string()),

    status: optional(string()),

    addtional_cost: type === 'maintenance'
      ? array(
        object({
          title: pipe(
            string(),
            minLength(1, 'Additional cost title is required'),
            maxLength(255, 'Additional cost title can be a maximum of 255 characters')
          ),
          amount: pipe(
            string(),
            minLength(1, 'Additional cost amount is required'),
            maxLength(255, 'Additional cost amount can be a maximum of 255 characters')
          )
        }),
        [minLength(1, 'At least one Additional cost is required')]
      )
      : array(
        object({
          title: pipe(string(), maxLength(255, 'Additional cost title can be a maximum of 255 characters')),
          amount: pipe(string(), maxLength(255, 'Additional cost amount can be a maximum of 255 characters'))
        })
      ),

    month: type === 'maintenance'
      ? pipe(string(), minLength(1, 'Month is required'))
      : optional(string()),

    year: type === 'maintenance'
      ? pipe(string(), minValue(1900, 'Year is required'))
      : optional(string())
  })

  const { data: session } = useSession()
  const token = session?.user?.token
  const API_URL = process.env.NEXT_PUBLIC_API_URL

  const [createData, setCreateData] = useState({ apartment: [], billType: [] })
  const [loading, setLoading] = useState(false)
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [imageError, setImageError] = useState('')

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm({
    resolver: valibotResolver(schema),
    defaultValues: {
      apartment_id: '',
      bill_type: '',
      bill_amount: '',
      bill_date: '',
      bill_due_date: '',
      payment_due_date: '',
      status: '',
      month: '',
      year: '',
      type: '',
      addtional_cost: []
    }
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'addtional_cost'
  })

  //  File Upload
  const { getRootProps, getInputProps } = useDropzone({
    multiple: false,
    maxSize: 2097152, // 2MB
    accept: {
      'image/jpeg': ['.jpeg', '.jpg'],
      'image/png': ['.png'],
      'image/gif': ['.gif'],
      'image/webp': ['.webp'],
      'image/svg+xml': ['.svg'],
      'image/bmp': ['.bmp'],
      'image/tiff': ['.tif', '.tiff'],
      'image/x-icon': ['.ico']
    },
    onDrop: acceptedFiles => {
      if (!acceptedFiles.length) return
      const selectedFile = acceptedFiles[0]

      setFile(selectedFile)
      setImageError('')
      const reader = new FileReader()

      reader.onload = e => setPreview(e.target.result)
      reader.readAsDataURL(selectedFile)
    },
    onDropRejected: rejectedFiles => {
      rejectedFiles.forEach(file => {
        file.errors.forEach(error => {
          let msg = ''

          switch (error.code) {
            case 'file-invalid-type':
              msg = `Invalid file type. Allowed: JPG, PNG, GIF, WebP, SVG, BMP, TIFF, ICO`
              break
            case 'file-too-large':
              msg = `File is too large. Max size: 2MB.`
              break
            case 'too-many-files':
              msg = `Only one image can be uploaded.`
              break
            default:
              msg = `There was an issue with the uploaded file.`
          }

          toast.error(msg)
          setImageError(msg)
        })
      })
    }
  })

  const formatDate = date => {
    if (!date) return ''
    const d = new Date(date)

    return d.toISOString().split('T')[0]
  }

  useEffect(() => {
    if (errors) {
      console.log('Error', errors)
    }
  }, [errors])

  // normalize additional cost array
  const normalizeAdditionalCost = (list = []) =>
    list.map(item => ({
      title: item?.title?.toString() || '',
      amount: item?.amount?.toString() || ''
    }))

  useEffect(() => {
    if (open && selectedZone) {
      reset({
        apartment_id: selectedZone?.apartment_id?._id?.toString() || '',
        bill_type: selectedZone?.bill_type?._id?.toString() || '',
        addtional_cost: normalizeAdditionalCost(selectedZone?.additional_cost),
        bill_amount: selectedZone?.bill_amount?.toString() || '',
        bill_date: formatDate(selectedZone?.bill_date),
        bill_due_date: formatDate(selectedZone?.bill_due_date),
        payment_due_date: formatDate(selectedZone?.payment_due_date),
        status: selectedZone?.status ? 'active' : 'inactive',
        month: selectedZone?.month || '',
        year: selectedZone?.year ? String(selectedZone.year) : ''
      })

      if (selectedZone?.doc_data) {
        setPreview(`${process.env.NEXT_PUBLIC_ASSETS_URL}/bills/${selectedZone.doc_data}`)
      }
    }
  }, [open, selectedZone, reset])

  const handleClose = () => {
    reset()
    setFile(null)
    setPreview(null)
    setImageError('')
    setOpen(false)
  }

  //  Fetch dropdown data
  useEffect(() => {
    let ignore = false

    const fetchCreateData = async () => {
      try {
        const response = await fetch(`${API_URL}/company/bill/create`, {
          method: 'GET',
          headers: { Authorization: `Bearer ${token}` }
        })

        const result = await response.json()

        if (response.ok && !ignore) {
          setCreateData(result?.data || { apartment: [], billType: [] })
        }
      } catch (error) {
        console.error('Error fetching bill create data', error)
      }
    }

    if (API_URL && token) {
      fetchCreateData()
    }

    return () => {
      ignore = true
    }
  }, [API_URL, token])

  //  Submit handler
  const submitData = async formData => {
    setLoading(true)

    try {
      const url = selectedZone
        ? `${API_URL}/company/bill/update/${selectedZone._id}`
        : `${API_URL}/company/bill`

      const method = selectedZone ? 'PUT' : 'POST'
      const payload = new FormData()

      Object.entries(formData).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          payload.append(key, JSON.stringify(value))
        } else {
          payload.append(key, value)
        }
      })

      if (type) {
        payload.append('type', type)
      }

      if (file) {
        payload.append('image', file)
      }

      const response = await fetch(url, {
        method,
        headers: { Authorization: `Bearer ${token}` },
        body: payload
      })

      const data = await response.json()

      if (response.ok) {
        fetchZoneData()
        toast.success(`Bill ${selectedZone ? 'updated' : 'added'} successfully!`, { autoClose: 700 })
        handleClose()
      } else {
        console.error('Server error:', data)
        toast.error(data?.message || 'Something went wrong')
      }
    } catch (err) {
      console.error('Submit error:', err)
      toast.error('Failed to save bill')
    } finally {
      setLoading(false)
    }
  }

  const sortedApartments = [...createData.apartment].sort((a, b) => {
    const nameA = String(a.apartment_no ?? '');
    const nameB = String(b.apartment_no ?? '');

    return nameA.localeCompare(nameB, undefined, { numeric: true });
  });

  //  Skeleton while fetching
  if (!createData.apartment.length && !createData.billType.length) {
    return (
      <Dialog fullWidth maxWidth="md" open={open} scroll="body" sx={{ '& .MuiDialog-paper': { overflow: 'visible' } }}>
        <DialogCloseButton onClick={handleClose}>
          <i className="tabler-x" />
        </DialogCloseButton>
        <DialogTitle variant="h4" className="text-center sm:pbs-16 sm:pbe-6 sm:pli-16">
          {selectedZone ? 'Edit Bill' : 'Add Bill'}
        </DialogTitle>
        <DialogContent className="overflow-visible flex flex-col gap-6 sm:pli-16">
          <Grid container spacing={3}>
            {[...Array(3)].map((_, i) => (
              <Grid size={{ xs: 12 }} key={i}>
                <Skeleton variant="rectangular" height={26} />
              </Grid>
            ))}
          </Grid>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog fullWidth maxWidth="md" open={open} scroll="body" sx={{ '& .MuiDialog-paper': { overflow: 'visible' } }}>
      <DialogCloseButton onClick={handleClose}>
        <i className="tabler-x" />
      </DialogCloseButton>
      <DialogTitle variant="h4" className="text-center sm:pbs-16 sm:pbe-6 sm:pli-16">
        {selectedZone ? 'Edit Bill' : 'Add Bill'}
      </DialogTitle>

      <form onSubmit={handleSubmit(submitData)} noValidate>
        <DialogContent className="overflow-visible flex flex-col gap-6 sm:pli-16">
          <Grid container spacing={3}>
            {type === 'maintenance' && (
              <>
                {/* Month */}
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Controller
                    name="month"
                    control={control}
                    render={({ field }) => (
                      <CustomTextField
                        {...field}
                        select
                        fullWidth
                        label="Month"
                        required
                        error={!!errors?.month}
                        helperText={errors?.month?.message}
                      >
                        <MenuItem value="">Select Month</MenuItem>
                        {months.map((month, idx) => (
                          <MenuItem key={idx} value={month}>
                            {month}
                          </MenuItem>
                        ))}
                      </CustomTextField>
                    )}
                  />
                </Grid>

                {/* Year */}
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Controller
                    name="year"
                    control={control}
                    render={({ field }) => (
                      <CustomTextField
                        {...field}
                        select
                        fullWidth
                        label="Year"
                        required
                        error={!!errors?.year}
                        helperText={errors?.year?.message}
                      >
                        <MenuItem value="">Select Year</MenuItem>
                        {years.map(year => (
                          <MenuItem key={year} value={year.toString()}>
                            {year}
                          </MenuItem>
                        ))}
                      </CustomTextField>
                    )}
                  />
                </Grid>
              </>
            )}

            {/* Apartment */}
            {type === 'utilityBills' && (
              <Grid size={{ xs: 12 }}>
                <Controller
                  name="apartment_id"
                  control={control}
                  render={({ field }) => (
                    <Autocomplete
                      options={sortedApartments}
                      getOptionLabel={(option) =>
                        `${option.apartment_no ?? 'Unnamed Apartment'}, ${option.tower_id?.name}, ${option?.floor_id?.floor_name}`
                      }
                      value={
                        sortedApartments.find(item => item._id === field.value) || null
                      }
                      onChange={(e, newValue) => {
                        field.onChange(newValue?._id || '');
                      }}
                      renderInput={(params) => (

                        <TextField
                          {...params}
                          label="Select Apartment"
                          required
                          error={!!errors?.apartment_id}
                          helperText={errors?.apartment_id?.message}
                        />
                      )}
                    />
                  )}
                />
              </Grid>
            )}

            {/* Bill Type & Fields */}
            {type !== 'maintenance' && (
              <>
                <Grid size={{ xs: 12 }}>
                  <Controller
                    name="bill_type"
                    control={control}
                    render={({ field }) => (
                      <CustomTextField
                        {...field}
                        select
                        fullWidth
                        label="Select Bill Type"
                        required
                        error={!!errors?.bill_type}
                        helperText={errors?.bill_type?.message}
                      >
                        <MenuItem value="">Select Bill Type</MenuItem>
                        {createData.billType.map(item => (
                          <MenuItem key={item._id} value={item._id}>
                            {item.name ?? 'Unnamed Bill Type'}
                          </MenuItem>
                        ))}
                      </CustomTextField>
                    )}
                  />
                </Grid>

                <Grid size={{ xs: 12 }}>
                  <Controller
                    name="bill_amount"
                    control={control}
                    render={({ field }) => (
                      <CustomTextField
                        {...field}
                        fullWidth
                        type="number"
                        required
                        label="Bill Amount"
                        placeholder="Enter Bill Amount"
                        error={!!errors?.bill_amount}
                        helperText={errors?.bill_amount?.message}
                      />
                    )}
                  />
                </Grid>

                <Grid size={{ xs: 12 }}>
                  <Controller
                    name="bill_date"
                    control={control}
                    render={({ field }) => (
                      <CustomTextField
                        {...field}
                        type="date"
                        fullWidth
                        label="Bill Date"
                        required
                        InputLabelProps={{ shrink: true }}
                        inputProps={{ min: today }}
                        error={!!errors?.bill_date}
                        helperText={errors?.bill_date?.message}
                      />
                    )}
                  />
                </Grid>

                <Grid size={{ xs: 12 }}>
                  <Controller
                    name="bill_due_date"
                    control={control}
                    render={({ field }) => (
                      <CustomTextField
                        {...field}
                        type="date"
                        fullWidth
                        label="Bill Due Date"
                        required
                        InputLabelProps={{ shrink: true }}
                        inputProps={{ min: today }}
                        error={!!errors?.bill_due_date}
                        helperText={errors?.bill_due_date?.message}
                      />
                    )}
                  />
                </Grid>
              </>
            )}

            {type === 'maintenance' && (
              <Grid size={{ xs: 12 }}>
                <Controller
                  name="payment_due_date"
                  control={control}
                  render={({ field }) => (
                    <CustomTextField
                      {...field}
                      type="date"
                      fullWidth
                      label="Payment Due Date"
                      required
                      InputLabelProps={{ shrink: true }}
                      inputProps={{ min: today }}
                      error={!!errors?.payment_due_date}
                      helperText={errors?.payment_due_date?.message}
                    />
                  )}
                />
              </Grid>
            )}

            {type == 'maintenance' && (
              <>
                {/* Additional Cost */}
                <Grid item size={{ xs: 12 }}>
                  <Grid container spacing={2}>
                    {fields.map((item, index) => (
                      <Grid item size={{ xs: 12 }} key={item.id}>
                        <Grid container spacing={2} alignItems="center">
                          <Grid item size={{ xs: 12, sm: 5 }}>
                            <Controller
                              name={`addtional_cost.${index}.title`}
                              control={control}
                              render={({ field }) => (
                                <CustomTextField
                                  {...field}
                                  fullWidth
                                  label="Title*"
                                  error={!!errors?.addtional_cost?.[index]?.title}
                                  helperText={errors?.addtional_cost?.[index]?.title?.message}
                                />
                              )}
                            />
                          </Grid>

                          <Grid item size={{ xs: 12, sm: 5 }}>
                            <Controller
                              name={`addtional_cost.${index}.amount`}
                              control={control}
                              render={({ field }) => (
                                <CustomTextField
                                  {...field}
                                  fullWidth
                                  label="Amount*"
                                  error={!!errors?.addtional_cost?.[index]?.amount}
                                  helperText={errors?.addtional_cost?.[index]?.amount?.message}
                                />
                              )}
                            />
                          </Grid>

                          <Grid item size={{ xs: 12, sm: 2 }} textAlign="center">
                            <IconButton color="error" onClick={() => remove(index)}>
                              <i className="tabler-x" />
                            </IconButton>
                          </Grid>
                        </Grid>
                      </Grid>
                    ))}
                  </Grid>
                </Grid>

                <Grid item size={{ xs: 12 }}>
                  <Button
                    variant="outlined"
                    startIcon={<i className="tabler-plus" />}
                    onClick={() => append({ title: '', amount: '' })}
                  >
                    Add Additional Cost
                  </Button>
                </Grid>
              </>
            )}
            {/* Image Upload */}
            <Grid size={{ xs: 12 }}>
              <Typography variant="body1" gutterBottom>
                Image
              </Typography>
              <AppReactDropzone>
                <div {...getRootProps({ className: 'dropzone' })} style={{ minHeight: '150px' }}>
                  <input {...getInputProps()} />
                  <div className="flex items-center flex-col">
                    <Avatar variant="rounded" className="bs-12 is-12 mbe-1">
                      <i className="tabler-upload" />
                    </Avatar>
                    <Typography>
                      Allowed *.jpg, *.jpeg, *.png, *.gif, *.webp, *.svg, *.bmp, *.tif, *.tiff, *.ico (Max 2MB)
                    </Typography>
                  </div>

                  {preview && (
                    <div className="mt-4">
                      <img
                        src={preview}
                        alt="Preview"
                        style={{
                          inlineSize: '150px',
                          blockSize: '150px',
                          objectFit: 'cover',
                          borderRadius: '10%'
                        }}
                      />
                    </div>
                  )}
                </div>
              </AppReactDropzone>
              {imageError && (
                <Typography variant="caption" color="var(--mui-palette-error-main)" sx={{ mt: 1 }}>
                  {imageError}
                </Typography>
              )}
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions className="justify-center sm:pbe-16 sm:pli-16">
          <Button variant="contained" type="submit" disabled={loading}>
            {loading ? (
              <CircularProgress
                size={24}
                sx={{ color: 'white', position: 'absolute', mt: '-12px', ml: '-12px' }}
              />
            ) : selectedZone ? 'Update' : 'Save'}
          </Button>
          <Button variant="tonal" color="secondary" onClick={handleClose}>
            Cancel
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}

export default BillDialog
