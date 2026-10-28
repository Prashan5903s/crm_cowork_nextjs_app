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
    TextField
} from '@mui/material'

import Grid from '@mui/material/Grid2';

// Hook Form + Validation
import { useForm, Controller } from 'react-hook-form'
import { valibotResolver } from '@hookform/resolvers/valibot'

import {
    object,
    string,
    pipe,
    minLength,
    maxLength,
} from 'valibot'

// Components

import { useSession } from 'next-auth/react'

import { toast } from 'react-toastify'

import CustomTextField from '@core/components/mui/TextField'
import DialogCloseButton from '../DialogCloseButton'

const colorOptions = [
    { label: 'Blue', value: '#60A5FA' },
    { label: 'Primary Blue', value: '#3B82F6' },
    { label: 'Red', value: '#EF4444' },
    { label: 'Green', value: '#10B981' },
    { label: 'Dark Red', value: '#DC2626' },
    { label: 'Gray', value: '#6B7280' }
]

const statusOptions = [
    { label: 'Open', value: 'Open' },
    { label: 'Contacted', value: 'Contacted' },
    { label: 'Qualified', value: 'Qualified' },
    { label: 'Unqualified', value: 'Unqualified' },
    { label: 'Lost', value: 'Lost' },
    { label: 'Converted', value: 'Converted' }
]

const schema = object({
    name: pipe(
        string(),
        minLength(1, 'Lead status name is required'),
        maxLength(50, 'Lead status name max length is 50')
    ),
    color: pipe(
        string(),
        minLength(1, 'Color is required')
    )
})

const LeadStatusDialog = ({ open, setOpen, title = '', fetchZoneData, selectedZone, typeForm, tableData }) => {

    const { data: session } = useSession()
    const token = session?.user?.token
    const API_URL = process.env.NEXT_PUBLIC_API_URL

    const {
        control,
        handleSubmit,
        reset,
        setError,
        formState: { errors }
    } = useForm({
        resolver: valibotResolver(schema),
        defaultValues: {
            name: '',
            color: ''
        }
    })

    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (open && selectedZone) {
            reset({
                name: selectedZone.name || '',
                color: selectedZone.color || ''
            })
        } else if (open && !selectedZone) {
            reset({
                name: '',
                color: ''
            })
        }
    }, [open, selectedZone, reset])

    const handleClose = () => {
        reset()
        setOpen(false)
    }

    const submitData = async (formData) => {

        if (tableData && tableData.length > 0) {
            let hasError = false;


            if (selectedZone) {
                const exist = tableData.find(item =>
                    item.name.trim().toLowerCase() === formData.name.trim().toLowerCase() &&
                    item._id.toString().trim() !== selectedZone._id.toString().trim()
                );

                if (exist) {
                    setError('name', {
                        type: 'manual',
                        message: 'This name already exists.'
                    });

                    return;
                }
            } else {

                const name = formData?.name?.trim();

                if (!name) return; // Skip empty names (optional)

                const existsInTable = tableData.some(zoneInTable =>
                    zoneInTable.name.trim().toLowerCase() == name.trim().toLowerCase()
                );

                if (existsInTable) {
                    setError(`name`, {
                        type: 'manual',
                        message: 'Lead status name must be unique.'
                    });
                    hasError = true;
                }

                if (hasError) return;
            }
        }

        setLoading(true)

        try {
            const url = selectedZone
                ? `${API_URL}/company/lead-status/${selectedZone._id}`
                : `${API_URL}/company/lead-status`

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
                fetchZoneData?.()
                toast.success(`Lead status ${selectedZone ? 'updated' : 'added'} successfully!`, {
                    autoClose: 700
                })
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
                {selectedZone ? 'Edit Lead status' : 'Add Lead status'}
            </DialogTitle>

            <form onSubmit={handleSubmit(submitData)} noValidate>
                <DialogContent className="overflow-visible flex flex-col gap-6 sm:pli-16">
                    <Grid size={{ xs: 12, md: 11 }}>
                        <Controller
                            name="name"
                            control={control}
                            render={({ field }) => (
                                <TextField
                                    {...field}
                                    select
                                    required
                                    fullWidth
                                    label="Name"
                                    placeholder="Select Name"
                                    error={!!errors?.name}
                                    helperText={errors?.name?.message}
                                >
                                    {statusOptions?.map((option) => (
                                        <MenuItem
                                            key={option.value}
                                            value={option.value}
                                        >
                                            <div className="flex items-center gap-3">
                                                <span>{option.label}</span>
                                            </div>
                                        </MenuItem>
                                    ))}
                                </TextField>
                            )}
                        />
                    </Grid>

                    <Grid size={{ xs: 12, md: 11 }}>
                        <Controller
                            name="color"
                            control={control}
                            render={({ field }) => (
                                <TextField
                                    {...field}
                                    select
                                    required
                                    fullWidth
                                    label="Color"
                                    placeholder="Select color"
                                    error={!!errors?.color}
                                    helperText={errors?.color?.message}
                                >
                                    {colorOptions.map((option) => (
                                        <MenuItem
                                            key={option.value}
                                            value={option.value}
                                        >
                                            <div className="flex items-center gap-3">
                                                <span
                                                    style={{
                                                        width: 18,
                                                        height: 18,
                                                        borderRadius: '4px',
                                                        backgroundColor: option.value,
                                                        border: '1px solid #d1d5db',
                                                        display: 'inline-block',
                                                        flexShrink: 0
                                                    }}
                                                />
                                                <span>{option.label}</span>
                                                <span className="text-gray-500 text-sm">
                                                    {option.value}
                                                </span>
                                            </div>
                                        </MenuItem>
                                    ))}
                                </TextField>
                            )}
                        />
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
                        ) : selectedZone ? 'Update' : 'Submit'}
                    </Button>
                    <Button variant="tonal" color="secondary" onClick={handleClose}>
                        Cancel
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    )
}

export default LeadStatusDialog
