'use client';

import React, { useEffect, useState } from 'react';

import { useSession } from 'next-auth/react';

import {
    Box,
    Typography,
    Paper,
    Table,
    TableBody,
    TableCell,
    TablePagination,
    TableContainer,
    TableHead,
    TableRow,
    Chip,
    Button,
    Stack,
    Dialog,
    TextField,
    MenuItem,
    Skeleton,
    IconButton,
    Divider,
    DialogContent,
    DialogTitle,
    DialogActions
} from '@mui/material';

import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { valibotResolver } from '@hookform/resolvers/valibot';
import { object, string, array, boolean, pipe, minLength } from 'valibot';

import AddIcon from '@mui/icons-material/Add';

import DeleteIcon from '@mui/icons-material/Delete';

import DialogCloseButton from '@/components/dialogs/DialogCloseButton';
import { toast } from 'react-toastify';

const API_URL = process.env.NEXT_PUBLIC_API_URL

// Valibot schema for the Inspection Template
const InspectionTemplateSchema = object({
    name: pipe(
        string(),
        minLength(1, "Template Name is required")
    ),
    category: pipe(
        string(),
        minLength(1, "Asset Category is required")
    ),
    checklist: array(
        object({
            title: pipe(
                string(),
                minLength(1, "Question title is required")
            ),
            type: pipe(
                string(),
                minLength(1, "Type is required")
            ),
            required: boolean()
        })
    )
});

const InspectionTemplatePage = ({ open, setOpen, data, selectedInspection, token, fetchData }) => {

    const {
        control,
        handleSubmit,
        reset,
        formState: { errors, isSubmitting }
    } = useForm({
        resolver: valibotResolver(InspectionTemplateSchema),
        defaultValues: {
            name: '',
            category: '',
            checklist: [{ title: '', type: 'boolean', required: true }]
        }
    });

    const { fields, append, remove } = useFieldArray({
        control,
        name: "checklist"
    });

    const handleClose = () => {
        reset();
        setOpen(false);
    };

    useEffect(() => {
        if (open) {
            if (selectedInspection) {
                reset({ ...selectedInspection, category: selectedInspection?.category?._id ?? "" })
            } else {
                reset()
            }
        }
    }, [open, selectedInspection])

    const handleSaveTemplate = async (data) => {
        try {


            const save_url = selectedInspection ? `inspection/template/update/data/${selectedInspection?._id}` : `inspection/template/save/data`
            const method = selectedInspection ? "PUT" : "POST"

            const response = await fetch(`${API_URL}/company/${save_url}`, {
                method,
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(data)
            })

            if (response.ok) {

                toast.success("Template saved successfully", {
                    autoClose: 1000
                })

                fetchData()
                handleClose()

            }

        } catch (error) {
            throw new Error(error)
        }
    };

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            maxWidth="lg"
            fullWidth
            sx={{
                '& .MuiDialog-paper': {
                    overflow: 'visible',
                    display: 'flex',
                    flexDirection: 'column',
                    maxHeight: '90vh'
                }
            }}
        >
            <DialogTitle>{selectedInspection ? "Edit" : "Add"} Inspection Template</DialogTitle>
            <DialogCloseButton onClick={handleClose}><i className='tabler-x' /></DialogCloseButton>

            <DialogContent>
                <Box
                    component="form"
                    id="inspection-template-form"
                    onSubmit={handleSubmit(handleSaveTemplate)}
                    sx={{ mt: 1 }}
                >
                    <Controller
                        name="name"
                        control={control}
                        render={({ field }) => (
                            <TextField
                                {...field}
                                fullWidth
                                label="Template Name"
                                error={!!errors.name}
                                helperText={errors.name?.message}
                                sx={{ mb: 2 }}
                            />
                        )}
                    />

                    <Controller
                        name="category"
                        control={control}
                        render={({ field }) => (
                            <TextField
                                {...field}
                                select
                                fullWidth
                                label="Asset Category"
                                error={!!errors.category}
                                helperText={errors.category?.message}
                                sx={{ mb: 3 }}
                            >
                                {data?.category.map((cat) => (
                                    <MenuItem key={cat._id} value={cat._id}>{cat.name}</MenuItem>
                                ))}
                            </TextField>
                        )}
                    />

                    <Divider sx={{ mb: 2 }} />

                    <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                        <Typography variant="subtitle1" fontWeight="bold">Checklist Questions</Typography>
                        <Button
                            size="small"
                            startIcon={<AddIcon />}
                            onClick={() => append({ title: '', type: 'text', required: true })}
                            variant="outlined"
                        >
                            Add Question
                        </Button>
                    </Stack>

                    {fields.map((item, index) => (
                        <Stack key={item.id} direction="row" spacing={1} alignItems="center" mb={2}>
                            <Controller
                                name={`checklist.${index}.title`}
                                control={control}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        label={`Question ${index + 1}`}
                                        error={!!errors.checklist?.[index]?.title}
                                        helperText={errors.checklist?.[index]?.title?.message}
                                        fullWidth
                                        size="small"
                                    />
                                )}
                            />

                            <Controller
                                name={`checklist.${index}.type`}
                                control={control}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        select
                                        label="Type"
                                        size="small"
                                        sx={{ minWidth: 130 }}
                                    >
                                        <MenuItem value="text">Text</MenuItem>
                                        <MenuItem value="number">Number</MenuItem>
                                        <MenuItem value="boolean">Boolean</MenuItem>
                                        <MenuItem value="date">Date</MenuItem>
                                    </TextField>
                                )}
                            />

                            <IconButton
                                color="error"
                                onClick={() => remove(index)}
                                disabled={fields.length === 1}
                            >
                                <DeleteIcon />
                            </IconButton>
                        </Stack>
                    ))}
                </Box>
            </DialogContent>

            <DialogActions sx={{ display: "flex", justifyContent: "center", pb: 2, mb: "9px" }}>
                <Button
                    type="submit"
                    form="inspection-template-form"
                    variant="contained"
                    disabled={isSubmitting}
                >
                    Save Template
                </Button>
                <Button variant="outlined" onClick={handleClose}>Cancel</Button>
            </DialogActions>
        </Dialog>
    );
};

export default function InspectionsPage() {

    const { data: session } = useSession()
    const token = session?.user?.token

    const [openModal, setOpenModal] = useState(false);
    const [data, setData] = useState()
    const [selectedInspection, setSelectedInspection] = useState()

    const [loading, setLoading] = useState(true);

    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    const fetchData = async () => {
        try {

            setLoading(true)

            const response = await fetch(`${API_URL}/company/inspection/template/data`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            })

            const value = await response.json();

            if (response.ok) {

                setData(value?.data)
            }
        } catch (error) {
            throw new Error(error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (API_URL && token) {

            fetchData()
        }
    }, [API_URL, token])

    const paginatedInspection =
        data?.inspection?.slice(
            page * rowsPerPage,
            page * rowsPerPage + rowsPerPage
        ) || [];

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    return (
        <Box sx={{ p: 3, bgcolor: '#f8f9fa', minHeight: '100vh' }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={4}>
                <Typography variant="h4" fontWeight="bold">Inspection Template</Typography>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => {

                        setSelectedInspection()
                        setOpenModal(true)
                    }}
                >
                    Create Template
                </Button>
            </Stack>

            <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2 }}>
                <Table>
                    <TableHead sx={{ bgcolor: '#f1f5f9' }}>
                        <TableRow>
                            <TableCell sx={{ fontWeight: 'bold' }}>Template Name</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Category</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Questions Count</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Types Included</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Action</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loading ? (
                            [...Array(rowsPerPage)].map((_, index) => (
                                <TableRow key={index}>
                                    <TableCell><Skeleton width="80%" /></TableCell>
                                    <TableCell><Skeleton width="70%" /></TableCell>
                                    <TableCell><Skeleton width="50%" /></TableCell>
                                    <TableCell>
                                        <Stack direction="row" spacing={1}>
                                            <Skeleton
                                                variant="rounded"
                                                width={70}
                                                height={24}
                                            />
                                            <Skeleton
                                                variant="rounded"
                                                width={70}
                                                height={24}
                                            />
                                        </Stack>
                                    </TableCell>
                                    <TableCell>
                                        <Skeleton
                                            variant="circular"
                                            width={24}
                                            height={24}
                                        />
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : paginatedInspection.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} align="center">
                                    <Typography sx={{ py: 3 }}>
                                        No Data Found
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        ) : (
                            paginatedInspection.map((insp) => (
                                <TableRow key={insp._id}>
                                    <TableCell sx={{ fontWeight: 500 }}>
                                        {insp.name}
                                    </TableCell>

                                    <TableCell>{insp.category?.name}</TableCell>

                                    <TableCell>
                                        {insp.checklist?.length || 0} items
                                    </TableCell>

                                    <TableCell>
                                        <Stack
                                            direction="row"
                                            spacing={1}
                                            flexWrap="wrap"
                                            useFlexGap
                                        >
                                            {insp.checklist?.map((item, idx) => (
                                                <Chip
                                                    key={idx}
                                                    label={`${item.title} (${item.type})`}
                                                    size="small"
                                                    variant="outlined"
                                                />
                                            ))}
                                        </Stack>
                                    </TableCell>

                                    <TableCell>
                                        <i
                                            className="tabler-edit"
                                            style={{ cursor: "pointer" }}
                                            onClick={() => {
                                                setSelectedInspection(insp);
                                                setOpenModal(true);
                                            }}
                                        />
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
                <TablePagination
                    component="div"
                    count={data?.inspection?.length || 0}
                    page={page}
                    onPageChange={handleChangePage}
                    rowsPerPage={rowsPerPage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                    rowsPerPageOptions={[5, 10, 25, 50]}
                />
            </TableContainer>


            {/* CREATE TEMPLATE MODAL */}
            <InspectionTemplatePage
                open={openModal}
                setOpen={setOpenModal}
                data={data}
                fetchData={fetchData}
                selectedInspection={selectedInspection}
                token={token}
            />
        </Box>
    );
}
