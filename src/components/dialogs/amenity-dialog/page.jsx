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
    MenuItem,
    Checkbox,
    FormControlLabel
} from '@mui/material'

import Grid from '@mui/material/Grid2'

// Hook Form + Validation
import { useForm, Controller } from 'react-hook-form'
import { valibotResolver } from '@hookform/resolvers/valibot'
import { object, string, minLength, pipe, optional, boolean, forward, check } from 'valibot'

// Components
import { useSession } from 'next-auth/react'
import { toast } from 'react-toastify'

import CustomTextField from '@core/components/mui/TextField'
import DialogCloseButton from '../DialogCloseButton'

const AmenityDialog = ({ open, setOpen, selectedZone, fetchZoneData }) => {
    // Validation Schema with conditional and time-range validation
    const schema = pipe(
        object({
            amenity_name: pipe(string(), minLength(1, 'Amenity Name is required')),
            amenity_status: pipe(string(), minLength(1, 'Amenity Status is required')),
            booking_required: optional(boolean()),
            start_time: optional(string()),
            end_time: optional(string()),
            time_diffrence: optional(string()),
            multiple_bookings: optional(boolean()),
            persons_allowed: optional(string())
        }),
        forward(
            check(data => {
                if (data.booking_required) {
                    if (!data.start_time || data.start_time.trim() === '') return false
                }
                return true
            }, 'Start Time is required'),
            ['start_time']
        ),
        forward(
            check(data => {
                if (data.booking_required) {
                    if (!data.end_time || data.end_time.trim() === '') return false
                }
                return true
            }, 'End Time is required'),
            ['end_time']
        ),
        forward(
            check(data => {
                if (data.booking_required) {
                    if (!data.time_diffrence || data.time_diffrence.trim() === '') return false
                }
                return true
            }, 'Time Diffrence is required'),
            ['time_diffrence']
        ),
        forward(
            check(data => {
                if (data.booking_required && data.start_time && data.end_time) {
                    if (data.start_time > data.end_time) return false
                }
                return true
            }, 'Start time cannot be greater than end time'),
            ['start_time']
        ),
        forward(
            check(data => {
                if (data.booking_required && data.start_time && data.end_time) {
                    if (data.end_time < data.start_time) return false
                }
                return true
            }, 'End time cannot be lower than start time'),
            ['end_time']
        ),
        forward(
            check(data => {
                if (data.booking_required && data.multiple_bookings) {
                    if (!data.persons_allowed || data.persons_allowed.trim() === '') return false
                }
                return true
            }, 'Number Of Person Allowed is required'),
            ['persons_allowed']
        )
    )

    const { data: session } = useSession()
    const token = session?.user?.token
    const API_URL = process.env.NEXT_PUBLIC_API_URL

    const [loading, setLoading] = useState(false)

    const {
        control,
        handleSubmit,
        reset,
        watch,
        formState: { errors }
    } = useForm({
        resolver: valibotResolver(schema),
        defaultValues: {
            amenity_name: selectedZone?.amenity_name || '',
            amenity_status: selectedZone?.amenity_status || '',
            booking_required: selectedZone?.booking_required || false,
            start_time: selectedZone?.start_time || '',
            end_time: selectedZone?.end_time || '',
            multiple_bookings: selectedZone?.multiple_bookings || false,
            persons_allowed: selectedZone?.persons_allowed || '',
            time_diffrence: selectedZone?.time_diffrence || ''
        }
    })

    const bookingRequired = watch('booking_required')
    const multipleBookings = watch('multiple_bookings')

    useEffect(() => {
        if (selectedZone) {
            reset({
                amenity_name: selectedZone?.title || '',
                amenity_status: String(selectedZone?.status) || '',
                booking_required: selectedZone?.is_booking_required || false,
                start_time: selectedZone?.start_time || '',
                end_time: selectedZone?.end_time || '',
                multiple_bookings: selectedZone?.is_multiple_booking_allowed || false,
                persons_allowed: String(selectedZone?.no_of_person) || '',
                time_diffrence: String(selectedZone?.time_diffrence) || ''
            })
        }
    }, [selectedZone, reset])

    const handleClose = () => {
        reset()
        setOpen(false)
    }

    // Submit handler
    const submitData = async formData => {
        setLoading(true)

        try {
            const url = selectedZone
                ? `${API_URL}/company/amenity/put/data/${selectedZone._id}`
                : `${API_URL}/company/amenity/post/data`

            const method = selectedZone ? 'PUT' : 'POST'

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            })

            const data = await response.json()

            if (response.ok) {
                fetchZoneData()
                toast.success(`Amenity ${selectedZone ? 'updated' : 'added'} successfully!`, { autoClose: 700 })
                handleClose()
            } else {
                console.error('Server error:', data)
                toast.error(data?.message || 'Something went wrong')
            }
        } catch (err) {
            console.error('Submit error:', err)
            toast.error('Failed to save amenity')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog fullWidth maxWidth="md" open={open} scroll="body" sx={{ '& .MuiDialog-paper': { overflow: 'visible' } }}>
            <DialogCloseButton onClick={handleClose}>
                <i className="tabler-x" />
            </DialogCloseButton>
            <DialogTitle variant="h4" className="text-center sm:pbs-16 sm:pbe-6 sm:pli-16">
                {selectedZone ? 'Edit' : 'Add'} Amenity
            </DialogTitle>

            <form onSubmit={handleSubmit(submitData)} noValidate>
                <DialogContent className="overflow-visible flex flex-col gap-6 sm:pli-16">
                    <Grid container spacing={3}>
                        {/* Amenity Name */}
                        <Grid size={{ xs: 12 }}>
                            <Controller
                                name="amenity_name"
                                control={control}
                                render={({ field }) => (
                                    <CustomTextField
                                        {...field}
                                        fullWidth
                                        label="Amenity Name"
                                        placeholder="Enter Amenity Name"
                                        required
                                        error={!!errors?.amenity_name}
                                        helperText={errors?.amenity_name?.message}
                                    />
                                )}
                            />
                        </Grid>

                        {/* Amenity Status */}
                        <Grid size={{ xs: 12 }}>
                            <Controller
                                name="amenity_status"
                                control={control}
                                render={({ field }) => (
                                    <CustomTextField
                                        {...field}
                                        select
                                        fullWidth
                                        label="Amenity Status"
                                        required
                                        error={!!errors?.amenity_status}
                                        helperText={errors?.amenity_status?.message}
                                    >
                                        <MenuItem value="1">Available</MenuItem>
                                        <MenuItem value="2">Unavailable</MenuItem>
                                    </CustomTextField>
                                )}
                            />
                        </Grid>

                        {/* Booking Required Checkbox */}
                        <Grid size={{ xs: 12 }}>
                            <Controller
                                name="booking_required"
                                control={control}
                                render={({ field }) => (
                                    <FormControlLabel
                                        control={<Checkbox {...field} checked={field.value} />}
                                        label="Booking Required"
                                    />
                                )}
                            />
                        </Grid>

                        {/* Conditional Fields visible only when 'Booking Required' is checked */}
                        {bookingRequired && (
                            <>
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <Controller
                                        name="start_time"
                                        control={control}
                                        render={({ field }) => (
                                            <CustomTextField
                                                {...field}
                                                type="time"
                                                fullWidth
                                                label="Start Time"
                                                required
                                                InputLabelProps={{ shrink: true }}
                                                error={!!errors?.start_time}
                                                helperText={errors?.start_time?.message}
                                            />
                                        )}
                                    />
                                </Grid>

                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <Controller
                                        name="end_time"
                                        control={control}
                                        render={({ field }) => (
                                            <CustomTextField
                                                {...field}
                                                type="time"
                                                fullWidth
                                                label="End Time"
                                                required
                                                InputLabelProps={{ shrink: true }}
                                                error={!!errors?.end_time}
                                                helperText={errors?.end_time?.message}
                                            />
                                        )}
                                    />
                                </Grid>

                                <Grid size={{ xs: 12 }}>
                                    <Controller
                                        name="time_diffrence"
                                        control={control}
                                        render={({ field }) => (
                                            <CustomTextField
                                                {...field}
                                                select
                                                fullWidth
                                                label="Time Diffrence"
                                                required
                                                error={!!errors?.time_diffrence}
                                                helperText={errors?.time_diffrence?.message}
                                            >
                                                <MenuItem value="10">10 minute</MenuItem>
                                                <MenuItem value="20">20 minute</MenuItem>
                                                <MenuItem value="30">30 minute</MenuItem>
                                                <MenuItem value="40">40 minute</MenuItem>
                                                <MenuItem value="50">50 minute</MenuItem>
                                                <MenuItem value="60">60 minute</MenuItem>
                                            </CustomTextField>
                                        )}
                                    />
                                </Grid>

                                <Grid size={{ xs: 12 }}>
                                    <Controller
                                        name="multiple_bookings"
                                        control={control}
                                        render={({ field }) => (
                                            <FormControlLabel
                                                control={<Checkbox {...field} checked={field.value} />}
                                                label="Multiple Bookings Allowed"
                                            />
                                        )}
                                    />
                                </Grid>

                                {/* Number Of Person Allowed Per Booking */}
                                {multipleBookings && (
                                    <Grid size={{ xs: 12 }}>
                                        <Controller
                                            name="persons_allowed"
                                            control={control}
                                            render={({ field }) => (
                                                <CustomTextField
                                                    {...field}
                                                    type="number"
                                                    fullWidth
                                                    label="Number Of Person Allowed Per Booking"
                                                    placeholder="Enter number of persons"
                                                    required
                                                    error={!!errors?.persons_allowed}
                                                    helperText={errors?.persons_allowed?.message}
                                                />
                                            )}
                                        />
                                    </Grid>
                                )}
                            </>
                        )}
                    </Grid>
                </DialogContent>

                <DialogActions className="justify-center sm:pbe-16 sm:pli-16">
                    <Button variant="contained" type="submit" disabled={loading}>
                        {selectedZone ? 'Update' : 'Save'}
                    </Button>
                    <Button variant="tonal" color="secondary" onClick={handleClose}>
                        Cancel
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    )
}

export default AmenityDialog
