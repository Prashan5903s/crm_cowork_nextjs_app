'use client'

// React Imports
import { useState, useMemo, useEffect } from 'react'

import { useParams } from 'next/navigation'

import {
  Button,
  CardContent,
  Card,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
  Divider,
  Chip,
  MenuItem
} from '@mui/material'

import Grid from '@mui/material/Grid2'

import { useForm, Controller } from 'react-hook-form'

import jsPDF from "jspdf";

import html2canvas from "html2canvas";

import classnames from 'classnames'

import { rankItem } from '@tanstack/match-sorter-utils'

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

import {
  object,
  string,
  minLength,
  pipe,
  optional,
} from 'valibot'

import { valibotResolver } from '@hookform/resolvers/valibot'

import { useSession } from 'next-auth/react'

import { toast } from 'react-toastify'

import { toWords } from 'number-to-words'

import OptionMenu from '@core/components/option-menu';

import CustomTextField from '@core/components/mui/TextField'

import TablePaginationComponent from '@components/TablePaginationComponent'

import tableStyles from '@core/styles/table.module.css'

import BillDialog from '@/components/dialogs/bill-dialog/page'

import { usePermissionList } from '@/utils/getPermission'

import DialogCloseButton from '@/components/dialogs/DialogCloseButton'

import Logo from '@components/layout/shared/Logo'

import FormatTime from '@/utils/formatTime';

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

  }, [value])

  return <CustomTextField {...props} value={value} onChange={e => setValue(e.target.value)} />

}

const columnHelper = createColumnHelper()

const PayModal = ({ open, data, setPayDialog, setPayData, billId, fetchZoneData }) => {

  const { data: session } = useSession()
  const token = session?.user?.token

  const API_URL = process.env.NEXT_PUBLIC_API_URL

  const [paymentMode, setPaymentMode] = useState("");

  // Schema based on selected payment mode
  const schema = object({
    billId: pipe(string(), minLength(1, "Bill id is required")),
    amount: pipe(string(), minLength(1, "Amount is required")),
    status: pipe(string(), minLength(1, "Status is required")),
    payment_mode: pipe(string(), minLength(1, "Payment mode is required")),
    paid_remark: optional(string()),
    bank_name:
      paymentMode === "1" || paymentMode === "2" || paymentMode === "3"
        ? pipe(string(), minLength(1, "Bank name is required"))
        : optional(string()),
    cheque_no:
      paymentMode === "1"
        ? pipe(string(), minLength(1, "Cheque no is required"))
        : optional(string()),
    cheque_date:
      paymentMode === "1"
        ? pipe(string(), minLength(1, "Cheque date is required"))
        : optional(string()),
    demand_draft_no:
      paymentMode === "2"
        ? pipe(string(), minLength(1, "Demand draft no is required"))
        : optional(string()),
    demand_draft_date:
      paymentMode === "2"
        ? pipe(string(), minLength(1, "Demand draft date is required"))
        : optional(string()),
    neft_no:
      paymentMode === "3"
        ? pipe(string(), minLength(1, "NEFT no is required"))
        : optional(string()),
    neft_date:
      paymentMode === "3"
        ? pipe(string(), minLength(1, "NEFT date is required"))
        : optional(string()),
  });

  const {
    handleSubmit,
    setValue,
    control,
    formState: { errors },
  } = useForm({
    resolver: valibotResolver(schema),
    defaultValues: {
      billId: "",
      amount: "",
      status: "",
      payment_mode: "",
      paid_remark: "",
      bank_name: "",
      cheque_no: "",
      cheque_date: "",
      demand_draft_no: "",
      demand_draft_date: "",
      neft_no: "",
      neft_date: "",
    },
  });

  useEffect(() => {
    if (data) {
      setValue("amount", data?.toString() || "");
      setValue('billId', billId?.toString())
    }
  }, [data, setValue]);

  const submitData = async (formData) => {
    try {

      const response = await fetch(`${API_URL}/company/payment`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(formData)
      });

      const result = await response.json();

      if (response.ok) {
        toast.success('Payment created successfull', {
          autoClose: 100
        })
        setPayDialog(false)
        fetchZoneData()
      } else {
        console.error("Error:", result?.message || "Something went wrong");
      }
    } catch (error) {
      console.error("Request failed:", error);
    }
  };

  return (
    <Dialog
      fullWidth
      maxWidth="sm"
      scroll="body"
      open={open}
      sx={{ "& .MuiDialog-paper": { overflow: "visible" } }}
    >
      <DialogCloseButton
        onClick={() => {
          setPayDialog(false);
        }}
      >
        <i className="tabler-x" />
      </DialogCloseButton>

      <DialogTitle variant="h4" className="text-center">
        Add New Payment
      </DialogTitle>

      <form onSubmit={handleSubmit(submitData)} method="POST" noValidate>
        <DialogContent>
          <Grid container spacing={4}>
            {/* Amount */}
            <Grid item size={{ xs: 12 }} >
              <Controller
                name="amount"
                control={control}
                render={({ field }) => (
                  <CustomTextField
                    {...field}
                    fullWidth
                    size="small"
                    label="Amount"
                    required
                    error={!!errors.amount}
                    helperText={errors.amount?.message}
                    onChange={(e) => {
                      let value = e.target.value;

                      if (/^\d*$/.test(value)) {
                        if (Number(value) <= (data || 0)) {
                          field.onChange(value);
                        } else {
                          field.onChange(data?.toString() || "");
                        }
                      }
                    }}
                  />
                )}
              />
            </Grid>

            {/* Status */}
            <Grid item size={{ xs: 12 }}>
              <Controller
                name="status"
                control={control}
                render={({ field }) => (
                  <CustomTextField
                    {...field}
                    select
                    fullWidth
                    size="small"
                    label="Change status"
                    required
                    error={!!errors.status}
                    helperText={errors.status?.message}
                  >
                    <MenuItem value="1">Pending</MenuItem>
                    <MenuItem value="2">Paid</MenuItem>
                    <MenuItem value="3">Partial Paid</MenuItem>
                  </CustomTextField>
                )}
              />
            </Grid>

            {/* Payment Mode */}
            <Grid item size={{ xs: 12 }}>
              <Controller
                name="payment_mode"
                control={control}
                render={({ field }) => (
                  <CustomTextField
                    {...field}
                    select
                    fullWidth
                    size="small"
                    label="Payment mode"
                    error={!!errors.payment_mode}
                    helperText={errors.payment_mode?.message}
                    onChange={(e) => {
                      field.onChange(e.target.value);
                      setPaymentMode(e.target.value);
                    }}
                  >
                    <MenuItem value="1">Cheque</MenuItem>
                    <MenuItem value="2">Demand draft</MenuItem>
                    <MenuItem value="3">NEFT</MenuItem>
                    <MenuItem value="4">Cash</MenuItem>
                  </CustomTextField>
                )}
              />
            </Grid>

            {/* Bank name */}
            {(paymentMode === "1" ||
              paymentMode === "2" ||
              paymentMode === "3") && (
                <Grid item size={{ xs: 12 }}>
                  <Controller
                    name="bank_name"
                    control={control}
                    render={({ field }) => (
                      <CustomTextField
                        {...field}
                        fullWidth
                        size="small"
                        label="Bank name"
                        required
                        error={!!errors.bank_name}
                        helperText={errors.bank_name?.message}
                      />
                    )}
                  />
                </Grid>
              )}

            {/* Cheque */}
            {paymentMode === "1" && (
              <>
                <Grid item size={{ xs: 12 }}>
                  <Controller
                    name="cheque_no"
                    control={control}
                    render={({ field }) => (
                      <CustomTextField
                        {...field}
                        fullWidth
                        size="small"
                        label="Cheque no"
                        required
                        error={!!errors.cheque_no}
                        helperText={errors.cheque_no?.message}
                      />
                    )}
                  />
                </Grid>
                <Grid item size={{ xs: 12 }}>
                  <Controller
                    name="cheque_date"
                    control={control}
                    render={({ field }) => (
                      <CustomTextField
                        {...field}
                        type="date"
                        fullWidth
                        label="Cheque Date"
                        required
                        InputLabelProps={{ shrink: true }}
                        error={!!errors.cheque_date}
                        helperText={errors.cheque_date?.message}
                      />
                    )}
                  />
                </Grid>
              </>
            )}

            {/* Demand Draft */}
            {paymentMode === "2" && (
              <>
                <Grid item size={{ xs: 12 }}>
                  <Controller
                    name="demand_draft_no"
                    control={control}
                    render={({ field }) => (
                      <CustomTextField
                        {...field}
                        fullWidth
                        size="small"
                        label="Demand draft no"
                        required
                        error={!!errors.demand_draft_no}
                        helperText={errors.demand_draft_no?.message}
                      />
                    )}
                  />
                </Grid>
                <Grid item size={{ xs: 12 }}>
                  <Controller
                    name="demand_draft_date"
                    control={control}
                    render={({ field }) => (
                      <CustomTextField
                        {...field}
                        type="date"
                        fullWidth
                        label="Demand Draft Date"
                        required
                        InputLabelProps={{ shrink: true }}
                        error={!!errors.demand_draft_date}
                        helperText={errors.demand_draft_date?.message}
                      />
                    )}
                  />
                </Grid>
              </>
            )}

            {/* NEFT */}
            {paymentMode === "3" && (
              <>
                <Grid item size={{ xs: 12 }}>
                  <Controller
                    name="neft_no"
                    control={control}
                    render={({ field }) => (
                      <CustomTextField
                        {...field}
                        fullWidth
                        size="small"
                        label="NEFT no"
                        required
                        error={!!errors.neft_no}
                        helperText={errors.neft_no?.message}
                      />
                    )}
                  />
                </Grid>
                <Grid item size={{ xs: 12 }}>
                  <Controller
                    name="neft_date"
                    control={control}
                    render={({ field }) => (
                      <CustomTextField
                        {...field}
                        type="date"
                        fullWidth
                        label="NEFT Date"
                        required
                        InputLabelProps={{ shrink: true }}
                        error={!!errors.neft_date}
                        helperText={errors.neft_date?.message}
                      />
                    )}
                  />
                </Grid>
              </>
            )}

            {/* Paid Remark */}
            <Grid item size={{ xs: 12 }}>
              <Controller
                name="paid_remark"
                control={control}
                render={({ field }) => (
                  <CustomTextField
                    {...field}
                    fullWidth
                    size="small"
                    label="Paid remark"
                    multiline
                    rows={3}
                    error={!!errors.paid_remark}
                    helperText={errors.paid_remark?.message}
                  />
                )}
              />
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions className="justify-center">
          <Button variant="contained" type="submit">
            Save
          </Button>
          <Button
            variant="tonal"
            color="secondary"
            onClick={() => {
              setPayDialog(false);
              setPayData();
            }}
          >
            Cancel
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

const PaidAmountModal = ({ open, data, setIsOpen }) => {

  const [globalFilter, setGlobalFilter] = useState('')
  const [rowSelection, setRowSelection] = useState({})

  const columns = useMemo(() => {

    const baseColumns = [];

    baseColumns.splice(
      1,
      0,
      columnHelper.accessor("sn_no", {
        header: "SNo",
        cell: ({ row }) => (
          <Typography className="capitalize" color="text.primary">
            {row.index + 1}
          </Typography>
        ),
      })
    );

    baseColumns.splice(
      2,
      0,
      columnHelper.accessor("Paid_amount", {
        header: "Paid amount",
        cell: ({ row }) => (
          <Typography className="capitalize" color="text.primary">
            {row.original.amount}
          </Typography>
        ),
      })
    );

    return baseColumns;
  }, []);

  const table = useReactTable({
    data: data.payments,
    columns,
    filterFns: { fuzzy: fuzzyFilter },
    state: { globalFilter },
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
      maxWidth="sm"
      scroll="body"
      open={open}
      sx={{ "& .MuiDialog-paper": { overflow: "visible" } }}
    >
      <DialogCloseButton
        onClick={() => {
          setIsOpen(false);
        }}
      >
        <i className="tabler-x" />
      </DialogCloseButton>
      {/* <DialogContent> */}
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
      {/* </DialogContent> */}
    </Dialog>

  )
}

const ViewInvoiceModal = ({ open, setIsInvoiceOpen, selectedZone, finalCost }) => {

  const param = useParams();

  const formattedDate = (date) => {

    return new Date(date).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  };

  const total = selectedZone.payments.reduce(
    (acc, item) => acc + item.amount,
    0
  );

  const payData = {
    "utilityBills": "Utility Bill",
    "common-area-bill": "Common Area Bill",
  }

  return (
    <>
      <Dialog
        fullWidth
        maxWidth="lg"
        scroll="body"
        open={open}
        sx={{ "& .MuiDialog-paper": { overflow: "visible" } }}
      >
        <DialogCloseButton
          onClick={() => {
            setIsInvoiceOpen(false);
          }}
        >
          <i className="tabler-x" />
        </DialogCloseButton>
        <DialogTitle variant="h4" className="text-center">Invoice</DialogTitle>
        <DialogContent>
          <Card className='previewCard'>
            <CardContent className='sm:!p-12'>
              <Grid container spacing={6}>
                <Grid size={{ xs: 12 }}>
                  <div className='p-6 bg-actionHover rounded'>
                    <div className='flex justify-between gap-y-4 flex-col sm:flex-row'>
                      <div className='flex flex-col gap-6'>
                        <div className='flex items-center gap-2.5'>
                          <Logo />
                        </div>
                        <div>
                          <Typography color='text.primary'>Zoo Deoria By Pass,</Typography>
                          <Typography color='text.primary'>DW cowork, near Gorakhpur,</Typography>
                          <Typography color='text.primary'>Uttar Pradesh 273016</Typography>
                        </div>
                      </div>
                      <div className='flex flex-col gap-6'>
                        <Typography variant='h5'>{`Invoice #${selectedZone.invoice_no}`}</Typography>
                        <div className='flex flex-col gap-1'>
                          <Typography color='text.primary'>{`Date Issued: ${formattedDate(selectedZone.bill_date)}`}</Typography>
                          <Typography color='text.primary'>{`Date Due: ${formattedDate(selectedZone?.bill_due_date)}`}</Typography>
                        </div>
                      </div>
                    </div>
                  </div>
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <Grid container spacing={6}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <div className='flex flex-col gap-4'>
                        <Typography className='font-medium' color='text.primary'>
                          Bill From:
                        </Typography>
                        <div>
                          <div className='flex items-center gap-4'>
                            <Typography className='min-is-[100px]'>DW cowork</Typography>
                          </div>
                          <div className='flex items-center gap-4'>
                            <Typography className='min-is-[100px]'>Talramgarh, Deoria Bypass Road</Typography>
                          </div>
                          <div className='flex items-center gap-4'>
                            <Typography className='min-is-[100px]'>Gorakhpur, Uttar Pradesh 273016</Typography>
                          </div>
                          <div className='flex items-center gap-4'>
                            <Typography className='min-is-[100px]'>+919513369620</Typography>
                          </div>
                        </div>
                      </div>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <div className='flex flex-col gap-4'>
                        <Typography className='font-medium' color='text.primary'>
                          Bill To:
                        </Typography>
                        <div>
                          <Typography>{selectedZone?.apartment_id?.assigned_to?.first_name || ""} {selectedZone?.apartment_id?.assigned_to?.last_name || ""}</Typography>
                          <Typography>{selectedZone?.apartment_id?.assigned_to?.email || ""}</Typography>
                          <Typography>{selectedZone?.apartment_id?.assigned_to?.phone || ""}</Typography>
                          <Typography>{selectedZone?.apartment_id?.assigned_to?.address || ""} {selectedZone?.apartment_id?.assigned_to?.pincode || ""}</Typography>
                        </div>
                      </div>
                    </Grid>
                  </Grid>
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <div className='overflow-x-auto border rounded'>
                    <table className={tableStyles.table}>
                      <thead className='border-bs-0'>
                        <tr>
                          <th className='!bg-transparent'>Sno</th>
                          <th className='!bg-transparent'>Quantity</th>
                          <th className='!bg-transparent'>Product</th>
                          <th className='!bg-transparent'>Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedZone.payments.map((item, index) => (
                          <tr key={index}>
                            <td>
                              <Typography color='text.primary'>{index + 1}</Typography>
                            </td>
                            <td>
                              <Typography color='text.primary'>1</Typography>
                            </td>
                            <td>
                              <Typography color='text.primary'>{payData?.[param.type]}</Typography>
                            </td>
                            <td>
                              <Typography color='text.primary'>{item.amount}</Typography>
                            </td>

                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <div className='flex justify-between flex-col gap-y-4 sm:flex-row'>
                    <div className='flex flex-col gap-1 order-2 sm:order-[unset]'>
                      <Typography>
                        <Typography component='span' className='font-medium' color='text.primary'>
                          Total Amount In Words:
                        </Typography>{' '}
                        INR {toWords(total).toUpperCase()} RUPEES ONLY
                      </Typography>
                    </div>
                    <div className='min-is-[200px]'>
                      <div className="flex items-center justify-center gap-2">
                        <Typography>Total:</Typography>
                        <Typography className="font-medium" color="text.primary">
                          ₹{total}
                        </Typography>
                      </div>

                    </div>
                  </div>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </DialogContent>
      </Dialog >
    </>
  )

}

const PayMaintenanceModal = ({
  open,
  data,
  setPayDialog,
  setPayData,
  apartmentId,
  userBillId,
  billId,
  fetchZoneData,
}) => {
  const { data: session } = useSession();
  const token = session?.user?.token;
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  const [paymentMode, setPaymentMode] = useState("");

  // ✅ Schema inside useMemo so it re-calculates when paymentMode changes
  const schema = useMemo(
    () =>
      object({
        billId: pipe(string(), minLength(1, "Bill id is required")),
        apartment_id: pipe(string(), minLength(1, "Apartment id is required")),
        amount: pipe(string(), minLength(1, "Amount is required")),
        status: pipe(string(), minLength(1, "Status is required")),
        payment_mode: pipe(string(), minLength(1, "Payment mode is required")),
        paid_remark: optional(string()),
        userBillId: optional(string()),
        bank_name:
          ["1", "2", "3"].includes(paymentMode) // only required if mode is 1/2/3
            ? pipe(string(), minLength(1, "Bank name is required"))
            : optional(string()),

        cheque_no:
          paymentMode === "1"
            ? pipe(string(), minLength(1, "Cheque no is required"))
            : optional(string()),
        cheque_date:
          paymentMode === "1"
            ? pipe(string(), minLength(1, "Cheque date is required"))
            : optional(string()),

        demand_draft_no:
          paymentMode === "2"
            ? pipe(string(), minLength(1, "Demand draft no is required"))
            : optional(string()),
        demand_draft_date:
          paymentMode === "2"
            ? pipe(string(), minLength(1, "Demand draft date is required"))
            : optional(string()),

        neft_no:
          paymentMode === "3"
            ? pipe(string(), minLength(1, "NEFT no is required"))
            : optional(string()),
        neft_date:
          paymentMode === "3"
            ? pipe(string(), minLength(1, "NEFT date is required"))
            : optional(string()),
      }),
    [paymentMode]
  );

  const {
    handleSubmit,
    setValue,
    control,
    formState: { errors },
  } = useForm({
    resolver: valibotResolver(schema),
    defaultValues: {
      billId: "",
      apartment_id: "",
      amount: "",
      status: "",
      payment_mode: "",
      userBillId: "",
      paid_remark: "",
      bank_name: "",
      cheque_no: "",
      cheque_date: "",
      demand_draft_no: "",
      demand_draft_date: "",
      neft_no: "",
      neft_date: "",
    },
  });

  // set form values when modal data changes
  useEffect(() => {
    if (data) {
      setValue("amount", data?.toFixed(0).toString() || "");
      setValue("billId", billId?.toString() || "");
      setValue("apartment_id", apartmentId?.toString() || "");
      setValue("userBillId", userBillId.toString() || "")
    }
  }, [data, setValue, apartmentId, billId, userBillId]);

  const submitData = async (formData) => {
    try {

      const response = await fetch(`${API_URL}/company/user/bill/data/payment`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(formData)
      });

      const result = await response.json();

      if (response.ok) {
        toast.success('Payment created successfull', {
          autoClose: 100
        })
        setPayDialog(false)
        fetchZoneData()
      } else {
        console.error("Error:", result?.message || "Something went wrong");
      }
    } catch (error) {
      console.error("Request failed:", error);
    }
  };

  return (
    <Dialog
      fullWidth
      maxWidth="sm"
      scroll="body"
      open={open}
      sx={{ "& .MuiDialog-paper": { overflow: "visible" } }}
    >
      <DialogCloseButton
        onClick={() => {
          setPayDialog(false);
        }}
      >
        <i className="tabler-x" />
      </DialogCloseButton>

      <DialogTitle variant="h4" className="text-center">
        Add new Payment
      </DialogTitle>

      <form onSubmit={handleSubmit(submitData)} method="POST" noValidate>
        <DialogContent>
          <Grid container spacing={4}>
            {/* Amount */}
            <Grid item size={{ xs: 12 }} >
              <Controller
                name="amount"
                control={control}
                render={({ field }) => (
                  <CustomTextField
                    {...field}
                    fullWidth
                    size="small"
                    label="Amount"
                    required
                    error={!!errors.amount}

                    helperText={errors.amount?.message}

                    onChange={(e) => {
                      let value = e.target.value;

                      if (/^\d*$/.test(value)) {
                        if (Number(value) <= (data || 0)) {
                          field.onChange(value);
                        } else {
                          field.onChange(data?.toFixed(0).toString() || "");
                        }
                      }
                    }}
                  />
                )}
              />
            </Grid>

            {/* Status */}
            <Grid item size={{ xs: 12 }}>
              <Controller
                name="status"
                control={control}
                render={({ field }) => (
                  <CustomTextField
                    {...field}
                    select
                    fullWidth
                    size="small"
                    label="Change status"
                    required
                    error={!!errors.status}
                    helperText={errors.status?.message}
                  >
                    <MenuItem value="1">Pending</MenuItem>
                    <MenuItem value="2">Paid</MenuItem>
                    <MenuItem value="3">Partial Paid</MenuItem>
                  </CustomTextField>
                )}
              />
            </Grid>

            {/* Payment Mode */}
            <Grid item size={{ xs: 12 }}>
              <Controller
                name="payment_mode"
                control={control}
                render={({ field }) => (
                  <CustomTextField
                    {...field}
                    select
                    fullWidth
                    size="small"
                    label="Payment mode"
                    error={!!errors.payment_mode}
                    helperText={errors.payment_mode?.message}
                    onChange={(e) => {
                      field.onChange(e.target.value);
                      setPaymentMode(e.target.value);
                    }}
                  >
                    <MenuItem value="1">Cheque</MenuItem>
                    <MenuItem value="2">Demand draft</MenuItem>
                    <MenuItem value="3">NEFT</MenuItem>
                    <MenuItem value="4">Cash</MenuItem>
                  </CustomTextField>
                )}
              />
            </Grid>

            {/* Bank name */}
            {(paymentMode === "1" ||
              paymentMode === "2" ||
              paymentMode === "3") && (
                <Grid item size={{ xs: 12 }}>
                  <Controller
                    name="bank_name"
                    control={control}
                    render={({ field }) => (
                      <CustomTextField
                        {...field}
                        fullWidth
                        size="small"
                        label="Bank name"
                        required
                        error={!!errors.bank_name}
                        helperText={errors.bank_name?.message}
                      />
                    )}
                  />
                </Grid>
              )}

            {/* Cheque */}
            {paymentMode === "1" && (
              <>
                <Grid item size={{ xs: 12 }}>
                  <Controller
                    name="cheque_no"
                    control={control}
                    render={({ field }) => (
                      <CustomTextField
                        {...field}
                        fullWidth
                        size="small"
                        label="Cheque no"
                        required
                        error={!!errors.cheque_no}
                        helperText={errors.cheque_no?.message}
                      />
                    )}
                  />
                </Grid>
                <Grid item size={{ xs: 12 }}>
                  <Controller
                    name="cheque_date"
                    control={control}
                    render={({ field }) => (
                      <CustomTextField
                        {...field}
                        type="date"
                        fullWidth
                        label="Cheque Date"
                        required
                        InputLabelProps={{ shrink: true }}
                        error={!!errors.cheque_date}
                        helperText={errors.cheque_date?.message}
                      />
                    )}
                  />
                </Grid>
              </>
            )}

            {/* Demand Draft */}
            {paymentMode === "2" && (
              <>
                <Grid item size={{ xs: 12 }}>
                  <Controller
                    name="demand_draft_no"
                    control={control}
                    render={({ field }) => (
                      <CustomTextField
                        {...field}
                        fullWidth
                        size="small"
                        label="Demand draft no"
                        required
                        error={!!errors.demand_draft_no}
                        helperText={errors.demand_draft_no?.message}
                      />
                    )}
                  />
                </Grid>
                <Grid item size={{ xs: 12 }}>
                  <Controller
                    name="demand_draft_date"
                    control={control}
                    render={({ field }) => (
                      <CustomTextField
                        {...field}
                        type="date"
                        fullWidth
                        label="Demand Draft Date"
                        required
                        InputLabelProps={{ shrink: true }}
                        error={!!errors.demand_draft_date}
                        helperText={errors.demand_draft_date?.message}
                      />
                    )}
                  />
                </Grid>
              </>
            )}

            {/* NEFT */}
            {paymentMode === "3" && (
              <>
                <Grid item size={{ xs: 12 }}>
                  <Controller
                    name="neft_no"
                    control={control}
                    render={({ field }) => (
                      <CustomTextField
                        {...field}
                        fullWidth
                        size="small"
                        label="NEFT no"
                        required
                        error={!!errors.neft_no}
                        helperText={errors.neft_no?.message}
                      />
                    )}
                  />
                </Grid>
                <Grid item size={{ xs: 12 }}>
                  <Controller
                    name="neft_date"
                    control={control}
                    render={({ field }) => (
                      <CustomTextField
                        {...field}
                        type="date"
                        fullWidth
                        label="NEFT Date"
                        required
                        InputLabelProps={{ shrink: true }}
                        error={!!errors.neft_date}
                        helperText={errors.neft_date?.message}
                      />
                    )}
                  />
                </Grid>
              </>
            )}

            {/* Paid Remark */}
            <Grid item size={{ xs: 12 }}>
              <Controller
                name="paid_remark"
                control={control}
                render={({ field }) => (
                  <CustomTextField
                    {...field}
                    fullWidth
                    size="small"
                    label="Paid remark"
                    multiline
                    rows={3}
                    error={!!errors.paid_remark}
                    helperText={errors.paid_remark?.message}
                  />
                )}
              />
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions className="justify-center">
          <Button variant="contained" type="submit">
            Save
          </Button>
          <Button
            variant="tonal"
            color="secondary"
            onClick={() => {
              setPayDialog(false);
              setPayData();
            }}
          >
            Cancel
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

const ViewMaintenance = ({ open, setIsOpenDetail, selectedZone }) => {
  const { data: session } = useSession();
  const token = session?.user?.token;
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  const [datas1, setData] = useState([]);
  const [rowSelection, setRowSelection] = useState({});
  const [globalFilter, setGlobalFilter] = useState('');
  const [openDialog, setOpenDialog] = useState(false)
  const [payData, setPayData] = useState();
  const [billId, setBillId] = useState()
  const [apartmentId, setApartmentId] = useState()

  const [userBillId, setUserBillId] = useState()

  // Fetch maintenance data
  const fetchMaintenance = async () => {
    try {
      const response = await fetch(`${API_URL}/company/user/bill/${selectedZone._id}`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
      });

      const result = await response.json();

      if (response.ok) {

        setData(result?.data || []);
      } else {
        console.error('Fetch maintenance failed:', result);
      }
    } catch (error) {
      console.error('Fetch maintenance error:', error);
    }
  };

  useEffect(() => {
    if (API_URL && token && selectedZone?._id) {
      fetchMaintenance();
    }
  }, [API_URL, token, selectedZone?._id]);

  const fixedCostMap = useMemo(() => {
    const map = new Map();

    if (Array.isArray(datas1?.fixedCost) && datas1?.fixedCost.length > 0) {

      datas1.fixedCost.forEach((item) => {
        map.set(item.apartment_type, String(item.unit_value || ""));
      });
    } else if (datas1?.fixedCost && typeof datas1.fixedCost === "object") {

      map.set("default", String(datas1.fixedCost.unit_value || ""));
    }

    return map;
  }, [datas1?.fixedCost]);

  // Table columns
  const columns = useMemo(() => [
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

    // Apartment No
    columnHelper.accessor('apartment_no', {
      header: 'Apartment No',
      cell: ({ row }) => (
        <Typography className="capitalize" color="text.primary">
          {row.original?.apartment_no || '-'}
        </Typography>
      ),
    }),
    columnHelper.accessor('tower_name', {
      header: 'Tower Name',
      cell: ({ row }) => (
        <Typography className="capitalize" color="text.primary">
          {row.original?.tower?.name || '-'}
        </Typography>
      ),
    }),
    columnHelper.accessor('floor_name', {
      header: 'Floor Name',
      cell: ({ row }) => (
        <Typography className="capitalize" color="text.primary">
          {row.original?.floor?.floor_name || '-'}
        </Typography>
      ),
    }),
    columnHelper.accessor('user', {
      header: 'User',
      cell: ({ row }) => (
        <Typography className="capitalize" color="text.primary">
          {row.original?.assigned_user?.first_name || '-'} {" "} {row.original?.assigned_user?.last_name || '_'}
        </Typography>
      ),
    }),

    // Total Cost
    columnHelper.accessor('total_cost', {
      header: 'Total amount',
      cell: ({ row }) => {
        const additionalCost = row.original?.user_bills?.[0]?.bill?.additional_cost || [];
        const aprtmentArea = row?.original?.apartment_area
        const apartmentType = row?.original?.apartment_type

        const fixedCost = Array.isArray(datas1?.fixedCost)
          ? Number(fixedCostMap.get(apartmentType))
          : Number(fixedCostMap.get("default") || 0) * Number(aprtmentArea);


        const additionalTotal = additionalCost.reduce((sum, val) => sum + (val.amount || 0), 0);
        const leftCost = row.original?.user_bills?.[0]?.payments?.reduce((sum, p) => sum + p.amount, 0) || 0;
        const finalCost = (Number(fixedCost) + Number(additionalTotal)) - Number(leftCost);

        const totalFinalCost = Number(fixedCost) + Number(additionalTotal);

        return (
          <Typography className="capitalize" color="text.primary">
            {totalFinalCost.toFixed(0)} {" "}
            {finalCost > 0 && (
              <Button
                size='small'
                variant="contained"
                sx={{ ml: 1 }}
                onClick={() => {
                  setBillId(selectedZone.id);
                  setApartmentId(row.original._id)
                  setOpenDialog(true);
                  setUserBillId(row.original?.user_bills?.[0]?._id)
                  setPayData(finalCost);
                }}
                disabled={finalCost <= 0}
              >
                Pay
              </Button>

            )}
          </Typography>
        );
      },
    }),
    columnHelper.accessor('Paid cost', {
      header: 'Paid cost',
      cell: ({ row }) => {

        const leftCost = row.original?.user_bills?.[0]?.payments?.reduce((sum, p) => sum + p.amount, 0) || 0;

        return (
          <Typography className="capitalize" color="text.primary">
            {leftCost}
          </Typography>
        );
      },
    }),

    // Bill Payment Date
    columnHelper.accessor('payment_due_date', {
      header: 'Bill Payment Date',
      cell: ({ row }) => (
        <Typography className="capitalize" color="text.primary">
          {FormatTime(row.original?.user_bills?.[0]?.bill.payment_due_date) || 0 || '-'}
        </Typography>
      ),
    }),
    columnHelper.accessor('status', {
      header: 'Status',
      cell: ({ row }) => {

        const additionalCost = row.original?.user_bills?.[0]?.bill?.additional_cost || [];
        const aprtmentArea = row?.original?.apartment_area
        const apartmentType = row?.original?.apartment_type

        const fixedCost = Array.isArray(datas1?.fixedCost)
          ? Number(fixedCostMap.get(apartmentType))
          : Number(fixedCostMap.get("default") || 0) * Number(aprtmentArea);


        const additionalTotal = additionalCost.reduce((sum, val) => sum + (val.amount || 0), 0);
        const leftCost = row.original?.user_bills?.[0]?.payments?.reduce((sum, p) => sum + p.amount, 0) || 0;
        const finalCost = (Number(fixedCost) + Number(additionalTotal)) - Number(leftCost);

        const totalFinalCost = Number(fixedCost) + Number(additionalTotal);


        return (
          <Typography className="capitalize" component="span" color="text.primary">
            <Chip
              label={leftCost == totalFinalCost.toFixed(0) ? 'Paid' : 'Unpaid'}
              color={leftCost == totalFinalCost.toFixed(0) ? 'success' : 'error'}
              variant="tonal"
              size="small"
            />
          </Typography>
        );
      },
    }),
  ], [datas1]);

  // React table instance
  const table = useReactTable({
    data: datas1?.userBill || [],
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
    getFacetedMinMaxValues: getFacetedMinMaxValues(),
  });

  const rows = table.getFilteredRowModel().rows;

  return (
    <Dialog
      fullWidth
      maxWidth="lg"
      scroll="body"
      open={open}
      sx={{ '& .MuiDialog-paper': { overflow: 'visible' } }}
    >
      <DialogCloseButton onClick={() => setIsOpenDetail(false)}>
        <i className="tabler-x" />
      </DialogCloseButton>

      <DialogTitle>Maintenance Detail</DialogTitle>

      <DialogContent style={{ margin: "4px" }}>
        <Card>
          <CardContent className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-2">
              <Typography>Show</Typography>
              <CustomTextField
                select
                value={table.getState().pagination.pageSize}
                onChange={e => table.setPageSize(Number(e.target.value))}
                className="w-full sm:w-[70px]"
              >
                <MenuItem value={10}>10</MenuItem>
                <MenuItem value={25}>25</MenuItem>
                <MenuItem value={50}>50</MenuItem>
              </CustomTextField>
            </div>
          </CardContent>

          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                {table.getHeaderGroups().map(headerGroup => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map(header => (
                      <th key={header.id}>
                        {header.isPlaceholder ? null : (
                          <div
                            className={classnames(
                              'flex items-center cursor-pointer select-none',
                              { 'justify-between': header.column.getIsSorted() }
                            )}
                            onClick={header.column.getToggleSortingHandler()}
                          >
                            {flexRender(header.column.columnDef.header, header.getContext())}
                            {{
                              asc: <i className="tabler-chevron-up text-xl" />,
                              desc: <i className="tabler-chevron-down text-xl" />
                            }[header.column.getIsSorted()] ?? null}
                          </div>
                        )}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={table.getVisibleFlatColumns().length} className="text-center">
                      No data available
                    </td>
                  </tr>
                ) : (
                  rows.map(row => (
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
        {openDialog && (
          <PayMaintenanceModal
            open={openDialog}
            data={payData}
            userBillId={userBillId}
            setPayDialog={setOpenDialog}
            setPayData={setPayData}
            apartmentId={apartmentId}
            billId={billId}
            fetchZoneData={fetchMaintenance}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};


const BillTable = ({ tableData, fetchZoneData, type }) => {

  const [role, setRole] = useState('')
  const [rowSelection, setRowSelection] = useState({})
  const [data, setData] = useState([])
  const [filteredData, setFilteredData] = useState([])
  const [globalFilter, setGlobalFilter] = useState('')
  const [openDialog, setOpenDialog] = useState(false)
  const [selectedZone, setSelectedZone] = useState(null)
  const [payDialog, setPayDialog] = useState(false)
  const [payData, setPayData] = useState();

  const [isInvoiceOpen, setIsInvoiceOpen] = useState();

  const getPermissions = usePermissionList();
  const [permissions, setPermissions] = useState({});
  const [bill_id, setBillId] = useState()

  const [isOpen, setIsOpen] = useState(false)
  const [paidData, setPaidData] = useState()
  const [isOpenDetail, setIsOpenDetail] = useState(false)
  const [finalCost, setFinalCost] = useState()

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
  }, [getPermissions]); // Include in dependency array

  useEffect(() => {
    if (tableData) {
      setData(tableData)
      setFilteredData(tableData)
    }
  }, [tableData])

  // Role filter effect
  useEffect(() => {
    const filtered = data.filter(user => {
      if (role && user.role !== role) return false

      return true
    })

    setFilteredData(filtered)
  }, [role, data])

  function formatTimes(timestamp) {
    if (!timestamp) return "-";

    const date = new Date(timestamp);

    const options = {
      year: "numeric",
      month: "short", // Jan, Feb, etc.
      day: "2-digit"
    };

    return date.toLocaleDateString("en-US", options);
  }

  const columns = useMemo(() => {
    const baseColumns = [
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
    ];

    if (type === "utilityBills") {
      baseColumns.splice(
        1,
        0,
        columnHelper.accessor("apartment_no", {
          header: "Apartment",
          cell: ({ row }) => (
            <Typography className="capitalize" color="text.primary">
              {row.original.apartment_id.apartment_no}, {row?.original?.apartment_id?.tower_id?.name}, {row?.original?.apartment_id?.floor_id?.floor_name}
            </Typography>
          ),
        })
      );
    }

    if (type === "common-area-bill" || type === "utilityBills") {
      // Replace column at index 2 with Bill Type
      baseColumns.splice(
        2,
        1,
        columnHelper.accessor("bill_type", {
          header: "Bill Type",
          cell: ({ row }) => (
            <Typography className="capitalize" color="text.primary">
              {row.original.bill_type.name}
            </Typography>
          ),
        })
      );

      // Insert Bill Date at index 3
      baseColumns.splice(
        3,
        0,
        columnHelper.accessor("bill_date", {
          header: "Bill Date",
          cell: ({ row }) => (
            <Typography className="capitalize" color="text.primary">
              {formatTimes(row.original.bill_date)}
            </Typography>
          ),
        })
      );

      // Insert Bill Due Date at index 4
      baseColumns.splice(
        4,
        0,
        columnHelper.accessor("bill_due_date", {
          header: "Bill Due Date",
          cell: ({ row }) => (
            <Typography className="capitalize" color="text.primary">
              {formatTimes(row.original.bill_due_date)}
            </Typography>
          ),
        })
      );

      // Insert Bill Amount at index 5
      baseColumns.splice(
        5,
        0,
        columnHelper.accessor("bill_amount", {
          header: "Bill Amount",
          cell: ({ row }) => {
            const totalPaid =
              row.original.payments?.reduce(
                (sum, p) => sum + (p.amount || 0),
                0
              ) || 0;

            const remaining = row.original.bill_amount - totalPaid;

            return (
              <Typography className="capitalize" color="text.primary">
                {row.original.bill_amount}
                {remaining > 0 && (
                  <Button
                    variant="outlined"
                    sx={{ ml: 1 }}
                    onClick={() => {
                      setBillId(row.original._id);
                      setPayDialog(true);
                      setPayData(remaining);
                    }}
                    disabled={remaining <= 0}
                  >
                    Pay
                  </Button>
                )}
              </Typography>
            );
          },
        })
      );

      // Insert Paid Amount at index 6
      baseColumns.splice(
        6,
        0,
        columnHelper.accessor("paid_amount", {
          header: "Paid Amount",
          cell: ({ row }) => {
            const totalPaid =
              row.original.payments?.reduce(
                (sum, p) => sum + (p.amount || 0),
                0
              ) || 0;

            const remaining = totalPaid;

            return (
              <Typography className="capitalize" color="text.primary">
                {remaining > 0
                  ?
                  (
                    <Button onClick={() => {
                      setIsOpen(true)
                      setPaidData(row.original)
                    }}>
                      {remaining}
                    </Button>
                  )
                  :
                  (
                    <>
                      {remaining}
                    </>

                  )}
              </Typography>
            );
          },
        })
      );
    }

    if (type === "maintenance") {
      baseColumns.splice(
        2,
        0,
        columnHelper.accessor("year", {
          header: "Year",
          cell: ({ row }) => (
            <Typography className="capitalize" color="text.primary">
              {row.original.year}
            </Typography>
          ),
        })
      );
      baseColumns.splice(
        3,
        0,
        columnHelper.accessor("month", {
          header: "Month",
          cell: ({ row }) => (
            <Typography className="capitalize" color="text.primary">
              {row.original.month}
            </Typography>
          ),
        })
      );
      baseColumns.splice(
        4,
        0,
        columnHelper.accessor("payment_due_date", {
          header: "Bill Payment Date",
          cell: ({ row }) => (
            <Typography className="capitalize" color="text.primary">
              {row.original.payment_due_date ? formatTimes(row.original.payment_due_date) : ""}
            </Typography>
          ),
        })
      );
      baseColumns.splice(
        5,
        0,
        columnHelper.accessor("additional_cost", {
          header: "Total Additional Cost",
          cell: ({ row }) => {
            const additionalCosts = row.original.additional_cost || [];

            const total = additionalCosts.reduce(
              (sum, item) => sum + (Number(item.amount) || 0),
              0
            );

            return (
              <Typography className="capitalize" color="text.primary">
                {total}
              </Typography>
            );
          },
        })
      );
    }

    if (
      type === "common-area-bill" ||
      type === "utilityBills"
    ) {
      // Status column
      baseColumns.splice(
        9,
        0,
        columnHelper.accessor("status", {
          header: "Status",
          cell: ({ row }) => (
            <Chip
              label={row.original.status ? "Paid" : "Unpaid"}
              color={row.original.status ? "success" : "error"}
              variant="tonal"
              size="small"
            />
          ),
        })
      );
    }


    if (
      (type === "common-area-bill" ||
        type === "utilityBills" ||
        type === "maintenance") && (
        permissions?.['hasBillingInvoicePermission'] || permissions?.['hasBillingEditPermission'] || permissions?.['hasBillingViewPermission']
      )
    ) {

      // Actions column
      baseColumns.splice(
        10,
        0,
        columnHelper.accessor("action", {
          header: "Action",
          cell: ({ row }) => {

            const totalPaid =
              row.original.payments?.reduce(
                (sum, p) => sum + (p.amount || 0),
                0
              ) || 0;

            const remaining = row.original.bill_amount - totalPaid;

            return (
              <div className="flex items-center">
                <OptionMenu
                  iconButtonProps={{ size: "medium" }}
                  iconClassName="text-textSecondary"
                  options={[

                    ...(permissions?.hasBillingEditPermission
                      ? [
                        {
                          text: "Edit Bill",
                          icon: "tabler-edit",
                          menuItemProps: {
                            className:
                              "flex items-center gap-2 text-textSecondary",
                            onClick: () => {
                              setSelectedZone(row.original);
                              setOpenDialog(true);
                            },
                          },
                        },
                      ]
                      : []),

                    ...(type !== "maintenance" &&
                      permissions?.hasBillingInvoicePermission
                      ? [
                        {
                          text: "Invoice",
                          icon: "tabler-report",
                          menuItemProps: {
                            className:
                              "flex items-center gap-2 text-textSecondary",
                            onClick: () => {
                              setSelectedZone(row.original);
                              setIsInvoiceOpen(true);
                              setFinalCost(remaining)
                            },
                          },
                        },
                      ]
                      : []),

                    ...(type === "maintenance" && permissions?.['hasBillingViewPermission']
                      ? [
                        {
                          text: "View",
                          icon: "tabler-eye",
                          menuItemProps: {
                            className:
                              "flex items-center gap-2 text-textSecondary",
                            onClick: () => {
                              setIsOpenDetail(true);
                              setSelectedZone(row.original);
                            },
                          },
                        },
                      ]
                      : []),
                  ]}
                />
              </div>
            )
          },
          enableSorting: false,
        })
      )

    }

    return baseColumns;
  }, [permissions, type]);

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
            placeholder='Search Bill'
          />
          {permissions && permissions?.['hasBillingAddPermission'] && (type == 'maintenance' || type == "common-area-bill" || type == "utilityBills") && (
            <Button
              variant="contained"
              size="small"
              onClick={() => setOpenDialog(true)}
              className='max-sm:is-full min-is-[250px]'

            >
              Add Bill
            </Button>
          )}
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

      {/* Role Dialog */}
      {openDialog && (
        <BillDialog
          open={openDialog}
          setOpen={setOpenDialog}
          selectedZone={selectedZone}
          fetchZoneData={fetchZoneData}
          tableData={tableData}
          type={type}
        />
      )}
      {payDialog && (
        <PayModal
          data={payData}
          open={payDialog}
          setPayDialog={setPayDialog}
          fetchZoneData={fetchZoneData}
          setPayData={setPayData}
          type={type}
          billId={bill_id}
        />
      )}

      {isOpen && (
        <PaidAmountModal
          setIsOpen={setIsOpen}
          open={isOpen}
          data={paidData}
        />
      )}
      {isInvoiceOpen && (
        <ViewInvoiceModal
          selectedZone={selectedZone}
          setIsInvoiceOpen={setIsInvoiceOpen}
          open={isInvoiceOpen}
          finalCost={finalCost}
        />
      )}
      {isOpenDetail && (
        <ViewMaintenance open={isOpenDetail} setIsOpenDetail={setIsOpenDetail} selectedZone={selectedZone} />
      )}
    </Card>
  )
}


export default BillTable
