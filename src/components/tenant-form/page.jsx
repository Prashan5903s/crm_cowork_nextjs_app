'use client'

// React Imports
import { useState, useEffect } from 'react'

// MUI Imports

import { useRouter, useParams } from 'next/navigation'

import Card from '@mui/material/Card'
import Button from '@mui/material/Button'
import Grid from '@mui/material/Grid2'
import Divider from '@mui/material/Divider'
import { useSession } from 'next-auth/react'
import MenuItem from '@mui/material/MenuItem'
import Checkbox from '@mui/material/Checkbox'
import ListItemText from '@mui/material/ListItemText'
import CardHeader from '@mui/material/CardHeader'
import CircularProgress from '@mui/material/CircularProgress'

import Typography from '@mui/material/Typography'

import { useForm, Controller, useFieldArray } from 'react-hook-form'

import CardContent from '@mui/material/CardContent'

import InputAdornment from '@mui/material/InputAdornment'

import IconButton from '@mui/material/IconButton'

import { valibotResolver } from '@hookform/resolvers/valibot';

import { toast } from 'react-toastify'

// Components Imports

import CardActions from '@mui/material/CardActions'

import {
  object,
  string,
  minLength,
  maxLength,
  pipe,
  regex,
  optional,
  email,
} from 'valibot';

import { useApi } from '../../utils/api';

import SkeletonFormComponent from '../skeleton/form/page'

import CustomTextField from '@core/components/mui/TextField'
import PermissionGuard from '@/hocs/PermissionClientGuard'

const TenantFormLayout = () => {

  const URL = process.env.NEXT_PUBLIC_API_URL
  const public_url = process.env.NEXT_PUBLIC_ASSETS_URL;
  const { data: session } = useSession() || {}

  const user_id = session?.user?.userId;

  const token = session?.user?.token
  const [createData, setCreateData] = useState();
  const [countryId, setCountryId] = useState();
  const [stateData, setStateData] = useState();
  const [stateId, setStateId] = useState();
  const [cityData, setCityData] = useState();
  const [editData, setEditData] = useState();
  const [selectTower, setSelectTower] = useState();
  const [selectFloor, setSelectFloor] = useState();
  const [selectedFloor, setSelectedFloor] = useState();
  const [selectedApartment, setSelectedApartment] = useState();
  const [userRoles, setUserRoles] = useState([]);
  const [isOfficeBearer, setIsOfficeBearer] = useState(false);
  const [isFlatOwner, setIsFlatOwner] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { doGet, doPost } = useApi();
  const [loading, setLoading] = useState(false)

  const router = useRouter();

  const { lang: locale, id: id } = useParams()

  const schema = object({
    first_name: pipe(
      string(),
      minLength(1, 'First Name is required'),
      maxLength(255, 'First Name can be a maximum of 255 characters')
    ),
    last_name: pipe(
      string(),
      minLength(1, 'Last Name is required'),
      maxLength(255, 'Last Name can be a maximum of 255 characters')
    ),
    user_type: isOfficeBearer
      ? pipe(string(), minLength(1, 'User type is required'))
      : optional(string()),

    email: pipe(
      string(),
      minLength(1, 'Email is required'),
      email('Please enter a valid email address'),
      maxLength(255, 'Email can be a maximum of 255 characters')
    ),

    phone: pipe(
      string(),
      minLength(7, 'Phone number must be valid'),
      maxLength(15, 'Phone number can be a maximum of 15 digits'),
      regex(/^[0-9]+$/, 'Phone number must contain only digits (0–9)')
    ),

    password: id
      ? optional(string())
      : pipe(
        string(),
        minLength(6, 'Password min length should be 6'),
        maxLength(255, 'Password can be a maximum of 255 characters')
      ),
    apartment_id: pipe(
      string(),
      minLength(1, 'Apartment is required'),
      maxLength(255, 'Apartment can be a maximum of 255 characters')
    ),
    contact_start_date: pipe(
      string(),
      minLength(1, 'Contact Start Date is required'),
      maxLength(255, 'Contact Start Date can be a maximum of 255 characters')
    ),
    contact_end_date: pipe(
      string(),
      minLength(1, 'Contact End Date is required'),
      maxLength(255, 'Contact End Date can be a maximum of 255 characters')
    ),
    rent_billing_cycle: pipe(
      string(),
      minLength(1, 'Rent Billing Cycle is required'),
      maxLength(255, 'Rent Billing Cycle can be a maximum of 255 characters')
    ),
    rent_amount: pipe(
      string(),
      minLength(1, 'Rent Amount is required'),
      maxLength(255, 'Rent Amount can be a maximum of 255 characters')
    ),
    move_in_date: pipe(
      string(),
      maxLength(255, 'Contact Start Date can be a maximum of 255 characters')
    ),
    move_out_date: pipe(
      string(),
      maxLength(255, 'Contact End Date can be a maximum of 255 characters')
    ),
  });

  // States
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    password: '',
    apartment_id: '',
    contact_start_date: '',
    contact_end_date: "",
    move_in_date: '',
    move_out_date: "",
    rent_billing_cycle: "",
    rent_amount: ""
  })

  const handleClickShowPassword = () => setFormData(show => ({ ...show, isPasswordShown: !show.isPasswordShown }))

  // const [formData, setFormData] = useState(initialData)
  const [imgSrc, setImgSrc] = useState('/images/avatars/11.png');

  // Hooks
  const {
    control,
    reset,
    watch,
    handleSubmit,
    setError,
    setValue,
    formState: { errors }
  } = useForm({
    resolver: valibotResolver(schema),
    defaultValues: {
      first_name: '',
      last_name: '',
      email: '',
      phone: "",
      password: '',
      apartment_id: '',
      contact_start_date: '',
      contact_end_date: "",
      move_in_date: '',
      move_out_date: "",
      rent_billing_cycle: "",
      rent_amount: ""
    }
  });

  useEffect(() => {
    if (userRoles && userRoles.length > 0) {
      const is_office_bearer = userRoles.some(item => item == "68c01730556298d2b76244ac")
      const is_flat_owner = userRoles.some(item => item == "68bfdb861814836bc3393bdc")

      if (!is_office_bearer) {
        setValue('user_type', '')
      }

      if (!is_flat_owner) {
        setValue('apartment_data', [])
      }

      setIsOfficeBearer(is_office_bearer)
      setIsFlatOwner(is_flat_owner)
    } else {
      setValue('user_type', '')
      setValue('user_type', '')
      setIsOfficeBearer(false)
      setIsFlatOwner(false)
    }
  }, [userRoles])

  const checkEmailCompany = async (email, id) => {
    try {
      const safeId = id || 'null'; // fallback to 'null' when id is undefined

      const response = await fetch(`${URL}/admin/company/email/check/${email}/${safeId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        return data.exists;
      } else {
        console.error('Failed to check email:', data);

        return false;
      }
    } catch (error) {
      console.error('Error occurred while checking email:', error);

      return false;
    }
  };

  const editFormData = async () => {
    try {
      const response = await fetch(`${URL}/company/tenant/edit/${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json();

      if (!response.ok) {

        // If server responded with an error status, handle it explicitly
        console.error('Failed to fetch user data:', result.message || result);

        return;
      }

      if (result?.data) {
        setEditData(result.data);
      } else {
        console.warn('No data found in response:', result);
      }

    } catch (error) {
      console.error('Network or parsing error:', error);
    }
  };

  const loadData = async () => {
    try {
      setIsLoading(true);

      const apartmentData = await doGet('company/tenant/create/data');

      if (apartmentData && Array.isArray(apartmentData)) {
        const filteredApartments = apartmentData.filter(apartment => {

          return (
            apartment.tenant_assigned_to === null ||
            apartment.tenant_assigned_to?.toString() === id?.toString()
          );
        });

        setCreateData(prevData => ({
          ...prevData,
          apartment: filteredApartments,
        }));
      }

    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (URL && token) {
      loadData();

      if (id) {
        editFormData();
      }
    }
  }, [URL, token, id]);

  useEffect(() => {
    if (!id || !editData) return;

    reset({
      first_name: editData.first_name ?? '',
      last_name: editData.last_name ?? '',
      email: editData.email ?? '',
      phone: editData.phone ?? '',
      contact_start_date: editData?.tenant_data?.contact_start_date,
      contact_end_date: editData?.tenant_data?.contact_end_date,
      rent_billing_cycle: editData?.tenant_data?.rent_billing_cycle,
      rent_amount: editData?.tenant_data?.rent_amount,
      apartment_id: editData?.tenant_data?.apartment_id,
      move_in_date: editData?.tenant_data?.move_in_date,
      move_out_date: editData?.tenant_data?.move_out_date
    });

    // Safe image assignment
    if (editData.photo) {
      setImgSrc(`${public_url}${editData.photo}`);
    } else {
      setImgSrc('/images/avatars/11.png')
    }

    // Country & state dependencies
    if (editData.country_id) setCountryId(editData.country_id);
    if (editData.state_id) setStateId(editData.state_id);

    // Roles
    if (Array.isArray(editData.roles) && editData.roles.length > 0) {
      const rolesIds = editData.roles.map((role) => role.role_id);

      setUserRoles(rolesIds);
      setValue('roles', rolesIds);
    } else {
      setUserRoles([]);
      setValue('roles', []);
    }

    // Tower & Floor
    if (editData.tower_id) setSelectTower(editData.tower_id);
    if (editData.floor_id) setSelectedFloor(editData.floor_id);

    // ✅ Apartments filtering
    if (editData.floor_id && createData?.apartment) {
      const branchData =
        createData.apartment.filter((b) => b.floor_id === editData.floor_id) || [];

      setSelectedApartment(branchData);
    } else {
      setSelectedApartment([]);
    }
  }, [id, editData, reset, setValue, createData]);

  useEffect(() => {
    if (countryId && createData?.country.length > 0) {
      const data = createData && createData['country'].find(item => item.country_id == countryId);
      const states = data['states'];

      setStateData(states);
    }
  }, [countryId, createData])

  useEffect(() => {
    if (errors) {
      console.log("Error", errors);
    }
  }, [errors])

  const submitFormData = async (values) => {
    try {

      const formData = new FormData();

      // Photo upload
      if (values.photo) {
        formData.append("photo", values.photo);
      }

      // ✅ Append other fields
      Object.entries(values).forEach(([key, value]) => {
        if (["photo", "cameras", "apartment_data"].includes(key)) return;

        if (Array.isArray(value)) {
          value.forEach((v) => formData.append(`${key}[]`, v));
        } else {
          formData.append(key, value ?? "");
        }
      });

      setLoading(true);

      const response = await fetch(
        id ? `${URL}/company/tenant/update/${id}` : `${URL}/company/tenant`,
        {
          method: id ? "PUT" : "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      const data1 = await response.json();

      if (response.ok) {
        router.push(`/${locale}/apps/tenant/list`);
        toast.success(`Tenant ${id ? "updated" : "added"} successfully!`, {
          autoClose: 700,
        });
      } else {
        toast.error(data1?.message || "Something went wrong", {
          autoClose: 1200,
        });
      }
    } catch (error) {
      console.error("Error", error);
      toast.error("Unexpected error occurred", { autoClose: 1200 });
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data) => {
    const newUser = {
      ...data,
      photo: file
    };

    const exist = await checkEmailCompany(data?.email, id);

    if (exist) {
      setError('email', {
        type: 'manual',
        message: 'This email is already in use.'
      });

      return;
    }

    submitFormData(newUser);
  };

  const [file, setFile] = useState(null);

  const handleFileInputChange = (event) => {
    const selectedFile = event.target.files[0];

    if (!selectedFile) return;

    const validTypes = ['image/jpeg', 'image/gif', 'image/png'];

    if (!validTypes.includes(selectedFile.type)) {
      setError('photo', {
        type: 'manual',
        message: 'Invalid file type. Only JPG, GIF, or PNG are allowed.'
      });

      return;
    }

    if (selectedFile.size > 800 * 1024) {
      setError('photo', {
        type: 'manual',
        message: 'File size exceeds 800KB.'
      });

      return;
    }

    setFile(selectedFile); // Save the actual File object

    const reader = new FileReader();

    reader.onload = () => setImgSrc(reader.result);
    reader.readAsDataURL(selectedFile);
  };

  const handleFileInputReset = () => {
    setFile('')
    setImgSrc('/images/avatars/11.png')
  }

  useEffect(() => {
    if (stateId && stateData) {
      const data = stateData && stateData.find(item => item.state_id == stateId);
      const city = data['cities'];

      setCityData(city);
    }
  }, [stateId, stateData])

  useEffect(() => {
    if (selectTower && createData) {

      const select_floor = createData?.floor?.filter(
        (item) => item.tower_id._id === selectTower
      )

      setSelectFloor(select_floor || []);

    }
  }, [selectTower, createData, setValue]);

  useEffect(() => {
    if (selectedFloor && createData) {
      const apartmentData =
        createData?.apartment?.filter(
          (item) => item.floor_id === selectedFloor && item.status === false
        ) || [];

      setSelectedApartment(apartmentData);
    }
  }, [selectedFloor, createData, setValue]);

  if (!createData || isLoading) {
    return (
      <>
        <PermissionGuard
          element={'isCompany'}
          locale={locale}
        >
          <SkeletonFormComponent />
        </PermissionGuard>
      </>
    )
  }

  return (
    <Card>
      <CardHeader title={id ? `Edit ${editData?.first_name}` : "Add New Tenant"} />
      <Divider />
      <form
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        encType="multipart/form-data"
      >
        <CardContent>
          <Grid container spacing={5}>
            {/* Account Details */}
            <Grid item size={{ xs: 12 }} >
              <Typography variant="body2" className="font-medium">
                1. Account Details
              </Typography>
            </Grid>

            <Grid item size={{ xs: 12, sm: 4 }}>
              <Controller
                name="first_name"
                control={control}
                render={({ field }) => (
                  <CustomTextField
                    {...field}
                    fullWidth
                    label="First Name*"
                    placeholder="First Name"
                    error={!!errors.first_name}
                    helperText={errors.first_name?.message}
                  />
                )}
              />
            </Grid>

            <Grid item size={{ xs: 12, sm: 4 }}>
              <Controller
                name="last_name"
                control={control}
                render={({ field }) => (
                  <CustomTextField
                    {...field}
                    fullWidth
                    type="text"
                    label="Last Name*"
                    placeholder="Last Name"
                    error={!!errors.last_name}
                    helperText={errors.last_name?.message}
                  />
                )}
              />
            </Grid>

            <Grid item size={{ xs: 12, sm: 4 }}>
              <Controller
                name="email"
                control={control}
                render={({ field }) => (
                  <CustomTextField
                    {...field}
                    fullWidth
                    type="email"
                    label="Email*"
                    placeholder="Email"
                    error={!!errors.email}
                    helperText={errors.email?.message}
                  />
                )}
              />
            </Grid>

            <Grid item size={{ xs: 12, sm: 4 }}>
              <Controller
                name="phone"
                control={control}
                render={({ field }) => (
                  <CustomTextField
                    {...field}
                    fullWidth
                    type="tel"
                    label="Phone*"
                    placeholder="Enter phone number"
                    error={!!errors.phone}
                    helperText={errors.phone?.message}
                    inputProps={{
                      inputMode: 'numeric', // shows numeric keypad on mobile
                      pattern: '[0-9]*' // browser hint
                    }}
                    onChange={(e) => {
                      // remove all non-digit characters
                      const numericValue = e.target.value.replace(/\D/g, '');
                      
                      field.onChange(numericValue);
                    }}
                  />
                )}
              />
            </Grid>

            {!id && (
              <Grid item size={{ xs: 12, sm: 4 }}>
                <Controller
                  name="password"
                  control={control}
                  render={({ field }) => (
                    <CustomTextField
                      fullWidth
                      label="Password*"
                      placeholder="············"
                      type={formData.isPasswordShown ? "text" : "password"}
                      {...field}
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              edge="end"
                              onClick={handleClickShowPassword}
                              onMouseDown={(e) => e.preventDefault()}
                              aria-label="toggle password visibility"
                            >
                              <i
                                className={
                                  formData.isPasswordShown
                                    ? "tabler-eye-off"
                                    : "tabler-eye"
                                }
                              />
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                      error={!!errors.password}
                      helperText={errors.password?.message}
                    />
                  )}
                />
              </Grid>
            )}

            {/* Profile Photo */}
            <Grid item size={{ xs: 12 }} >
              <Divider />
            </Grid>
            <Grid item size={{ xs: 12, sm: 4 }}>
              <Typography variant="h6" className="mb-4">
                Profile Photo
              </Typography>
              <CardContent className="flex flex-col sm:flex-row items-start gap-6 p-0">
                <img
                  src={imgSrc}
                  alt="Profile"
                  className="rounded-full object-cover border"
                  style={{ width: 100, height: 100 }}
                />
                <div className="flex flex-col gap-2">
                  <div className="flex flex-col gap-2 w-48">
                    <Button
                      component="label"
                      variant="contained"
                      fullWidth
                      htmlFor="upload-image"
                    >
                      Upload New Photo
                      <input
                        hidden
                        type="file"
                        accept="image/png, image/jpeg"
                        id="upload-image"
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
                  </div>
                  {errors?.photo && (
                    <Typography
                      variant="body2"
                      color="error"
                      className="mt-2"
                      style={{ color: "var(--mui-palette-error-main)" }}
                    >
                      {errors.photo.message}
                    </Typography>
                  )}
                </div>
              </CardContent>
            </Grid>

            {/* Roles */}
            <Grid item size={{ xs: 12 }} >
              <Divider />
            </Grid>
            <Grid item size={{ xs: 12 }}>
              <Typography variant="body2" className="font-medium">
                3. Apartment & Rent
              </Typography>
            </Grid>

            <Grid item size={{ xs: 12 }}>
              <Controller
                name={`apartment_id`}
                control={control}
                render={({ field }) => (
                  <CustomTextField
                    {...field}
                    select
                    fullWidth
                    label="Apartment*"
                    value={field.value ?? ""}
                    onChange={(e) => field.onChange(e.target.value || "")}
                    error={!!errors?.apartment_id}
                    helperText={
                      errors?.apartment_id?.message
                    }
                  >
                    {createData?.apartment?.map((item, index) => (
                      <MenuItem key={index} value={item._id} >
                        {item?.apartment_no}, {item?.tower_id?.name}, {item?.floor_id?.floor_name}
                      </MenuItem>
                    ))}

                  </CustomTextField>
                )}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <Controller
                name="contact_start_date"
                control={control}
                render={({ field }) => (
                  <CustomTextField
                    {...field}
                    type="date"
                    fullWidth
                    label="Contact Start Date"
                    required
                    InputLabelProps={{ shrink: true }}
                    error={!!errors?.contact_start_date}
                    helperText={errors?.contact_start_date?.message}
                  />
                )}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <Controller
                name="contact_end_date"
                control={control}
                render={({ field }) => (
                  <CustomTextField
                    {...field}
                    type="date"
                    fullWidth
                    label="Contact End Date"
                    required
                    InputLabelProps={{ shrink: true }}
                    error={!!errors?.contact_end_date}
                    helperText={errors?.contact_end_date?.message}
                  />
                )}
              />
            </Grid>

            <Grid item size={{ xs: 12, sm: 6 }}>
              <Controller
                name={`rent_billing_cycle`}
                control={control}
                render={({ field }) => (
                  <CustomTextField
                    {...field}
                    select
                    fullWidth
                    label="Rent Billing Cycle*"
                    value={field.value ?? ""}
                    onChange={(e) => field.onChange(e.target.value || "")}
                    error={!!errors?.rent_billing_cycle}
                    helperText={
                      errors?.rent_billing_cycle?.message
                    }
                  >

                    <MenuItem key={1} value={"1"} >
                      Annualy
                    </MenuItem>

                    <MenuItem key={2} value={"2"} >
                      Monthly
                    </MenuItem>
                  </CustomTextField>
                )}
              />
            </Grid>

            <Grid item size={{ xs: 12, sm: 6 }}>
              <Controller
                name="rent_amount"
                control={control}
                rules={{
                  required: "Rent amount is required",
                  pattern: {
                    value: /^[0-9]*\.?[0-9]+$/, // allows positive integers or decimals
                    message: "Enter a valid positive number",
                  },
                  validate: (value) =>
                    parseFloat(value) > 0 || "Amount must be greater than zero",
                }}
                render={({ field }) => (
                  <CustomTextField
                    {...field}
                    fullWidth
                    label="Rent Amount*"
                    placeholder="Rent Amount"
                    error={!!errors.rent_amount}
                    helperText={errors.rent_amount?.message}
                    onChange={(e) => {
                      // Prevent negative sign and non-numeric characters

                      const newValue = e.target.value.replace(/[^0-9.]/g, '');

                      field.onChange(newValue);
                    }}
                  />
                )}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <Controller
                name="move_in_date"
                control={control}
                render={({ field }) => (
                  <CustomTextField
                    {...field}
                    type="date"
                    fullWidth
                    label="Move In Date"
                    InputLabelProps={{ shrink: true }}
                    error={!!errors?.move_in_date}
                    helperText={errors?.move_in_date?.message}
                  />
                )}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <Controller
                name="move_out_date"
                control={control}
                render={({ field }) => (
                  <CustomTextField
                    {...field}
                    type="date"
                    fullWidth
                    label="Move Out Date"
                    InputLabelProps={{ shrink: true }}
                    error={!!errors?.move_out_date}
                    helperText={errors?.move_out_date?.message}
                  />
                )}
              />
            </Grid>
          </Grid>
        </CardContent>

        <Divider />
        <CardActions>
          <Button
            type="submit"
            variant="contained"
            disabled={loading}
            sx={{ height: 40, position: "relative" }}
          >
            {loading ? (
              <CircularProgress
                size={24}
                sx={{
                  color: "white",
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  marginTop: "-12px",
                  marginLeft: "-12px",
                }}
              />
            ) : (
              "Submit"
            )}
          </Button>
          <Button
            variant="tonal"
            color="error"
            type="reset"
            onClick={() => router.push(`/${locale}/apps/tenant/list`)}
          >
            Cancel
          </Button>
        </CardActions>
      </form>
    </Card >
  );

}

export default TenantFormLayout
