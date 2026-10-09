'use client'

import { useState, useEffect, useMemo } from "react"

import {
    FormControl,
    FormLabel,
    Card,
    MenuItem,
    Box,
    Button,
    Dialog,
    RadioGroup,
    FormControlLabel,
    Radio,
    Checkbox,
    CardContent,
    Typography,
    DialogContent,
    DialogTitle,
    DialogActions
} from "@mui/material"

import Grid from '@mui/material/Grid2'

import classnames from 'classnames'

import { valibotResolver } from '@hookform/resolvers/valibot'

import {
    object,
    string,
    minLength,
    pipe,
} from 'valibot'

import {
    createColumnHelper,
    flexRender,
    getCoreRowModel,
    useReactTable,
    getFilteredRowModel,
    getFacetedRowModel,
    getFacetedUniqueValues,
    getFacetedMinMaxValues,
    getPaginationRowModel,
    getSortedRowModel
} from '@tanstack/react-table'

import { useForm, Controller } from 'react-hook-form'

import { useSession } from "next-auth/react"

import { toast } from "react-toastify"

import tableStyles from '@core/styles/table.module.css'

import TablePaginationComponent from '@components/TablePaginationComponent'

import CustomTextField from "@/@core/components/mui/TextField"

import DialogCloseButton from "@/components/dialogs/DialogCloseButton"

import FormatTime from '@/utils/formatTime';

// Filter function
const fuzzyFilter = (row, columnId, value, addMeta) => {
    const itemRank = rankItem(row.getValue(columnId), value)

    addMeta({ itemRank })

    return itemRank.passed
}

const columnHelper = createColumnHelper()

const ComplainModal = ({ open, setIsOpen, fetchComplain }) => {

    const { data: session } = useSession()
    const token = session?.user?.token
    const API_URL = process.env.NEXT_PUBLIC_API_URL

    // Validation schema
    const schema = object({
        nature: pipe(string(), minLength(1, "Nature is required")),
        complaint_type: pipe(string(), minLength(1, "Complaint type is required")),
        category: pipe(string(), minLength(1, "Category is required")),
        description: pipe(string(), minLength(1, "Description is required")),
    });

    // useForm setup
    const {
        control,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm({
        resolver: valibotResolver(schema),
        defaultValues: {
            nature: "1",
            complaint_type: "1",
            category: "",
            description: "",
        },
    });

    const onClose = () => {
        reset();
        setIsOpen(false);
    };

    // Submit handler
    const onSubmit = async (data) => {
        try {
            const response = await fetch(`${API_URL}/user/my-complain`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(data),
            });

            if (response.ok) {
                toast.success("Complain created successfully", {
                    autoClose: 1000,
                });
                fetchComplain()
                onClose();
                reset();
            } else {
                const errorData = await response.json().catch(() => ({}));

                toast.error(errorData?.message || "Failed to create complain");
            }
        } catch (error) {
            console.error("Submit error:", error);
            toast.error("Something went wrong. Please try again.");
        }
    };

    return (
        <Dialog
            fullWidth
            maxWidth="md"
            scroll="body"
            open={open}
            onClose={onClose}
            sx={{ "& .MuiDialog-paper": { overflow: "visible" } }}
        >
            <DialogCloseButton onClick={onClose}>
                <i className="tabler-x" />
            </DialogCloseButton>

            <DialogTitle>New Complaint/Suggestion</DialogTitle>

            {/* ✅ form wrapper */}
            <form onSubmit={handleSubmit(onSubmit)}>
                <DialogContent>
                    <Grid container spacing={3}>
                        {/* Nature */}
                        <Grid item size={{ xs: 12, md: 6 }}>
                            <FormControl component="fieldset" fullWidth>
                                <FormLabel>Nature *</FormLabel>
                                <Controller
                                    name="nature"
                                    control={control}
                                    render={({ field }) => (
                                        <RadioGroup row {...field}>
                                            <FormControlLabel
                                                value="1"
                                                control={<Radio />}
                                                label="Complaint"
                                            />
                                            <FormControlLabel
                                                value="2"
                                                control={<Radio />}
                                                label="Suggestion"
                                            />
                                        </RadioGroup>
                                    )}
                                />
                            </FormControl>
                        </Grid>

                        {/* Complaint Type */}
                        <Grid item size={{ xs: 12, md: 6 }}>
                            <FormControl component="fieldset" fullWidth>
                                <FormLabel>Complaint Type *</FormLabel>
                                <Controller
                                    name="complaint_type"
                                    control={control}
                                    render={({ field }) => (
                                        <RadioGroup row {...field}>
                                            <FormControlLabel
                                                value="1"
                                                control={<Radio />}
                                                label="Individual"
                                            />
                                            <FormControlLabel
                                                value="2"
                                                control={<Radio />}
                                                label="Society"
                                            />
                                        </RadioGroup>
                                    )}
                                />
                            </FormControl>
                        </Grid>

                        {/* Category */}
                        <Grid item size={{ xs: 12 }}>
                            <Controller
                                name="category"
                                control={control}
                                render={({ field }) => (
                                    <CustomTextField
                                        {...field}
                                        fullWidth
                                        select
                                        label="Category *"
                                        error={!!errors.category}
                                        helperText={errors.category?.message}
                                    >
                                        <MenuItem value="1">Plumbing</MenuItem>
                                        <MenuItem value="2">Electricity</MenuItem>
                                        <MenuItem value="3">Leakage</MenuItem>
                                        <MenuItem value="4">Internet</MenuItem>
                                        <MenuItem value="5">House keeping/Gardening</MenuItem>
                                        <MenuItem value="6">others</MenuItem>
                                    </CustomTextField>
                                )}
                            />
                        </Grid>

                        {/* Description */}
                        <Grid item size={{ xs: 12 }}>
                            <Controller
                                name="description"
                                control={control}
                                render={({ field }) => (
                                    <CustomTextField
                                        {...field}
                                        fullWidth
                                        multiline
                                        minRows={4}
                                        label="Description *"
                                        error={!!errors.description}
                                        helperText={errors.description?.message}
                                    />
                                )}
                            />
                        </Grid>
                    </Grid>
                </DialogContent>

                {/* Buttons */}
                <DialogActions sx={{ justifyContent: "center", gap: 2 }}>
                    <Button variant="contained" type="submit">
                        Submit
                    </Button>
                    <Button
                        variant="outlined"
                        color="error"
                        onClick={() => onClose()}
                    >
                        Cancel
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    );
};

const HappyCodeModal = ({ open, setOpenDialog, code, id }) => {

    const onClose = () => {
        setOpenDialog(false)
    }



    return (
        <Dialog
            fullWidth
            maxWidth="xs"
            scroll="body"
            open={open}
            onClose={onClose}
            sx={{ "& .MuiDialog-paper": { overflow: "visible" } }}
        >
            <DialogCloseButton onClick={onClose}>
                <i className="tabler-x" />
            </DialogCloseButton>
            {/* Title */}
            <DialogTitle
                sx={{
                    textAlign: "center",
                    fontWeight: "bold",
                    background: "linear-gradient(90deg, #333, #555)", // stylish gradient
                    color: "white",
                    py: 2,
                    fontSize: "1.25rem",
                }}
            >
                Complaint
            </DialogTitle>

            <DialogContent sx={{ textAlign: "center", mt: "4px", px: 3 }}>
                <Typography variant="body2" sx={{ mb: 2 }}>
                    Your Complaint has been registered with us and we have generated a
                    Complaint ID. <strong>{id}</strong> for your future reference.
                </Typography>

                {/* Logo */}
                <Box sx={{ my: 2 }}>
                    <img
                        src="/images/company_logo.png"
                        alt="Logo"
                        style={{ width: 100, margin: "0 auto" }}
                    />
                </Box>

                {/* Happy Code */}
                <Typography variant="subtitle1" sx={{ mb: 1 }}>
                    Your 6 digit “Happy Code” is as given below!
                </Typography>
                <Box
                    sx={{
                        background: "linear-gradient(135deg, #ff9800, #ff5722)",
                        color: "#fff",
                        fontWeight: "bold",
                        fontSize: "2rem",
                        borderRadius: 2,
                        display: "inline-block",
                        px: 4,
                        py: 1,
                        mb: 2,
                        boxShadow: 3,
                    }}
                >
                    {code}
                </Box>

                {/* Instructions */}
                <Typography variant="body2" sx={{ fontStyle: "italic", mb: 2 }}>
                    If you are satisfied with your Complaint, you can share your “Happy
                    Code” with our concerned technician to resolve this issue.
                </Typography>
            </DialogContent>

            {/* Footer */}
            <DialogActions sx={{ justifyContent: "center", pb: 2 }}>
                <Typography variant="body1" fontWeight="bold" color="text.secondary">
                    DW cowork
                </Typography>
            </DialogActions>
        </Dialog>
    );

}

const NoticeTable = ({ value, type }) => {

    const { data: session } = useSession()
    const token = session?.user?.token
    const API_URL = process.env.NEXT_PUBLIC_API_URL

    const [rowSelection, setRowSelection] = useState({})
    const [data, setData] = useState([])
    const [openDialog, setOpenDialog] = useState(false)
    const [globalFilter, setGlobalFilter] = useState('')

    const [isOpen, setIsOpen] = useState(false)
    const [code, setCode] = useState()
    const [complainId, setComplainId] = useState()

    const fetchComplain = async () => {
        try {
            const response = await fetch(`${API_URL}/user/notice`, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token}`
                }
            })

            const result = await response.json()

            if (response.ok) {

                const data = result?.data;

                setData(data)
            }

        } catch (error) {
            throw new Error(error)
        }
    }

    useEffect(() => {
        if (API_URL && token) {
            fetchComplain()
        }
    }, [API_URL, token])

    const MAX_LENGTH = 50;

    const columns = useMemo(() => {
        return [
            {
                id: "select",
                header: ({ table }) => (
                    <Checkbox
                        checked={table.getIsAllRowsSelected()}
                        indeterminate={table.getIsSomeRowsSelected()}
                        onChange={table.getToggleAllRowsSelectedHandler()}
                    />
                ),
                cell: ({ row }) => (
                    <Checkbox
                        checked={row.getIsSelected()}
                        disabled={!row.getCanSelect()}
                        indeterminate={row.getIsSomeSelected()}
                        onChange={row.getToggleSelectedHandler()}
                    />
                ),
            },

            // Sr No
            columnHelper.display({
                id: "sr_no",
                header: "Sr No",
                cell: ({ row, table }) => (
                    <Typography className="capitalize" color="text.primary">
                        {row.index + 1}
                    </Typography>
                ),
            }),

            // Ticket
            columnHelper.accessor("ticket", {
                header: "title",
                cell: ({ row }) => (
                    <Typography>
                        {row.original.title}
                    </Typography>
                ),
            }),

            // Description
            columnHelper.accessor("description", {
                header: "Description",
                cell: ({ row }) => (
                    <Typography className="capitalize" color="text.primary">
                        {(row.original?.description
                            ? row.original.description.length > MAX_LENGTH
                                ? row.original.description.slice(0, MAX_LENGTH) + '...'
                                : row.original.description
                            : '-')}
                    </Typography>
                ),
            }),

            // Created At
            columnHelper.accessor("created_at", {
                header: "Created At",
                cell: ({ row }) => (
                    <Typography className="capitalize" color="text.primary">
                        {FormatTime(row.original?.created_at) || "-"}
                    </Typography>
                ),
            }),
        ];
    }, []);

    const table = useReactTable({
        data: data,
        columns,
        filterFns: { fuzzy: fuzzyFilter },
        state: { rowSelection, globalFilter },
        initialState: { pagination: { pageSize: 10 } },
        enableRowSelection: true,
        globalFilterFn: fuzzyFilter,
        onRowSelectionChange: setRowSelection,
        onGlobalFilterChange: setGlobalFilter,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getFacetedRowModel: getFacetedRowModel(),
        getFacetedUniqueValues: getFacetedUniqueValues(),
        getFacetedMinMaxValues: getFacetedMinMaxValues()
    })

    return (
        <Card>
            <CardContent className='flex justify-between flex-col gap-4 items-start sm:flex-row sm:items-center'>
                <div className='flex items-center gap-2'>
                    <Typography>Show</Typography>
                    <CustomTextField
                        select
                        value={table.getState().pagination.pageSize}
                        onChange={e => table.setPageSize(Number(e.target.value))}
                        className='max-sm:is-full sm:is-[70px]'
                    >
                        <MenuItem value={10}>10</MenuItem>
                        <MenuItem value={25}>25</MenuItem>
                        <MenuItem value={50}>50</MenuItem>
                    </CustomTextField>
                </div>
            </CardContent>

            <div className='overflow-x-auto'>
                <table className={tableStyles.table}>
                    <thead>
                        {table.getHeaderGroups().map(headerGroup => (
                            <tr key={headerGroup.id}>
                                {headerGroup.headers.map(header => (
                                    <th key={header.id}>
                                        {header.isPlaceholder ? null : (
                                            <div
                                                className={classnames({
                                                    'flex items-center': header.column.getIsSorted(),
                                                    'cursor-pointer select-none': header.column.getCanSort()
                                                })}
                                                onClick={header.column.getToggleSortingHandler()}
                                            >
                                                {flexRender(header.column.columnDef.header, header.getContext())}
                                                {{
                                                    asc: <i className='tabler-chevron-up text-xl' />,
                                                    desc: <i className='tabler-chevron-down text-xl' />
                                                }[header.column.getIsSorted()] ?? null}
                                            </div>
                                        )}
                                    </th>
                                ))}
                            </tr>
                        ))}
                    </thead>
                    <tbody>
                        {table.getFilteredRowModel().rows.length === 0 ? (
                            <tr>
                                <td colSpan={table.getVisibleFlatColumns().length} className='text-center'>
                                    No data available
                                </td>
                            </tr>
                        ) : (
                            table.getRowModel().rows.map(row => (
                                <tr key={row.id} className={classnames({ selected: row.getIsSelected() })}>
                                    {row.getVisibleCells().map(cell => (
                                        <td key={cell.id}>
                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        </td>
                                    ))}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <TablePaginationComponent table={table} />
            <ComplainModal open={isOpen} setIsOpen={setIsOpen} fetchComplain={fetchComplain} />
            <HappyCodeModal open={openDialog} setOpenDialog={setOpenDialog} code={code} id={complainId} />
        </Card>
    )
}

export default NoticeTable
