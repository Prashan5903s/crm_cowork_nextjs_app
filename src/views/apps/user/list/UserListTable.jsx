'use client'

// -------------------- React Imports --------------------
import { useEffect, useState, useMemo } from 'react'

// -------------------- Next.js Imports --------------------
import { useRouter, useParams } from 'next/navigation'

// -------------------- MUI Imports --------------------
import {
  Card,
  ListItemText,
  MenuItem,
  FormControlLabel,
  Switch,
  Typography,
  Checkbox,
  Button,
  TablePagination
} from '@mui/material'

// -------------------- External Libraries --------------------
import { toast } from 'react-toastify'
import classnames from 'classnames'
import { rankItem } from '@tanstack/match-sorter-utils'

// -------------------- React Table Imports --------------------
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

// -------------------- Dialog & View Components --------------------
import UpdatePasswordDialog from '@components/dialogs/user/update-password-dialog/page'
import DeleteUserDialog from '@components/dialogs/user/delete-user-dialog/page'
import ManageEmpCodeDialog from '@/components/dialogs/user/manage-emp-code-dialog'
import ImportUsers from '../../../../views/apps/user/import/ImportUsers'

// -------------------- Local/Custom Components --------------------
import OptionMenu from '@core/components/option-menu'
import TablePaginationComponent from '@components/TablePaginationComponent'
import CustomTextField from '@core/components/mui/TextField'
import CustomAvatar from '@core/components/mui/Avatar'

// -------------------- Utilities --------------------
import { getInitials } from '@/utils/getInitials'
import { useApi } from '../../../../utils/api'
import { usePermissionList } from '@/utils/getPermission'

// -------------------- Styles --------------------
import tableStyles from '@core/styles/table.module.css'

// -------------------- Helper Functions --------------------
const fuzzyFilter = (row, columnId, value, addMeta) => {
  const itemRank = rankItem(row.getValue(columnId), value)

  addMeta({ itemRank })

  return itemRank.passed
}

const DebouncedInput = ({ value: initialValue, onChange, debounce = 500, ...props }) => {
  const [value, setValue] = useState(initialValue ?? '')

  useEffect(() => setValue(initialValue ?? ''), [initialValue])

  useEffect(() => {
    const timeout = setTimeout(() => onChange(value), debounce)

    return () => clearTimeout(timeout)
  }, [value, debounce, onChange])

  return <CustomTextField {...props} value={value} onChange={e => setValue(e.target.value)} />
}

// -------------------- Column Helper --------------------
const columnHelper = createColumnHelper()

// -------------------- Main Component --------------------
const UserListTable = ({
  userData = [],
  roleData = [],
  filterUser = [],
  setFilterUser = () => { },
  loadData = () => { },
  setIsUserCardShow = () => { },
  getStatsCount = () => { }
}) => {

  const [rowSelection, setRowSelection] = useState({})
  const [data, setData] = useState([])
  const [filteredData, setFilteredData] = useState([])
  const [globalFilter, setGlobalFilter] = useState('')
  const [open, setOpen] = useState(false)
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false)
  const [openManageEmpCodeDialog, setManageEmpCodeDialog] = useState(false)
  const [openImportWindow, setOpenImportWindow] = useState(false)
  const [user, setUser] = useState(null)
  const [permissions, setPermissions] = useState({})

  const { doPostFormData } = useApi()
  const public_url = process.env.NEXT_PUBLIC_ASSETS_URL
  const router = useRouter()
  const { lang: locale } = useParams()

  const getPermissions = usePermissionList()

  useEffect(() => {
    const fetchPermissions = async () => {
      try {
        const result = await getPermissions()

        setPermissions(result || {})
      } catch (error) {
        console.error('Error fetching permissions:', error)
      }
    }

    if (getPermissions) fetchPermissions()
  }, [getPermissions])

  // actions
  const updateNewPasswordhandle = (row) => {
    setUser(row)
    setOpen(true)
  }

  const handleImportDialog = () => {
    setOpenImportWindow(true)
    setIsUserCardShow(false)
  }

  const onBack = () => {
    setOpenImportWindow(false)
    setIsUserCardShow(true)
    loadData()
    getStatsCount()
  }

  const handleStatusChange = async (userId, status) => {
    const endpoint = `admin/user/status/update/${userId}`

    await doPostFormData({
      endpoint,
      values: { status },
      method: 'PUT',
      onSuccess: (response) => {
        toast.success(response.message, { autoClose: 2000 })
        getStatsCount()
      },
      onError: () => { }
    })
  }

  // Ensure filterUser is always an array (parent should pass array; fallback here)
  useEffect(() => {
    const roleFilterArr = Array.isArray(filterUser) ? filterUser : filterUser ? [filterUser] : []

    // keep raw data
    setData(userData ?? [])

    // start with userData
    let result = Array.isArray(userData) ? [...userData] : []

    // Apply role(s) filter (role_id._id)
    if (roleFilterArr.length > 0) {
      result = result.filter((u) =>
        Array.isArray(u.roles) &&
        u.roles.some((r) => roleFilterArr.includes(r.role_id?._id))
      )
    }

    // Apply global text search (basic fields: first_name, last_name, email, phone)
    if (globalFilter && String(globalFilter).trim() !== '') {
      const gf = String(globalFilter).toLowerCase()

      result = result.filter((u) => {

        const name = `${u.first_name ?? ''} ${u.last_name ?? ''}`.toLowerCase()
        const email = (u.email ?? '').toLowerCase()
        const phone = (u.phone ?? '').toLowerCase()

        return name.includes(gf) || email.includes(gf) || phone.includes(gf)

      })
    }

    setFilteredData(result)
  }, [userData, filterUser, globalFilter])

  // -------------------- Avatars --------------------
  const getAvatar = ({ avatar, fullName }) => {
    if (avatar) return <CustomAvatar src={`${public_url}/uploads/images/${avatar}`} size={34} />

    return <CustomAvatar size={34}>{getInitials(fullName)}</CustomAvatar>
  }

  // -------------------- Table Columns --------------------
  const columns = useMemo(
    () => [
      {
        id: 'select',
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
        )
      },
      columnHelper.accessor('first_name', {
        header: 'User',
        cell: ({ row }) => (
          <div className="flex items-center gap-4">
            {getAvatar({
              avatar: row.original.photo,
              fullName: `${row.original.first_name} ${row.original.last_name}`
            })}
            <div className="flex flex-col">
              <Typography color="text.primary" className="font-medium">
                {`${row.original.first_name ?? ''} ${row.original.last_name ?? ''}`}
              </Typography>
              <Typography variant="body2">{row.original.email}</Typography>
            </div>
          </div>
        )
      }),
      columnHelper.accessor('email', {
        header: 'Email',
        cell: ({ row }) => <Typography>{row.original.email}</Typography>
      }),
      columnHelper.accessor('phone', {
        header: 'Phone',
        cell: ({ row }) => <Typography>{row.original.phone}</Typography>
      }),
      columnHelper.accessor('apartment_data', {
        header: 'Apartment',
        cell: ({ row }) => {
          const apartments = row.original.apartment_data || []

          return (

            <Typography variant="body2" component="div">
              {apartments.length > 0 ? (
                apartments.map((item, index) => {
                  const aptNo = item.apartment_id?.apartment_no || 'N/A'
                  const towerName = item.apartment_id?.tower_id?.name || 'N/A'
                  const floorName = item.apartment_id?.floor_id?.floor_name || 'N/A'

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
      columnHelper.accessor('roles', {
        header: 'Role',
        cell: ({ row }) => {
          const roles = row.original.roles || []

          return (
            <div className="flex flex-wrap gap-1">
              {roles.length > 0 ? (
                roles.map((r) => (
                  <Typography
                    key={r._id}
                    variant="body2"
                    className="bg-gray-100 text-gray-800 px-2 py-1 rounded-md"
                  >
                    {r.role_id?.name || 'N/A'}
                  </Typography>
                ))
              ) : (
                <Typography variant="body2" color="textSecondary">
                  No Roles
                </Typography>
              )}
            </div>
          )
        }
      }),
      columnHelper.accessor('status', {
        header: 'Status',
        cell: ({ row }) =>
          permissions?.hasUserStatusPermission ? (
            <FormControlLabel
              control={
                <Switch
                  defaultChecked={row.original.status}
                  color="success"
                  onChange={(e) => handleStatusChange(row.original.id, e.target.checked)}
                  size="medium"
                />
              }
            />
          ) : null
      }),
      columnHelper.accessor('action', {
        header: 'Action',
        cell: ({ row }) => {
          const options = [
            ...(permissions?.hasUserEditPermission
              ? [
                {
                  text: 'Edit account',
                  icon: 'tabler-edit',
                  menuItemProps: {
                    className: 'flex items-center gap-2 text-textSecondary',
                    onClick: () => router.push(`/${locale}/apps/user/form/${row.original._id}`)
                  }
                }
              ]
              : []),
            {
              text: 'Update password',
              icon: 'tabler-lock',
              menuItemProps: {
                className: 'flex items-center gap-2 text-textSecondary',
                onClick: () => updateNewPasswordhandle(row.original)
              }
            }
          ]

          return (
            <div className="flex items-center">
              <OptionMenu iconButtonProps={{ size: 'medium' }} iconClassName="text-textSecondary" options={options} />
            </div>
          )
        },
        enableSorting: false
      })
    ],
    [permissions, router, locale]
  )

  // -------------------- Table Instance --------------------
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

  // -------------------- Render --------------------
  return (
    <>
      {openImportWindow ? (
        <ImportUsers batch={[]} onBack={onBack} />
      ) : (
        <Card className="shadow-sm rounded-2xl overflow-hidden">
          {/* ---------- Filter Bar ---------- */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-6 border-b border-gray-200 bg-gray-50">
            {/* Left Controls */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full sm:w-auto">
              {/* Page Size */}
              <CustomTextField
                select
                size="small"
                label="Rows per page"
                value={table.getState().pagination.pageSize}
                onChange={e => table.setPageSize(Number(e.target.value))}
                className="w-full sm:w-[120px]"
              >
                <MenuItem value="10">10</MenuItem>
                <MenuItem value="25">25</MenuItem>
                <MenuItem value="50">50</MenuItem>
              </CustomTextField>

              {/* Role Filter (multi-select) */}
              <CustomTextField
                select
                size="small"
                label="Filter by Role"
                value={filterUser}
                onChange={(e) =>
                  setFilterUser(
                    typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value
                  )
                }
                SelectProps={{ multiple: true }}
                className="w-full sm:w-[220px]"
              >
                {roleData?.length > 0 ? (
                  roleData.map((role, index) => (
                    <MenuItem key={index} value={role._id}>
                      <Checkbox checked={filterUser.includes(role._id)} />
                      <ListItemText primary={role.name} />
                    </MenuItem>
                  ))
                ) : (
                  <MenuItem disabled>No roles</MenuItem>
                )}
              </CustomTextField>
            </div>

            {/* Right Controls */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full sm:w-auto">
              {/* Search */}
              <DebouncedInput
                value={globalFilter ?? ''}
                onChange={(value) => setGlobalFilter(String(value))}
                placeholder="Search user..."
                className="w-full sm:w-[220px]"
              />

              {/* Import */}
              {permissions?.hasUserImportPermission && (
                <Button
                  variant="outlined"
                  startIcon={<i className="tabler-upload" />}
                  onClick={handleImportDialog}
                  className="w-full sm:w-auto"
                >
                  Import
                </Button>
              )}

              {/* Add User */}
              {permissions?.hasUserAddPermission && (
                <Button
                  variant="contained"
                  startIcon={<i className="tabler-plus" />}
                  onClick={() => router.push(`/${locale}/apps/user/form`)}
                  className="w-full sm:w-auto"
                >
                  Add User
                </Button>
              )}
            </div>
          </div>

          {/* ---------- Table Section ---------- */}
          <div className="overflow-x-auto">
            <table className={`${tableStyles.table} w-full`}>
              <thead className="bg-gray-100">
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <th
                        key={header.id}
                        className="px-4 py-3 text-left text-sm font-medium text-gray-700 border-b"
                      >
                        {header.isPlaceholder ? null : (
                          <div
                            className={classnames({
                              'flex items-center justify-between': header.column.getIsSorted(),
                              'cursor-pointer select-none': header.column.getCanSort()
                            })}
                            onClick={header.column.getToggleSortingHandler()}
                          >
                            {flexRender(header.column.columnDef.header, header.getContext())}
                            {{
                              asc: <i className="tabler-chevron-up text-lg" />,
                              desc: <i className="tabler-chevron-down text-lg" />
                            }[header.column.getIsSorted()] ?? null}
                          </div>
                        )}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>

              {table.getFilteredRowModel().rows.length === 0 ? (
                <tbody>
                  <tr>
                    <td
                      colSpan={table.getVisibleFlatColumns().length}
                      className="text-center text-gray-500 py-8"
                    >
                      No data available
                    </td>
                  </tr>
                </tbody>
              ) : (
                <tbody>
                  {table.getRowModel().rows.map((row) => (
                    <tr
                      key={row.id}
                      className={classnames('hover:bg-gray-50 transition-colors duration-100', {
                        'bg-gray-100': row.getIsSelected()
                      })}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <td key={cell.id} className="px-4 py-3 border-b text-sm text-gray-700">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              )}
            </table>
          </div>

          {/* ---------- Pagination ---------- */}
          <div className="border-t border-gray-200 bg-gray-50">
            <TablePagination
              component={() => <TablePaginationComponent table={table} />}
              count={table.getFilteredRowModel().rows.length}
              rowsPerPage={table.getState().pagination.pageSize}
              page={table.getState().pagination.pageIndex}
              onPageChange={(_, page) => table.setPageIndex(page)}
            />
          </div>

          {/* ---------- Dialogs ---------- */}
          <UpdatePasswordDialog open={open} setOpen={setOpen} data={user} />
          <DeleteUserDialog open={openDeleteDialog} setOpen={setOpenDeleteDialog} user={user} loadData={loadData} />
          <ManageEmpCodeDialog open={openManageEmpCodeDialog} setOpen={setManageEmpCodeDialog} user={user} loadData={loadData} />
        </Card>
      )}
    </>
  )
}

export default UserListTable
