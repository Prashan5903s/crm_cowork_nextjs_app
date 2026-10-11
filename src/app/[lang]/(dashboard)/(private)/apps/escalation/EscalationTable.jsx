'use client'

// React Imports
import { useState, useMemo, useEffect } from 'react'

import { useSession } from 'next-auth/react'

import {
  Button,
  CardContent,
  Card,
  Checkbox,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
  Dialog,
  MenuItem
} from '@mui/material'

import Grid from '@mui/material/Grid2'

import classnames from 'classnames'

import { rankItem } from '@tanstack/match-sorter-utils'

import {
  object,
  string,
  minLength,
  pipe,
  optional,
} from 'valibot'

import { valibotResolver } from '@hookform/resolvers/valibot'

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

import { toast } from 'react-toastify'

import CustomTextField from '@core/components/mui/TextField'

import TablePaginationComponent from '@components/TablePaginationComponent'

import tableStyles from '@core/styles/table.module.css'

import { usePermissionList } from '@/utils/getPermission'

import DialogCloseButton from '@/components/dialogs/DialogCloseButton'


// Filter function
const fuzzyFilter = (row, columnId, value, addMeta) => {
  const itemRank = rankItem(row.getValue(columnId), value)

  addMeta({ itemRank })

  return itemRank.passed
}

// Debounced Input
const DebouncedInput = ({ value: initialValue, onChange, debounce = 500, ...props }) => {
  const [value, setValue] = useState(initialValue)

  useEffect(() => {
    setValue(initialValue)
  }, [initialValue])

  useEffect(() => {
    const timeout = setTimeout(() => {
      onChange(value)
    }, debounce)

    return () => clearTimeout(timeout)

  }, [value, debounce, onChange])

  return <CustomTextField {...props} value={value} onChange={e => setValue(e.target.value)} />
}

const columnHelper = createColumnHelper()

const ComplainModal = ({
  open,
  setIsOpen,
  fetchComplain,
  code,
  id,
  complainData,
  escalateId
}) => {

  const { data: session } = useSession();
  const token = session?.user?.token;
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  const [createData, setCreateData] = useState([]);

  // Validation schema
  const schema = object({
    user: code == 1 ? pipe(string(), minLength(1, "Assigned User is required")) : optional(string()),
    status: code == 2 ? pipe(string(), minLength(1, "Status is required")) : optional(string()),
    remark: optional(string()),
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
      status: "",
      remark: "",
      user: "",
    },
  });

  const onClose = () => {
    reset({
      status: "",
      remark: "",
      user: "",
    });
    setIsOpen(false);
  };

  // complainData reset safely on modal open
  useEffect(() => {
    if (open) {
      if (complainData && code == 1) {
        reset({
          remark: complainData?.escalated_assigned_to?.remark ?? "",
          user: complainData?.escalated_assigned_to?.user ?? "",
          status: "",
        });
      } else if (complainData && code == 2) {
        reset({
          remark: complainData?.remark ?? "",
          status: complainData?.status ?? "",
          user: "",
        });
      } else {
        reset({
          remark: "",
          status: "",
          user: "",
        });
      }
    }
  }, [open, complainData, code, reset]);

  // Fetch users for assign
  const fetchCreateUser = async () => {
    try {
      const response = await fetch(`${API_URL}/company/complain/create`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json();

      if (response.ok) {
        setCreateData(result?.data || []);
      }
    } catch (error) {
      console.error("Fetch error:", error);
    }
  };

  useEffect(() => {
    if (API_URL && token && open) {
      fetchCreateUser();
    }
  }, [API_URL, token, open]);

  // Submit handler
  const onSubmit = async (data) => {
    try {

      const payload = {
        user: data?.user,
        status: data?.status,
        remark: data?.remark,
        escalateId,
        complainId: id
      }

      const response = await fetch(`${API_URL}/company/escalated/complain/data/${code}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        toast.success("Complain updated successfully", { autoClose: 1000 });
        fetchComplain();
        onClose();
      } else {
        const errorData = await response.json().catch(() => ({}));
        toast.error(errorData?.message || "Failed to update complain");
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

      <DialogTitle>Complaint Dialog</DialogTitle>

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <DialogContent>
          <Grid container spacing={3}>
            {code == 1 && (
              <Grid size={{ xs: 12 }}>
                <Controller
                  name="user"
                  control={control}
                  render={({ field }) => (
                    <CustomTextField
                      {...field}
                      value={field.value ?? ""}
                      fullWidth
                      select
                      required
                      label="Assign User"
                      error={!!errors.user}
                      helperText={errors.user?.message}
                    >
                      {(createData || []).map((item) => (
                        <MenuItem key={item._id} value={item._id}>
                          {item.first_name} {item.last_name}
                        </MenuItem>
                      ))}
                    </CustomTextField>
                  )}
                />
              </Grid>
            )}

            {code == 2 && (
              <Grid size={{ xs: 12 }}>
                <Controller
                  name="status"
                  control={control}
                  render={({ field }) => (
                    <CustomTextField
                      {...field}
                      value={field.value ?? ""}
                      fullWidth
                      select
                      required
                      label="Change status"
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
            )}

            {/* Remark */}
            <Grid size={{ xs: 12 }}>
              <Controller
                name="remark"
                control={control}
                render={({ field }) => (
                  <CustomTextField
                    {...field}
                    value={field.value ?? ""}
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

        <DialogActions sx={{ justifyContent: "center", gap: 2 }}>
          <Button variant="contained" type="submit">
            Submit
          </Button>
          <Button variant="outlined" color="error" onClick={onClose}>
            Cancel
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

const ComplainTableModal = ({ open, setOpen, complainData }) => {
  const [rowSelection, setRowSelection] = useState({})
  const [globalFilter, setGlobalFilter] = useState('')

  const onClose = () => {
    setOpen(false)
  }

  const columns = useMemo(() => {
    return [
      {
        id: "select",
        header: ({ table }) => (
          <div style={{ display: "flex", justifyContent: "center" }}>
            <Checkbox
              checked={table.getIsAllRowsSelected()}
              indeterminate={table.getIsSomeRowsSelected()}
              onChange={table.getToggleAllRowsSelectedHandler()}
            />
          </div>
        ),
        cell: ({ row }) => (
          <div style={{ display: "flex", justifyContent: "center" }}>
            <Checkbox
              checked={row.getIsSelected()}
              disabled={!row.getCanSelect()}
              indeterminate={row.getIsSomeSelected()}
              onChange={row.getToggleSelectedHandler()}
            />
          </div>
        ),
      },

      columnHelper.display({
        id: "sr_no",
        header: () => <div style={{ textAlign: "center" }}>Sr No</div>,
        cell: ({ row }) => (
          <Typography style={{ textAlign: "center" }} color="text.primary">
            {row.index + 1}
          </Typography>
        ),
      }),

      columnHelper.accessor("Status", {
        header: () => <div style={{ textAlign: "center" }}>Status</div>,
        cell: ({ row }) => {
          const statusMap = {
            1: "Pending",
            2: "Assigned",
            3: "Resolved",
            4: "In progress"
          };

          return (
            <Typography style={{ textAlign: "center" }} color="error">
              {statusMap[row.original?.complaint_status] || "-"}
            </Typography>
          );
        },
      }),

      columnHelper.accessor("Remark", {
        header: () => <div style={{ textAlign: "center" }}>Remark</div>,
        cell: ({ row }) => {
          return (
            <Typography style={{ textAlign: "center" }} color="text.primary">
              {row.original.remark || "-"}
            </Typography>
          );
        },
      }),
    ];
  }, []);

  const table = useReactTable({
    data: Array.isArray(complainData) ? complainData : [],
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
      <DialogTitle>Complaint Dialog</DialogTitle>
      <DialogContent>
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
                {table?.getFilteredRowModel()?.rows?.length === 0 ? (
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
        </Card>
      </DialogContent>
    </Dialog>
  )
}

const EscalationTable = ({ tableData, fetchZoneData }) => {
  const [rowSelection, setRowSelection] = useState({})
  const [data, setData] = useState([])
  const [filteredData, setFilteredData] = useState([])
  const [globalFilter, setGlobalFilter] = useState('')

  const [openDialog, setOpenDialog] = useState(false)
  const [openTable, setOpenTable] = useState(false)

  const [complainData, setComplainData] = useState([])
  const [modalComplainData, setModalComplainData] = useState(null)

  const [complainId, setComplainId] = useState()
  const [code, setCode] = useState()
  const [escalateComplainId, setEscalateComplainId] = useState();

  const getPermissions = usePermissionList();
  const [permissions, setPermissions] = useState({});

  useEffect(() => {
    const fetchPermissions = async () => {
      try {
        const result = await getPermissions();
        setPermissions(result);
      } catch (error) {
        console.error('Error fetching permissions:', error);
      }
    };

    if (getPermissions) {
      fetchPermissions();
    }
  }, [getPermissions]);

  useEffect(() => {
    if (tableData) {
      setData(tableData)
      setFilteredData(tableData)
    }
  }, [tableData])

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
      columnHelper.accessor("resident", {
        header: "Resident",
        cell: ({ row }) => (
          <Typography
            component="div"
            className="capitalize"
            color="text.primary"
          >
            {row.original?.resident?.first_name}{" "}
            {row.original?.resident?.last_name}
            <div>{row.original?.resident?.phone}</div>
          </Typography>
        ),
      }),
      columnHelper.accessor("complain_no", {
        header: "Complain No",
        cell: ({ row }) => (
          <Typography className="capitalize" color="text.primary">
            {row.original?.complains?.complain_no}
          </Typography>
        ),
      }),
      columnHelper.accessor("assigned_user", {
        header: () => <div style={{ textAlign: "center" }}>Assigned User</div>,
        cell: ({ row }) =>
          row.original?.latest_complain_user?.complaint_status == 3 ? (
            <div style={{ textAlign: "center" }}>
              {row.original?.assigned_user?.first_name}{" "}
              {row.original?.assigned_user?.last_name}
            </div>
          ) : (
            <div style={{ display: "flex", justifyContent: "center" }}>
              <Button
                variant="contained"
                onClick={() => {
                  setCode(1);
                  setModalComplainData(row.original?.complains);
                  setComplainId(row.original?.complains?._id);
                  setEscalateComplainId(row?.original?._id);
                  setOpenDialog(true);
                }}
              >
                Update
              </Button>
            </div>
          ),
      }),
      columnHelper.accessor("action", {
        header: () => <div style={{ textAlign: "center" }}>Action</div>,
        cell: ({ row }) =>
          row.original?.latest_complain_user?.complaint_status == 3 ? (
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                gap: 10,
              }}
            >
              <span>Resolved</span>

              {permissions?.hasComplainRecordViewPermission && (
                <Button
                  variant="outlined"
                  onClick={() => {
                    setComplainData(row.original?.all_complain_users);
                    setComplainId(row.original?.complains?._id);
                    setEscalateComplainId(row?.original?._id);
                    setOpenTable(true);
                  }}
                >
                  View
                </Button>
              )}
            </div>
          ) : (
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                gap: 10,
              }}
            >
              <Button
                variant="outlined"
                onClick={() => {
                  setCode(2);
                  setModalComplainData(row.original?.complains);
                  setComplainId(row.original?.complains?._id);
                  setEscalateComplainId(row?.original?._id);
                  setOpenDialog(true);
                }}
              >
                Update
              </Button>
              <Button
                variant="contained"
                onClick={() => {
                  setComplainData(row.original?.all_complain_users);
                  setComplainId(row.original?.complains?._id);
                  setEscalateComplainId(row?.original?._id);
                  setOpenTable(true);
                }}
              >
                View
              </Button>
            </div>
          ),
      }),
      columnHelper.accessor("resident_remarks", {
        header: "Resident Remark",
        cell: ({ row }) => (
          <Typography className="capitalize" color="text.primary">
            {row.original?.resident_remarks}
          </Typography>
        ),
      }),
      columnHelper.accessor("escalation_reason", {
        header: "Escalation Reason",
        cell: ({ row }) => (
          <Typography className="capitalize" color="text.primary">
            {row.original?.escalation_reason?.title}
          </Typography>
        ),
      }),
      columnHelper.accessor("escalation_status", {
        header: "Escalation Status",
        cell: ({ row }) => (
          <Typography className="capitalize" color="text.primary">
            {row.original?.escalation_status?.title}
          </Typography>
        ),
      }),
      columnHelper.accessor("complain_description", {
        header: "Complain Description",
        cell: ({ row }) => (
          <Typography className="capitalize" color="text.primary">
            {row.original?.complains?.description}
          </Typography>
        ),
      }),
    ];
  }, [permissions]);

  const table = useReactTable({
    data: filteredData,
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
    <>
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
          <div className='flex gap-4 flex-col !items-start max-sm:is-full sm:flex-row sm:items-center'>
            <DebouncedInput
              value={globalFilter ?? ''}
              className='max-sm:is-full min-is-[250px]'
              onChange={value => setGlobalFilter(String(value))}
              placeholder='Search Escalated Complain'
            />
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
      </Card>

      <ComplainModal
        open={openDialog}
        setIsOpen={setOpenDialog}
        id={complainId}
        fetchComplain={fetchZoneData}
        code={code}
        escalateId={escalateComplainId}
        complainData={modalComplainData}
      />

      <ComplainTableModal
        open={openTable}
        setOpen={setOpenTable}
        complainData={complainData}
      />
    </>
  )
}

export default EscalationTable
