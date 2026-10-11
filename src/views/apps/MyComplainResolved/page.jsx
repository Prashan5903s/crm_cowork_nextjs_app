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
  optional,
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

import CustomAvatar from '@core/components/mui/Avatar'

import tableStyles from '@core/styles/table.module.css'

import TablePaginationComponent from '@components/TablePaginationComponent'

import CustomTextField from "@/@core/components/mui/TextField"

import DialogCloseButton from "@/components/dialogs/DialogCloseButton"

const public_url = process.env.NEXT_PUBLIC_ASSETS_URL

const getAvatar = ({ avatar, fullName }) => {
  if (avatar) return <CustomAvatar src={`${public_url}/uploads/images/${avatar}`} size={34} />

  return <CustomAvatar size={34}>{getInitials(fullName)}</CustomAvatar>
}

// Filter function
const fuzzyFilter = (row, columnId, value, addMeta) => {
  const itemRank = rankItem(row.getValue(columnId), value)

  addMeta({ itemRank })

  return itemRank.passed
}

const columnHelper = createColumnHelper()

const ComplainModal = ({ open, setIsOpen, fetchComplain, complainId, setComplainId }) => {

  const { data: session } = useSession()
  const token = session?.user?.token
  const API_URL = process.env.NEXT_PUBLIC_API_URL

  const [currentStatus, setCurrentStatus] = useState()

  // Validation schema
  const schema = object({
    status: pipe(string(), minLength(1, "Status is required")),
    happy_code: currentStatus == "3" ? pipe(string(), minLength(1, "Happy code is required")) : optional(string()),
    remark: optional(string()),
    complain_id: optional(string())
  });

  // useForm setup
  const {
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: valibotResolver(schema),
    defaultValues: {
      status: "",
      complain_id: "",
      remark: "",
      complain_id: "",
      happy_code: "",
    },
  });

  useEffect(() => {
    if (complainId) {
      setValue('complain_id', complainId)
    }
  }, [complainId])

  const onClose = () => {
    reset();
    setComplainId()
    setCurrentStatus()
    setIsOpen(false);
  };

  // Submit handler
  const onSubmit = async (data) => {
    try {

      const response = await fetch(`${API_URL}/user/complain/data/resolve`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      const result = await response.json()

      if (response.ok) {

        toast.success("Complain created successfully", {
          autoClose: 1000,
        });
        fetchComplain()
        onClose();
        reset();
      } else {
        toast.error(result?.message || "Failed to create complain", {
          autoClose: 2000
        });
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

      <DialogTitle>Complain Portal</DialogTitle>

      {/* ✅ form wrapper */}
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent>
          <Grid container spacing={3}>

            {/* Category */}
            <Grid item size={{ xs: 12 }}>
              <Controller
                name="status"
                control={control}
                render={({ field }) => (
                  <CustomTextField
                    {...field}
                    fullWidth
                    select
                    label="Change status*"

                    onChange={(e) => {
                      setCurrentStatus(e.target.value)

                      if (e.target.value != "3") {
                        setValue('happy_code', "")
                      }

                      field.onChange(e.target.value)

                    }}
                    error={!!errors.status}
                    helperText={errors.status?.message}
                  >
                    <MenuItem value="1">Pending</MenuItem>
                    <MenuItem value="3">Resolved</MenuItem>
                    <MenuItem value="4">In Progress</MenuItem>
                  </CustomTextField>
                )}
              />
            </Grid>


            {currentStatus && currentStatus == "3" && (
              <Grid item size={{ xs: 12 }}>
                <Controller
                  name="happy_code"
                  control={control}
                  rules={{
                    required: "Happy Code is required",
                    pattern: {
                      value: /^\d{6}$/, // exactly 6 digits
                      message: "Happy Code must be exactly 6 digits",
                    },
                  }}
                  render={({ field }) => (
                    <CustomTextField
                      {...field}
                      fullWidth
                      label="Happy Code*"
                      type="number"
                      inputProps={{
                        min: 0,            // positive numbers only
                        maxLength: 6,      // restrict to 6 digits
                        inputMode: "numeric",
                        pattern: "[0-9]*", // only digits
                      }}
                      error={!!errors.happy_code}
                      helperText={errors.happy_code?.message}
                      onInput={(e) => {
                        // prevent typing negative sign or non-numeric
                        e.target.value = e.target.value.replace(/[^0-9]/g, "");

                        // prevent more than 6 digits

                        if (e.target.value.length > 6) {
                          e.target.value = e.target.value.slice(0, 6);
                        }

                        field.onChange(e);
                      }}
                    />
                  )}
                />
              </Grid>
            )}

            {/* Description */}
            <Grid item size={{ xs: 12 }}>
              <Controller
                name="remark"
                control={control}
                render={({ field }) => (
                  <CustomTextField
                    {...field}
                    fullWidth
                    multiline
                    minRows={4}
                    label="Remark"
                    error={!!errors.remark}
                    helperText={errors.remark?.message}
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

const BillTable = () => {

  const { data: session } = useSession()
  const token = session?.user?.token
  const API_URL = process.env.NEXT_PUBLIC_API_URL

  const [rowSelection, setRowSelection] = useState({})
  const [data, setData] = useState([])
  const [openDialog, setOpenDialog] = useState(false)
  const [globalFilter, setGlobalFilter] = useState('')
  const [complainId, setComplainId] = useState()

  const fetchComplain = async () => {
    try {
      const response = await fetch(`${API_URL}/user/complain/data/resolve`, {
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

  const columns = useMemo(() => {
    return [

      columnHelper.accessor('first_name', {
        header: 'User',
        cell: ({ row }) => (
          <div className="flex items-center gap-4">
            {getAvatar({
              avatar: row.original.created_by_user.photo,
              fullName: `${row.original.created_by_user.first_name} ${row.original.created_by_user.last_name}`
            })}
            <div className="flex flex-col">
              <Typography color="text.primary" className="font-medium">
                {`${row.original.created_by_user.first_name ?? ''} ${row.original.created_by_user.last_name ?? ''}`}
              </Typography>

              <Typography variant="body2">{row.original.created_by_user.email}</Typography>

              <Typography variant="body2">{row.original.created_by_user.phone}</Typography>
            </div>
          </div>
        )
      }),

      columnHelper.accessor('apartment_data', {
        header: 'Apartment',
        cell: ({ row }) => {
          const apartments = row.original.created_by_user.apartment_data || []

          return (

            <Typography variant="body2" component="div">
              {apartments.length > 0 ? (
                apartments.map((item, index) => {
                  const aptNo = item.apartment_id?.apartment_no || 'N/A'
                  const towerName = item.tower_id?.name || 'N/A'
                  const floorName = item?.floor_id?.floor_name || 'N/A'

                  return (
                    <div key={index}>
                      {aptNo}, {towerName}, {floorName}
                    </div>
                  )
                })
              ) : (
                'No apartment assigned'
              )}
            </Typography>
          )
        }
      }),

      // Complaint Type
      columnHelper.accessor("complaint_type", {
        header: "Type",
        cell: ({ row }) => (
          <Typography className="capitalize" color="text.primary">
            {row.original.complaint_type === "1" ? "Individual" : "Society"}
          </Typography>
        ),
      }),

      // Category
      columnHelper.accessor("category", {
        header: "Category",
        cell: ({ row }) => {

          return (
            <Typography className="capitalize" color="text.primary">
              {row.original?.category?.name || "-"}
            </Typography>
          );
        },
      }),

      // Description
      columnHelper.accessor("description", {
        header: "Description",
        cell: ({ row }) => (
          <Typography className="capitalize" color="text.primary">
            {row.original?.description || "-"}
          </Typography>
        ),
      }),

      // Description
      columnHelper.accessor("Status", {
        header: "Status",
        cell: ({ row }) => {
          const statusMap = {
            1: "Pending",
            2: "Assigned",
            3: "Resolved",
            4: "In Progress",
          };

          const status =
            statusMap[row.original?.latest_complain_user?.complaint_status] || "Pending";

          return (
            <Typography className="capitalize" color="text.primary">
              {status}
            </Typography>
          );
        },
      }),

      // Action
      columnHelper.display({
        id: "action",
        header: "Action",
        cell: ({ row }) => (

          <i
            className="tabler-edit"
            style={{
              cursor: "pointer",
              transition: "color 0.2s ease-in-out, transform 0.2s",
            }}
            onClick={() => {
              setComplainId(row?.original?._id)
              setOpenDialog(true)
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "primary";
              e.currentTarget.style.transform = "scale(1.2)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "";
              e.currentTarget.style.transform = "scale(1)";
            }}
          ></i>
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
      <ComplainModal open={openDialog} setIsOpen={setOpenDialog} fetchComplain={fetchComplain} setComplainId={setComplainId} complainId={complainId} />
    </Card>
  )
}

export default BillTable
