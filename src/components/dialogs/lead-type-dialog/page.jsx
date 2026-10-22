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

const schema = object({
    name: pipe(
        string(),
        minLength(1, 'Lead Type  name is required'),
        maxLength(50, 'Lead Type  name max length is 50')
    ),
})

const LeadSourceDialog = ({ open, setOpen, title = '', fetchZoneData, selectedZone, typeForm, tableData }) => {

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
        }
    })

    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (open && selectedZone) {
            reset({
                name: selectedZone.name || '',
            })
        } else if (open && !selectedZone) {
            reset({
                name: '',
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
                        message: 'Zone name must be unique.'
                    });
                    hasError = true;
                }

                if (hasError) return;
            }
        }

        setLoading(true)

        try {
            const url = selectedZone
                ? `${API_URL}/company/lead-type/${selectedZone._id}`
                : `${API_URL}/company/lead-type `

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
                toast.success(`Lead Type  ${selectedZone ? 'updated' : 'added'} successfully!`, {
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
                {selectedZone ? 'Edit Lead Type ' : 'Add Lead Type '}
            </DialogTitle>

            <form onSubmit={handleSubmit(submitData)} noValidate>
                <DialogContent className="overflow-visible flex flex-col gap-6 sm:pli-16">
                    <Grid item size={{ xs: 12, md: 11 }} >
                        <Controller
                            name={`name`}
                            control={control}
                            render={({ field }) => (
                                <CustomTextField
                                    {...field}
                                    required
                                    label="Lead Type  Name"
                                    placeholder="Enter Lead Type  name"
                                    fullWidth

                                    onPaste={(e) => {
                                        const paste = e.clipboardData.getData('text');

                                        // Allow paste if it only contains letters and spaces
                                        if (!/^[a-zA-Z ]+$/.test(paste)) {
                                            e.preventDefault();
                                        }
                                    }}
                                    error={!!errors?.name}
                                    helperText={errors?.name?.message}
                                />
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

export default LeadSourceDialog
