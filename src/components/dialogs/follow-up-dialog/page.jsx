
'use client'

import { useEffect, useState } from 'react'

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  MenuItem,
  Card,
  CircularProgress,
  Typography
} from '@mui/material'

import Grid from '@mui/material/Grid2'

import { useForm, Controller } from 'react-hook-form'
import { valibotResolver } from '@hookform/resolvers/valibot'

import {
  object,
  string,
  pipe,
  minLength,
  optional,
  custom,
  any
} from 'valibot'

import { toast } from 'react-toastify'

import CustomTextField from '@core/components/mui/TextField'
import DialogCloseButton from '../DialogCloseButton'

import { useApi } from '@/utils/api'


// ========================================
// VALIDATION SCHEMA
// ========================================

const schema = object(
  {
    follow_up_date: pipe(
      string(),
      minLength(1, 'Follow up date is required')
    ),

    next_follow_up_date: optional(string()),

    lead_status_id: pipe(
      string(),
      minLength(1, 'Lead status is required')
    ),

    follow_up_type: pipe(
      string(),
      minLength(1, 'Follow up type is required')
    ),

    notes: optional(string()),

    status: pipe(
      string(),
      minLength(1, 'Status is required')
    ),

    priority: pipe(
      string(),
      minLength(1, 'Priority is required')
    ),

    reminder_before: optional(any())
  },
  [
    custom(
      (data) => {
        const {
          follow_up_date,
          next_follow_up_date
        } = data

        if (!follow_up_date || !next_follow_up_date) {
          return true
        }

        const followDate = new Date(
          `${follow_up_date}T00:00`
        )

        const nextDate = new Date(next_follow_up_date)

        if (
          isNaN(followDate.getTime()) ||
          isNaN(nextDate.getTime())
        ) {
          return true
        }

        return nextDate >= followDate
      },
      'Next follow up date must be greater than or equal to follow up date',
      ['next_follow_up_date']
    )
  ]
)


// ========================================
// DATE HELPERS
// ========================================

const today = new Date().toISOString().split('T')[0]

const formatDate = (date) => {
  if (!date) return ''

  return new Date(date).toISOString().split('T')[0]
}

const formatDateTime = (date) => {
  if (!date) return ''

  const value = new Date(date)

  const offset = value.getTimezoneOffset()

  return new Date(value.getTime() - offset * 60000)
    .toISOString()
    .slice(0, 16)
}


// ========================================
// COMPONENT
// ========================================

const FollowUpDialog = ({
  open,
  setOpen,
  fetchLeadsData,

  isChange = false,

  selectedLead,
  selectedLeadId,

  // Actual follow-up document ID for PUT
  selectedFollowUpId
}) => {

  const {
    doGet,
    token
  } = useApi()

  const API_URL = process.env.NEXT_PUBLIC_API_URL

  const [loading, setLoading] = useState(false)

  const [createData, setCreateData] = useState({
    leadStatusData: [],
    followUpType: [],
    followUpStatus: [],
    followUpPriority: []
  })


  // ========================================
  // FORM
  // ========================================

  const {
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors }
  } = useForm({
    resolver: valibotResolver(schema),

    defaultValues: {
      follow_up_date: today,
      next_follow_up_date: '',

      lead_status_id: '',
      follow_up_type: '',

      notes: '',

      status: 'in_progress',
      priority: 'medium',

      reminder_before: 10
    }
  })


  const followUpDate = watch('follow_up_date')

  const nextFollowUpDate = watch('next_follow_up_date')


  // ========================================
  // DEFAULT VALUES
  // ========================================

  useEffect(() => {
    if (open && !isChange) {
      reset({
        follow_up_date: today,
        next_follow_up_date: '',

        lead_status_id: '',
        follow_up_type: 'calls',

        notes: '',

        status: 'in_progress',
        priority: 'medium',

        reminder_before: 10
      })
    }
  }, [open, isChange, reset])


  // ========================================
  // AUTO FIX INVALID DATE
  // ========================================

  useEffect(() => {
    if (nextFollowUpDate && followUpDate) {

      const follow = new Date(
        `${followUpDate}T00:00`
      )

      const next = new Date(nextFollowUpDate)

      if (next < follow) {
        setValue('next_follow_up_date', '')
      }
    }
  }, [
    followUpDate,
    nextFollowUpDate,
    setValue
  ])


  // ========================================
  // FETCH DROPDOWN DATA
  // ========================================

  const fetchCreateData = async () => {
    try {

      const response = await doGet(
        'company/follow-up/create/data'
      )

      const result =
        response?.data?.data ??
        response?.data ??
        response

      setCreateData({
        leadStatusData: result?.leadStatusData || [],
        followUpType: result?.followUpType || [],
        followUpStatus: result?.followUpStatus || [],
        followUpPriority: result?.followUpPriority || []
      })

    } catch (error) {

      console.error(error)

      toast.error('Unable to fetch follow up data')
    }
  }


  useEffect(() => {
    if (token && open) {
      fetchCreateData()
    }
  }, [token, open])


  // ========================================
  // RENDER DROPDOWN OPTIONS
  // ========================================

  const renderOptions = (data) => {

    if (!data || data.length === 0) {
      return (
        <MenuItem disabled>
          No options available
        </MenuItem>
      )
    }

    return data.map((item) => (
      <MenuItem
        key={item._id}
        value={item._id}
      >
        {item.title ?? item.name}
      </MenuItem>
    ))
  }


  // ========================================
  // CLOSE DIALOG
  // ========================================

  const handleClose = () => {

    setOpen(false)

    reset({
      follow_up_date: today,
      next_follow_up_date: '',
      lead_status_id: '',
      follow_up_type: '',
      notes: '',
      status: 'in_progress',
      priority: 'medium',
      reminder_before: 10
    })
  }


  // ========================================
  // EDIT: SET EXISTING VALUES
  // ========================================

  useEffect(() => {

    if (selectedLead && isChange && open) {

      reset({
        follow_up_date: formatDate(
          selectedLead?.follow_up_date
        ),

        next_follow_up_date: formatDateTime(
          selectedLead?.next_follow_up_date
        ),

        lead_status_id:
          selectedLead?.lead_status_id?._id ||
          selectedLead?.lead_status_id ||
          '',

        follow_up_type:
          selectedLead?.follow_up_type || '',

        notes:
          selectedLead?.notes || '',

        status:
          selectedLead?.status || 'in_progress',

        priority:
          selectedLead?.priority || 'medium',

        reminder_before:
          selectedLead?.reminder_before ?? 10
      })
    }

  }, [
    selectedLead,
    isChange,
    open,
    reset
  ])


  // ========================================
  // SUBMIT: CREATE / UPDATE
  // ========================================

  const onSubmit = async (values) => {

    try {

      setLoading(true)

      const payload = {
        ...values,
        next_follow_up_date: values.next_follow_up_date || null,
        notes: values.notes?.trim() || null,
        reminder_before: values.reminder_before === '' || values.reminder_before == null ? null : Number(values.reminder_before)
      }

      const endpoint = isChange
        ? `${API_URL}/company/follow-up/put/data/${selectedFollowUpId}`
        : `${API_URL}/company/follow-up/post/${selectedLeadId}`

      const response = await fetch(endpoint, {
        method: isChange ? 'PUT' : 'POST',

        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },

        body: JSON.stringify(payload)
      })

      const data = await response.json()

      if (!response.ok) {

        toast.error(
          data?.message || 'Something went wrong'
        )

        return
      }

      toast.success(
        isChange
          ? 'Follow up updated successfully'
          : 'Follow up created successfully'
      )

      fetchLeadsData?.()

      handleClose()

    } catch (error) {

      console.error(error)

      toast.error('Server error')

    } finally {

      setLoading(false)
    }
  }


  // ========================================
  // LEAD INFORMATION
  // ========================================

  const leadInfo = isChange
    ? selectedLead?.lead_data
    : selectedLead

  // ========================================
  // UI
  // ========================================

  return (
    <Dialog
      fullWidth
      maxWidth="lg"
      scroll="body"
      open={open}
      closeAfterTransition={false}
      sx={{
        '& .MuiDialog-paper': {
          overflow: 'visible'
        }
      }}
    >

      <DialogCloseButton onClick={handleClose}>
        <i className="tabler-x" />
      </DialogCloseButton>


      <DialogTitle
        className="text-center"
        sx={{ fontWeight: 600 }}
      >
        {isChange ? 'Edit' : 'Add'} Follow Up
      </DialogTitle>


      {/* ========================================
                LEAD INFORMATION
            ======================================== */}

      <Card
        sx={{
          boxShadow: 2,
          borderRadius: 2,
          p: 6,
          m: 4,
          backgroundColor: 'grey.50'
        }}
      >

        <Grid container spacing={2}>

          <Grid size={{ xs: 12, sm: 6 }}>
            <Typography variant="caption">
              Company
            </Typography>

            <Typography fontWeight={500}>
              {leadInfo?.company_name || '-'}
            </Typography>
          </Grid>


          <Grid size={{ xs: 12, sm: 6 }}>
            <Typography variant="caption">
              Name
            </Typography>

            <Typography fontWeight={500}>
              {leadInfo?.name || '-'}
            </Typography>
          </Grid>


          <Grid size={{ xs: 12, sm: 6 }}>
            <Typography variant="caption">
              Email
            </Typography>

            <Typography>
              {leadInfo?.email || '-'}
            </Typography>
          </Grid>


          <Grid size={{ xs: 12, sm: 6 }}>
            <Typography variant="caption">
              Phone
            </Typography>

            <Typography>
              {leadInfo?.phone || '-'}
            </Typography>
          </Grid>

        </Grid>

      </Card>


      {/* ========================================
                FORM
            ======================================== */}

      <form
        onSubmit={handleSubmit(onSubmit)}
        noValidate
      >

        <DialogContent>

          <Grid container spacing={3}>


            {/* FOLLOW UP DATE */}

            <Grid size={{ xs: 12, sm: 6 }}>

              <Controller
                name="follow_up_date"
                control={control}

                render={({ field }) => (
                  <CustomTextField
                    {...field}
                    fullWidth
                    required
                    type="date"
                    label="Follow Up Date"
                    InputLabelProps={{
                      shrink: true
                    }}
                    error={!!errors.follow_up_date}
                    helperText={
                      errors.follow_up_date?.message
                    }
                  />
                )}
              />

            </Grid>


            {/* LEAD STATUS */}

            <Grid size={{ xs: 12, sm: 6 }}>

              <Controller
                name="lead_status_id"
                control={control}

                render={({ field }) => (
                  <CustomTextField
                    {...field}
                    fullWidth
                    required
                    select
                    label="Lead Status"
                    error={!!errors.lead_status_id}
                    helperText={
                      errors.lead_status_id?.message
                    }
                  >
                    {renderOptions(
                      createData.leadStatusData
                    )}
                  </CustomTextField>
                )}
              />

            </Grid>


            {/* FOLLOW UP TYPE */}

            <Grid size={{ xs: 12, sm: 6 }}>

              <Controller
                name="follow_up_type"
                control={control}

                render={({ field }) => (
                  <CustomTextField
                    {...field}
                    fullWidth
                    required
                    select
                    label="Follow Up Type"
                    error={!!errors.follow_up_type}
                    helperText={
                      errors.follow_up_type?.message
                    }
                  >
                    {renderOptions(
                      createData.followUpType
                    )}
                  </CustomTextField>
                )}
              />

            </Grid>


            {/* FOLLOW UP STATUS */}

            <Grid size={{ xs: 12, sm: 6 }}>

              <Controller
                name="status"
                control={control}

                render={({ field }) => (
                  <CustomTextField
                    {...field}
                    fullWidth
                    required
                    select
                    label="Follow Up Status"
                    error={!!errors.status}
                    helperText={
                      errors.status?.message
                    }
                  >
                    {renderOptions(
                      createData.followUpStatus
                    )}
                  </CustomTextField>
                )}
              />

            </Grid>


            {/* PRIORITY */}

            <Grid size={{ xs: 12, sm: 6 }}>

              <Controller
                name="priority"
                control={control}

                render={({ field }) => (
                  <CustomTextField
                    {...field}
                    fullWidth
                    required
                    select
                    label="Priority"
                    error={!!errors.priority}
                    helperText={
                      errors.priority?.message
                    }
                  >
                    {renderOptions(
                      createData.followUpPriority
                    )}
                  </CustomTextField>
                )}
              />

            </Grid>


            {/* REMINDER */}

            <Grid size={{ xs: 12, sm: 6 }}>

              <Controller
                name="reminder_before"
                control={control}

                render={({ field }) => (
                  <CustomTextField
                    {...field}
                    fullWidth
                    type="number"
                    label="Reminder (minutes)"
                    inputProps={{
                      min: 0
                    }}
                    error={!!errors.reminder_before}
                    helperText={
                      errors.reminder_before?.message
                    }
                  />
                )}
              />

            </Grid>


            {/* NEXT FOLLOW UP DATE */}

            <Grid size={{ xs: 12, sm: 6 }}>

              <Controller
                name="next_follow_up_date"
                control={control}

                render={({ field }) => (
                  <CustomTextField
                    {...field}
                    fullWidth
                    type="datetime-local"
                    label="Next Follow Up Date & Time"
                    InputLabelProps={{
                      shrink: true
                    }}
                    inputProps={{
                      min: followUpDate
                        ? `${followUpDate}T00:00`
                        : undefined
                    }}
                    error={
                      !!errors.next_follow_up_date
                    }
                    helperText={
                      errors.next_follow_up_date?.message
                    }
                  />
                )}
              />

            </Grid>


            {/* NOTES */}

            <Grid size={{ xs: 12, sm: 6 }}>

              <Controller
                name="notes"
                control={control}

                render={({ field }) => (
                  <CustomTextField
                    {...field}
                    fullWidth
                    label="Notes"
                    multiline
                    rows={3}
                  />
                )}
              />

            </Grid>

          </Grid>

        </DialogContent>


        {/* ========================================
                    ACTION BUTTONS
                ======================================== */}

        <DialogActions
          sx={{
            justifyContent: 'center',
            py: 3
          }}
        >

          <Button
            type="submit"
            variant="contained"
            disabled={loading}
          >

            {loading ? (
              <CircularProgress size={22} />
            ) : (
              isChange ? 'Update' : 'Submit'
            )}

          </Button>


          <Button
            variant="outlined"
            onClick={handleClose}
            disabled={loading}
          >
            Cancel
          </Button>

        </DialogActions>

      </form>

    </Dialog>
  )
}

export default FollowUpDialog
