'use client'

import { useState, useEffect, useMemo } from 'react'

import {
  FormControl,
  FormLabel,
  MenuItem,
  Button,
  Stack,
  Divider,
  Rating,
  TextField,
  Dialog,
  RadioGroup,
  FormControlLabel,
  Radio,
  Checkbox,
  Card,
  CardContent,
  Typography,
  DialogContent,
  DialogTitle,
  DialogActions,
  Box
} from '@mui/material'

import Grid from '@mui/material/Grid2'

import { valibotResolver } from '@hookform/resolvers/valibot'

import {
  object,
  string,
  instance,
  minLength,
  nullable,
  pipe,
  optional,
  any
} from 'valibot'

import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getFilteredRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFacetedMinMaxValues,
  getPaginationRowModel,
  getSortedRowModel
} from '@tanstack/react-table'

import { rankItem } from '@tanstack/match-sorter-utils'

import { useForm, Controller } from 'react-hook-form'

import { useSession } from 'next-auth/react'

import { toast } from 'react-toastify'

import tableStyles from '@core/styles/table.module.css'

import TablePaginationComponent from '@components/TablePaginationComponent'

import CustomTextField from '@/@core/components/mui/TextField'

import FormatTime from '@/utils/formatTime'

import OptionMenu from '@/@core/components/option-menu'

import DialogCloseButton from '@/components/dialogs/DialogCloseButton'

const ASSET_URL = process.env.NEXT_PUBLIC_ASSETS_URL

const fuzzyFilter = (row, columnId, value, addMeta) => {
  const itemRank = rankItem(row.getValue(columnId), value)

  addMeta({ itemRank })

  return itemRank.passed
}

const columnHelper = createColumnHelper()

// Image validation constants
const MAX_FILE_SIZE = 2 * 1024 * 1024 // 2MB in bytes
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png']
const ACCEPTED_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png']

const validateImageFile = (file) => {
  if (!file) {
    return null
  }

  // Check file type (MIME type)
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
    return 'Only JPEG, JPG and PNG images are allowed'
  }

  // Check file extension as a fallback/extra check
  const fileName = file.name?.toLowerCase() || ''
  const hasValidExtension = ACCEPTED_IMAGE_EXTENSIONS.some(ext =>
    fileName.endsWith(ext)
  )

  if (!hasValidExtension) {
    return 'Only .jpg, .jpeg and .png files are allowed'
  }

  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return 'Image size must not exceed 2MB'
  }

  return null
}

const ImageModal = ({ open, setOpen, imgFile }) => {
  const handleClose = () => {
    setOpen(false)
  }

  const imageUrl = `${ASSET_URL}/uploads/complain/${imgFile}`

  return (
    <Dialog
      fullWidth
      maxWidth='sm'
      scroll='body'
      open={open}
      onClose={handleClose}
      sx={{
        '& .MuiDialog-paper': {
          overflow: 'visible'
        }
      }}
    >
      <DialogCloseButton onClick={handleClose}><i className="tabler-x" /></DialogCloseButton>
      <DialogTitle>Image Preview</DialogTitle>
      <DialogContent>
        {!imgFile ?
          (
            <Typography textAlign={'center'} fontWeight={'bold'}>Image not found</Typography>
          )
          :
          (

            <img
              src={imageUrl}
              alt='Complaint'
              style={{
                maxWidth: '100%',
                maxHeight: '80vh',
                objectFit: 'contain'
              }}
            />
          )}
      </DialogContent>
    </Dialog >
  )
}

const ComplainModal = ({
  open,
  setIsOpen,
  fetchComplain
}) => {
  const { data: session } = useSession()

  const token = session?.user?.token

  const API_URL = process.env.NEXT_PUBLIC_API_URL

  const [createData, setCreateData] = useState([])

  const schema = object({
    nature: pipe(
      string(),
      minLength(1, 'Nature is required')
    ),

    complaint_type: pipe(
      string(),
      minLength(1, 'Complaint type is required')
    ),

    category: pipe(
      string(),
      minLength(1, 'Category is required')
    ),

    priority: pipe(
      string(),
      minLength(1, 'Priority is required')
    ),
    complain_img: optional(any()),
    description: pipe(
      string(),
      minLength(1, 'Description is required')
    )
  })

  const {
    control,
    handleSubmit,
    reset,
    setError,
    clearErrors,
    formState: { errors }
  } = useForm({
    resolver: valibotResolver(schema),

    defaultValues: {
      nature: '1',
      complaint_type: '1',
      category: '',
      complain_img: "",
      description: '',
      priority: ''
    }
  })

  const onClose = () => {
    reset()
    setIsOpen(false)
  }

  /* Fetch category data */

  const fetchCreateData = async () => {
    try {
      const response = await fetch(
        `${API_URL}/user/my-complain/data/create`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      )

      const result = await response.json()

      if (response.ok) {
        setCreateData(result?.data || [])
      } else {
        toast.error(
          result?.message || 'Failed to load categories'
        )
      }
    } catch (error) {
      console.error('Fetch create data error:', error)

      toast.error('Failed to load complaint categories')
    }
  }

  useEffect(() => {
    if (API_URL && token && open) {
      fetchCreateData()
    }
  }, [API_URL, token, open])

  /* Submit complaint */

  const onSubmit = async data => {
    try {
      const formData = new FormData()

      formData.append('nature', data.nature)
      formData.append('complaint_type', data.complaint_type)
      formData.append('category', data.category)
      formData.append('priority', data.priority)
      formData.append('description', data.description)

      if (data.complain_img instanceof File) {
        formData.append('complain_img', data.complain_img)
      }

      const response = await fetch(
        `${API_URL}/user/my-complain`,
        {
          method: 'POST',

          headers: {
            Authorization: `Bearer ${token}`
          },

          body: formData
        }
      )

      const result = await response.json().catch(() => ({}))

      if (response.ok) {
        toast.success(
          'Complaint created successfully',
          {
            autoClose: 1000
          }
        )

        await fetchComplain()

        onClose()
      } else {
        toast.error(
          result?.message ||
          'Failed to create complaint'
        )
      }
    } catch (error) {
      console.error('Submit error:', error)

      toast.error(
        'Something went wrong. Please try again.'
      )
    }
  }

  const priorityData = [
    {
      title: 'High',
      value: '1'
    },
    {
      title: 'Medium',
      value: '2'
    },
    {
      title: 'Low',
      value: '3'
    }
  ]

  return (
    <Dialog
      fullWidth
      maxWidth='md'
      scroll='body'
      open={open}
      onClose={onClose}
      sx={{
        '& .MuiDialog-paper': {
          overflow: 'visible'
        }
      }}
    >

      <DialogCloseButton onClick={onClose}>
        <i className='tabler-x' />
      </DialogCloseButton>
      <DialogTitle>
        New Complaint/Suggestion
      </DialogTitle>

      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent>
          <Grid container spacing={3}>

            {/* Nature */}

            <Grid size={{ xs: 12, md: 6 }}>
              <FormControl
                component='fieldset'
                fullWidth
              >
                <FormLabel>
                  Nature *
                </FormLabel>

                <Controller
                  name='nature'
                  control={control}
                  render={({ field }) => (
                    <RadioGroup
                      row
                      {...field}
                    >
                      <FormControlLabel
                        value='1'
                        control={<Radio />}
                        label='Complaint'
                      />

                      <FormControlLabel
                        value='2'
                        control={<Radio />}
                        label='Suggestion'
                      />
                    </RadioGroup>
                  )}
                />
              </FormControl>
            </Grid>

            {/* Complaint Type */}

            <Grid size={{ xs: 12, md: 6 }}>
              <FormControl
                component='fieldset'
                fullWidth
              >
                <FormLabel>
                  Complaint Type *
                </FormLabel>

                <Controller
                  name='complaint_type'
                  control={control}
                  render={({ field }) => (
                    <RadioGroup
                      row
                      {...field}
                    >
                      <FormControlLabel
                        value='1'
                        control={<Radio />}
                        label='Individual'
                      />

                      <FormControlLabel
                        value='2'
                        control={<Radio />}
                        label='Society'
                      />
                    </RadioGroup>
                  )}
                />
              </FormControl>
            </Grid>

            {/* Complaint Image */}

            <Grid size={{ xs: 12 }}>
              <Controller
                name='complain_img'
                control={control}
                defaultValue={null}
                render={({
                  field: { value, onChange },
                  fieldState: { error }
                }) => {
                  const previewUrl = value
                    ? URL.createObjectURL(value)
                    : null

                  const handleFileChange = (event) => {
                    const file = event.target.files?.[0] || null

                    // Reset input value so selecting the same
                    // invalid file again still triggers onChange
                    event.target.value = ''

                    if (!file) {
                      return
                    }

                    const validationError = validateImageFile(file)

                    if (validationError) {
                      setError('complain_img', {
                        type: 'manual',
                        message: validationError
                      })

                      toast.error(validationError)

                      return
                    }

                    clearErrors('complain_img')
                    onChange(file)
                  }

                  return (
                    <Box>
                      <Typography
                        variant='subtitle2'
                        sx={{
                          fontWeight: 600,
                          mb: 1
                        }}
                      >
                        Complaint Image
                      </Typography>

                      <Box
                        sx={{
                          border: theme =>
                            `1.5px dashed ${error
                              ? theme.palette.error.main
                              : theme.palette.divider
                            }`,
                          borderRadius: 2,
                          p: 2.5,
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            borderColor: 'primary.main',
                            backgroundColor: 'action.hover'
                          }
                        }}
                      >
                        {!value ? (
                          <Box
                            sx={{
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              justifyContent: 'center',
                              minHeight: 150,
                              textAlign: 'center'
                            }}
                          >
                            <Box
                              sx={{
                                width: 52,
                                height: 52,
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                backgroundColor: 'primary.main',
                                color: 'primary.contrastText',
                                mb: 1.5
                              }}
                            >
                              <i
                                className='tabler-photo'
                                style={{ fontSize: 26 }}
                              />
                            </Box>

                            <Typography
                              variant='body1'
                              sx={{
                                fontWeight: 600,
                                mb: 0.5
                              }}
                            >
                              Upload an image
                            </Typography>

                            <Typography
                              variant='caption'
                              color='text.secondary'
                              sx={{ mb: 2 }}
                            >
                              PNG, JPG or JPEG (max 2MB)
                            </Typography>

                            <Button
                              variant='contained'
                              component='label'
                              startIcon={
                                <i className='tabler-upload' />
                              }
                            >
                              Choose Image
                              <input
                                type='file'
                                hidden
                                accept='image/png,image/jpeg,image/jpg,.png,.jpg,.jpeg'
                                onChange={handleFileChange}
                              />
                            </Button>
                          </Box>
                        ) : (
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 2,
                              flexWrap: 'wrap'
                            }}
                          >
                            {/* Preview */}
                            <Box
                              sx={{
                                width: 100,
                                height: 100,
                                borderRadius: 2,
                                overflow: 'hidden',
                                border: theme =>
                                  `1px solid ${theme.palette.divider}`,
                                flexShrink: 0
                              }}
                            >
                              <img
                                src={previewUrl}
                                alt='Complaint preview'
                                style={{
                                  width: '100%',
                                  height: '100%',
                                  objectFit: 'cover'
                                }}
                              />
                            </Box>

                            {/* File Details */}
                            <Box sx={{ flex: 1, minWidth: 180 }}>
                              <Typography
                                variant='body2'
                                sx={{
                                  fontWeight: 600,
                                  wordBreak: 'break-word'
                                }}
                              >
                                {value.name}
                              </Typography>

                              <Typography
                                variant='caption'
                                color='text.secondary'
                              >
                                {(value.size / 1024).toFixed(1)} KB
                              </Typography>
                            </Box>

                            {/* Change Image */}
                            <Button
                              variant='outlined'
                              component='label'
                              size='small'
                              startIcon={
                                <i className='tabler-refresh' />
                              }
                            >
                              Change
                              <input
                                type='file'
                                hidden
                                accept='image/png,image/jpeg,image/jpg,.png,.jpg,.jpeg'
                                onChange={handleFileChange}
                              />
                            </Button>

                            {/* Remove */}
                            <Button
                              variant='outlined'
                              color='error'
                              size='small'
                              onClick={() => {
                                clearErrors('complain_img')
                                onChange(null)
                              }}
                              startIcon={
                                <i className='tabler-trash' />
                              }
                            >
                              Remove
                            </Button>
                          </Box>
                        )}
                      </Box>

                      {error && (
                        <Typography
                          color='var(--mui-palette-error-main)'
                          variant='caption'
                          sx={{
                            display: 'block',
                            mt: 0.75,
                            ml: 1
                          }}
                        >
                          {error.message}
                        </Typography>
                      )}
                    </Box>
                  )
                }}
              />
            </Grid>

            {/* Category */}

            <Grid size={{ xs: 12 }}>
              <Controller
                name='category'
                control={control}
                render={({ field }) => (
                  <CustomTextField
                    {...field}
                    fullWidth
                    select
                    label='Category *'
                    error={!!errors.category}
                    helperText={
                      errors.category?.message
                    }
                  >
                    <MenuItem value=''>
                      Select Category
                    </MenuItem>

                    {createData?.map(item => (
                      <MenuItem
                        key={item._id}
                        value={item._id}
                      >
                        {item.name}
                      </MenuItem>
                    ))}
                  </CustomTextField>
                )}
              />
            </Grid>

            {/* Priority */}

            <Grid size={{ xs: 12 }}>
              <Controller
                name='priority'
                control={control}
                render={({ field }) => (
                  <CustomTextField
                    {...field}
                    fullWidth
                    select
                    label='Priority *'
                    error={!!errors.priority}
                    helperText={
                      errors.priority?.message
                    }
                  >
                    <MenuItem value=''>
                      Select Priority
                    </MenuItem>

                    {priorityData.map(item => (
                      <MenuItem
                        key={item.value}
                        value={item.value}
                      >
                        {item.title}
                      </MenuItem>
                    ))}
                  </CustomTextField>
                )}
              />
            </Grid>

            {/* Description */}

            <Grid size={{ xs: 12 }}>
              <Controller
                name='description'
                control={control}
                render={({ field }) => (
                  <CustomTextField
                    {...field}
                    fullWidth
                    multiline
                    minRows={4}
                    label='Description *'
                    error={!!errors.description}
                    helperText={
                      errors.description?.message
                    }
                  />
                )}
              />
            </Grid>

          </Grid>
        </DialogContent>

        <DialogActions
          sx={{
            justifyContent: 'center',
            gap: 2,
            pb: 3
          }}
        >
          <Button
            variant='contained'
            type='submit'
          >
            Submit
          </Button>

          <Button
            variant='outlined'
            color='error'
            onClick={onClose}
          >
            Cancel
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}

const HappyCodeModal = ({
  open,
  setOpenDialog,
  code,
  id
}) => {
  const onClose = () => {
    setOpenDialog(false)
  }

  return (
    <Dialog
      fullWidth
      maxWidth='xs'
      scroll='body'
      open={open}
      onClose={onClose}
      sx={{
        '& .MuiDialog-paper': {
          overflow: 'visible'
        }
      }}
    >

      <DialogCloseButton onClick={onClose}>
        <i className='tabler-x' />
      </DialogCloseButton>

      <DialogTitle
        sx={{
          textAlign: 'center',
          fontWeight: 'bold',
          background:
            'linear-gradient(90deg, #333, #555)',
          color: 'white',
          py: 2,
          fontSize: '1.25rem'
        }}
      >
        Complaint
      </DialogTitle>

      <DialogContent
        sx={{
          textAlign: 'center',
          mt: 1,
          px: 3
        }}
      >
        <Typography
          variant='body2'
          sx={{ mb: 2 }}
        >
          Your Complaint has been registered with us
          and we have generated a Complaint ID.
          <strong> {id}</strong> for your future
          reference.
        </Typography>

        <Box sx={{ my: 2 }}>
          <img
            src='/images/company_logo.png'
            alt='Logo'
            style={{
              width: 100,
              margin: '0 auto'
            }}
          />
        </Box>

        <Typography
          variant='subtitle1'
          sx={{ mb: 1 }}
        >
          Your 6 digit “Happy Code” is as given below!
        </Typography>

        <Box
          sx={{
            background:
              'linear-gradient(135deg, #ff9800, #ff5722)',
            color: '#fff',
            fontWeight: 'bold',
            fontSize: '2rem',
            borderRadius: 2,
            display: 'inline-block',
            px: 4,
            py: 1,
            mb: 2,
            boxShadow: 3
          }}
        >
          {code || '-'}
        </Box>

        <Typography
          variant='body2'
          sx={{
            fontStyle: 'italic',
            mb: 2
          }}
        >
          If you are satisfied with your Complaint,
          you can share your “Happy Code” with our
          concerned technician to resolve this issue.
        </Typography>
      </DialogContent>

      <DialogActions
        sx={{
          justifyContent: 'center',
          pb: 2
        }}
      >
        <Typography
          variant='body1'
          fontWeight='bold'
          color='text.secondary'
        >
          DW cowork
        </Typography>
      </DialogActions>
    </Dialog>
  )
}

const EscalateModal = ({ open, setOpen, id }) => {

  const [createData, setCreateData] = useState()

  const { data: session } = useSession()

  const token = session?.user?.token

  const API_URL = process.env.NEXT_PUBLIC_API_URL

  const schema = object({
    escalation_reason: pipe(
      string(),
      minLength(1, 'Escalation reason is required')
    ),

    escalation_status: pipe(
      string(),
      minLength(1, 'Escalation status is required')
    ),

    resident_remarks: pipe(
      string(),
      minLength(1, 'Resident remarks are required')
    )
  })

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm({
    resolver: valibotResolver(schema),

    defaultValues: {
      escalation_reason: '',
      escalation_status: '',
      resident_remarks: ''
    }
  })

  const fetchCreateData = async () => {
    try {
      const response = await fetch(`${API_URL}/user/escalation/create/data`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      const result = await response.json()

      if (response.ok) {

        setCreateData(result?.data)

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

  const onClose = () => {
    reset()
    setOpen(false)
  }

  const onSubmit = async data => {
    try {
      const payload = {
        complain_id: id,
        escalation_reason: data.escalation_reason,
        escalation_status: data.escalation_status,
        resident_remarks: data.resident_remarks
      }

      const response = await fetch(
        `${API_URL}/user/escalate/post/data`,
        {
          method: 'POST',

          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },

          body: JSON.stringify(payload)
        }
      )

      const result = await response
        .json()
        .catch(() => ({}))

      if (response.ok) {
        toast.success(
          'Complaint escalated successfully',
          {
            autoClose: 1000
          }
        )

        onClose()
      } else {
        toast.error(
          result?.message ||
          'Failed to escalate complaint'
        )
      }
    } catch (error) {
      console.error(
        'Escalation error:',
        error
      )

      toast.error(
        'Something went wrong. Please try again.'
      )
    }
  }

  return (
    <Dialog
      fullWidth
      maxWidth='md'
      scroll='body'
      open={open}
      onClose={onClose}
      sx={{
        '& .MuiDialog-paper': {
          overflow: 'visible'
        }
      }}
    >
      <DialogCloseButton onClick={onClose}>
        <i className='tabler-x' />
      </DialogCloseButton>
      <DialogTitle
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          fontWeight: 'bold'
        }}
      >
        Escalate Complaint
      </DialogTitle>

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <DialogContent>
          <Grid container spacing={3}>

            <Grid size={{ xs: 12, }}>
              <Controller
                name='escalation_reason'
                control={control}
                render={({ field }) => (
                  <CustomTextField
                    {...field}
                    fullWidth
                    select
                    required
                    label='Escalation Reason'
                    error={
                      !!errors.escalation_reason
                    }
                    helperText={
                      errors
                        .escalation_reason
                        ?.message
                    }
                  >
                    <MenuItem value=''>
                      Select Escalation Reason
                    </MenuItem>

                    {createData?.escalation_reason_data?.map(
                      item => (
                        <MenuItem
                          key={item?._id}
                          value={item?._id}
                        >
                          {item?.title}
                        </MenuItem>
                      )
                    )}
                  </CustomTextField>
                )}
              />
            </Grid>

            {/* Escalation Status */}

            <Grid size={{ xs: 12 }}>
              <Controller
                name='escalation_status'
                control={control}
                render={({ field }) => (
                  <CustomTextField
                    {...field}
                    fullWidth
                    select
                    label='Escalation Status'
                    required
                    error={
                      !!errors.escalation_status
                    }
                    helperText={
                      errors
                        .escalation_status
                        ?.message
                    }
                  >
                    <MenuItem value=''>
                      Select Escalation Status
                    </MenuItem>

                    {createData?.escalation_status_data?.map(
                      item => (
                        <MenuItem
                          key={item._id}
                          value={item._id}
                        >
                          {item.title}
                        </MenuItem>
                      )
                    )}
                  </CustomTextField>
                )}
              />
            </Grid>

            {/* Resident Remarks */}

            <Grid size={{ xs: 12 }}>
              <Controller
                name='resident_remarks'
                control={control}
                render={({ field }) => (
                  <CustomTextField
                    {...field}
                    fullWidth
                    multiline
                    minRows={4}
                    label='Resident Remarks'
                    required
                    placeholder='Please explain why you want to escalate this complaint...'
                    error={
                      !!errors.resident_remarks
                    }
                    helperText={
                      errors
                        .resident_remarks
                        ?.message
                    }
                  />
                )}
              />
            </Grid>

          </Grid>
        </DialogContent>

        <DialogActions
          sx={{
            justifyContent: 'center',
            gap: 2,
            pb: 3
          }}
        >
          <Button
            variant='contained'
            type='submit'
          >
            Submit Escalation
          </Button>

          <Button
            variant='outlined'
            color='error'
            type='button'
            onClick={onClose}
          >
            Cancel
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}

const ReviewFeedbackDialog = ({ open, setOpen, setComplainId, complainId, token, url, fetchComplain }) => {

  const [rating, setRating] = useState(5)
  const [isSatisfied, setIsSatisfied] = useState('yes')
  const [feedback, setFeedback] = useState('')
  const [reopenRequest, setReopenRequest] = useState(false)

  const onClose = () => {
    setOpen(false)
    setComplainId()
  }

  const handleSubmit = async () => {
    const payload = {
      rating,
      is_satisfied: isSatisfied === 'yes',
      feedback,
      complainId,
      reopen_request: reopenRequest
    }

    try {
      const response = await fetch(`${url}/user/review/feedback/data`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to submit review')
      }

      toast.success('Review submitted successfully', {
        autoClose: 1000
      })
      fetchComplain()
      onClose()

    } catch (error) {
      toast.error(error.message || 'Something went wrong')
      console.error(error)
    }
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth='sm'
      sx={{
        '& .MuiDialog-paper': {
          overflow: 'visible'
        }
      }}
    >
      <DialogCloseButton onClick={onClose}>
        <i className='tabler-x' />
      </DialogCloseButton>
      <DialogTitle>
        Complaint Feedback
      </DialogTitle>

      <DialogContent dividers>
        <Stack spacing={3}>
          <Typography variant='body2' color='text.secondary'>
            Your complaint has been resolved. Please share your experience.
          </Typography>

          <Divider />

          <Stack spacing={1}>
            <Typography fontWeight={600}>
              Rate your experience
            </Typography>

            <Rating
              value={rating}
              size='large'
              onChange={(event, newValue) => {
                setRating(newValue || 1)
              }}
            />
          </Stack>

          <Stack spacing={1}>
            <Typography fontWeight={600}>
              Are you satisfied with the resolution?
            </Typography>

            <RadioGroup
              row
              value={isSatisfied}
              onChange={(e) => setIsSatisfied(e.target.value)}
            >
              <FormControlLabel
                value='yes'
                control={<Radio />}
                label='Yes'
              />

              <FormControlLabel
                value='no'
                control={<Radio />}
                label='No'
              />
            </RadioGroup>
          </Stack>

          <TextField
            fullWidth
            multiline
            minRows={4}
            label='Feedback'
            placeholder='Tell us about your experience...'
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
          />


        </Stack>
      </DialogContent>

      <DialogActions style={{ marginTop: "10px", display: "flex", justifyContent: "center", alignItems: "center" }}>

        <Button
          variant='contained'
          onClick={handleSubmit}
        >
          Submit Feedback
        </Button>

        <Button
          variant='outlined'
          onClick={onClose}
        >
          Cancel
        </Button>

      </DialogActions>
    </Dialog>
  )
}

const ComplainTable = () => {

  const { data: session } = useSession()
  const token = session?.user?.token

  const API_URL = process.env.NEXT_PUBLIC_API_URL

  const [rowSelection, setRowSelection] = useState({})
  const [data, setData] = useState([])
  const [openDialog, setOpenDialog] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedComplainId, setSelectedComplainId] = useState(null)
  const [isOpen, setIsOpen] = useState(false)
  const [code, setCode] = useState(null)
  const [complainId, setComplainId] = useState(null)
  const [openEscalateModal, setOpenEscalateModal] = useState(false)
  const [currentComplainId, setCurrentComplainId] = useState(null)
  const [openFeedbackModal, setOpenFeedbackModal] = useState(false)
  const [selectComplainId, setSelectComplainId] = useState();

  const [imgFileName, setImgFileName] = useState()
  const [openImgDialog, setOpenImgDialog] = useState(false)

  const fetchComplain = async () => {
    try {
      const response = await fetch(
        `${API_URL}/user/my-complain`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      )

      const result = await response.json()

      if (response.ok) {
        setData(result?.data || [])
      } else {
        toast.error(
          result?.message ||
          'Failed to fetch complaints'
        )
      }
    } catch (error) {
      console.error(
        'Fetch complaints error:',
        error
      )

      toast.error(
        'Failed to fetch complaints'
      )
    }
  }

  useEffect(() => {
    if (API_URL && token) {
      fetchComplain()
    }
  }, [API_URL, token])

  const handleDelete = async () => {
    if (!selectedComplainId) {
      return
    }

    try {
      const response = await fetch(
        `${API_URL}/user/my-complain/${selectedComplainId}`,
        {
          method: 'DELETE',

          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      )

      const result =
        await response.json().catch(() => ({}))

      if (response.ok) {
        toast.success(
          'Complaint deleted successfully',
          {
            autoClose: 1000
          }
        )

        await fetchComplain()
      } else {
        toast.error(
          result?.message ||
          'Failed to delete complaint'
        )
      }
    } catch (error) {
      console.error(
        'Delete complaint error:',
        error
      )

      toast.error(
        'Something went wrong'
      )
    } finally {
      setDeleteDialogOpen(false)
      setSelectedComplainId(null)
    }
  }

  const columns = useMemo(
    () => [
      {
        id: 'select',

        header: ({ table }) => (
          <Checkbox
            checked={table.getIsAllRowsSelected()}
            indeterminate={
              table.getIsSomeRowsSelected()
            }
            onChange={
              table.getToggleAllRowsSelectedHandler()
            }
          />
        ),

        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            disabled={!row.getCanSelect()}
            indeterminate={
              row.getIsSomeSelected()
            }
            onChange={
              row.getToggleSelectedHandler()
            }
          />
        )
      },


      /* Sr No */
      columnHelper.display({
        id: 'sr_no',
        header: 'Sr No',
        cell: ({ row }) => (
          <Typography>
            {row.index + 1}
          </Typography>
        )
      }),

      /* Ticket */
      columnHelper.accessor('ticket', {
        header: 'Ticket',

        cell: ({ row }) => (
          <i
            className='tabler-eye'
            style={{
              cursor: 'pointer',
              transition:
                'transform 0.2s'
            }}
            onClick={() => {
              setCode(
                row.original?.happy_code
              )

              setComplainId(
                row.original?.complain_no
              )

              setOpenDialog(true)
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform =
                'scale(1.2)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform =
                'scale(1)'
            }}
          />
        )
      }),

      columnHelper.accessor('complain_img', {
        header: 'Attached Image',

        cell: ({ row }) => (
          <i
            className='tabler-eye'
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              cursor: 'pointer',
              transition:
                'transform 0.2s'
            }}
            onClick={() => {
              setImgFileName(
                row.original?.complain_img
              )
              setOpenImgDialog(true)
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform =
                'scale(1.2)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform =
                'scale(1)'
            }}
          />
        )
      }),

      /* Complaint Type */
      columnHelper.accessor(
        'complaint_type',
        {
          header: 'Type',

          cell: ({ row }) => (
            <Typography>
              {row.original
                ?.complaint_type === '1'
                ? 'Individual'
                : 'Society'}
            </Typography>
          )
        }
      ),

      /* Category */
      columnHelper.accessor(
        'category',
        {
          header: 'Category',

          cell: ({ row }) => (
            <Typography>
              {row.original
                ?.category?.name || '-'}
            </Typography>
          )
        }
      ),

      /* Assigned User */
      columnHelper.accessor(
        'assigned_user',
        {
          header: 'Assigned User',

          cell: ({ row }) => (
            <Typography>
              {row.original
                ?.assigned_user
                ?.first_name || '-'}{' '}

              {row.original
                ?.assigned_user
                ?.last_name || ''}
            </Typography>
          )
        }
      ),

      /* Description */
      columnHelper.accessor(
        'description',
        {
          header: 'Description',

          cell: ({ row }) => (
            <Typography>
              {row.original
                ?.description || '-'}
            </Typography>
          )
        }
      ),

      columnHelper.accessor('review_feedback', {
        header: 'Review Feedback',

        cell: ({ row }) => {
          const hasFeedback =
            Array.isArray(row.original?.feedbackLog)
              ? row.original.feedbackLog.length > 0
              : !!row.original?.feedbackLog?._id

          return (
            <Typography display="flex" justifyContent="center" alignItems="center">
              {row.original?.latest_complain_user?.complaint_status === "3" && !hasFeedback && (
                <i
                  className="tabler-send"
                  style={{ cursor: 'pointer' }}
                  onClick={() => {
                    setOpenFeedbackModal(true)
                    setSelectComplainId(row.original._id)
                  }}
                />
              )}
            </Typography>
          )
        }
      }),

      /* Complaint Status */
      columnHelper.accessor(
        'complain_status',
        {
          header: 'Complaint Status',

          cell: ({ row }) => {
            const statusMap = {
              1: 'Pending',
              2: 'Assigned',
              3: 'Resolved',
              4: 'In progress'
            }

            const status =
              row.original
                ?.latest_complain_user
                ?.complaint_status

            return (
              <Typography>
                {statusMap[status] ||
                  'Pending'}
              </Typography>
            )
          }
        }
      ),

      /* Created At */
      columnHelper.accessor(
        'created_at',
        {
          header: 'Created At',

          cell: ({ row }) => (
            <Typography>
              {row.original?.created_at
                ? FormatTime(
                  row.original.created_at
                )
                : '-'}
            </Typography>
          )
        }
      ),

      /* Modified At */
      columnHelper.accessor(
        'updated_at',
        {
          header: 'Modified At',

          cell: ({ row }) => (
            <Typography>
              {row.original?.updated_at
                ? FormatTime(
                  row.original.updated_at
                )
                : '-'}
            </Typography>
          )
        }
      ),

      /* Action */
      columnHelper.display({
        id: 'action',

        header: 'Action',

        enableSorting: false,

        cell: ({ row }) => {
          const options = [
            {
              text: 'Delete',

              icon: 'tabler-trash',

              menuItemProps: {
                className:
                  'flex items-center gap-2 text-textSecondary',

                onClick: () => {
                  setSelectedComplainId(
                    row.original?._id
                  )

                  setDeleteDialogOpen(
                    true
                  )
                }
              }
            },

            {
              text: 'Escalate complain',

              icon: 'tabler-arrow-up',

              menuItemProps: {
                className:
                  'flex items-center gap-2 text-textSecondary',

                onClick: () => {
                  // IMPORTANT:
                  // Set complaint ID before opening modal

                  setCurrentComplainId(
                    row.original?._id
                  )

                  setOpenEscalateModal(
                    true
                  )
                }
              }
            }
          ]

          return (
            <div className='flex items-center'>
              <OptionMenu
                iconButtonProps={{
                  size: 'medium'
                }}
                iconClassName='text-textSecondary'
                options={options}
              />
            </div>
          )
        }
      })
    ],
    []
  )

  const table = useReactTable({
    data,
    columns,

    filterFns: {
      fuzzy: fuzzyFilter
    },

    state: {
      rowSelection
    },

    initialState: {
      pagination: {
        pageSize: 10
      }
    },

    enableRowSelection: true,

    onRowSelectionChange:
      setRowSelection,

    getCoreRowModel:
      getCoreRowModel(),

    getFilteredRowModel:
      getFilteredRowModel(),

    getSortedRowModel:
      getSortedRowModel(),

    getPaginationRowModel:
      getPaginationRowModel(),

    getFacetedRowModel:
      getFacetedRowModel(),

    getFacetedUniqueValues:
      getFacetedUniqueValues(),

    getFacetedMinMaxValues:
      getFacetedMinMaxValues()
  })

  return (
    <>
      <Card>
        <CardContent>
          <div className='flex justify-between items-center gap-4 mb-4'>

            {/* Page Size */}

            <CustomTextField
              select
              value={
                table.getState()
                  .pagination.pageSize
              }
              onChange={e => {
                table.setPageSize(
                  Number(e.target.value)
                )
              }}
              className='max-sm:is-full sm:is-[70px]'
            >
              <MenuItem value={10}>
                10
              </MenuItem>

              <MenuItem value={25}>
                25
              </MenuItem>

              <MenuItem value={50}>
                50
              </MenuItem>
            </CustomTextField>


            {/* Add Complaint */}

            <Button
              variant='contained'
              startIcon={
                <i className='tabler-plus' />
              }
              onClick={() => {
                setIsOpen(true)
              }}
              className='max-sm:is-full'
            >
              Add Complaint
            </Button>
          </div>


          {/* Table */}

          <div className='overflow-x-auto'>
            <table
              className={tableStyles.table}
            >
              <thead>
                {table
                  .getHeaderGroups()
                  .map(headerGroup => (
                    <tr
                      key={headerGroup.id}
                    >
                      {headerGroup.headers.map(
                        header => (
                          <th
                            key={header.id}
                          >
                            {header.isPlaceholder
                              ? null
                              : flexRender(
                                header
                                  .column
                                  .columnDef
                                  .header,
                                header.getContext()
                              )}
                          </th>
                        )
                      )}
                    </tr>
                  ))}
              </thead>

              <tbody>
                {table.getRowModel()
                  .rows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={
                        table.getVisibleFlatColumns()
                          .length
                      }
                      className='text-center'
                    >
                      No data available
                    </td>
                  </tr>
                ) : (
                  table
                    .getRowModel()
                    .rows
                    .map(row => (
                      <tr key={row.id}>
                        {row
                          .getVisibleCells()
                          .map(cell => (
                            <td
                              key={cell.id}
                            >
                              {flexRender(
                                cell.column
                                  .columnDef
                                  .cell,
                                cell.getContext()
                              )}
                            </td>
                          ))}
                      </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>


          {/* Pagination */}

          <TablePaginationComponent
            table={table}
          />
        </CardContent>
      </Card>

      <ReviewFeedbackDialog
        open={openFeedbackModal}
        setOpen={setOpenFeedbackModal}
        setComplainId={setSelectComplainId}
        complainId={selectComplainId}
        token={token}
        url={API_URL}
        fetchComplain={fetchComplain}
      />

      {/* Add Complaint */}

      <ComplainModal
        open={isOpen}
        setIsOpen={setIsOpen}
        fetchComplain={fetchComplain}
      />


      {/* Happy Code */}

      <HappyCodeModal
        open={openDialog}
        setOpenDialog={setOpenDialog}
        code={code}
        id={complainId}
      />

      <ImageModal
        imgFile={imgFileName}
        open={openImgDialog}
        setOpen={setOpenImgDialog}
      />

      {/* Escalate */}

      <EscalateModal
        open={openEscalateModal}
        setOpen={setOpenEscalateModal}
        id={currentComplainId}
      />


      {/* Delete Confirmation */}

      <Dialog
        open={deleteDialogOpen}
        onClose={() =>
          setDeleteDialogOpen(false)
        }
        fullWidth
        maxWidth='xs'
      >
        <DialogTitle>
          Confirm Delete
        </DialogTitle>

        <DialogContent>
          <Typography>
            Are you sure you want to delete
            this complaint?
          </Typography>
        </DialogContent>

        <DialogActions
          sx={{
            justifyContent: 'center',
            gap: 2,
            pb: 3
          }}
        >
          <Button
            color='error'
            variant='contained'
            onClick={handleDelete}
          >
            Delete
          </Button>

          <Button
            variant='outlined'
            onClick={() =>
              setDeleteDialogOpen(false)
            }
          >
            Cancel
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

export default ComplainTable
