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
  maxValue,
  boolean,
  regex,
  optional,
  email,
  custom,
  array
} from 'valibot';

import { useApi } from '../../utils/api';

import SkeletonFormComponent from '../skeleton/form/page'

import CustomTextField from '@core/components/mui/TextField'
import PermissionGuard from '@/hocs/PermissionClientGuard'

const UserFormLayout = () => {

  const URL = process.env.NEXT_PUBLIC_API_URL
  const public_url = process.env.NEXT_PUBLIC_ASSETS_URL;
  const { data: session } = useSession() || {}

  const user_id = session?.user?.userId;

  const token = session?.user?.token
  const [createData, setCreateData] = useState({ 'country': [] }, { designations: [] });
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

    qnap_username: optional(
      string(),
      maxLength(255, 'Qnap Username can be a maximum of 255 characters')
    ),

    qnap_password: optional(
      string(),
      maxLength(255, 'Password can be a maximum of 255 characters')
    ),

    sip_extension: pipe(
      string(),
      maxLength(255, 'SIP extension can be a maximum of 255 characters')
    ),

    country_id: pipe(string()),
    state_id: pipe(string()),
    city_id: pipe(string()),
    address: pipe(string(), maxLength(1000, 'Address can be a maximum of 1000 characters')),
    pincode: pipe(string(), maxLength(10, 'Pincode max length is of 10 digit')),

    photo: optional(string()),
    status: boolean(),

    dob: optional(
      pipe(
        string(),
        custom(
          (value) => !value || !isNaN(Date.parse(value)),
          'Invalid Date of Birth'
        )
      )
    ),

    roles: array(
      string([minLength(1, 'Each role must be at least 1 character')]),
      [minLength(1, 'At least one role must be selected')]
    ),
    no_of_pets: optional(
      pipe(
        string(),
        maxValue(2, "Maximum 2 pets allowed")
      )
    ),

    no_of_members: optional(
      pipe(
        string(),
        maxValue(20, "Maximum 20 members allowed")
      )
    ),
    vehicle_data: array(
      pipe(
        object({
          vehicle_number: optional(
            pipe(
              string(),
              regex(
                /^[A-Z]{2}[ -]?\d{1,2}[ -]?[A-Z]{1,2}[ -]?\d{4}$/,
                "Invalid vehicle number"
              )
            )
          ),
          vehicle_name: optional(string())
        }),
        custom((value) => {
          const hasName = value.vehicle_name?.trim();
          const hasNumber = value.vehicle_number?.trim();

          // both empty → valid
          if (!hasName && !hasNumber) return true;

          // both filled → valid
          if (hasName && hasNumber) return true;

          // one filled, one missing → invalid
          return false;
        }, 'Both vehicle name and number are required if one is filled')
      )
    ),

    // Cameras validation
    cameras: array(
      object({
        title: pipe(
          string(),
          minLength(1, 'Camera Title is required'),
          maxLength(255, 'Camera Title can be a maximum of 255 characters')
        ),
        ip: pipe(
          string(),
          minLength(1, 'Camera IP is required'),
          maxLength(255, 'Camera IP can be a maximum of 255 characters')
        )
      }),
      [minLength(1, 'At least one camera is required')]
    ),

    //  Fixed apartment_data schema (uses floor_id instead of flat_id)
    apartment_data: isFlatOwner
      ? array(
        object({
          tower_id: pipe(
            string(),
            minLength(1, 'Tower Id is required'),
            maxLength(255, 'Tower Id can be a maximum of 255 characters')
          ),
          floor_id: pipe(
            string(),
            minLength(1, 'Floor Id is required'),
            maxLength(255, 'Floor Id can be a maximum of 255 characters')
          ),
          apartment_id: pipe(
            string(),
            minLength(1, 'Apartment Id is required'),
            maxLength(255, 'Apartment Id can be a maximum of 255 characters')
          )
        }),
        [minLength(1, 'At least one Apartment is required')]
      )
      : array(
        object({
          tower_id: pipe(string(), maxLength(255, 'Tower Id can be a maximum of 255 characters')),
          floor_id: pipe(string(), maxLength(255, 'Floor Id can be a maximum of 255 characters')),
          apartment_id: pipe(string(), maxLength(255, 'Apartment Id can be a maximum of 255 characters'))
        })
      )
  });

  // States
  const [formData, setFormData] = useState({
    company_name: '',
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    country_id: '',
    no_of_pets: '',
    no_of_members: '',
    state_id: '',
    city_id: '',
    region_id: '',
    branch_id: "",
    user_type: "",
    address: '',
    no_of_pets: "",
    no_of_members: '',
    vehicle_data: [
      { vehicle_number: "", vehicle_name: "" }
    ],
    cameras: [
      { title: '', ip: '' }
    ],
    apartment_data: [
      { tower_id: "", floor_id: "", apartment_id: "" }
    ],
    pincode: '',
    dob: '',
    phone: '',
    photo: '',
    website: '',
    status: false,
    roles: [],
    user_code: '',
    qnap_username: "",
    qnap_password: "",
    sip_extension: ""
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
      password: '',
      country_id: '',
      branch_id: "",
      state_id: '',
      city_id: '',
      address: '',
      pincode: '',
      dob: '',
      phone: '',
      photo: '',
      website: '',
      status: false,
      urn_no: '',
      idfa_code: '',
      application_no: '',
      licence_no: '',
      roles: [],
      apartment_data: [
        { tower_id: "", floor_id: "", apartment_id: "" }
      ],
      no_of_pets: "",
      no_of_members: '',
      vehicle_data: [
        { vehicle_number: "", vehicle_name: "" }
      ],
      cameras: [
        { title: '', ip: '' }
      ],
      user_type: '',
      employee_type: '',
      participation_type_id: '',
      designation_id: '',
      department_id: '',
      alternative_email: '',
      qnap_username: "",
      qnap_password: "",
      sip_extension: ""
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'cameras'
  })

  const { fields: vehicleFields, append: vehicleAppend, remove: vehicleRemove } = useFieldArray({
    control,
    name: 'vehicle_data'
  })

  const { fields: apartmentFields, append: apartmentAppend, remove: apartmentRemove } = useFieldArray({
    control,
    name: "apartment_data",
  });

  const watchApartmentData = watch("apartment_data"); // get per-row values

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
      const response = await fetch(`${URL}/admin/user/${id}/edit`, {
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
      const countryData = await doGet(`admin/countries`);
      const designationData = await doGet(`admin/designations?status=true`);
      const towerData = await doGet(`company/tower`);
      const floorData = await doGet(`company/floor`);
      const apartmentData = await doGet('company/apartment')
      const participationTypesData = await doGet(`admin/participation_types?status=true`);
      const roleData = await doGet(`company/role`);
      const filteredRoles = roleData.filter(role => role._id !== '68fcb8aa19932a2fcc0450b9');


      setCreateData(prevData => ({
        ...prevData,
        country: countryData.country,
        designations: designationData,
        department: [],
        tower: towerData,
        floor: floorData,
        apartment: apartmentData,
        participation_types: participationTypesData,
        roles: filteredRoles,
      }));

      setIsLoading(false);
    } catch (error) {
      console.error('Error loading data:', error.message);
    }
  };

  useEffect(() => {
    if (URL && token) {
      loadData();

      if (id) {
        editFormData();
      }
    }

  }, [URL, token, id])


  useEffect(() => {
    if (!id || !editData) return;

    reset({
      first_name: editData.first_name ?? '',
      last_name: editData.last_name ?? '',
      user_type: editData.user_type ?? '',
      email: editData.email ?? '',
      phone: editData.phone ?? '',
      address: editData.address ?? '',
      pincode: editData.pincode ?? '',
      country_id: editData.country_id ?? '',
      state_id: editData.state_id ?? '',
      city_id: editData.city_id ?? '',
      status: editData.status ?? '',
      website: editData.website ?? '',
      qnap_password: editData.qnap_password ?? '',
      qnap_username: editData.qnap_username ?? '',
      sip_extension: editData.sip_extension ?? '',
      tower_id: editData.tower_id ?? '',
      no_of_pets: editData.no_of_pets ?? '',
      no_of_members: editData.no_of_members ?? '',
      vehicle_data: Array.isArray(editData.vehicle_data) ? editData.vehicle_data : [],
      floor_id: editData.floor_id ?? '',
      apartment_id: editData.apartment_id ?? '',
      apartment_data: Array.isArray(editData.apartment_data) ? editData.apartment_data : [],
      cameras: Array.isArray(editData.cameras) ? editData.cameras : [],
      dob: editData.dob ? new Date(editData.dob).toISOString().split('T')[0] : '',
    });

    // Safe image assignment
    if (editData.photo) {
      setImgSrc(`${public_url}/uploads/images/${editData.photo}`);
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

    //  Apartments filtering
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

  const submitFormData = async (values) => {
    try {


      if (values.roles.length === 0) {
        setError("roles", {
          type: "manual",
          message: "Please select at least one role.",
        });

        return;
      }

      const formData = new FormData();

      // Photo upload
      if (values.photo) {
        formData.append("photo", values.photo);
      }

      //  Append apartment_data correctly
      if (Array.isArray(values.apartment_data)) {
        values.apartment_data.forEach((apart, index) => {
          if (apart.tower_id)
            formData.append(`apartment_data[${index}][tower_id]`, apart.tower_id);
          if (apart.floor_id)
            formData.append(`apartment_data[${index}][floor_id]`, apart.floor_id);
          if (apart.apartment_id)
            formData.append(`apartment_data[${index}][apartment_id]`, apart.apartment_id);
        });
      }

      //  Append cameras correctly
      if (Array.isArray(values.cameras)) {
        values.cameras.forEach((cam, index) => {
          if (cam.title) formData.append(`cameras[${index}][title]`, cam.title);
          if (cam.ip) formData.append(`cameras[${index}][ip]`, cam.ip);
        });
      }

      if (Array.isArray(values.vehicle_data)) {
        values.vehicle_data.forEach((vehicle, index) => {
          formData.append(`vehicle_data[${index}][vehicle_name]`, vehicle.vehicle_name);
          formData.append(`vehicle_data[${index}][vehicle_number]`, vehicle.vehicle_number);
        });
      }

      //  Append other fields
      Object.entries(values).forEach(([key, value]) => {
        if (["photo", "cameras", "apartment_data", "vehicle_data"].includes(key)) return;

        if (Array.isArray(value)) {
          value.forEach((v) => formData.append(`${key}[]`, v));
        } else {
          formData.append(key, value ?? "");
        }
      });

      setLoading(true);

      const response = await fetch(
        id ? `${URL}/admin/user/${id}` : `${URL}/admin/user`,
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
        router.push(`/${locale}/apps/user/list`);
        toast.success(`User ${id ? "updated" : "added"} successfully!`, {
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

      setError("email", {
        type: "manual",
        message: "This email is already in use."
      });

      return;
    }

    let hasError = false;

    const filteredVehicles = [];

    (data.vehicle_data || []).forEach((item, index) => {

      const hasName = item.vehicle_name?.trim();
      const hasNumber = item.vehicle_number?.trim();

      // one filled, one missing
      if (hasName && !hasNumber) {

        setError(`vehicle_data.${index}.vehicle_number`, {
          type: "manual",
          message: "Vehicle number is required"
        });

        hasError = true;

        return;
      }

      if (!hasName && hasNumber) {

        setError(`vehicle_data.${index}.vehicle_name`, {
          type: "manual",
          message: "Vehicle name is required"
        });

        hasError = true;

        return;
      }

      //  only push valid rows (both filled)
      if (hasName && hasNumber) {

        filteredVehicles.push({
          vehicle_name: item.vehicle_name.trim(),
          vehicle_number: item.vehicle_number.trim()
        });
      }
    });

    if (hasError) return;

    //  replace with cleaned data
    newUser.vehicle_data = filteredVehicles;

    console.log("Final cleaned user:", newUser);

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
          element={id ? 'hasUserEditPermission' : 'hasUserAddPermission'}
          locale={locale}
        >
          <SkeletonFormComponent />
        </PermissionGuard>
      </>
    )
  }

  return (
    <Card>
      <CardHeader title={id ? `Edit ${editData?.first_name}` : "Add New User"} />
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

            {/* Personal Info */}
            <Grid item size={{ xs: 12 }} >
              <Divider />
            </Grid>
            <Grid item size={{ xs: 12 }}>
              <Typography variant="body2" className="font-medium">
                2. Personal Info
              </Typography>
            </Grid>

            <Grid item size={{ xs: 12, sm: 4 }} >
              <Controller
                name="dob"
                control={control}
                render={({ field }) => (
                  <CustomTextField
                    {...field}
                    fullWidth
                    type="date"
                    label="Date of birth"
                    placeholder="Date of birth"
                    error={!!errors.dob}
                    helperText={errors.dob?.message}
                  />
                )}
              />
            </Grid>

            <Grid item size={{ xs: 12, sm: 8 }} >
              <Controller
                name="address"
                control={control}
                render={({ field }) => (
                  <CustomTextField
                    {...field}
                    fullWidth
                    label="Address"
                    placeholder="Address"
                    multiline
                    rows={1}
                    error={!!errors.address}
                    helperText={errors.address?.message}
                  />
                )}
              />
            </Grid>

            {/* Country, State, City, Pincode */}
            <Grid item size={{ xs: 12, sm: 4 }}>
              <Controller
                name="country_id"
                control={control}
                render={({ field }) => (
                  <CustomTextField
                    {...field}
                    select
                    fullWidth
                    label="Country"
                    onChange={(e) => {
                      const selectedCountryId = e.target.value;

                      field.onChange(selectedCountryId);
                      setCountryId(selectedCountryId);
                    }}
                    error={!!errors.country_id}
                    helperText={errors.country_id?.message}
                  >
                    {createData?.country?.map((item, index) => (
                      <MenuItem key={index} value={`${item.country_id}`}>
                        {item.country_name}
                      </MenuItem>
                    ))}
                  </CustomTextField>
                )}
              />
            </Grid>

            <Grid item size={{ xs: 12, sm: 4 }}>
              <Controller
                name="state_id"
                control={control}
                render={({ field }) => (
                  <CustomTextField
                    {...field}
                    select
                    fullWidth
                    label="State"
                    onChange={(e) => {
                      const selectStateId = e.target.value;

                      field.onChange(selectStateId);
                      setStateId(selectStateId);
                    }}
                    error={!!errors.state_id}
                    helperText={errors.state_id?.message}
                  >
                    <MenuItem disabled value="1">
                      Select state
                    </MenuItem>
                    {stateData?.map((item, index) => (
                      <MenuItem key={index} value={`${item.state_id}`}>
                        {item.state_name}
                      </MenuItem>
                    ))}
                  </CustomTextField>
                )}
              />
            </Grid>

            <Grid item size={{ xs: 12, sm: 4 }}>
              <Controller
                name="city_id"
                control={control}
                render={({ field }) => (
                  <CustomTextField
                    {...field}
                    select
                    fullWidth
                    label="City"
                    error={!!errors.city_id}
                    helperText={errors.city_id?.message}
                  >
                    <MenuItem disabled value="1">
                      Select city
                    </MenuItem>
                    {cityData?.map((item, index) => (
                      <MenuItem key={index} value={`${item.city_id}`}>
                        {item.city_name}
                      </MenuItem>
                    ))}
                  </CustomTextField>
                )}
              />
            </Grid>

            <Grid item size={{ xs: 12, sm: 4 }}>
              <Controller
                name="pincode"
                control={control}
                render={({ field }) => (
                  <CustomTextField
                    {...field}
                    fullWidth
                    type="number"
                    label="Pincode"
                    placeholder="Pincode"
                    error={!!errors.pincode}
                    helperText={errors.pincode?.message}
                  />
                )}
              />
            </Grid>

            {/* Roles */}
            <Grid item size={{ xs: 12 }} >
              <Divider />
            </Grid>
            <Grid item size={{ xs: 12 }}>
              <Typography variant="body2" className="font-medium">
                3. Roles
              </Typography>
            </Grid>

            <Grid item size={{ xs: 12, sm: 4 }}>
              <Controller
                name="roles"
                control={control}
                defaultValue={[]}
                render={({ field }) => (
                  <CustomTextField
                    {...field}
                    select
                    fullWidth
                    label="Assign role*"
                    value={field.value}
                    error={!!errors.roles}
                    helperText={errors.roles?.message}
                    SelectProps={{
                      multiple: true,
                      onChange: (event) => {
                        const value = event.target.value;

                        setUserRoles(value);
                        field.onChange(value);
                      },
                      renderValue: (selectedIds) => {
                        const selectedNames = createData.roles
                          .filter((role) => selectedIds.includes(role._id))
                          .map((role) => role.name);

                        return selectedNames.join(", ");
                      },
                    }}
                  >
                    {createData?.roles?.length > 0 ? (
                      createData.roles.map((role, index) => (
                        <MenuItem key={index} value={role._id}>
                          <Checkbox checked={userRoles.includes(role._id)} />
                          <ListItemText primary={role.name} />
                        </MenuItem>
                      ))
                    ) : (
                      <MenuItem disabled>No roles</MenuItem>
                    )}
                  </CustomTextField>
                )}
              />
            </Grid>
            {isOfficeBearer && (


              <Grid item size={{ xs: 12, sm: 4 }}>
                <Controller
                  name="user_type" // single value
                  control={control}
                  defaultValue="" // default to empty string
                  render={({ field }) => (
                    <CustomTextField
                      {...field}
                      select
                      fullWidth
                      label="User Type*"
                      value={field.value || ""}
                      error={!!errors.user_type}
                      helperText={errors.user_type?.message}
                    >

                      <MenuItem key={1} value={"1"}>
                        Electricity
                      </MenuItem>
                      <MenuItem key={2} value={'2'}>
                        House Keeping/Guard
                      </MenuItem>
                      <MenuItem key={3} value={"3"}>
                        Internet
                      </MenuItem>
                    </CustomTextField>
                  )}
                />
              </Grid>
            )}
            {/* Cameras */}
            <Grid item size={{ xs: 12 }}>
              <Divider />
            </Grid>
            <Grid item size={{ xs: 12 }}>
              <Typography variant="body2" className="font-medium">
                4. Cameras
              </Typography>
            </Grid>

            <Grid item size={{ xs: 12 }}>
              <Grid container spacing={2}>
                {fields.map((item, index) => (
                  <Grid item size={{ xs: 12 }} key={item.id}>
                    <Grid container spacing={2} alignItems="center">
                      <Grid item size={{ xs: 12, sm: 5 }}>
                        <Controller
                          name={`cameras.${index}.title`}
                          control={control}
                          render={({ field }) => (
                            <CustomTextField
                              {...field}
                              fullWidth
                              label="Camera Title*"
                              error={!!errors?.cameras?.[index]?.title}
                              helperText={
                                errors?.cameras?.[index]?.title?.message
                              }
                            />
                          )}
                        />
                      </Grid>

                      <Grid item size={{ xs: 12, sm: 5 }} >
                        <Controller
                          name={`cameras.${index}.ip`}
                          control={control}
                          render={({ field }) => (
                            <CustomTextField
                              {...field}
                              fullWidth
                              label="Camera IP Address*"
                              error={!!errors?.cameras?.[index]?.ip}
                              helperText={errors?.cameras?.[index]?.ip?.message}
                            />
                          )}
                        />
                        <Typography variant="caption">
                          Example:
                          http://admin:admin123@192.168.80.22/cgi-bin/mjpg/video.cgi?channel=1&subtype=1
                        </Typography>
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
              <Grid item size={{ xs: 12 }}>
                <Button
                  variant="outlined"
                  startIcon={<i className="tabler-plus" />}
                  onClick={() =>
                    append({ title: '', ip: '' })
                  }
                >
                  Add Camera
                </Button>
              </Grid>
            </Grid>

            {/* QNAP/SIP */}
            <Grid item size={{ xs: 12 }} >
              <Divider />
            </Grid>
            <Grid item size={{ xs: 12 }} >
              <Typography variant="body2" className="font-medium">
                5. Access Qnap/SIP
              </Typography>
            </Grid>

            <Grid item size={{ xs: 12, sm: 4 }}>
              <Controller
                name="qnap_username"
                control={control}
                render={({ field }) => (
                  <CustomTextField
                    {...field}
                    fullWidth
                    label="Qnap Username"
                    error={!!errors.qnap_username}
                    helperText={errors.qnap_username?.message}
                  />
                )}
              />
            </Grid>

            {!id && (
              <Grid item size={{ xs: 12, sm: 4 }}>
                <Controller
                  name="qnap_password"
                  control={control}
                  render={({ field }) => (
                    <CustomTextField
                      fullWidth
                      label="Qnap Password"
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
                      error={!!errors.qnap_password}
                      helperText={errors.qnap_password?.message}
                    />
                  )}
                />
              </Grid>
            )}

            <Grid item size={{ xs: 12, sm: 4 }}>
              <Controller
                name="sip_extension"
                control={control}
                render={({ field }) => (
                  <CustomTextField
                    {...field}
                    fullWidth
                    label="SIP Extension"
                    error={!!errors.sip_extension}
                    helperText={errors.sip_extension?.message}
                  />
                )}
              />
            </Grid>

            {isFlatOwner && (
              <>
                <Grid item size={{ xs: 12 }}>
                  <Divider />
                </Grid>

                <Grid item size={{ xs: 12 }}>
                  <Typography variant="body2" className="font-medium">
                    6. Other Details
                  </Typography>
                </Grid>

                <Grid item size={{ xs: 12 }}>
                  <Grid container size={{ xs: 12 }} spacing={2}>
                    {apartmentFields.map((item, index) => {

                      const currentTowerId = watchApartmentData?.[index]?.tower_id;
                      const currentFloorId = watchApartmentData?.[index]?.floor_id;

                      const floors =
                        createData?.floor?.filter((f) => f.tower_id._id === currentTowerId) || [];

                      const apartments = Array.isArray(createData?.apartment)
                        ? createData.apartment.filter((a) => a.floor_id._id == currentFloorId)
                        : [];

                      const selectedApartmentIds = (watchApartmentData || [])
                        .map((d) => d?.apartment_id)
                        .filter(Boolean);

                      return (
                        <Grid container item size={{ xs: 12 }} spacing={2} key={item.id}>
                          {/* Tower Select */}
                          <Grid item size={{ xs: 12, sm: 4 }}>
                            <Controller
                              name={`apartment_data.${index}.tower_id`}
                              control={control}
                              render={({ field }) => (
                                <CustomTextField
                                  {...field}
                                  select
                                  fullWidth
                                  label="Tower*"
                                  value={field.value ?? ""}
                                  onChange={(e) => {
                                    const value = e.target.value || "";

                                    field.onChange(value);
                                    setValue(`apartment_data.${index}.floor_id`, "");
                                    setValue(`apartment_data.${index}.apartment_id`, "");
                                  }}
                                  error={!!errors?.apartment_data?.[index]?.tower_id}
                                  helperText={errors?.apartment_data?.[index]?.tower_id?.message}
                                >
                                  {createData?.tower
                                    .slice()
                                    .sort((a, b) => a.name.localeCompare(b.name))
                                    .map((tower) => (
                                      <MenuItem key={tower._id} value={tower._id}>
                                        {tower.name}
                                      </MenuItem>
                                    ))}
                                </CustomTextField>
                              )}
                            />
                          </Grid>

                          {/* Floor Select */}
                          {floors.length > 0 && (
                            <Grid item size={{ xs: 12, sm: 3 }}>
                              <Controller
                                name={`apartment_data.${index}.floor_id`}
                                control={control}
                                render={({ field }) => (
                                  <CustomTextField
                                    {...field}
                                    select
                                    fullWidth
                                    label="Floor*"
                                    value={field.value ?? ""}
                                    onChange={(e) => {
                                      const value = e.target.value || "";

                                      field.onChange(value);
                                      setValue(`apartment_data.${index}.apartment_id`, "");
                                    }}
                                    error={!!errors?.apartment_data?.[index]?.floor_id}
                                    helperText={errors?.apartment_data?.[index]?.floor_id?.message}
                                  >
                                    {floors
                                      .slice()
                                      .sort((a, b) => a.floor_name.localeCompare(b.floor_name))
                                      .map((floor) => (
                                        <MenuItem key={floor._id} value={floor._id}>
                                          {floor.floor_name}
                                        </MenuItem>
                                      ))}
                                  </CustomTextField>
                                )}
                              />
                            </Grid>
                          )}

                          {/* Apartment Select */}
                          {apartments.length > 0 && (
                            <Grid item size={{ xs: 12, sm: 3 }}>
                              <Controller
                                name={`apartment_data.${index}.apartment_id`}
                                control={control}
                                render={({ field }) => (
                                  <CustomTextField
                                    {...field}
                                    select
                                    fullWidth
                                    label="Apartment*"
                                    value={field.value ?? ""}
                                    onChange={(e) => field.onChange(e.target.value || "")}
                                    error={!!errors?.apartment_data?.[index]?.apartment_id}
                                    helperText={
                                      errors?.apartment_data?.[index]?.apartment_id?.message
                                    }
                                  >
                                    {apartments
                                      .slice()
                                      .map((apt) => {
                                        const isAlreadySelected =
                                          selectedApartmentIds.includes(apt._id) &&
                                          field.value !== apt._id;

                                        //  Only disable if assigned to another user OR status = true (but not current user’s assignment)
                                        const isAssignedToOtherUser =
                                          apt.assigned_to &&
                                          apt.assigned_to.toString() !== user_id.toString();

                                        const isUnavailable =
                                          isAlreadySelected || isAssignedToOtherUser || apt.status === true;

                                        const isDisabled = isUnavailable && field.value !== apt._id;

                                        return (
                                          <MenuItem key={apt._id} value={apt._id} disabled={isDisabled}>
                                            {apt.apartment_no}
                                          </MenuItem>
                                        );
                                      })}
                                  </CustomTextField>
                                )}
                              />
                            </Grid>
                          )}

                          {/* Remove button */}
                          <Grid item size={{ xs: 12, sm: 2 }} textAlign="center">
                            <IconButton color="error" onClick={() => apartmentRemove(index)}>
                              <i className="tabler-x" />
                            </IconButton>
                          </Grid>
                        </Grid>
                      );
                    })}


                  </Grid>
                </Grid>

                {/* Add More */}
                <Grid item size={{ xs: 12 }}>
                  <Button
                    variant="outlined"
                    startIcon={<i className="tabler-plus" />}
                    onClick={() =>
                      apartmentAppend({ tower_id: "", floor_id: "", apartment_id: "" })
                    }
                  >
                    Add more
                  </Button>
                </Grid>
              </>
            )}

            <Grid item size={{ xs: 12 }}>
              <Grid container spacing={2}>
                {vehicleFields.map((item, index) => (
                  <Grid item size={{ xs: 12 }} key={item.id}>
                    <Grid container spacing={2} alignItems="center">
                      <Grid item size={{ xs: 12, sm: 5 }}>
                        <Controller
                          name={`vehicle_data.${index}.vehicle_name`}
                          control={control}
                          defaultValue=''
                          render={({ field }) => (
                            <CustomTextField
                              {...field}
                              fullWidth
                              label="Vehicle Name"
                              error={!!errors?.vehicle_data?.[index]?.vehicle_name}
                              helperText={
                                errors?.vehicle_data?.[index]?.vehicle_name?.message
                              }
                            />
                          )}
                        />
                      </Grid>

                      <Grid item size={{ xs: 12, sm: 5 }} >
                        <Controller
                          name={`vehicle_data.${index}.vehicle_number`}
                          control={control}
                          defaultValue=""
                          render={({ field }) => (
                            <CustomTextField
                              {...field}
                              fullWidth
                              label="Vehicle Number"
                              error={!!errors?.vehicle_data?.[index]?.vehicle_number}
                              helperText={errors?.vehicle_data?.[index]?.vehicle_number?.message}
                            />
                          )}
                        />
                      </Grid>

                      <Grid item size={{ xs: 12, sm: 2 }} textAlign="center">
                        <IconButton color="error" onClick={() => vehicleRemove(index)}>
                          <i className="tabler-x" />
                        </IconButton>
                      </Grid>
                    </Grid>
                    <Grid item size={{ xs: 12 }}>
                      {errors?.vehicle_data?.[index]?.root?.message && (
                        <span style={{ color: 'red', fontSize: '12px' }}>
                          {errors.vehicle_data[index].root.message}
                        </span>
                      )}
                    </Grid>
                  </Grid>
                ))}
              </Grid>
            </Grid>

            <Grid item size={{ xs: 12 }}>
              <Button
                variant="outlined"
                startIcon={<i className="tabler-plus" />}
                onClick={() => vehicleAppend({ vehicle_name: "", vehicle_number: "" })}
              >
                Add Vehicle
              </Button>
            </Grid>

            <Grid item size={{ xs: 12, sm: 6 }}>
              <Controller
                name="no_of_members"
                control={control}
                defaultValue=''
                render={({ field }) => (
                  <CustomTextField
                    {...field}
                    fullWidth
                    type="tel"
                    label="No of members"
                    placeholder="Enter number of members"
                    error={!!errors.no_of_members}
                    helperText={errors.no_of_members?.message}
                    inputProps={{
                      inputMode: 'numeric', // shows numeric keypad on mobile
                      pattern: '[0-9]*' // browser hint
                    }}
                    onChange={(e) => {

                      const numericValue = e.target.value.replace(/\D/g, '');

                      field.onChange(numericValue);
                    }}
                  />
                )}
              />
            </Grid>

            <Grid item size={{ xs: 12, sm: 6 }}>
              <Controller
                name="no_of_pets"
                control={control}
                defaultValue=''
                render={({ field }) => (
                  <CustomTextField
                    {...field}
                    fullWidth
                    type="tel"
                    label="No of pets"
                    placeholder="Enter number of pets"
                    error={!!errors.no_of_pets}
                    helperText={errors.no_of_pets?.message}
                    inputProps={{
                      inputMode: 'numeric', // shows numeric keypad on mobile
                      pattern: '[0-9]*' // browser hint
                    }}
                    onChange={(e) => {

                      const numericValue = e.target.value.replace(/\D/g, '');

                      field.onChange(numericValue);
                    }}
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
            onClick={() => router.push(`/${locale}/apps/user/list`)}
          >
            Cancel
          </Button>
        </CardActions>
      </form>
    </Card >
  );

}

export default UserFormLayout
