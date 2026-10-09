'use client';

import { useState, useEffect } from "react";

import { useSession } from "next-auth/react";

import { useForm, Controller } from "react-hook-form";
import { valibotResolver } from "@hookform/resolvers/valibot";
import { object, pipe, string, minLength, maxLength, array, minLength as minArrayLength } from "valibot";

import {
    Box,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Card,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TablePagination,
    TextField,
    Typography,
    MenuItem,
    IconButton,
    Tooltip,
    FormHelperText,
} from "@mui/material";

import AddIcon from "@mui/icons-material/Add";
import InsertDriveFileOutlinedIcon from "@mui/icons-material/InsertDriveFileOutlined";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import CloudUploadOutlinedIcon from "@mui/icons-material/CloudUploadOutlined";

import { toast } from "react-toastify";
import DialogCloseButton from "@/components/dialogs/DialogCloseButton";
import formatTime from "@/utils/formatTime";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const documentTypeData = [
    { value: "1", label: "Bye-laws" },
    { value: "2", label: "AGM Minutes" },
    { value: "3", label: "Meeting Documents" },
    { value: "4", label: "Circulars" },
    { value: "5", label: "NOC Forms" },
    { value: "6", label: "Insurance Documents" },
    { value: "7", label: "Download Center" },
];

const documentSchema = object({
    document_name: pipe(
        string(),
        minLength(1, 'Document Name is required'),
        maxLength(100, 'Document Name can be max of 100 characters')
    ),
    document_type: pipe(
        string(),
        minLength(1, 'Document Type is required')
    ),
    documents: pipe(
        array(object({})),
        minArrayLength(1, 'At least one document file is compulsory')
    )
});

const DocumentModal = ({ open, setOpen, formData, handleFiles, handleRemoveFile, handleSubmit, control, errors, selectDocument }) => {

    const handleClose = () => {
        setOpen(false);
    };

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            fullWidth
            maxWidth="md"
            sx={{ '& .MuiDialog-paper': { overflow: 'visible' } }}
        >
            <DialogTitle sx={{ fontWeight: 600, fontSize: '1.25rem' }}>
                {selectDocument ? "Edit" : "Add"} Document
            </DialogTitle>

            <DialogCloseButton onClick={handleClose}><i className="tabler-x" /></DialogCloseButton>

            <DialogContent>
                <Box
                    component="form"
                    display="grid"
                    gridTemplateColumns="1fr"
                    gap={2.5}
                    mt={1}
                >
                    <Controller
                        name="document_name"
                        control={control}
                        render={({ field }) => (
                            <TextField
                                {...field}
                                required
                                label="Document Name"
                                fullWidth
                                variant="outlined"
                                size="medium"
                                error={Boolean(errors.document_name)}
                                helperText={errors.document_name?.message}
                            />
                        )}
                    />

                    <Controller
                        name="document_type"
                        control={control}
                        render={({ field }) => (
                            <TextField
                                {...field}
                                select
                                required
                                label="Document Type"
                                fullWidth
                                variant="outlined"
                                size="medium"
                                error={Boolean(errors.document_type)}
                                helperText={errors.document_type?.message}
                            >
                                {documentTypeData.map((option) => (
                                    <MenuItem key={option.value} value={option.value}>
                                        {option.label}
                                    </MenuItem>
                                ))}
                            </TextField>
                        )}
                    />

                    <Box
                        component="label"
                        sx={{
                            border: '2px dashed',
                            borderColor: errors.documents ? 'error.main' : 'divider',
                            borderRadius: 2,
                            p: 3,
                            textAlign: 'center',
                            cursor: 'pointer',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: 1,
                            backgroundColor: 'background.default',
                            transition: 'all 0.2s ease-in-out',
                            '&:hover': {
                                borderColor: 'primary.main',
                                backgroundColor: 'action.hover',
                            },
                        }}
                    >
                        <CloudUploadOutlinedIcon color={errors.documents ? "error" : "primary"} sx={{ fontSize: 40 }} />
                        <Typography variant="body1" fontWeight={500}>
                            Click to upload or drag & drop files
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            Support for multiple file uploads (PDF, DOCX, images, etc.)
                        </Typography>
                        <input
                            hidden
                            multiple
                            type="file"
                            onChange={handleFiles}
                        />
                    </Box>
                    {errors.documents && (
                        <FormHelperText error sx={{ mt: -2, ml: 1 }}>
                            {errors.documents.message}
                        </FormHelperText>
                    )}

                    {formData.documents.length > 0 && (
                        <Box display="grid" gridTemplateColumns="1fr" gap={1.5}>
                            <Typography variant="subtitle2" fontWeight={600} color="text.secondary">
                                Selected Files ({formData.documents.length}):
                            </Typography>

                            <Box
                                display="grid"
                                gridTemplateColumns="1fr"
                                gap={1}
                                maxHeight={160}
                                sx={{ overflowY: 'auto', pr: 0.5 }}
                            >
                                {formData.documents.map((file, index) => (
                                    <Card
                                        key={index}
                                        variant="outlined"
                                        sx={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            p: 1.5,
                                            borderRadius: 2,
                                            backgroundColor: 'background.paper'
                                        }}
                                    >
                                        <Box display="flex" alignItems="center" gap={1.5} sx={{ minWidth: 0 }}>
                                            <InsertDriveFileOutlinedIcon color="action" fontSize="small" />
                                            <Typography variant="body2" noWrap fontWeight={500}>
                                                {file?.file_name}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0 }}>
                                                ({(file?.file_size / 1024).toFixed(1)} KB)
                                            </Typography>
                                        </Box>

                                        <IconButton
                                            size="small"
                                            color="error"
                                            onClick={() => handleRemoveFile(index)}
                                        >
                                            <DeleteOutlineOutlinedIcon fontSize="small" />
                                        </IconButton>
                                    </Card>
                                ))}
                            </Box>
                        </Box>
                    )}
                </Box>
            </DialogContent>

            <DialogActions sx={{ px: 3, pb: 2, display: 'flex', justifyContent: 'center', gap: 1, mb: 3 }}>
                <Button
                    variant="contained"
                    onClick={handleSubmit}
                    disableElevation
                >
                    Save
                </Button>

                <Button
                    onClick={handleClose}
                    variant="outlined"
                    sx={{ textTransform: 'none', fontWeight: 600 }}
                >
                    Cancel
                </Button>
            </DialogActions>
        </Dialog>
    );
};

const DocumentPage = () => {

    const { data: session } = useSession();
    const token = session?.user?.token;

    const [documentData, setDocumentData] = useState([]);
    const [open, setOpen] = useState(false);

    const [selectDocument, setSelectDocument] = useState();

    const [formData, setFormData] = useState({
        document_name: "",
        document_type: "",
        documents: [],
    });

    const {
        control,
        handleSubmit: handleFormSubmit,
        setValue,
        reset,
        clearErrors,
        formState: { errors }
    } = useForm({
        resolver: valibotResolver(documentSchema),
        defaultValues: {
            document_name: "",
            document_type: "",
            documents: []
        }
    });

    // Pagination State
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(5);

    const fetchDocuments = async () => {
        try {
            const response = await fetch(`${API_URL}/company/document/fetch/data`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();

            if (response.ok) {
                setDocumentData(data?.data || []);
            } else {
                toast.error(data?.message || "Failed to fetch documents");
            }
        } catch (error) {
            toast.error(error.message || "Failed to fetch document data");
        }
    };

    useEffect(() => {
        if (API_URL && token) {
            fetchDocuments();
        }
    }, [API_URL, token]);

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const handleFiles = (e) => {
        if (e.target.files) {
            const newFiles = Array.from(e.target.files);
            const updatedDocuments = [...formData.documents, ...newFiles];
            setFormData((prev) => ({
                ...prev,
                documents: updatedDocuments,
            }));
            setValue("documents", updatedDocuments, { shouldValidate: true });
        }
    };

    const handleRemoveFile = (indexToRemove) => {
        const updatedDocuments = formData.documents.filter((_, index) => index !== indexToRemove);
        setFormData((prev) => ({
            ...prev,
            documents: updatedDocuments,
        }));
        setValue("documents", updatedDocuments, { shouldValidate: true });
    };

    const handleClose = () => {
        setOpen(false);
        reset();
        setFormData({
            document_name: "",
            document_type: "",
            documents: [],
        });
    };

    // Populate form and local state when opening the modal for editing
    useEffect(() => {
        if (selectDocument) {
            // 1. Set React Hook Form values
            setValue("document_name", selectDocument.document_name || "");
            setValue("document_type", selectDocument.document_type || "");
            setValue("documents", selectDocument.documents || []);

            // 2. Set Local State for file previews
            setFormData({
                document_name: selectDocument.document_name || "",
                document_type: selectDocument.document_type || "",
                documents: selectDocument.documents || [],
            });
        } else {
            // Reset when opening for "Add"
            reset({
                document_name: "",
                document_type: "",
                documents: []
            });
            setFormData({
                document_name: "",
                document_type: "",
                documents: [],
            });
        }
    }, [selectDocument, setValue, reset]);

    const onSubmit = async (data) => {
        try {
            const dataToSend = new FormData();

            dataToSend.append("document_name", data.document_name);
            dataToSend.append("document_type", data.document_type);

            formData.documents.forEach((file) => {
                dataToSend.append("documents", file);
            });

            const docMethod = selectDocument ? 'PUT' : 'POST';
            const docEndpoint = selectDocument ? `${API_URL}/company/document/update/data/${selectDocument._id}` : `${API_URL}/company/document/save/data`;

            const response = await fetch(docEndpoint, {
                method: docMethod,
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
                body: dataToSend,
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || 'Something went wrong');
            }

            toast.success("Document uploaded successfully!");
            handleClose();
            fetchDocuments();
        } catch (error) {
            toast.error(error.message || "Upload error");
        }
    };

    const paginatedRows = documentData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

    return (
        <Box display="grid" gridTemplateColumns="1fr" gap={3} p={3}>
            <Box
                display="grid"
                gridTemplateColumns={{ xs: "1fr", sm: "1fr auto" }}
                alignItems="center"
                gap={2}
            >
                <Box>
                    <Typography variant="h5" fontWeight={700} color="text.primary">
                        Society Documents
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Manage and organize all legal, financial, and agreement documentation.
                    </Typography>
                </Box>

                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => {

                        clearErrors()
                        setOpen(true)
                        setSelectDocument(null)
                    }}
                    disableElevation
                >
                    Add Document
                </Button>
            </Box>

            <Card variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden' }}>
                <TableContainer>
                    <Table>
                        <TableHead sx={{ backgroundColor: 'background.default' }}>
                            <TableRow>
                                <TableCell><b>#</b></TableCell>
                                <TableCell><b>Document Name</b></TableCell>
                                <TableCell><b>Document Type</b></TableCell>
                                <TableCell><b>Total Files</b></TableCell>
                                <TableCell><b>Created At</b></TableCell>
                                <TableCell>Action</TableCell>
                            </TableRow>
                        </TableHead>

                        <TableBody>
                            {paginatedRows.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                                        <Box display="grid" justifyItems="center" gap={1}>
                                            <InsertDriveFileOutlinedIcon color="disabled" sx={{ fontSize: 48 }} />
                                            <Typography variant="body1" fontWeight={500} color="text.secondary">
                                                No Documents Found
                                            </Typography>
                                            <Typography variant="caption" color="text.disabled">
                                                Get started by adding a new document using the button above.
                                            </Typography>
                                        </Box>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                paginatedRows.map((row, index) => (
                                    <TableRow key={row._id} hover>
                                        <TableCell>{page * rowsPerPage + index + 1}</TableCell>
                                        <TableCell>{row.document_name}</TableCell>
                                        <TableCell>
                                            {documentTypeData.find((item) => item.value === row.document_type)?.label || 'N/A'}
                                        </TableCell>
                                        <TableCell>{row.documents?.length || 0}</TableCell>
                                        <TableCell>{formatTime(row.created_at)}</TableCell>
                                        <TableCell>
                                            <IconButton
                                                size="small"
                                                onClick={() => {

                                                    
                                                    clearErrors()
                                                    setSelectDocument(row);
                                                    setOpen(true);
                                                }}
                                            >
                                                <i className="tabler-edit" />
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>

                <TablePagination
                    rowsPerPageOptions={[5, 10, 25]}
                    component="div"
                    count={documentData.length}
                    rowsPerPage={rowsPerPage}
                    page={page}
                    onPageChange={handleChangePage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                />
            </Card>

            <DocumentModal
                open={open}
                setOpen={setOpen}
                formData={formData}
                handleFiles={handleFiles}
                handleRemoveFile={handleRemoveFile}
                handleSubmit={handleFormSubmit(onSubmit)}
                control={control}
                errors={errors}
                selectDocument={selectDocument}
            />
        </Box>
    );
};

export default DocumentPage;
