'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useForm, Controller } from 'react-hook-form'
import { valibotResolver } from '@hookform/resolvers/valibot'
import {
  object, string, boolean, optional, pipe, minLength, maxLength,
  email, check, regex
} from 'valibot'

import Card from '@mui/material/Card'
import Button from '@mui/material/Button'
import Grid from '@mui/material/Grid2'
import Divider from '@mui/material/Divider'
import MenuItem from '@mui/material/MenuItem'
import CardHeader from '@mui/material/CardHeader'
import Typography from '@mui/material/Typography'
import CardContent from '@mui/material/CardContent'
import CardActions from '@mui/material/CardActions'
import InputAdornment from '@mui/material/InputAdornment'
import IconButton from '@mui/material/IconButton'
import { toast } from 'react-toastify'

import CustomTextField from '@core/components/mui/TextField'
import SkeletonFormComponent from '../skeleton/form/page'
import PermissionGuard from '@/hocs/PermissionClientGuard'

const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][A-Z1-9]Z[0-9A-Z]$/
const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]$/
const websiteRegex = /^(https?:\/\/)?([\w-]+\.)+[\w-]{2,}(\/[\w\-./?%&=]*)?$/

const schema = object({
  company_name: pipe(string(), minLength(1, 'Company name is required'), maxLength(255, 'Company name can be a maximum of 255 characters')),
  first_name: pipe(string(), minLength(1, 'First name is required'), maxLength(255, 'First name can be a maximum of 255 characters')),
  last_name: pipe(string(), minLength(1, 'Last name is required'), maxLength(255, 'Last name can be a maximum of 255 characters')),
  email: pipe(string(), minLength(1, 'Email is required'), email('Please enter a valid email address'), maxLength(255, 'Email can be a maximum of 255 characters')),
  password: optional(string()),
  package_id: pipe(string(), minLength(1, 'Package is required')),
  country_id: pipe(string(), minLength(1, 'Country is required')),
  state_id: pipe(string(), minLength(1, 'State is required')),
  city_id: pipe(string(), minLength(1, 'City is required')),
  address: pipe(string(), minLength(1, 'Address is required'), maxLength(1000, 'Address can be a maximum of 1000 characters')),
  pincode: pipe(string(), minLength(6, 'Pincode must contain at least 6 digits'), maxLength(10, 'Pincode can contain at most 10 digits'), regex(/^\d+$/, 'Pincode must contain digits only')),
  phone: pipe(string(), minLength(7, 'Phone number must contain at least 7 digits'), maxLength(15, 'Phone number can contain at most 15 digits'), regex(/^[0-9]+$/, 'Phone number must contain digits only')),
  gst_no: optional(pipe(string(), check(v => v === '' || gstinRegex.test(v), 'Enter a valid 15-character GSTIN'))),
  pan_no: optional(pipe(string(), check(v => v === '' || panRegex.test(v), 'Enter a valid PAN, e.g. ABCDE1234F'))),
  website: optional(pipe(string(), check(v => v === '' || (v.length >= 8 && v.length <= 255 && websiteRegex.test(v)), 'Enter a valid website URL'))),
  tax_registration_type: pipe(string(), minLength(1, 'Tax registration type is required')),
  gst_applicable: boolean(),
  photo: optional(string()),
  status: boolean()
})

const initialValues = {
  company_name: '', first_name: '', last_name: '', email: '', password: '',
  package_id: '', country_id: '', state_id: '', city_id: '', address: '',
  pincode: '', phone: '', photo: '', gst_no: '', pan_no: '', website: '',
  tax_registration_type: 'regular', gst_applicable: true, status: true
}

const UserFormLayout = () => {
  const URL = process.env.NEXT_PUBLIC_API_URL
  const publicUrl = process.env.NEXT_PUBLIC_ASSETS_URL
  const { data: session } = useSession() || {}
  const token = session?.user?.token
  const router = useRouter()
  const { lang: locale, id } = useParams()

  const [createData, setCreateData] = useState(null)
  const [editData, setEditData] = useState(null)
  const [countryId, setCountryId] = useState('')
  const [stateId, setStateId] = useState('')
  const [stateData, setStateData] = useState([])
  const [cityData, setCityData] = useState([])
  const [file, setFile] = useState(null)
  const [imgSrc, setImgSrc] = useState('/images/avatars/11.png')
  const [passwordShown, setPasswordShown] = useState(false)

  const {
    control, reset, handleSubmit, setError, clearErrors,
    formState: { errors, isSubmitting }
  } = useForm({
    resolver: valibotResolver(schema),
    defaultValues: initialValues
  })

  const authHeaders = { Authorization: `Bearer ${token}` }

  const createFormData = async () => {
    const response = await fetch(`${URL}/admin/company/create`, {
      method: 'GET',
      headers: { ...authHeaders, 'Content-Type': 'application/json' }
    })
    const result = await response.json()
    if (!response.ok) throw new Error(result?.message || 'Unable to load form data')
    setCreateData(result?.data || null)
  }

  const editFormData = async () => {
    const response = await fetch(`${URL}/admin/company/${id}/edit`, {
      method: 'GET',
      headers: { ...authHeaders, 'Content-Type': 'application/json' }
    })
    const result = await response.json()
    if (!response.ok) throw new Error(result?.message || 'Unable to load company')
    setEditData(result?.data || null)
  }

  useEffect(() => {
    if (!URL || !token) return
    Promise.all([createFormData(), id ? editFormData() : Promise.resolve()])
      .catch(error => {
        console.error(error)
        toast.error(error.message || 'Failed to load form')
      })
  }, [URL, token, id])

  useEffect(() => {
    if (!createData || !countryId) {
      setStateData([])
      return
    }
    const country = createData.country?.find(item => String(item.country_id) === String(countryId))
    setStateData(country?.states || [])
  }, [countryId, createData])

  useEffect(() => {
    if (!stateId || !stateData.length) {
      setCityData([])
      return
    }
    const state = stateData.find(item => String(item.state_id) === String(stateId))
    setCityData(state?.cities || [])
  }, [stateId, stateData])

  useEffect(() => {
    if (!id || !editData) return
    reset({
      ...initialValues,
      ...editData,
      password: '',
      company_name: editData.company_name || '',
      first_name: editData.first_name || '',
      last_name: editData.last_name || '',
      email: editData.email || '',
      phone: String(editData.phone || ''),
      pincode: String(editData.pincode || ''),
      country_id: String(editData.country_id || ''),
      state_id: String(editData.state_id || ''),
      city_id: String(editData.city_id || ''),
      package_id: String(editData.package_id || ''),
      status: Boolean(editData.status),
      gst_applicable: editData.gst_applicable === undefined ? Boolean(editData.gst_no) : Boolean(editData.gst_applicable),
      tax_registration_type: editData.tax_registration_type || 'regular',
      gst_no: editData.gst_no || '',
      pan_no: editData.pan_no || '',
      website: editData.website || ''
    })
    setCountryId(String(editData.country_id || ''))
    setStateId(String(editData.state_id || ''))
    if (editData.photo) setImgSrc(`${publicUrl}/uploads/images/${editData.photo}`)
  }, [id, editData, reset, publicUrl])

  const handleFileInputChange = event => {
    const selectedFile = event.target.files?.[0]
    if (!selectedFile) return
    const validTypes = ['image/jpeg', 'image/png', 'image/gif']
    if (!validTypes.includes(selectedFile.type)) {
      setError('photo', { type: 'manual', message: 'Only JPG, PNG, or GIF images are allowed.' })
      event.target.value = ''
      return
    }
    if (selectedFile.size > 800 * 1024) {
      setError('photo', { type: 'manual', message: 'Image size must not exceed 800KB.' })
      event.target.value = ''
      return
    }
    clearErrors('photo')
    setFile(selectedFile)
    setImgSrc(URL.createObjectURL(selectedFile))
  }

  const handleFileInputReset = () => {
    setFile(null)
    setImgSrc(id && editData?.photo ? `${publicUrl}/uploads/images/${editData.photo}` : '/images/avatars/11.png')
    clearErrors('photo')
  }

  const checkEmailCompany = async (emailValue, companyId) => {
    const safeId = companyId || 'null'
    const response = await fetch(`${URL}/admin/company/email/check/${encodeURIComponent(emailValue)}/${safeId}`, {
      method: 'GET',
      headers: { ...authHeaders, 'Content-Type': 'application/json' }
    })
    const result = await response.json()
    if (!response.ok) throw new Error(result?.message || 'Could not verify email')
    return Boolean(result.exists)
  }

  const onSubmit = async values => {
    try {
      if (!id && (!values.password || values.password.length < 6)) {
        setError('password', { type: 'manual', message: 'Password must be at least 6 characters.' })
        return
      }

      const exists = await checkEmailCompany(values.email, id)
      if (exists) {
        setError('email', { type: 'manual', message: 'This email is already in use.' })
        return
      }

      const payload = new FormData()
      Object.entries(values).forEach(([key, value]) => {
        if (key === 'password' && id && !value) return
        if (key === 'photo') return
        payload.append(key, value === undefined || value === null ? '' : String(value))
      })
      if (file) payload.append('photo', file)

      const response = await fetch(id ? `${URL}/admin/company/${id}` : `${URL}/admin/company`, {
        method: id ? 'PUT' : 'POST',
        headers: authHeaders,
        body: payload
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result?.message || 'Unable to save company')

      toast.success(`Company ${id ? 'updated' : 'created'} successfully!`)
      router.push(`/${locale}/apps/society/list`)
    } catch (error) {
      console.error('Company form submission failed:', error)
      toast.error(error.message || 'Something went wrong')
    }
  }

  if (!createData) return <SkeletonFormComponent />

  return (
    <PermissionGuard locale={locale} element="isSuperAdmin">
      <Card>
        <CardHeader title={id ? 'Edit Company' : 'Add New Company'} />
        <Divider />
        <form onSubmit={handleSubmit(onSubmit)} noValidate encType="multipart/form-data">
          <CardContent>
            <Grid container spacing={6}>
              <Grid size={{ xs: 12 }}>
                <Typography variant="body2" className="font-medium">1. Company and Account Details</Typography>
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <Controller name="company_name" control={control} render={({ field }) => (
                  <CustomTextField {...field} fullWidth required label="Company Name" error={!!errors.company_name} helperText={errors.company_name?.message} />
                )} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Controller name="email" control={control} render={({ field }) => (
                  <CustomTextField {...field} fullWidth required type="email" label="Email" error={!!errors.email} helperText={errors.email?.message} />
                )} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Controller name="first_name" control={control} render={({ field }) => (
                  <CustomTextField {...field} fullWidth required label="First Name" error={!!errors.first_name} helperText={errors.first_name?.message} />
                )} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Controller name="last_name" control={control} render={({ field }) => (
                  <CustomTextField {...field} fullWidth required label="Last Name" error={!!errors.last_name} helperText={errors.last_name?.message} />
                )} />
              </Grid>
              {!id && <Grid size={{ xs: 12, sm: 6 }}>
                <Controller name="password" control={control} render={({ field }) => (
                  <CustomTextField {...field} fullWidth required label="Password" type={passwordShown ? 'text' : 'password'} error={!!errors.password} helperText={errors.password?.message}
                    InputProps={{ endAdornment: <InputAdornment position="end"><IconButton onClick={() => setPasswordShown(v => !v)} edge="end" aria-label="toggle password visibility"><i className={passwordShown ? 'tabler-eye-off' : 'tabler-eye'} /></IconButton></InputAdornment> }} />
                )} />
              </Grid>}
              <Grid size={{ xs: 12, sm: 6 }}>
                <Controller name="phone" control={control} render={({ field }) => (
                  <CustomTextField {...field} fullWidth required type="tel" label="Phone" inputProps={{ inputMode: 'numeric' }} onChange={e => field.onChange(e.target.value.replace(/\D/g, '').slice(0, 15))} error={!!errors.phone} helperText={errors.phone?.message} />
                )} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="h6" className="mb-4">Company Logo / Profile Photo</Typography>
                <div className="flex items-start gap-4">
                  <img src={imgSrc} alt="Company logo preview" className="rounded-full object-cover border" style={{ width: 100, height: 100 }} />
                  <div className="flex flex-col gap-2">
                    <Button component="label" variant="contained">Upload Photo
                      <input hidden type="file" accept="image/png,image/jpeg,image/gif" onChange={handleFileInputChange} />
                    </Button>
                    <Button variant="outlined" color="secondary" onClick={handleFileInputReset}>Reset</Button>
                    {errors.photo && <Typography color="error" variant="body2">{errors.photo.message}</Typography>}
                  </div>
                </div>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Controller name="package_id" control={control} render={({ field }) => (
                  <CustomTextField {...field} select required fullWidth label="Select Package" error={!!errors.package_id} helperText={errors.package_id?.message}>
                    {(createData.allPackages || []).map(item => <MenuItem key={item._id} value={String(item._id)}>{item.name}</MenuItem>)}
                  </CustomTextField>
                )} />
              </Grid>

              <Grid size={{ xs: 12 }}><Divider /></Grid>
              <Grid size={{ xs: 12 }}><Typography variant="body2" className="font-medium">2. Address and Contact Details</Typography></Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Controller name="pincode" control={control} render={({ field }) => (
                  <CustomTextField {...field} fullWidth required label="Pincode" inputProps={{ inputMode: 'numeric', maxLength: 10 }} onChange={e => field.onChange(e.target.value.replace(/\D/g, '').slice(0, 10))} error={!!errors.pincode} helperText={errors.pincode?.message} />
                )} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Controller name="address" control={control} render={({ field }) => (
                  <CustomTextField {...field} fullWidth required multiline rows={3} label="Address" error={!!errors.address} helperText={errors.address?.message} />
                )} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Controller name="country_id" control={control} render={({ field }) => (
                  <CustomTextField {...field} select required fullWidth label="Select Country" error={!!errors.country_id} helperText={errors.country_id?.message}
                    onChange={e => { const value = e.target.value; field.onChange(value); setCountryId(value); setStateId(''); setCityData([]); }}>
                    {(createData.country || []).map(item => <MenuItem key={item.country_id} value={String(item.country_id)}>{item.country_name}</MenuItem>)}
                  </CustomTextField>
                )} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Controller name="state_id" control={control} render={({ field }) => (
                  <CustomTextField {...field} select required fullWidth label="Select State" error={!!errors.state_id} helperText={errors.state_id?.message}
                    onChange={e => { field.onChange(e.target.value); setStateId(e.target.value); }}>
                    {stateData.map(item => <MenuItem key={item.state_id} value={String(item.state_id)}>{item.state_name}</MenuItem>)}
                  </CustomTextField>
                )} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Controller name="city_id" control={control} render={({ field }) => (
                  <CustomTextField {...field} select required fullWidth label="Select City" error={!!errors.city_id} helperText={errors.city_id?.message}>
                    {cityData.map(item => <MenuItem key={item.city_id} value={String(item.city_id)}>{item.city_name}</MenuItem>)}
                  </CustomTextField>
                )} />
              </Grid>

              <Grid size={{ xs: 12 }}><Divider /></Grid>
              <Grid size={{ xs: 12 }}><Typography variant="body2" className="font-medium">3. Tax and GST Configuration</Typography></Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Controller name="tax_registration_type" control={control} render={({ field }) => (
                  <CustomTextField {...field} select required fullWidth label="Tax Registration Type" error={!!errors.tax_registration_type} helperText={errors.tax_registration_type?.message}>
                    <MenuItem value="regular">Regular GST</MenuItem>
                    <MenuItem value="composition">Composition Scheme</MenuItem>
                    <MenuItem value="unregistered">Unregistered / Not Registered</MenuItem>
                    <MenuItem value="sez">SEZ</MenuItem>
                  </CustomTextField>
                )} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Controller name="gst_applicable" control={control} render={({ field }) => (
                  <CustomTextField select fullWidth required label="GST Applicable" value={field.value ? 'true' : 'false'} onChange={e => field.onChange(e.target.value === 'true')} error={!!errors.gst_applicable} helperText={errors.gst_applicable?.message}>
                    <MenuItem value="true">Yes</MenuItem>
                    <MenuItem value="false">No</MenuItem>
                  </CustomTextField>
                )} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Controller name="gst_no" control={control} render={({ field }) => (
                  <CustomTextField {...field} fullWidth label="GSTIN" placeholder="e.g. 22ABCDE1234F1Z5" inputProps={{ maxLength: 15, style: { textTransform: 'uppercase' } }}
                    onChange={e => field.onChange(e.target.value.toUpperCase().replace(/\s/g, ''))}
                    error={!!errors.gst_no} helperText={errors.gst_no?.message || 'Optional. Enter 15-character GSTIN if registered.'} />
                )} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Controller name="pan_no" control={control} render={({ field }) => (
                  <CustomTextField {...field} fullWidth label="PAN Number" placeholder="ABCDE1234F" inputProps={{ maxLength: 10, style: { textTransform: 'uppercase' } }}
                    onChange={e => field.onChange(e.target.value.toUpperCase().replace(/\s/g, ''))}
                    error={!!errors.pan_no} helperText={errors.pan_no?.message || 'Optional. Format: 5 letters, 4 digits, 1 letter.'} />
                )} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Controller name="website" control={control} render={({ field }) => (
                  <CustomTextField {...field} fullWidth label="Company Website" placeholder="https://example.com" error={!!errors.website} helperText={errors.website?.message} />
                )} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Controller name="status" control={control} render={({ field }) => (
                  <CustomTextField select required fullWidth label="Company Status" value={field.value ? 'true' : 'false'} onChange={e => field.onChange(e.target.value === 'true')} error={!!errors.status} helperText={errors.status?.message}>
                    <MenuItem value="true">Active</MenuItem>
                    <MenuItem value="false">Inactive</MenuItem>
                  </CustomTextField>
                )} />
              </Grid>
            </Grid>
          </CardContent>
          <Divider />
          <CardActions>
            <Button variant="contained" type="submit" disabled={isSubmitting}>{isSubmitting ? 'Saving...' : 'Submit'}</Button>
            <Button variant="outlined" color="error" type="button" onClick={() => router.push(`/${locale}/apps/society/list`)}>Cancel</Button>
          </CardActions>
        </form>
      </Card>
    </PermissionGuard>
  )
}

export default UserFormLayout
