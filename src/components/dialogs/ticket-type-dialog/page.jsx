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
} from '@mui/material'

import Grid from '@mui/material/Grid2';

// Hook Form + Validation
import { useForm, useFieldArray, Controller } from 'react-hook-form'
import { valibotResolver } from '@hookform/resolvers/valibot'
import {
    object,
    string,
    array,
    pipe,
    minLength,
    maxLength,
    regex
} from 'valibot'

// Components

import { useSession } from 'next-auth/react'

import { toast } from 'react-toastify'

import CustomTextField from '@core/components/mui/TextField'
import DialogCloseButton from '../DialogCloseButton'

const schema = object({
    name: pipe(string(), minLength(1, 'Ticket type name is required'), maxLength(50, 'Ticket type name max length is 50'))
})

const TicketDialog = ({ open, setOpen, title = '', fetchZoneData, selectedZone, typeForm, tableData }) => {

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
            name: ''
        }
    })

    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (open && selectedZone) {

            reset({ name: selectedZone.name })
        }
    }, [open, selectedZone])

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
                ? `${API_URL}/company/ticket-type/${selectedZone._id}`
                : `${API_URL}/company/ticket-type`

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
                toast.success(`Ticket type ${selectedZone ? 'updated' : 'added'} successfully!`, {
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
                {selectedZone ? 'Edit Ticket Type' : 'Add Ticket Type'}
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
                                    label="Ticket Type Name"
                                    placeholder="Enter ticket type name"
                                    fullWidth
                                    onKeyDown={(e) => {
                                        const key = e.key;
                                        const allowedKeys = ['Backspace', 'Tab', 'ArrowLeft', 'ArrowRight', 'Delete', ' ']; // include space

                                        // Allow A-Z, a-z, and space
                                        if (!/^[a-zA-Z0-9 ]$/.test(key) && !allowedKeys.includes(key)) {
                                            e.preventDefault();
                                        }

                                    }}

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

export default TicketDialog
