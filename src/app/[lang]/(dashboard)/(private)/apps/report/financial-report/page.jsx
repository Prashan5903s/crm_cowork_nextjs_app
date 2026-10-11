'use client'

import { useState, useEffect, useMemo, useCallback, useRef } from "react";

import { useSession } from "next-auth/react";

import {
  Checkbox,
  Box,
  Stack,
  Card,
  Dialog,
  TextField,
  Button,
  MenuItem,
  CardContent,
  Typography,
} from '@mui/material';

import { Controller, useForm } from "react-hook-form";

import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
} from '@tanstack/react-table';

import classnames from 'classnames';

import dayjs from 'dayjs'

import AppReactDatepicker from '@/libs/styles/AppReactDatepicker';

import FormatTime from '@/utils/formatTime';

import DialogCloseButton from '@/components/dialogs/DialogCloseButton';

import TablePaginationComponent from '@components/TablePaginationComponent';

import tableStyles from '@core/styles/table.module.css';


const columnHelper = createColumnHelper();

// Paid Amount Modal
const PaidAmountModal = ({ open, data, setIsOpen }) => {


  const columns = useMemo(() => [
    columnHelper.accessor("sn_no", {
      header: "SNo",
      cell: ({ row }) => row.index + 1
    }),
    columnHelper.accessor("user", {
      header: "User",
      cell: ({ row }) => {


        if (data?.apartment_id?.assigned_to) {
          return `${data?.apartment_id?.assigned_to.first_name} ${data?.apartment_id?.assigned_to.last_name}`;
        } else if (row?.original?.user_bill_id?.user_id) {
          return `${row?.original?.user_bill_id?.user_id?.first_name} ${row?.original?.user_bill_id?.user_id?.last_name}`;
        } else {
          return "-";
        }
      }
    }),
    columnHelper.accessor("amount", {
      header: "Paid Amount",
      cell: ({ row }) => row.original.amount
    }),
    columnHelper.accessor("payment_date", {
      header: "Payment date",
      cell: ({ row }) => FormatTime(row?.original?.created_at)
    })
  ], [data]);

  const table = useReactTable({
    data: data?.payments || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

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
      <Card>
        <table className={tableStyles.table}>
          <thead>
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <th key={header.id}>
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map(row => (
              <tr key={row.id}>
                {row.getVisibleCells().map(cell => (
                  <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                ))}
              </tr>
            ))}
            {table.getRowModel().rows.length === 0 && (
              <tr>
                <td colSpan={columns.length} className="text-center">No data available</td>
              </tr>
            )}
          </tbody>
        </table>
        <TablePaginationComponent table={table} />
      </Card>
    </Dialog>
  );
};

// Financial Report
const FinancialReport = () => {

  const { data: session } = useSession() || {};
  const token = session?.user?.token;
  const URL = process.env.NEXT_PUBLIC_API_URL;

  const [type, setType] = useState("all");
  const [isOpen, setIsOpen] = useState(false);
  const [filteredData, setFilteredData] = useState([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [rowSelection, setRowSelection] = useState({});
  const [paidData, setPaidData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const myDateRef = useRef(null);

  const { control, formState: { errors } } = useForm()

  const [startDateRange, setStartDateRange] = useState(
    dayjs().startOf("day").toDate()
  );

  const [endDateRange, setEndDateRange] = useState(
    dayjs().endOf("day").toDate()
  );

  // Fetch API
  const fetchTablePaymentData = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${URL}/company/table/financial/report/${startDateRange.toISOString()}/${endDateRange.toISOString()}/${type}`,
        { method: "GET", headers: { Authorization: `Bearer ${token}` } }
      );

      const result = await response.json();

      if (response.ok) setFilteredData(result.data || []);
      else setError(result?.message || "Something went wrong");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [URL, startDateRange, endDateRange, type, token]);

  useEffect(() => {
    if (URL && token) fetchTablePaymentData();
  }, [URL, token, startDateRange, endDateRange, type, fetchTablePaymentData]);

  const fixedCostMap = useMemo(() => {
    const map = new Map();

    if (Array.isArray(filteredData?.fixedCost) && filteredData?.fixedCost.length > 0) {

      filteredData.fixedCost.forEach((item) => {
        map.set(item.apartment_type, String(item.unit_value || ""));
      });
    } else if (filteredData?.fixedCost && typeof filteredData.fixedCost === "object") {

      map.set("default", String(filteredData.fixedCost.unit_value || ""));
    }

    return map;
  }, [filteredData?.fixedCost]);

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

  // Columns
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
    columnHelper.accessor("apartment_no", { header: "Apartment No", cell: ({ row }) => row.original.apartment_id?.apartment_no || "-" }),
    columnHelper.accessor("bill_types", { header: "Bill Type", cell: ({ row }) => row.original.bill_id?.bill_data_type || row.original.bill_data_type }),
    columnHelper.accessor("total_amounts", {
      header: "Total Amount", cell: ({ row }) => {

        const map = new Map();

        const additionalCost = row?.original?.bill_id?.additional_cost
          ?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;

        const apartType = row?.original?.apartment_id?.apartment_type;

        const apartArea = row?.original?.apartment_id?.apartment_area;

        const fixedCost = Array.isArray(filteredData?.fixedCost)
          ? Number(fixedCostMap.get(apartType))
          : Number(fixedCostMap.get("default") || 0) * Number(apartArea);

        const finalCost = Number(fixedCost) + Number(additionalCost);

        return <Typography>{finalCost.toFixed(0)}</Typography>

      }
    }),
    columnHelper.accessor("paid_amountss", {
      header: "Paid Amount",
      cell: ({ row }) => {
        const totalPaid = row.original?.payments?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;

        return (
          <Button
            disabled={totalPaid === 0}
            onClick={() => {
              setPaidData(row.original);
              setIsOpen(true);
            }}
          >
            {totalPaid}
          </Button>
        );
      },
    }),
    columnHelper.accessor("bill_date", { header: "Bill Date", cell: ({ row }) => formatTimes(row.original.bill_date) }),
    columnHelper.accessor("bill_due_date", {
      header: "Bill Due Date", cell: ({ row }) => {
        if (row?.original?.bill_id?.additional_cost) {
          return formatTimes(row.original?.bill_id?.payment_due_date)
        } else {
          return formatTimes(row.original.bill_due_date)
        }
      }
    }),
    columnHelper.accessor("created_at", { header: "Created At", cell: ({ row }) => formatTimes(row.original.created_at) }),
  ], [filteredData]);

  const tableData = useMemo(() => (type === "all" || type === "maintenance" ? filteredData?.userBill || [] : filteredData || []), [filteredData, type]);

  // Table hook at top level
  const table = useReactTable({
    data: tableData,
    columns,
    state: { rowSelection, globalFilter },
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  return (
    <>
      <Card>
        <CardContent className="flex justify-between flex-col gap-4 items-start sm:flex-row sm:items-center">
          <div className="flex items-center gap-2">
            <Typography>Show</Typography>
            <TextField select value={table.getState().pagination.pageSize} onChange={e => table.setPageSize(Number(e.target.value))} size="small">
              <MenuItem value={10}>10</MenuItem>
              <MenuItem value={25}>25</MenuItem>
              <MenuItem value={50}>50</MenuItem>
            </TextField>
          </div>

          <div className="flex gap-4 flex-row">
            <Controller
              name="date"
              control={control}
              render={({ field }) => (
                <AppReactDatepicker
                  todayButton="Today"
                  selectsRange
                  fullWidth
                  monthsShown={2}
                  startDate={field.value?.[0] || startDateRange}
                  endDate={field.value?.[1] || endDateRange}
                  onChange={(dates) => {
                    const [start, end] = dates

                    setStartDateRange(start)
                    setEndDateRange(end)
                    field.onChange(dates) // react-hook-form को update करें
                  }}
                  showYearDropdown
                  showMonthDropdown
                  dateFormat="yyyy/MM/dd"
                  placeholderText="YYYY/MM/DD"
                  customInput={
                    <TextField
                      size="small"
                      fullWidth
                      style={{ width: "200px" }}
                      label="Date"
                      error={!!errors?.date}
                      helperText={errors?.date?.message}
                      inputRef={myDateRef} // ref यहां लगाएं
                    />
                  }
                />
              )}
            />

            <TextField
              select
              style={{ width: "200px" }}
              fullWidth
              size="small"
              required
              label="Bill Type"
              value={type}
              onChange={(e) => setType(e.target.value)}
            >
              <MenuItem value="" disabled>
                Select Bill Type
              </MenuItem>
              <MenuItem value="all">All</MenuItem>
              <MenuItem value="utilityBills">Utility Bill</MenuItem>
              <MenuItem value="common-area-bill">Common Area Bill</MenuItem>
              <MenuItem value="maintenance">Maintenance</MenuItem>
            </TextField>
          </div>
        </CardContent>

        <div className="overflow-x-auto">
          <table className={tableStyles.table}>
            <thead>
              {table.getHeaderGroups().map(hg => (
                <tr key={hg.id}>{hg.headers.map(h => <th key={h.id}>{flexRender(h.column.columnDef.header, h.getContext())}</th>)}</tr>
              ))}
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={columns.length} className="text-center">Loading...</td></tr>
              ) : error ? (
                <tr><td colSpan={columns.length} className="text-center">{error}</td></tr>
              ) : table.getRowModel().rows.length === 0 ? (
                <tr><td colSpan={columns.length} className="text-center">No data available</td></tr>
              ) : table.getRowModel().rows.map(row => (
                <tr key={row.id} className={classnames({ selected: row.getIsSelected() })}>
                  {row.getVisibleCells().map(cell => <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <TablePaginationComponent table={table} />
      </Card>

      {isOpen && <PaidAmountModal open={isOpen} setIsOpen={setIsOpen} data={paidData} />}
    </>
  );
};

export default FinancialReport;
