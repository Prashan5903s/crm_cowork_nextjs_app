'use client';

import React, { useEffect, useState } from 'react';

import { useSession } from 'next-auth/react';

import {
    Box,
    Typography,
    Card,
    CardContent,
    Button,
    Divider,
    List,
    Skeleton,
    ListItem,
    ListItemText,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    IconButton,
    TextField
} from '@mui/material';

import Grid from "@mui/material/Grid2"

import { Controller, useForm } from 'react-hook-form';

import { valibotResolver } from '@hookform/resolvers/valibot'

import {
    object,
    string,
    minLength,
    transform,
    maxLength,
    pipe,
    regex,
    email,
    optional,

} from 'valibot'

import { Add as AddIcon, Category, LocationOn, Edit as EditIcon } from '@mui/icons-material';

import DialogCloseButton from '@/components/dialogs/DialogCloseButton';
import { toast } from 'react-toastify';

const API_URL = process.env.NEXT_PUBLIC_API_URL

function CategoryForm({
    open,
    setOpen,
    token,
    fetchData,
    data
}) {

    const schema = object({
        name: pipe(
            string(),
            minLength(1, 'Name is required'),
            maxLength(255, 'Name can be a maximum of 255 characters')
        ),
        description: pipe(
            string(),
            minLength(1, 'Description is required'),
            maxLength(255, 'Description can be a maximum of 255 characters')
        ),
    });

    const {
        control,
        handleSubmit,
        reset,
        formState: { errors }
    } = useForm({
        resolver: valibotResolver(schema),
        defaultValues: {
            name: '',
            description: ''
        }
    });

    const onClose = () => {
        reset();
        setOpen(false);
    };

    useEffect(() => {
        if (data) {
            reset({
                name: data.name || "",
                description: data.description || ""
            });
        } else {
            reset({
                name: "",
                description: ""
            });
        }
    }, [data, reset]);

    const onSubmit = async (formData) => {
        try {

            const save_url = data ? `asset/category/put/data/${data?._id}` : `asset/category/post/data`
            const method = data ? "PUT" : "POST"

            const response = await fetch(`${API_URL}/company/${save_url}`, {
                method,
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            })

            if (response.ok) {

                toast.success('Category saved successfully', {
                    autoClose: 1000
                })

                fetchData();

                onClose();
            }

        } catch (error) {
            throw new Error(error)
        }
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="md"
            fullWidth
            sx={{
                '& .MuiDialog-paper': {
                    overflow: 'visible'
                }
            }}
        >
            <DialogTitle>
                Asset Category
            </DialogTitle>

            <DialogCloseButton onClick={onClose}>
                <i className="tabler-x" />
            </DialogCloseButton>

            <form onSubmit={handleSubmit(onSubmit)} noValidate>
                <DialogContent>
                    <Grid container spacing={2} sx={{ mt: 1 }}>

                        <Grid size={{ xs: 12 }}>
                            <Controller
                                name="name"
                                control={control}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        fullWidth
                                        required
                                        label="Category Name"
                                        error={!!errors.name}
                                        helperText={errors.name?.message}
                                    />
                                )}
                            />
                        </Grid>

                        <Grid size={{ xs: 12 }}>
                            <Controller
                                name="description"
                                control={control}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        fullWidth
                                        required
                                        multiline
                                        rows={4}
                                        label="Description"
                                        error={!!errors.description}
                                        helperText={errors.description?.message}
                                    />
                                )}
                            />
                        </Grid>

                    </Grid>
                </DialogContent>

                <DialogActions sx={{ justifyContent: "center" }}>
                    <Button
                        type="submit"
                        variant="contained"
                    >
                        Save
                    </Button>

                    <Button
                        type="button"
                        onClick={onClose}
                    >
                        Cancel
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    );
}

function LocationForm({
    open,
    setOpen,
    location,
    token,
    fetchData,
    data
}) {

    const schema = object({
        name: pipe(
            string(),
            minLength(1, "Name is required"),
            maxLength(100, "Name can be a maximum of 100 characters")
        ),
        description: pipe(
            string(),
            minLength(1, "Description is required"),
            maxLength(255, "Description can be a maximum of 255 characters")
        )
    });

    const {
        control,
        handleSubmit,
        reset,
        formState: { errors }
    } = useForm({
        resolver: valibotResolver(schema),
        defaultValues: {
            name: "",
            description: ""
        }
    });

    useEffect(() => {
        if (data) {
            reset({
                name: data.name || "",
                description: data.description || ""
            });
        } else {
            reset({
                name: "",
                description: ""
            });
        }
    }, [data, reset]);

    const onClose = () => {
        reset();
        setOpen(false);
    };

    const onSubmit = async (formData) => {
        try {
            const save_url = data
                ? `asset/location/put/data/${data._id}`
                : `asset/location/post/data`;

            const method = data ? "PUT" : "POST";

            const response = await fetch(`${API_URL}/company/${save_url}`, {
                method,
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                toast.success(
                    data
                        ? "Location updated successfully"
                        : "Location created successfully",
                    {
                        autoClose: 1000
                    }
                );

                fetchData()

                onClose();
            }
        } catch (error) {
            console.error(error);
            toast.error("Something went wrong");
        }
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="md"
            fullWidth
            sx={{
                "& .MuiDialog-paper": {
                    overflow: "visible"
                }
            }}
        >
            <DialogTitle>
                {data ? "Edit Location" : "Add Location"}
            </DialogTitle>

            <DialogCloseButton onClick={onClose}>
                <i className="tabler-x" />
            </DialogCloseButton>

            <form onSubmit={handleSubmit(onSubmit)} noValidate>
                <DialogContent>
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid size={{ xs: 12, }}>
                            <Controller
                                name="name"
                                control={control}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        fullWidth
                                        required
                                        label="Location name"
                                        error={!!errors.name}
                                        helperText={errors.name?.message}
                                    />
                                )}
                            />
                        </Grid>

                        <Grid size={{ xs: 12 }}>
                            <Controller
                                name="description"
                                control={control}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        fullWidth
                                        multiline
                                        rows={4}
                                        label="Description"
                                        error={!!errors.description}
                                        helperText={errors.description?.message}
                                    />
                                )}
                            />
                        </Grid>
                    </Grid>
                </DialogContent>

                <DialogActions sx={{ justifyContent: "center" }}>
                    <Button type="submit" variant="contained">
                        {data ? "Update" : "Save"}
                    </Button>

                    <Button type="button" onClick={onClose}>
                        Cancel
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    );
}

export default function MastersPage() {

    const { data: session } = useSession()
    const token = session?.user?.token

    const [openDialogCategory, setOpenDialogCategory] = useState(false)
    const [openLocatinCategory, setOpenLocationCategory] = useState(false)

    const [selectedCategory, setSelectedCategory] = useState(null);
    const [selectedLocation, setSelectedLocation] = useState(null);

    const [loading, setLoading] = useState(true);

    const [data, setData] = useState()

    const fetchData = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${API_URL}/company/location-category/log/data`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            })

            const result = await response.json();

            if (response.ok) {

                setData(result?.data)
            }

        } catch (error) {
            throw new Error(error)
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        if (API_URL && token) {
            fetchData()
        }
    }, [API_URL, token])

    if (loading) {

        return (
            [...Array(5)].map((_, index) => (
                <ListItem key={index}>
                    <ListItemText
                        primary={
                            <Skeleton
                                variant="text"
                                width="45%"
                                height={28}
                            />
                        }
                        secondary={
                            <Skeleton
                                variant="text"
                                width="85%"
                                height={20}
                            />
                        }
                    />
                </ListItem>
            ))
        )
    }

    return (
        <Box sx={{ p: 3, bgcolor: '#f8f9fa', minHeight: '100vh' }}>
            <Typography variant="h4" fontWeight="bold" mb={3}>Asset Master Setup</Typography>

            <Grid container spacing={3}>
                {/* Categories Section */}
                <Grid item size={{ xs: 12, md: 6 }}>
                    <Card elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2, height: '100%' }}>
                        <CardContent>
                            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                                <Typography variant="h6" fontWeight="bold"><Category sx={{ mr: 1, verticalAlign: 'middle' }} /> Categories</Typography>
                                <Button size="small" variant="outlined" startIcon={<AddIcon />} onClick={() => {
                                    setSelectedCategory();
                                    setOpenDialogCategory(true)
                                }}>Add Category</Button>
                            </Box>
                            <Divider sx={{ mb: 2 }} />
                            <List>
                                {data?.category?.length == 0 ? (
                                    <Typography>
                                        No data found
                                    </Typography>
                                ) : data?.category?.map((cat) => (
                                    <ListItem
                                        key={cat._id}
                                        sx={{ borderBottom: "1px solid #f1f5f9" }}
                                        secondaryAction={
                                            <IconButton
                                                color="primary"
                                                onClick={() => {
                                                    setSelectedCategory(cat);
                                                    setOpenDialogCategory(true);
                                                }}
                                            >
                                                <EditIcon />
                                            </IconButton>
                                        }
                                    >
                                        <ListItemText
                                            primary={cat.name}
                                            secondary={cat.description}
                                        />
                                    </ListItem>
                                ))}
                            </List>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Locations Section */}
                <Grid item size={{ xs: 12, md: 6 }}>
                    <Card elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2, height: '100%' }}>
                        <CardContent>
                            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                                <Typography variant="h6" fontWeight="bold"><LocationOn sx={{ mr: 1, verticalAlign: 'middle' }} /> Locations</Typography>
                                <Button size="small" variant="outlined" startIcon={<AddIcon />} onClick={() => {
                                    setSelectedLocation()
                                    setOpenLocationCategory(true)
                                }}>Add Location</Button>
                            </Box>
                            <Divider sx={{ mb: 2 }} />
                            <List>
                                {data?.location?.length == 0 ? (
                                    <Typography>
                                        No data found
                                    </Typography>
                                ) : data?.location?.map((loc) => (
                                    <ListItem
                                        key={loc._id}
                                        sx={{ borderBottom: "1px solid #f1f5f9" }}
                                        secondaryAction={
                                            <IconButton
                                                color="primary"
                                                onClick={() => {
                                                    setSelectedLocation(loc);
                                                    setOpenLocationCategory(true);
                                                }}
                                            >
                                                <EditIcon />
                                            </IconButton>
                                        }
                                    >
                                        <ListItemText
                                            primary={loc.name}
                                            secondary={loc.description}
                                        />
                                    </ListItem>
                                ))}
                            </List>
                        </CardContent>
                    </Card>
                </Grid>
                <CategoryForm
                    open={openDialogCategory}
                    setOpen={(value) => {
                        setOpenDialogCategory(value);

                        if (!value) {
                            setSelectedCategory(null);
                        }
                    }}
                    category={selectedCategory}
                    token={token}
                    data={selectedCategory}
                    fetchData={fetchData}
                />
                <LocationForm
                    open={openLocatinCategory}
                    setOpen={(value) => {
                        setOpenLocationCategory(value);

                        if (!value) {
                            setSelectedLocation(null);
                        }
                    }}
                    location={selectedLocation}
                    token={token}
                    data={selectedLocation}
                    fetchData={fetchData}
                />
            </Grid>
        </Box>
    );
}
