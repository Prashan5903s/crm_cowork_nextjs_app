'use client'

import { useState, useEffect, useMemo } from "react"

import {
  Card,
  MenuItem,
  Tab,
  Button,
  Dialog,
  Checkbox,
  CardContent,
  Typography,
  DialogContent,
  DialogTitle,
  DialogActions
} from "@mui/material"

import { TabContext, TabPanel, TabList } from "@mui/lab"

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

import tableStyles from '@core/styles/table.module.css'

import TablePaginationComponent from '@components/TablePaginationComponent'

import CustomTextField from "@/@core/components/mui/TextField"

import DialogCloseButton from "@/components/dialogs/DialogCloseButton"

import { usePermissionList } from '@/utils/getPermission'

const ASSET_URL = process.env.NEXT_PUBLIC_ASSETS_URL

function formatTimestamp(timestamp) {
  if (!timestamp) return "-";

  const date = new Date(timestamp);

  const options = {
    year: "numeric",
    month: "short", // Jan, Feb, etc.
    day: "2-digit"
  };

  return date.toLocaleDateString("en-US", options);
}

// Filter function
const fuzzyFilter = (row, columnId, value, addMeta) => {
  const itemRank = rankItem(row.getValue(columnId), value)

  addMeta({ itemRank })

  return itemRank.passed
}

const columnHelper = createColumnHelper()

const ImageModal = ({ open, setOpen, imgFile }) => {
  const handleClose = () => {
    setOpen(false)
  }

  const imageUrl = `${ASSET_URL}/uploads/complain/${imgFile}`

  return (
    <Dialog
      fullWidth
      maxWidth='sm'
      scroll='body'
      open={open}
      onClose={handleClose}
      sx={{
        '& .MuiDialog-paper': {
          overflow: 'visible'
        }
      }}
    >
      <DialogCloseButton onClick={handleClose}><i className="tabler-x" /></DialogCloseButton>
      <DialogTitle>Image Preview</DialogTitle>
      <DialogContent>
        {!imgFile ?
          (
            <Typography textAlign={'center'} fontWeight={'bold'}>Image not found</Typography>
          )
          :
          (

            <img
              src={imageUrl}
              alt='Complaint'
              style={{
                maxWidth: '100%',
                maxHeight: '80vh',
                objectFit: 'contain'
              }}
            />
          )}
      </DialogContent>
    </Dialog >
  )
}

const ComplainModal = ({ open, setIsOpen, fetchComplain, code, id, complainData }) => {
  const { data: session } = useSession();
  const token = session?.user?.token;
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  const [createData, setCreateData] = useState([]);

  // ✅ Validation schema
  const schema = object({
    user: code == 1 ? pipe(string(), minLength(1, "User is required")) : optional(string()),
    status: code == 2 ? pipe(string(), minLength(1, "Status is required")) : optional(string()),
    remark: optional(string()),
  });

  // ✅ useForm setup
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

  // complainData reset
  useEffect(() => {
    if (complainData && code == 1) {
      reset({
        remark: complainData?.assigned_to?.remark ?? "",
        user: complainData?.assigned_to?.user ?? "",
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
  }, [complainData, reset, code]);

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
    if (API_URL && token) {
      fetchCreateUser();
    }
  }, [API_URL, token]);

  // Submit handler
  const onSubmit = async (data) => {
    try {
      const response = await fetch(`${API_URL}/company/complain/data/${id}/${code}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        toast.success("Complain created successfully", { autoClose: 1000 });
        fetchComplain();
        onClose();
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

      <DialogTitle>Complaint Dialog</DialogTitle>

      {/* ✅ form wrapper */}
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent>
          <Grid container spacing={3}>
            {code == 1 && (
              <Grid item size={{ xs: 12 }}>
                <Controller
                  name="user"
                  control={control}
                  render={({ field }) => (
                    <CustomTextField
                      {...field}
                      value={field.value ?? ""}
                      fullWidth
                      select
                      label="Assign User *"
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
              <Grid item size={{ xs: 12 }}>
                <Controller
                  name="status"
                  control={control}
                  render={({ field }) => (
                    <CustomTextField
                      {...field}
                      value={field.value ?? ""}
                      fullWidth
                      select
                      label="Change status *"
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
            <Grid item size={{ xs: 12 }}>
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

        {/* Buttons */}
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
    data: complainData,
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
        </DialogContent>
      </Dialog>
    </>
  )
}

const ComplainTab = () => {
  const [value, setValue] = useState("1");

  const handleTabChange = (event, newValue) => {
    setValue(newValue);
  };

  return (
    <TabContext value={value}>
      <TabList
        variant="scrollable"
        onChange={handleTabChange}
        className="border-b px-0 pt-0"
      >
        <Tab label="Pending" value="1" />
        <Tab label="Assigned" value="2" />
        <Tab label="Resolved" value="3" />
        <Tab label="In Progress" value="4" />
      </TabList>

      <div className="pt-0 mt-4">
        <TabPanel value="1" className="p-0">
          <ComplainTable status="1" />
        </TabPanel>
        <TabPanel value="2" className="p-0">
          <ComplainTable status="2" />
        </TabPanel>
        <TabPanel value="3" className="p-0">
          <ComplainTable status="3" />
        </TabPanel>
        <TabPanel value="4" className="p-0">
          <ComplainTable status="4" />
        </TabPanel>
      </div>
    </TabContext>
  );
};

const ComplainTable = ({ status }) => {
  const { data: session } = useSession();
  const token = session?.user?.token;
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  const getPermissions = usePermissionList();
  const [permissions, setPermissions] = useState({});

  const [imgFileName, setImgFileName] = useState()
  const [openImgDialog, setOpenImgDialog] = useState(false)

  useEffect(() => {
    const fetchPermissions = async () => {
      try {
        const result = await getPermissions();

        setPermissions(result);
      } catch (error) {
        console.error("Error fetching permissions:", error);
      }
    };

    if (getPermissions) fetchPermissions();
  }, [getPermissions]);

  const [data, setData] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [complainData, setComplainData] = useState(false);
  const [openTable, setOpenTable] = useState(false);
  const [code, setCode] = useState();
  const [complainId, setComplainId] = useState();

  const fetchComplain = async () => {
    try {
      const response = await fetch(`${API_URL}/company/complain/data/${status}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const result = await response.json();

      if (response.ok) {
        setData(result?.data || []);
      }
    } catch (error) {
      console.error("Error fetching complaints:", error);
    }
  };

  useEffect(() => {
    if (API_URL && token && status) {
      fetchComplain();
    }
  }, [API_URL, token, status]);

  // columns (same as before)
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

      columnHelper.accessor("assigned_user", {
        header: () => <div style={{ textAlign: "center" }}>Assigned User</div>,
        cell: ({ row }) => (
          row?.original?.latest_complain_user?.complaint_status == 3 ? (
            <div style={{ textAlign: "center" }}>
              {row?.original?.assigned_user?.first_name} {row?.original?.assigned_user?.last_name}
            </div>
          ) : (
            <div style={{ display: "flex", justifyContent: "center" }}>
              <Button
                variant="contained"
                onClick={() => {
                  setOpenDialog(true);
                  setComplainData(row?.original);
                  setCode(1);
                  setComplainId(row.original._id);
                }}
              >
                Update
              </Button>
            </div>
          )
        )
      }),

      columnHelper.accessor("Action", {
        header: () => <div style={{ textAlign: "center" }}>Action</div>,
        cell: ({ row }) => (
          row?.original?.latest_complain_user?.complaint_status == 3 ? (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 10 }}>
              <span>Resolved</span>
              {permissions && permissions?.['hasComplainRecordViewPermission'] && (
                <Button
                  variant="outlined"
                  onClick={() => {
                    setOpenTable(true);
                    setComplainData(row?.original?.all_complain_users);
                    setComplainId(row.original._id);
                  }}
                >
                  View
                </Button>
              )}
            </div>
          ) : (
            <div style={{ display: "flex", justifyContent: "center", gap: 10 }}>
              <Button
                variant="outlined"
                onClick={() => {
                  setOpenDialog(true);
                  setComplainData(row?.original);
                  setCode(2);
                  setComplainId(row.original._id);
                }}
              >
                Update
              </Button>
              <Button
                variant="contained"
                onClick={() => {
                  setOpenTable(true);
                  setComplainData(row?.original?.all_complain_users);
                  setComplainId(row.original._id);
                }}
              >
                View
              </Button>
            </div>
          )
        )
      }),


      columnHelper.accessor('complain_img', {
        header: 'Attached Image',

        cell: ({ row }) => (
          <div style={{ display: "flex", justifyContent: "center" }}>

            <i
              className='tabler-eye'
              style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                cursor: 'pointer',
                transition:
                  'transform 0.2s'
              }}
              onClick={() => {
                setImgFileName(
                  row.original?.complain_img
                )
                setOpenImgDialog(true)
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform =
                  'scale(1.2)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform =
                  'scale(1)'
              }}
            />
          </div>
        )
      }),

      columnHelper.accessor("Nature", {
        header: () => <div style={{ textAlign: "center" }}>Nature</div>,
        cell: ({ row }) => (
          <Typography style={{ textAlign: "center" }} color="text.primary">
            {row.original.nature == "1" ? "Complaint" : "Suggestion"}
          </Typography>
        ),
      }),

      columnHelper.accessor("Complain Type", {
        header: () => <div style={{ textAlign: "center" }}>Complain Type</div>,
        cell: ({ row }) => (
          <Typography style={{ textAlign: "center" }} color="text.primary">
            {row.original.complain_type == 1 ? "Individual" : "Society"}
          </Typography>
        ),
      }),

      columnHelper.accessor("Category", {
        header: () => <div style={{ textAlign: "center" }}>Category</div>,
        cell: ({ row }) => {
          const categoryMap = {
            1: "Plumbing",
            2: "Electricity",
            3: "Leakage",
            4: "Internet",
            5: "House Keeping / Guard",
            6: "Others",
          };

          return (
            <Typography style={{ textAlign: "center" }} color="text.primary">
              {categoryMap?.[row.original.category] || "-"}
            </Typography>
          );
        },
      }),

      columnHelper.accessor("Complaint By", {
        header: () => <div style={{ textAlign: "center" }}>Complaint By</div>,
        cell: ({ row }) => (
          <Typography style={{ textAlign: "center" }} color="text.primary">
            {row.original?.created_by.first_name || "-"} {row.original?.created_by.last_name || "-"}
          </Typography>
        ),
      }),

      columnHelper.display({
        id: "Complaint Date",
        header: () => <div style={{ textAlign: "center" }}>Complaint Date</div>,
        cell: ({ row }) => (
          <Typography style={{ textAlign: "center" }}>
            {formatTimestamp(row.original.created_at)}
          </Typography>
        ),
      }),

      columnHelper.display({
        id: "Complaint Status",
        header: () => <div style={{ textAlign: "center" }}>Complaint Status</div>,
        cell: ({ row }) => {
          const statusMap = {
            1: "Pending",
            2: "Assigned",
            3: "Resolved",
            4: "In progress"
          };

          return (
            <Typography style={{ textAlign: "center" }} color="error">
              {statusMap[row.original?.latest_complain_user?.complaint_status] || "Pending"}
            </Typography>
          );
        },
      }),

      columnHelper.display({
        id: "Created at",
        header: () => <div style={{ textAlign: "center" }}>Created at</div>,
        cell: ({ row }) => (
          <Typography style={{ textAlign: "center" }}>
            {formatTimestamp(row.original.created_at)}
          </Typography>
        ),
      }),
    ];
  }, [permissions]);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  return (
    <Card>
      <CardContent className="flex justify-between flex-col gap-4 items-start sm:flex-row sm:items-center">
        <div className="flex items-center gap-2">
          <Typography>Show</Typography>
          <CustomTextField
            select
            value={table.getState().pagination.pageSize}
            onChange={(e) => table.setPageSize(Number(e.target.value))}
            className="max-sm:is-full sm:is-[70px]"
          >
            <MenuItem value={10}>10</MenuItem>
            <MenuItem value={25}>25</MenuItem>
            <MenuItem value={50}>50</MenuItem>
          </CustomTextField>
        </div>
      </CardContent>

      <div className="overflow-x-auto">
        <table className={tableStyles.table}>
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.length === 0 ? (
              <tr>
                <td colSpan={table.getVisibleFlatColumns().length} className="text-center">
                  No data available
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr key={row.id}>
                  {row.getVisibleCells().map((cell) => (
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

      <ComplainModal
        open={openDialog}
        setIsOpen={setOpenDialog}
        id={complainId}
        fetchComplain={fetchComplain}
        code={code}
        complainData={complainData}
      />

      <ImageModal
        imgFile={imgFileName}
        open={openImgDialog}
        setOpen={setOpenImgDialog}
      />

      <ComplainTableModal
        open={openTable}
        setOpen={setOpenTable}
        complainData={complainData}
      />
    </Card>
  );
};

export default ComplainTab
