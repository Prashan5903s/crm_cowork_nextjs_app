'use client'

import { useState, useEffect, useMemo } from 'react'

import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  MenuItem, Button, CircularProgress, Card, Typography,
  IconButton, Divider, FormControlLabel, Switch
} from '@mui/material'

import Grid from '@mui/material/Grid2'

import { useForm, Controller, useFieldArray, useWatch } from 'react-hook-form'
import { valibotResolver } from '@hookform/resolvers/valibot'
import { object, string, array, pipe, optional, minLength, regex } from 'valibot'

import { toast } from 'react-toastify'

import DialogCloseButton from '../DialogCloseButton'
import DownloadPrposal from '@/utils/DowloadProposalPDF'
import CustomTextField from '@core/components/mui/TextField'
import { useApi } from '@/utils/api'

/* ---------- endpoints (must match the router) ---------- */
const CREATE_DATA_PATH = 'company/proposal/create/data'
const POST_PATH = 'company/proposal/save/data'

/* ---------- helpers ---------- */
const money = /^\d+(\.\d{1,2})?$/
const moneyOptional = /^(\d+(\.\d{1,2})?)?$/

const required = msg => pipe(string(), minLength(1, msg))

const requiredMoney = label => pipe(string(), minLength(1, `${label} is required`), regex(money, 'Enter a valid amount'))

const optionalMoney = pipe(string(), regex(moneyOptional, 'Enter a valid amount'))

const num = v => (isNaN(parseFloat(v)) ? 0 : parseFloat(v))
const fmt = v => `₹ ${Number(v || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

// local date (toISOString gives the previous day in IST between 00:00 and 05:30)
const today = () => {
  const d = new Date()

  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const defaultValues = {
  customer_id: '',
  property_id: '',
  seats: '',
  contract_period: '',
  start_date: '',
  expiry_date: '',
  monthly_rent: '',
  setup_fee: '',
  security_deposit: '',
  discount: '',
  tax_percent: '18',
  additional_services: [],
  email: '',
  notes: ''
}

const schema = object({
  customer_id: required('Customer is required'),
  property_id: required('Property is required'),
  seats: pipe(string(), minLength(1, 'Seats is required'), regex(/^[1-9]\d{0,4}$/, 'Enter a valid number of seats')),
  contract_period: pipe(string(), minLength(1, 'Contract period is required'), regex(/^[1-9]\d{0,2}$/, 'Enter months (1-999)')),
  start_date: required('Start date is required'),
  expiry_date: required('Expiry date is required'),
  monthly_rent: requiredMoney('Monthly rent'),
  setup_fee: optionalMoney,
  security_deposit: optionalMoney,
  discount: optionalMoney,
  tax_percent: pipe(string(), regex(/^(100|\d{1,2}(\.\d{1,2})?)?$/, 'Enter 0 - 100')),
  additional_services: array(
    object({
      name: required('Service name is required'),
      amount: requiredMoney('Amount')
    })
  ),
  email: pipe(string(), minLength(1, 'Email is required'), regex(/^\S+@\S+\.\S+$/, 'Invalid email format')),
  notes: optional(string())
})

const customerLabel = c => c?.full_name || c?.company_name || c?.name || ''
const customerEmail = c => c?.emails?.[0] || c?.email || ''
const propertyLabel = p => p?.name || p?.title || p?.property_name || ''
const propertyRent = p => p?.monthly_rent ?? p?.rent ?? p?.rental_value ?? null

const ProposalDialog = ({ open, setOpen, selectedLead, fetchLeadsData }) => {
  const { doGet, token } = useApi()

  const API_URL = process.env.NEXT_PUBLIC_API_URL

  const [createData, setCreateData] = useState()
  const [loadingAction, setLoadingAction] = useState(null) // 'download' | 'email' | null
  const [sendEmail, setSendEmail] = useState(true)

  const { control, handleSubmit, reset, setError, setValue } = useForm({
    resolver: valibotResolver(schema),
    defaultValues
  })

  const { fields, append, remove } = useFieldArray({ control, name: 'additional_services' })

  /* ---------- dropdown data ---------- */
  useEffect(() => {
    if (!open || !token) return

    let ignore = false

      ; (async () => {
        try {
          const response = await doGet(CREATE_DATA_PATH)

          if (!ignore) setCreateData(response?.data ?? response)
        } catch (error) {
          console.error('Error loading proposal data:', error)
          toast.error('Could not load customers and properties')
        }
      })()

    return () => {
      ignore = true
    }
  }, [open, token])

  const properties = useMemo(() => createData?.propertyData || [], [createData])

  /* ---------- customers: API list + the lead's own contact ---------- */
  const customers = useMemo(() => {
    const list = createData?.customerData || []
    const contact = selectedLead?.contact
    const id = selectedLead?.contact_id || contact?._id

    if (id && !list.some(c => c._id === id)) {
      return [
        contact
          ? { ...contact, _id: id }
          : { _id: id, full_name: selectedLead?.company_name || selectedLead?.name, emails: [selectedLead?.email] },
        ...list
      ]
    }

    return list
  }, [createData, selectedLead])

  /* ---------- prefill from the lead ---------- */
  useEffect(() => {
    if (open) {
      reset({
        ...defaultValues,
        customer_id: selectedLead?.contact_id || selectedLead?.contact?._id || '',
        email: selectedLead?.contact?.emails?.[0] || selectedLead?.email || '',
        start_date: today()
      })
    }
  }, [open, selectedLead, reset])

  /* ---------- live total (same formula as the backend model) ---------- */
  const watched = useWatch({ control })

  const totals = useMemo(() => {
    const rent = num(watched?.monthly_rent) * num(watched?.contract_period)
    const services = (watched?.additional_services || []).reduce((s, i) => s + num(i?.amount), 0)
    const setup = num(watched?.setup_fee)
    const subtotal = rent + setup + services
    const discount = Math.min(num(watched?.discount), subtotal)
    const taxable = subtotal - discount
    const tax = (taxable * num(watched?.tax_percent)) / 100
    const deposit = num(watched?.security_deposit) // refundable, not taxed
    const total = taxable + tax + deposit

    return { rent, services, setup, subtotal, discount, tax, deposit, total }
  }, [watched])

  /* ---------- property → auto-fill rent ---------- */
  const handlePropertyChange = (field, id) => {
    field.onChange(id)

    const rent = propertyRent(properties.find(p => p._id === id))

    if (rent != null) setValue('monthly_rent', String(rent), { shouldValidate: true })
  }

  const handleClose = () => {
    setOpen(false)
    reset(defaultValues)
  }

  /* ---------- submit ---------- */
  const submitData = async (values, action) => {
    if (values.expiry_date < today()) {
      setError('expiry_date', { message: 'Expiry date cannot be in the past' })

      return
    }

    if (values.expiry_date < values.start_date) {
      setError('expiry_date', { message: 'Expiry date cannot be before the start date' })

      return
    }

    setLoadingAction(action)

    // totals are recalculated by the backend, so they are not sent
    const payload = {
      ...values,
      lead_id: selectedLead?._id,
      seats: num(values.seats),
      contract_period: num(values.contract_period),
      monthly_rent: num(values.monthly_rent),
      setup_fee: num(values.setup_fee),
      security_deposit: num(values.security_deposit),
      discount: num(values.discount),
      tax_percent: num(values.tax_percent),
      additional_services: values.additional_services.map(s => ({ ...s, amount: num(s.amount) })),
      send_email: action === 'email'
    }

    try {
      const res = await fetch(`${API_URL}/${POST_PATH}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload)
      })

      const data = await res.json().catch(() => ({}))

      if (res.ok) {
        const result = data?.data

        if (action === 'download') {
          await DownloadPrposal({
            finalData: result?.finalData || {},
            subject: result?.subject || '',
            message: result?.message || ''
          })
        }

        toast.success(action === 'email' ? 'Proposal emailed successfully' : 'Proposal generated', {
          autoClose: 1000
        })

        fetchLeadsData?.()
        handleClose()
      } else {
        toast.error(data?.message || 'Something went wrong')
      }
    } catch (err) {
      console.error(err)
      toast.error('Server error')
    } finally {
      setLoadingAction(null)
    }
  }

  const busy = !!loadingAction

  /* ---------- reusable field renderers ---------- */
  const textField = (name, label, extra = {}) => (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <CustomTextField
          {...field}
          fullWidth
          label={label}
          error={!!fieldState.error}
          helperText={fieldState.error?.message}
          {...extra}
        />
      )}
    />
  )

  const numberField = (name, label, { decimal = true, required: req = false, maxLength = 10 } = {}) => (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <CustomTextField
          {...field}
          required={req}
          fullWidth
          label={label}
          error={!!fieldState.error}
          helperText={fieldState.error?.message}
          inputProps={{ maxLength, inputMode: decimal ? 'decimal' : 'numeric' }}
          onChange={e => {
            let v = e.target.value.replace(decimal ? /[^0-9.]/g : /[^0-9]/g, '')

            if (decimal) {
              const [a, ...rest] = v.split('.')

              v = rest.length ? `${a}.${rest.join('').slice(0, 2)}` : a
            }

            field.onChange(v)
          }}
        />
      )}
    />
  )

  return (
    <Dialog
      fullWidth
      maxWidth='lg'
      scroll='body'
      open={open}
      closeAfterTransition={false}
      sx={{ '& .MuiDialog-paper': { overflow: 'visible' } }}
    >
      <DialogCloseButton onClick={handleClose}>
        <i className='tabler-x' />
      </DialogCloseButton>

      <DialogTitle variant='h4' className='text-center sm:pbs-16 sm:pbe-6 sm:pli-16'>
        Create Proposal / Quotation
      </DialogTitle>

      <form onSubmit={e => e.preventDefault()} noValidate>
        <DialogContent className='flex flex-col gap-6'>
          {/* ================= CUSTOMER & PROPERTY ================= */}
          <Card sx={{ boxShadow: 2, borderRadius: 2, p: 6, backgroundColor: 'grey.50' }}>
            <Typography variant='h6' className='mbe-4'>Customer & Property</Typography>

            <Grid container spacing={4}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Controller
                  name='customer_id'
                  control={control}
                  render={({ field, fieldState }) => (
                    <CustomTextField
                      {...field}
                      select
                      required
                      fullWidth
                      label='Customer'
                      error={!!fieldState.error}
                      helperText={fieldState.error?.message}
                      onChange={e => {
                        field.onChange(e.target.value)

                        const email = customerEmail(customers.find(x => x._id === e.target.value))

                        if (email) setValue('email', email, { shouldValidate: true })
                      }}
                    >
                      {customers.length > 0 ? (
                        customers.map(c => (
                          <MenuItem key={c._id} value={c._id}>
                            {customerLabel(c)}
                          </MenuItem>
                        ))
                      ) : (
                        <MenuItem disabled value=''>No Customer Available</MenuItem>
                      )}
                    </CustomTextField>
                  )}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <Controller
                  name='property_id'
                  control={control}
                  render={({ field, fieldState }) => (
                    <CustomTextField
                      {...field}
                      select
                      required
                      fullWidth
                      label='Property'
                      error={!!fieldState.error}
                      helperText={fieldState.error?.message}
                      onChange={e => handlePropertyChange(field, e.target.value)}
                    >
                      {properties.length > 0 ? (
                        properties.map(p => (
                          <MenuItem key={p._id} value={p._id}>
                            {propertyLabel(p)}
                          </MenuItem>
                        ))
                      ) : (
                        <MenuItem disabled value=''>No Property Available</MenuItem>
                      )}
                    </CustomTextField>
                  )}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                {textField('email', 'Send To (Email)', { required: true, type: 'email' })}
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                {numberField('seats', 'Seats', { decimal: false, required: true, maxLength: 5 })}
              </Grid>
            </Grid>
          </Card>

          {/* ================= CONTRACT ================= */}
          <Card sx={{ boxShadow: 2, borderRadius: 2, p: 6 }}>
            <Typography variant='h6' className='mbe-4'>Contract Details</Typography>

            <Grid container spacing={4}>
              <Grid size={{ xs: 12, sm: 4 }}>
                {numberField('contract_period', 'Contract Period (Months)', {
                  decimal: false,
                  required: true,
                  maxLength: 3
                })}
              </Grid>

              <Grid size={{ xs: 12, sm: 4 }}>
                {textField('start_date', 'Start Date', {
                  type: 'date',
                  required: true,
                  InputLabelProps: { shrink: true }
                })}
              </Grid>

              <Grid size={{ xs: 12, sm: 4 }}>
                {textField('expiry_date', 'Proposal Expiry Date', {
                  type: 'date',
                  required: true,
                  InputLabelProps: { shrink: true },
                  inputProps: { min: today() }
                })}
              </Grid>
            </Grid>
          </Card>

          {/* ================= PRICING ================= */}
          <Card sx={{ boxShadow: 2, borderRadius: 2, p: 6 }}>
            <Typography variant='h6' className='mbe-4'>Pricing</Typography>

            <Grid container spacing={4}>
              <Grid size={{ xs: 12, sm: 4 }}>
                {numberField('monthly_rent', 'Monthly Rent (₹)', { required: true })}
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>{numberField('setup_fee', 'Setup Fee (₹)')}</Grid>
              <Grid size={{ xs: 12, sm: 4 }}>{numberField('security_deposit', 'Security Deposit (₹)')}</Grid>
              <Grid size={{ xs: 12, sm: 4 }}>{numberField('discount', 'Discount (₹)')}</Grid>
              <Grid size={{ xs: 12, sm: 4 }}>{numberField('tax_percent', 'Tax / GST (%)', { maxLength: 5 })}</Grid>
            </Grid>

            <Divider className='mlb-6' />

            {/* Additional services */}
            <div className='flex items-center justify-between mbe-4'>
              <Typography variant='subtitle1'>Additional Services</Typography>
              <Button
                size='small'
                variant='outlined'
                startIcon={<i className='tabler-plus' />}
                onClick={() => append({ name: '', amount: '' })}
              >
                Add Service
              </Button>
            </div>

            {fields.length === 0 && (
              <Typography variant='body2' color='text.secondary'>
                No additional services added.
              </Typography>
            )}

            {fields.map((item, index) => (
              <Grid container spacing={4} key={item.id} alignItems='flex-start' className='mbe-2'>
                <Grid size={{ xs: 12, sm: 7 }}>
                  {textField(`additional_services.${index}.name`, 'Service Name')}
                </Grid>
                <Grid size={{ xs: 10, sm: 4 }}>
                  {numberField(`additional_services.${index}.amount`, 'Amount (₹)')}
                </Grid>
                <Grid size={{ xs: 2, sm: 1 }} className='flex justify-center pbs-6'>
                  <IconButton color='error' onClick={() => remove(index)}>
                    <i className='tabler-trash' />
                  </IconButton>
                </Grid>
              </Grid>
            ))}
          </Card>

          {/* ================= SUMMARY ================= */}
          <Card sx={{ boxShadow: 2, borderRadius: 2, p: 6, backgroundColor: 'grey.50' }}>
            <Typography variant='h6' className='mbe-4'>Summary</Typography>

            {[
              ['Rent (monthly × period)', totals.rent],
              ['Setup Fee', totals.setup],
              ['Additional Services', totals.services],
              ['Discount', -totals.discount],
              [`Tax (${watched?.tax_percent || 0}%)`, totals.tax],
              ['Security Deposit (refundable)', totals.deposit]
            ].map(([label, value]) => (
              <div key={label} className='flex justify-between mbe-2'>
                <Typography variant='body2'>{label}</Typography>
                <Typography variant='body2'>{value < 0 ? `- ${fmt(-value)}` : fmt(value)}</Typography>
              </div>
            ))}

            <Divider className='mlb-3' />

            <div className='flex justify-between'>
              <Typography variant='h6'>Total Amount</Typography>
              <Typography variant='h6' color='primary'>{fmt(totals.total)}</Typography>
            </div>
          </Card>

          {textField('notes', 'Notes / Terms (optional)', { multiline: true, minRows: 2 })}

          <FormControlLabel
            control={<Switch checked={sendEmail} onChange={e => setSendEmail(e.target.checked)} />}
            label='Email proposal to customer after generating PDF'
          />
        </DialogContent>

        <DialogActions className='justify-center pbe-8'>
          <Button
            variant='contained'
            disabled={busy}
            onClick={handleSubmit(v => submitData(v, sendEmail ? 'email' : 'download'))}
          >
            {busy && loadingAction === (sendEmail ? 'email' : 'download') ? (
              <CircularProgress size={24} sx={{ color: 'white' }} />
            ) : sendEmail ? (
              'Generate & Email'
            ) : (
              'Generate PDF'
            )}
          </Button>

          {sendEmail && (
            <Button variant='outlined' disabled={busy} onClick={handleSubmit(v => submitData(v, 'download'))}>
              {loadingAction === 'download' ? <CircularProgress size={24} /> : 'Download PDF Only'}
            </Button>
          )}

          <Button variant='outlined' color='secondary' onClick={handleClose} disabled={busy}>
            Cancel
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}

export default ProposalDialog
