'use client'

// React Imports
import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'

// MUI Imports
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    MenuItem,
    Box,
    Typography,
    Autocomplete
} from '@mui/material'

import Grid from '@mui/material/Grid2'

// Hook Form + Validation
import { useForm, Controller } from 'react-hook-form'

// Components
import CustomTextField from '@core/components/mui/TextField'
import DialogCloseButton from '../DialogCloseButton'
import { toast } from 'react-toastify'

// Helper to get today's date in YYYY-MM-DD format for min date restriction
const getTodayDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const formatDate = (date) => {
    if (!date) return '';

    return new Date(date).toISOString().split('T')[0];
};

const generateTimeSlots = (start, end, interval = 20) => {
    const slots = [];

    let [startHour, startMinute] = start.split(":").map(Number);
    let [endHour, endMinute] = end.split(":").map(Number);

    const startDate = new Date();
    startDate.setHours(startHour, startMinute, 0, 0);

    const endDate = new Date();
    endDate.setHours(endHour, endMinute, 0, 0);

    while (startDate <= endDate) {
        slots.push(
            startDate.toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
                hour12: true,
            })
        );

        startDate.setMinutes(startDate.getMinutes() + interval);
    }

    return slots;
};

const BookingTimeSlotDialog = ({ open, setOpen, selectedZone, fetchZoneData }) => {
    const URL = process.env.NEXT_PUBLIC_API_URL

    const { data: session } = useSession() || {}
    const token = session && session.user && session?.user?.token

    const [loading, setLoading] = useState(false)
    const [createData, setCreateData] = useState()
    const [selectedAmenity, setSelectedAmenity] = useState()
    const [selectedTimeSlot, setSelectedTimeSlot] = useState()
    const [selectedCurrentAmenity, setSelectedCurrentAmenity] = useState()
    const [selectBookType, setSelectBookType] = useState()

    const fetchCreate = async () => {
        try {
            const response = await fetch(`${URL}/company/amenity/booking/create`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            })

            const value = await response.json()

            if (response.ok) {
                const result = value?.data
                setCreateData(result)
            }
        } catch (error) {
            throw new Error(error)
        }
    }

    useEffect(() => {
        if (URL && token && open) {
            fetchCreate()
        }
    }, [URL, token, open])

    // Handle updating amenity details and time slots when selectedAmenity changes
    useEffect(() => {
        if (selectedAmenity && createData?.amenity) {
            const amenity = createData.amenity.find(
                am => am._id === selectedAmenity
            );

            setSelectedCurrentAmenity(amenity);

            if (amenity?.start_time && amenity?.end_time) {
                let slots = generateTimeSlots(
                    amenity.start_time,
                    amenity.end_time,
                    amenity.time_diffrence
                );

                // While editing, include already saved booking times
                if (selectedZone?.custom_time?.length) {
                    slots = [...new Set([...slots, ...selectedZone.custom_time])];

                    // Optional: sort by time
                    slots.sort((a, b) => {
                        const d1 = new Date(`1970-01-01 ${a}`);
                        const d2 = new Date(`1970-01-01 ${b}`);
                        return d1 - d2;
                    });
                }

                setSelectedTimeSlot(slots);
            }
        }
    }, [selectedAmenity, createData, selectedZone]);

    const {
        control,
        handleSubmit,
        reset,
        setValue,
        watch
    } = useForm({
        defaultValues: {
            amenity: '',
            booking_type: '',
            user_id: [],
            booking_start_time: '',
            booking_end_time: '',
            booking_time: [],
            persons_allowed: ''
        }
    })

    const bookingStartDate = watch('booking_start_time')

    const handleClose = () => {
        reset()
        setSelectedAmenity(undefined)
        setSelectedTimeSlot(undefined)
        setSelectBookType(undefined)
        setCreateData(undefined)
        setSelectedCurrentAmenity(undefined)
        setOpen(false)
    }

    const onSubmit = async (data) => {
        setLoading(true)

        try {
            const url = selectedZone ? `${URL}/company/amenity/booking/data/update/${selectedZone?._id}` : `${URL}/company/amenity/booking/data/store`
            const saveMethod = selectedZone ? "PUT" : "POST";

            const response = await fetch(url, {
                method: saveMethod,
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(data),
            });

            if (response.ok) {
                toast.success("Booking done successfully", {
                    autoClose: 1000
                })
                fetchZoneData()
                handleClose();
            }
        } catch (error) {
            throw new Error(error)
        } finally {
            setLoading(false)
        }
    }

    // Pre-populate form fields and state variables when editing an existing zone
    useEffect(() => {
        if (selectedZone && createData) {
            const amenityId = selectedZone?.amenity_id?._id || selectedZone?.amenity_id;
            const bookingTypeStr = String(selectedZone?.booking_type || '');

            // Extract user IDs from bookingLog if available
            const userIds = Array.isArray(selectedZone?.bookingLog)
                ? selectedZone.bookingLog.map(log => log.user_id)
                : (selectedZone?.user_id || []);

            setSelectedAmenity(amenityId);
            setSelectBookType(bookingTypeStr);

            reset({
                amenity: amenityId,
                booking_type: bookingTypeStr,
                user_id: userIds,
                booking_start_time: formatDate(selectedZone?.booking_start_time) || '',
                booking_end_time: formatDate(selectedZone?.booking_end_time) || '',
                booking_time: selectedZone?.custom_time || selectedZone?.booking_time || [],
                persons_allowed: selectedZone?.no_of_person || ''
            });
        }
    }, [selectedZone, createData]);

    return (
        <Dialog fullWidth maxWidth="md" open={open} scroll="body" sx={{ '& .MuiDialog-paper': { overflow: 'visible' } }}>
            <DialogCloseButton onClick={handleClose}>
                <i className="tabler-x" />
            </DialogCloseButton>
            <DialogTitle variant="h4" className="text-center sm:pbs-16 sm:pbe-6 sm:pli-16">
                {selectedZone ? "Edit" : "Add"} Book Amenity
            </DialogTitle>

            <form onSubmit={handleSubmit(onSubmit)} noValidate>
                <DialogContent className="overflow-visible flex flex-col gap-6 sm:pli-16">
                    <Grid container spacing={4}>
                        {/* Choose Amenity */}
                        <Grid size={{ xs: 12 }}>
                            {createData?.amenity?.length > 0 ? (
                                <Controller
                                    name="amenity"
                                    control={control}
                                    rules={{ required: 'Amenity is required' }}
                                    render={({ field, fieldState: { error } }) => (
                                        <CustomTextField
                                            {...field}
                                            select
                                            fullWidth
                                            label="Amenity"
                                            required
                                            error={Boolean(error)}
                                            helperText={error?.message}
                                            onChange={(e) => {
                                                field.onChange(e);
                                                setSelectedAmenity(e.target.value);
                                                setValue('booking_time', []);
                                            }}
                                        >
                                            {createData.amenity.map((am) => (
                                                <MenuItem key={am._id} value={am._id}>
                                                    {am.title}
                                                </MenuItem>
                                            ))}
                                        </CustomTextField>
                                    )}
                                />
                            ) : (
                                <CustomTextField fullWidth label="Amenity" disabled placeholder="Loading amenities..." />
                            )}
                        </Grid>

                        <Grid size={{ xs: 12 }}>
                            <Controller
                                name="booking_type"
                                control={control}
                                rules={{ required: 'Booking type is required' }}
                                render={({ field, fieldState: { error } }) => (
                                    <CustomTextField
                                        {...field}
                                        label="Booking type"
                                        value={field.value ?? ""}
                                        select
                                        fullWidth
                                        required
                                        error={Boolean(error)}
                                        helperText={error?.message}
                                        onChange={(e) => {
                                            field.onChange(e);
                                            const val = e.target.value;
                                            setSelectBookType(val);
                                            if (val !== '5') {
                                                setValue('booking_start_time', '');
                                                setValue('booking_end_time', '');
                                                setValue('booking_time', []);
                                            }
                                        }}
                                    >
                                        <MenuItem key={1} value={"1"}>Weekly</MenuItem>
                                        <MenuItem key={2} value={"2"}>Monthly</MenuItem>
                                        <MenuItem key={3} value={"3"}>Quarterly</MenuItem>
                                        <MenuItem key={4} value={"4"}>Yearly</MenuItem>
                                        <MenuItem key={5} value={"5"}>Custom</MenuItem>
                                    </CustomTextField>
                                )}
                            />
                        </Grid>

                        {/* Choose Users */}
                        <Grid size={{ xs: 12 }}>
                            {createData?.users?.length > 0 ? (
                                <Controller
                                    name="user_id"
                                    control={control}
                                    rules={{
                                        validate: (value) => (Array.isArray(value) && value.length > 0) || 'At least one user is required'
                                    }}
                                    render={({ field: { onChange, value }, fieldState: { error } }) => {
                                        const selectedUsers = createData.users.filter(u =>
                                            Array.isArray(value) && value.includes(u._id)
                                        )

                                        return (
                                            <Autocomplete
                                                multiple
                                                options={createData.users}
                                                getOptionLabel={(option) => `${option?.first_name || ''} ${option?.last_name || ''} (${option?.phone || ''})`}
                                                getOptionKey={(option) => option._id}
                                                value={selectedUsers}
                                                isOptionEqualToValue={(option, val) => option._id === val._id}
                                                filterOptions={(options, { inputValue }) => {
                                                    const query = inputValue.toLowerCase().trim();
                                                    if (!query) return options;
                                                    return options.filter(option => {
                                                        const fullName = `${option?.first_name || ''} ${option?.last_name || ''}`.toLowerCase();
                                                        const phone = String(option?.phone || '').toLowerCase();
                                                        return fullName.includes(query) || phone.includes(query);
                                                    });
                                                }}
                                                onChange={(_, newValue) => {
                                                    onChange(newValue.map(u => u._id))
                                                }}
                                                renderInput={(params) => (
                                                    <CustomTextField
                                                        {...params}
                                                        label="Users"
                                                        required
                                                        placeholder="Search by name or phone..."
                                                        error={Boolean(error)}
                                                        helperText={error?.message}
                                                    />
                                                )}
                                            />
                                        )
                                    }}
                                />
                            ) : (
                                <CustomTextField fullWidth label="Users" disabled placeholder="Loading users..." />
                            )}
                        </Grid>

                        {/* Custom Booking Details (Only visible when booking type is '5') */}
                        {selectBookType === '5' && (
                            <>
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <Controller
                                        name="booking_start_time"
                                        control={control}
                                        rules={{
                                            required: selectBookType === '5' ? 'Start date is required' : false
                                        }}
                                        render={({ field, fieldState: { error } }) => (
                                            <CustomTextField
                                                {...field}
                                                type="date"
                                                fullWidth
                                                disabled={!selectedAmenity}
                                                label="Booking Start Date"
                                                required
                                                error={Boolean(error)}
                                                helperText={error?.message}
                                                inputProps={{ min: getTodayDate() }}
                                                InputLabelProps={{ shrink: true }}
                                                onChange={(e) => {
                                                    field.onChange(e);
                                                    const endDate = watch('booking_end_time');
                                                    if (endDate && e.target.value > endDate) {
                                                        setValue('booking_end_time', '');
                                                    }
                                                }}
                                            />
                                        )}
                                    />
                                </Grid>

                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <Controller
                                        name="booking_end_time"
                                        control={control}
                                        rules={{
                                            required: selectBookType === '5' ? 'End date is required' : false,
                                            validate: (value) => {
                                                if (selectBookType !== '5') return true;
                                                if (!value) return true;
                                                if (bookingStartDate && value < bookingStartDate) {
                                                    return 'End date cannot be earlier than start date';
                                                }
                                                return true;
                                            }
                                        }}
                                        render={({ field, fieldState: { error } }) => (
                                            <CustomTextField
                                                {...field}
                                                type="date"
                                                fullWidth
                                                disabled={!selectedAmenity || !bookingStartDate}
                                                label="Booking End Date"
                                                required
                                                error={Boolean(error)}
                                                helperText={error?.message}
                                                inputProps={{ min: bookingStartDate || getTodayDate() }}
                                                InputLabelProps={{ shrink: true }}
                                            />
                                        )}
                                    />
                                </Grid>

                                {selectedTimeSlot && (
                                    <Grid size={{ xs: 12 }}>
                                        <Typography variant="body2" className="font-medium mb-2 text-textPrimary">
                                            Booking Time <span className="text-error">*</span>
                                        </Typography>

                                        <Controller
                                            name="booking_time"
                                            control={control}
                                            rules={{
                                                validate: (value) =>
                                                    selectBookType !== '5' || (Array.isArray(value) && value.length > 0) || 'At least one booking time is required'
                                            }}
                                            render={({ field, fieldState: { error } }) => {
                                                const currentSelection = Array.isArray(field.value) ? field.value : []

                                                const handleToggleSlot = (slot) => {
                                                    if (currentSelection.includes(slot)) {
                                                        field.onChange(currentSelection.filter((s) => s !== slot))
                                                    } else {
                                                        field.onChange([...currentSelection, slot])
                                                    }
                                                }

                                                return (
                                                    <Box>
                                                        <Box className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                                                            {selectedTimeSlot.map((slot) => {
                                                                const isSelected = currentSelection.includes(slot)
                                                                return (
                                                                    <Button
                                                                        key={slot}
                                                                        type="button"
                                                                        variant={isSelected ? 'contained' : 'outlined'}
                                                                        color={isSelected ? 'primary' : 'secondary'}
                                                                        onClick={() => handleToggleSlot(slot)}
                                                                        className={`normal-case text-xs sm:text-sm py-2 px-1 ${isSelected
                                                                            ? '!bg-primary !text-primary-contrast'
                                                                            : '!border-action-selected !text-textSecondary hover:!border-primary'
                                                                            }`}
                                                                        sx={{
                                                                            minWidth: 'unset',
                                                                            borderRadius: '8px',
                                                                            borderColor: isSelected ? 'transparent' : 'divider'
                                                                        }}
                                                                    >
                                                                        {slot}
                                                                    </Button>
                                                                )
                                                            })}
                                                        </Box>
                                                        {error && (
                                                            <Typography variant="caption" className="text-error mt-1 block">
                                                                {error.message}
                                                            </Typography>
                                                        )}
                                                    </Box>
                                                )
                                            }}
                                        />
                                    </Grid>
                                )}
                            </>
                        )}

                        {/* Number of Persons Allowed */}
                        {selectedCurrentAmenity?.is_multiple_booking_allowed && (
                            <>
                                <Grid size={{ xs: 12 }}>
                                    <Typography variant="body2" className="text-textSecondary">
                                        No of person allowed: {selectedCurrentAmenity?.no_of_person}
                                    </Typography>
                                </Grid>

                                <Grid size={{ xs: 12 }}>
                                    <Controller
                                        name="persons_allowed"
                                        control={control}
                                        rules={{
                                            required: 'Number of persons is required',
                                            validate: (value) => {
                                                const num = Number(value);
                                                const max = Number(selectedCurrentAmenity?.no_of_person || 0);
                                                if (num > max) {
                                                    return `Number of persons cannot exceed ${max}`;
                                                }
                                                if (num <= 0) {
                                                    return 'Must be at least 1 person';
                                                }
                                                return true;
                                            }
                                        }}
                                        render={({ field, fieldState: { error } }) => (
                                            <CustomTextField
                                                {...field}
                                                type="number"
                                                fullWidth
                                                label="Number Of Person Allowed Per Booking"
                                                placeholder="Enter number of persons"
                                                required
                                                error={Boolean(error)}
                                                helperText={error?.message}
                                            />
                                        )}
                                    />
                                </Grid>
                            </>
                        )}
                    </Grid>
                </DialogContent>

                <DialogActions className="justify-center sm:pbe-16 sm:pli-16 gap-3">
                    <Button
                        variant="contained"
                        type="submit"
                        disabled={loading}
                    >
                        Save
                    </Button>
                    <Button variant="tonal" color="secondary" onClick={handleClose} className="min-w-[90px]">
                        Cancel
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    )
}

export default BookingTimeSlotDialog
