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
import { object, string, pipe, minLength, maxLength } from 'valibot'

// Auth + Toast
import { useSession } from 'next-auth/react'
import { toast } from 'react-toastify'

// Components
import CustomTextField from '@core/components/mui/TextField'
import DialogCloseButton from '../DialogCloseButton'

const schema = object({
    name: pipe(
        string(),
        minLength(1, 'Floor name is required'),
        maxLength(50, 'Floor name max length is 50')
    ),
    tower_id: string(), // required dropdown value
})

const FloorDialog = ({
    open,
    setOpen,
    fetchZoneData,
    selectedZone,
    tableData,
}) => {

    const { data: session } = useSession()
    const token = session?.user?.token
    const API_URL = process.env.NEXT_PUBLIC_API_URL

    const [createData, setCreateData] = useState([])
    const [loading, setLoading] = useState(false)

    const {
        control,
        handleSubmit,
        reset,
        setError,
        formState: { errors },
    } = useForm({
        resolver: valibotResolver(schema),
        defaultValues: {
            name: '',
            tower_id: '',
        },
    })

    // Reset when editing
    useEffect(() => {
        if (open && selectedZone) {
            reset({
                name: selectedZone.floor_name,
                tower_id: selectedZone.tower_id._id.toString() || '',
            })
        }
    }, [open, selectedZone, reset])

    const handleClose = () => {
        reset()
        setOpen(false)
    }

    // Fetch towers for dropdown
    const fetchCreateData = async () => {
        try {
            const response = await fetch(`${API_URL}/company/floor/create`, {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            })

            const value = await response.json()

            if (response.ok) {
                setCreateData(value?.data || [])
            }
        } catch (error) {
            console.error('Fetch towers error:', error)
        }
    }

    useEffect(() => {
        if (API_URL && token) {
            fetchCreateData()
        }
    }, [API_URL, token])

    // Submit
    const submitData = async (formData) => {
        // Unique validation against tableData
        if (tableData && tableData.length > 0) {
            const floorName = String(formData.name || '').replace(/\s+/g, ' ').trim().toLowerCase();
            const towerId = String(formData.tower_id || '');

            if (selectedZone) {
                // Edit mode: check for duplicates excluding current selectedZone
                const duplicate = tableData.find((item) => {
                    const itemName = String(item.floor_name || '').replace(/\s+/g, ' ').trim().toLowerCase();
                    const itemTowerId = String(item.tower_id?._id || '');
                    const itemId = String(item._id || '');

                    return itemName === floorName && itemTowerId === towerId && itemId !== String(selectedZone._id || '');
                });

                if (duplicate) {

                    setError('name', {
                        type: 'manual',
                        message: 'This floor name already exists in this tower.',
                    });

                    return;
                }
            } else {

                // Add mode: check for any duplicates
                const duplicate = tableData.some((item) => {
                    const itemName = String(item.floor_name || '').replace(/\s+/g, ' ').trim().toLowerCase();
                    const itemTowerId = String(item.tower_id?._id || '');

                    return itemName === floorName && itemTowerId === towerId;
                });

                if (duplicate) {
                    setError('name', {
                        type: 'manual',
                        message: 'Floor name must be unique in this tower.',
                    });

                    return;
                }
            }
        }

        setLoading(true)

        try {
            const url = selectedZone
                ? `${API_URL}/company/floor/${selectedZone._id}`
                : `${API_URL}/company/floor`

            const method = selectedZone ? 'PUT' : 'POST'

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(formData),
            })

            const data = await response.json()

            if (response.ok) {
                fetchZoneData?.()
                toast.success(
                    `Floor ${selectedZone ? 'updated' : 'added'} successfully!`,
                    { autoClose: 700 }
                )
                handleClose()
            } else {
                console.error('Server error:', data)
            }
        } catch (err) {
            console.error('Submit error:', err)
        } finally {
            setLoading(false)
        }
    }

    return (
        <>
            {!createData || createData.length === 0 ? (
                <>
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

                        <DialogTitle
                            variant="h4"
                            className="text-center sm:pbs-16 sm:pbe-6 sm:pli-16"
                        >
                            {selectedZone ? 'Edit Floor' : 'Add Floor'}
                        </DialogTitle>

                        <form onSubmit={handleSubmit(submitData)} noValidate>
                            <DialogContent className="overflow-visible flex flex-col gap-6 sm:pli-16">
                                <Grid container spacing={3}>

                                    <Grid item size={{ xs: 12 }}>
                                        <Skeleton variant="rectangular" height={26} />
                                    </Grid>
                                    <Grid size={{ xs: 12 }}>
                                        <Skeleton variant="rectangular" height={26} />
                                    </Grid>
                                </Grid>
                            </DialogContent>

                            <DialogActions className="justify-center sm:pbe-16 sm:pli-16">
                                <Button variant="contained" type="submit" disabled={loading}>
                                    {loading ? (
                                        <CircularProgress
                                            size={24}
                                            sx={{
                                                color: 'white',
                                                position: 'absolute',
                                                top: '50%',
                                                left: '50%',
                                                mt: '-12px',
                                                ml: '-12px',
                                            }}
                                        />
                                    ) : selectedZone ? (
                                        'Update'
                                    ) : (
                                        'Submit'
                                    )}
                                </Button>
                                <Button
                                    variant="tonal"
                                    color="secondary"
                                    onClick={handleClose}
                                >
                                    Cancel
                                </Button>
                            </DialogActions>
                        </form>
                    </Dialog>
                </>
            ) : (
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

                    <DialogTitle
                        variant="h4"
                        className="text-center sm:pbs-16 sm:pbe-6 sm:pli-16"
                    >
                        {selectedZone ? 'Edit Floor' : 'Add Floor'}
                    </DialogTitle>

                    <form onSubmit={handleSubmit(submitData)} noValidate>
                        <DialogContent className="overflow-visible flex flex-col gap-6 sm:pli-16">
                            <Grid container spacing={3}>

                                <Grid item size={{ xs: 12 }}>
                                    {/* Floor Name Input */}
                                    <Controller
                                        name="name"
                                        control={control}
                                        render={({ field }) => (
                                            <CustomTextField
                                                {...field}
                                                required
                                                label="Floor Name"
                                                placeholder="Enter floor name"
                                                fullWidth
                                                onKeyDown={(e) => {
                                                    const key = e.key

                                                    const allowedKeys = [
                                                        'Backspace',
                                                        'Tab',
                                                        'ArrowLeft',
                                                        'ArrowRight',
                                                        'Delete',
                                                        ' ',
                                                    ]

                                                    if (
                                                        !/^[a-zA-Z0-9 ]$/.test(key) &&
                                                        !allowedKeys.includes(key)
                                                    ) {
                                                        e.preventDefault()
                                                    }
                                                }}
                                                onPaste={(e) => {
                                                    const paste = e.clipboardData.getData('text')

                                                    if (!/^[a-zA-Z0-9 ]+$/.test(paste)) {
                                                        e.preventDefault()
                                                    }
                                                }}
                                                error={!!errors?.name}
                                                helperText={errors?.name?.message}
                                            />
                                        )}
                                    />
                                </Grid>
                                <Grid size={{ xs: 12 }}>
                                    {/* Tower Dropdown */}
                                    <Controller
                                        name="tower_id"
                                        control={control}
                                        render={({ field }) => (
                                            <CustomTextField
                                                {...field}
                                                select
                                                required
                                                label="Tower"
                                                placeholder="Select Tower"
                                                fullWidth
                                                error={!!errors?.tower_id}
                                                helperText={errors?.tower_id?.message}
                                            >
                                                {createData
                                                    .slice()
                                                    .sort((a, b) => a.name.localeCompare(b.name))
                                                    .map((item) => (
                                                        <MenuItem key={item._id} value={item._id}>
                                                            {item.name}
                                                        </MenuItem>
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
                                        sx={{
                                            color: 'white',
                                            position: 'absolute',
                                            top: '50%',
                                            left: '50%',
                                            mt: '-12px',
                                            ml: '-12px',
                                        }}
                                    />
                                ) : selectedZone ? (
                                    'Update'
                                ) : (
                                    'Submit'
                                )}
                            </Button>
                            <Button
                                variant="tonal"
                                color="secondary"
                                onClick={handleClose}
                            >
                                Cancel
                            </Button>
                        </DialogActions>
                    </form>
                </Dialog>
            )}
        </>
    )
}

export default FloorDialog
