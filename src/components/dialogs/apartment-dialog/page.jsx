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
    CircularProgress,
    MenuItem,
    Skeleton
} from '@mui/material'
import Grid from '@mui/material/Grid2'

// Hook Form + Validation
import { useForm, Controller } from 'react-hook-form'
import { valibotResolver } from '@hookform/resolvers/valibot'
import { object, string, number, minLength, pipe, optional } from 'valibot'

import { useSession } from 'next-auth/react'

import { toast } from 'react-toastify'

import CustomTextField from '@core/components/mui/TextField'

import DialogCloseButton from '../DialogCloseButton'

// ✅ Validation Schema
const schema = object({
    tower: pipe(string(), minLength(1, 'Tower is required')),
    floor: pipe(string(), minLength(1, 'Floor is required')),
    apartmentNumber: pipe(string(), minLength(1, 'Apartment number is required')),
    area: pipe(string(), minLength(1, 'Area is required')), // keep as string since input type="number"
    apartmentType: pipe(string(), minLength(1, 'Apartment type is required')),
    status: optional(string()),

    // tower & parkingCode removed from schema since no input fields exist
})

const ApartmentDialog = ({ open, setOpen, selectedZone, fetchZoneData, tableData }) => {

    const { data: session } = useSession()
    const token = session?.user?.token
    const API_URL = process.env.NEXT_PUBLIC_API_URL

    const [createData, setCreateData] = useState([])
    const [loading, setLoading] = useState(false)
    const [towerId, setTowerId] = useState();
    const [floor, setFloor] = useState();

    const {
        control,
        handleSubmit,
        reset,
        setError,
        formState: { errors }
    } = useForm({
        resolver: valibotResolver(schema),
        defaultValues: {
            tower: '',
            floor: '',
            apartmentNumber: '',
            area: '',
            apartmentType: '',
            status: 'inactive'
        }
    })

    useEffect(() => {
        if (createData && towerId) {
            const floor = createData?.towers?.find(item => item._id == towerId);

            setFloor(floor?.floors)
        }
    }, [createData, towerId]);

    // ✅ Reset form when editing
    useEffect(() => {
        if (open && selectedZone) {

            setTowerId(selectedZone?.tower_id?._id.toString())
            reset({
                tower: selectedZone?.tower_id?._id.toString() || '',
                floor: selectedZone?.floor_id?._id.toString() || '',
                apartmentNumber: selectedZone?.apartment_no.toString() || '',
                apartmentType: selectedZone?.apartment_type?._id || '',
                area: selectedZone?.apartment_area?.toString() || '',
                status: selectedZone?.status ? 'active' : 'inactive'
            })
        }
    }, [open, selectedZone, reset])

    const handleClose = () => {
        reset()
        setOpen(false)
    }

    // ✅ Fetch floors on mount
    useEffect(() => {
        let ignore = false

        const fetchCreateData = async () => {
            try {
                const response = await fetch(`${API_URL}/company/apartment/create`, {
                    method: 'GET',
                    headers: { Authorization: `Bearer ${token}` }
                })

                const result = await response.json()

                if (response.ok && !ignore) {
                    setCreateData(result?.data || [])
                }
            } catch (error) {
                console.error('Error fetching floors', error)
            }
        }

        if (API_URL && token) {
            fetchCreateData()
        }

        return () => {
            ignore = true
        }
    }, [API_URL, token])

    // ✅ Submit handler
    const submitData = async (formData) => {

        if (tableData && tableData.length > 0) {
            const apartmentNo = String(formData.apartmentNumber || '').replace(/\s+/g, ' ').trim().toLowerCase();
            const towerId = String(formData.tower || '');
            const floorId = String(formData.floor || '');

            if (selectedZone) {
                // Edit mode: check for duplicates excluding the current selectedZone
                const duplicate = tableData.find((item) => {
                    const itemApartment = String(item.apartment_no || '').replace(/\s+/g, ' ').trim().toLowerCase();
                    const itemTower = String(item.tower_id?._id || '');
                    const itemFloor = String(item.floor_id?._id || '');
                    const itemId = String(item._id || '');

                    return (
                        itemApartment === apartmentNo &&
                        itemTower === towerId &&
                        itemFloor === floorId &&
                        itemId !== String(selectedZone._id || '')
                    );
                });

                if (duplicate) {
                    setError('apartmentNumber', {
                        type: 'manual',
                        message: 'This apartment number already exists on this floor.',
                    });

                    return;
                }
            } else {
                // Add mode: check for any duplicates
                const duplicate = tableData.some((item) => {
                    const itemApartment = String(item.apartment_no || '').replace(/\s+/g, ' ').trim().toLowerCase();
                    const itemTower = String(item.tower_id?._id || '');
                    const itemFloor = String(item.floor_id?._id || '');

                    return (
                        itemApartment === apartmentNo &&
                        itemTower === towerId &&
                        itemFloor === floorId
                    );
                });

                if (duplicate) {
                    setError('apartmentNumber', {
                        type: 'manual',
                        message: 'This apartment number already exists on this floor.',
                    });

                    return;
                }
            }
        }

        setLoading(true)

        try {
            const url = selectedZone
                ? `${API_URL}/company/apartment/${selectedZone._id}`
                : `${API_URL}/company/apartment`

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
                toast.success(`Apartment ${selectedZone ? 'updated' : 'added'} successfully!`, { autoClose: 700 })
                handleClose()
            } else {
                console.error('Server error:', data)
                toast.error(data?.message || 'Something went wrong')
            }
        } catch (err) {
            console.error('Submit error:', err)
            toast.error('Failed to save apartment')
        } finally {
            setLoading(false)
        }
    }

    if (!createData) {
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
                    {selectedZone ? 'Edit Apartment' : 'Add Apartment'}
                </DialogTitle>

                <DialogContent className="overflow-visible flex flex-col gap-6 sm:pli-16">
                    <Grid container spacing={3}>
                        {/* Show skeleton loaders instead of crashing */}
                        <Grid size={{ xs: 12 }}>
                            <Skeleton variant="rectangular" height={26} />
                        </Grid>
                        <Grid size={{ xs: 12 }}>
                            <Skeleton variant="rectangular" height={26} />
                        </Grid>
                        <Grid size={{ xs: 12 }}>
                            <Skeleton variant="rectangular" height={26} />
                        </Grid>
                    </Grid>
                </DialogContent>
            </Dialog>
        )
    }


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
                {selectedZone ? 'Edit Apartment' : 'Add Apartment'}
            </DialogTitle>

            <form onSubmit={handleSubmit(submitData)} noValidate>
                <DialogContent className="overflow-visible flex flex-col gap-6 sm:pli-16">
                    <Grid container spacing={3}>
                        {/* Tower */}
                        <Grid size={{ xs: 12 }}>
                            <Controller
                                name="tower"
                                control={control}
                                render={({ field }) => (
                                    <CustomTextField
                                        {...field}
                                        select
                                        fullWidth
                                        label="Select tower"
                                        required
                                        onChange={(e) => {
                                            field.onChange(e); // update RHF form state
                                            setTowerId(e.target.value); // update local state
                                        }}
                                        error={!!errors?.tower}
                                        helperText={errors?.tower?.message}
                                    >
                                        <MenuItem value="">Select Tower</MenuItem>
                                        {createData && createData?.towers?.slice()
                                            .sort((a, b) => a.name.localeCompare(b.name))
                                            .map((item) => (
                                                <MenuItem key={item._id} value={item._id}>
                                                    {item.name ?? 'Unnamed Tower'}
                                                </MenuItem>
                                            ))}
                                    </CustomTextField>
                                )}
                            />
                        </Grid>
                        {/* Floor */}
                        {floor && (
                            <Grid size={{ xs: 12 }}>
                                <Controller
                                    name="floor"
                                    control={control}
                                    render={({ field }) => (
                                        <CustomTextField
                                            {...field}
                                            select
                                            fullWidth
                                            label="Select Floor"
                                            required
                                            error={!!errors?.floor}
                                            helperText={errors?.floor?.message}
                                        >
                                            <MenuItem value="">Select Floor</MenuItem>
                                            {floor
                                                .slice()
                                                .sort((a, b) => a.floor_name.localeCompare(b.floor_name))
                                                .map((item) => (
                                                    <MenuItem key={item._id} value={item._id}>
                                                        {item.floor_name ?? 'Unnamed Floor'}
                                                    </MenuItem>
                                                ))}
                                        </CustomTextField>
                                    )}
                                />
                            </Grid>
                        )}

                        {/* Apartment Number */}
                        <Grid size={{ xs: 12 }}>
                            <Controller
                                name="apartmentNumber"
                                control={control}
                                render={({ field }) => (
                                    <CustomTextField
                                        {...field}
                                        fullWidth
                                        required
                                        label="Apartment Number"
                                        placeholder="Enter apartment number"
                                        error={!!errors?.apartmentNumber}
                                        helperText={errors?.apartmentNumber?.message}
                                    />
                                )}
                            />
                        </Grid>

                        {/* Area */}
                        <Grid size={{ xs: 12 }}>
                            <Controller
                                name="area"
                                control={control}
                                render={({ field }) => (
                                    <CustomTextField
                                        {...field}
                                        fullWidth
                                        type="number"
                                        required
                                        label="Apartment Area (sqft)"
                                        placeholder="Enter area in sqft"
                                        error={!!errors?.area}
                                        helperText={errors?.area?.message}
                                    />
                                )}
                            />
                        </Grid>

                        {/* Apartment Type */}
                        <Grid size={{ xs: 12 }}>
                            <Controller
                                name="apartmentType"
                                control={control}
                                render={({ field }) => (
                                    <CustomTextField
                                        {...field}
                                        select
                                        fullWidth
                                        label="Apartment Type"
                                        required
                                        error={!!errors?.apartmentType}
                                        helperText={errors?.apartmentType?.message}
                                    >
                                        <MenuItem value="" disabled>Select Apartment Type</MenuItem>
                                        {createData && createData?.apartmentType?.map((item, index) => (
                                            <MenuItem key={index} value={item._id}>{item.name}</MenuItem>
                                        ))}
                                    </CustomTextField>
                                )}
                            />
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

export default ApartmentDialog
