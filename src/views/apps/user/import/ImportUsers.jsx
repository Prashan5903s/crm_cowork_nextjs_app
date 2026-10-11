// -------------------- React & Core --------------------
import React, { useEffect, useMemo, useState } from 'react';

// -------------------- MUI Components --------------------
import {
  Button,
  Typography,
  Card,
  CardHeader,
  CardContent,
  Alert,
  AlertTitle,
  Avatar,
  List,
  ListItem,
  IconButton,
  LinearProgress,
  TablePagination,
  MenuItem,
  Checkbox,
  ListItemText,
  CircularProgress
} from '@mui/material';


// -------------------- External Libraries --------------------
import * as XLSX from 'xlsx';
import { useDropzone } from 'react-dropzone';
import { toast } from 'react-toastify';
import { object, string, minLength, array } from 'valibot';
import { useForm, Controller } from 'react-hook-form';
import { valibotResolver } from '@hookform/resolvers/valibot';
import classnames from 'classnames';
import { useSession } from 'next-auth/react';

// -------------------- React Table --------------------
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getFacetedMinMaxValues,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { rankItem } from '@tanstack/match-sorter-utils';

// -------------------- MUI Custom Components --------------------
import CustomTextField from '@core/components/mui/TextField';
import CustomAvatar from '@core/components/mui/Avatar';

// -------------------- Internal Imports --------------------
import { useApi } from '../../../../utils/api';
import tableStyles from '@core/styles/table.module.css';
import AppReactDropzone from '@/libs/styles/AppReactDropzone';
import TablePaginationComponent from '@/components/TablePaginationComponent';
import ImportSuccessDialog from '@/components/dialogs/user/import-success-dialog/page';


//import { ExpectedStudentExcelHeaders, ExpectedStudentExcelHeadersWithoutBatchId } from '@/configs/customDataConfig';
const CHUNK_SIZE = 1;

const schema = object({
  roles: array(
    string([minLength(1, 'Each role must be at least 1 character')]),
    [minLength(1, 'At least one role must be selected')]
  )
});

const fuzzyFilter = (row, columnId, value, addMeta) => {
  // Rank the item
  const itemRank = rankItem(row.getValue(columnId), value)

  // Store the itemRank info
  addMeta({
    itemRank
  })

  // Return if the item should be filtered in/out
  return itemRank.passed
}

const columnHelper = createColumnHelper()

const ImportUsers = ({ batch, onBack }) => {

  const [data, setData] = useState([]);
  const [uploadData, setUploadData] = useState([]);
  const [missingHeadersData, setMissingHeaders] = useState([]);
  const [fileInput, setFileInput] = useState(null);
  const [loading, setLoading] = useState(false); // Loading state
  const [isProgress, setIsProgress] = useState(false); // Loading state
  const [openSuccessDialog, setOpenSuccessDialog] = useState(false); // Loading state
  const [progress, setProgress] = useState(0); // Progress state
  const [roles, setRoles] = useState([]); // Progress state
  const { data: session } = useSession();
  const { doGet, doPost } = useApi();
  const [selectedRoles, setSelectedRoles] = useState([]);
  const [showError, setShowError] = useState();
  const [userRoles, setUserRoles] = useState([]);

  const token = session?.user?.token;

  const {
    control,
    formState: { errors }
  } = useForm({
    resolver: valibotResolver(schema),
    defaultValues: {
      roles: []
    }
  });

  const { getRootProps, getInputProps } = useDropzone({

    // maxFiles: 1,
    multiple: false,
    maxSize: 2000000,
    accept: {
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
    },

    onDrop: (acceptedFiles) => {

      setFileInput(null);
      setMissingHeaders([]);
      setLoading(true); // Start loading
      setProgress(0); // Reset progress
      setData([]);

      const reader = new FileReader();

      reader.onload = async (e) => {
        if (e.target?.result) {
          try {
            const arrayBuffer = e.target.result;
            const workbook = XLSX.read(new Uint8Array(arrayBuffer), { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet);

            // Validate header
            const requiredHeaders = [
              'SRNO', 'Email', 'FirstName', 'LastName', 'PhoneNo', 'Password', 'ParticipationType',
              'EmpID', 'Address', 'Country', 'State', 'City', 'PinCode', 'LicenseNo', 'Status'
            ];

            // const optionalHeaders = [
            //   'URNNumber', 'ApplicationNo', 'Designation', 'Department',
            //   'EmployeeType', '', 'Zone', 'Region', 'Branch', 'Website'
            // ];

            // Now only validate required headers
            const headers = XLSX.utils.sheet_to_json(worksheet, { header: 1 })[0];
            const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));

            // After checking for missingHeaders
            if (missingHeaders.length > 0) {
              setMissingHeaders(missingHeaders);
              setLoading(false);
              
              return;
            }

            // Validate required header values
            const rowsWithMissingValues = [];

            jsonData.forEach((row, rowIndex) => {
              requiredHeaders.forEach((header) => {
                const value = row[header];
                
                if (value === undefined || value === null || value.toString().trim() === '') {
                  rowsWithMissingValues.push({ row: rowIndex + 2, header });
                  
                  // +2 because Excel rowIndex starts from 0, and row 1 is the header
                }
              });
            });

            if (rowsWithMissingValues.length > 0) {

              const errorMsg = rowsWithMissingValues
                .map(r => `"${r.header}"`)
                .join(', ');

              const msgError = "Missing value in row: " + errorMsg

              setShowError(msgError)

              setLoading(false);
              
              return;
            } else {
              setShowError()
            }

            // Validate Excel duplicate emails
            const seen = new Set();
            const duplicates = new Set();

            for (const row of jsonData) {

              const email = (row.Email || '').toLowerCase().trim();

              if (!email) continue;

              if (seen.has(email)) {
                duplicates.add(email);
              } else {
                seen.add(email);
              }
            }

            if (duplicates.size > 0) {

              toast.error(`Duplicate emails found in Excel: ${Array.from(duplicates).join(', ')}`);
              setLoading(false);

              return;
            }

            setData([]);
            setUploadData(jsonData);
            setFileInput(acceptedFiles[0]);
          } catch (error) {
            console.error('Error processing the Excel file:', error);
            toast.error('Error in processing the Excel file.', {
              hideProgressBar: false
            });
          }
        }
      };

      reader.onerror = (error) => {
        console.error('Error reading the file:', error);
        setLoading(false); // End loading
        setProgress(0); // Reset progress on error
        setUploadData([]);
        setData([]);
      };

      reader.onprogress = (event) => {
        if (event.loaded && event.total) {
          //const percentCompleted = Math.round((event.loaded / event.total) * 100);
          setProgress(0); // Update progress
        }
      };

      if (acceptedFiles[0]) {
        reader.readAsArrayBuffer(acceptedFiles[0]); // Read the file as an ArrayBuffer
      }
    },
    onDropRejected: (rejectedFiles) => {
      setLoading(false); // End loading
      setProgress(0); // Reset progress on error
      setUploadData([]);
      setData([]);

      const errorMessage = rejectedFiles.map(file => {

        if (file.errors.length > 0) {

          return file.errors.map(error => {
            switch (error.code) {
              case 'file-invalid-type':
                return `Invalid file type for ${file.file.name}.`;
              case 'file-too-large':
                return `File ${file.file.name} is too large.`;
              case 'too-many-files':
                return `Too many files selected.`;
              default:
                return `Error with file ${file.file.name}.`;
            }
          }).join(' ');
        }

        return `Error with file ${file.file.name}.`;
      });

      errorMessage.map(error => {
        toast.error(error, {
          hideProgressBar: false
        });
      })

    }
  });

  const getRoles = async () => {
    const roleData = await doGet(`company/role`);
    
    setRoles(roleData);
  }

  const handleRemoveFile = () => {
    setData([]);
    setFileInput(null)
    setUploadData([]);
    setLoading(false);
  }

  useEffect(() => {
    getRoles();
  }, [getRoles]);

  const handleUploadData = async () => {
    try {

      if (userRoles.length == 0) {

        setShowError(`Please choose the role first`)
        setLoading(false);

        return;

      } else {
        setShowError()
      }

      setIsProgress(true);

      const jsonData = uploadData;

      const totalChunks = Math.ceil(jsonData.length / CHUNK_SIZE);

      const final_url = `${process.env.NEXT_PUBLIC_API_URL}/admin/users/import`;

      for (let i = 0; i < totalChunks; i++) {
        const chunk = jsonData.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);

        const res = await fetch(final_url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ chunk, roles: userRoles }),
        });

        const result = await res.json();

        if (!res.ok) {

          throw new Error(result.message || 'Import failed');
        }

        const percent = Math.round(((i + 1) / totalChunks) * 100);

        setData(prev => [...prev, ...result.data.data]);

        setProgress(percent);

        if (percent == 100) {
          setOpenSuccessDialog(true);
          setUploadData([]);
          setUserRoles([]);
          setIsProgress(false);
        }
      }

    } catch (error) {
      console.error('Error processing the Excel file:', error);
      toast.error('Error in processing the Excel file.', {
        hideProgressBar: false
      });

      setLoading(false); // End loading
      setProgress(0); // Reset progress on error
      setUploadData([]);
      setData([]);
      setIsProgress(false);
    }

  }

  const columns = useMemo(
    () => [
      {
        id: 'serialNumber', // Serial number column
        header: 'S.No.',
        cell: ({ row }) => <Typography>{row.original.SRNO}</Typography>
      },
      columnHelper.accessor('Import Status', {
        header: 'Imported',
        cell: ({ row }) => {
          const hasErrors = row.original?.errors && Object.keys(row.original.errors).length > 0;

          return (
            <Typography color='text.primary'>
              <CustomAvatar skin='light' color={!hasErrors ? 'success' : 'error'}>
                <i className={!hasErrors ? 'tabler-circle-check' : 'tabler-circle-x'} />
              </CustomAvatar>
            </Typography>
          );
        }
      }),

      columnHelper.accessor('FirstName', {
        header: 'First Name',
        cell: ({ row }) => (
          <div className='flex items-center gap-4'>
            <div className='flex flex-col'>
              <Typography color='text.primary' >
                {row.original.FirstName}
              </Typography>
              <Typography variant='body2' color="error">{row.original?.error}</Typography>
            </div>
          </div>
        )
      }),


      columnHelper.accessor('LastName', {
        header: 'Last Name',
        cell: ({ row }) => (
          <div className="flex flex-col">
            <Typography color='text.primary' >
              {row.original.LastName}
            </Typography>
            <Typography variant='body2'>{row.original?.error}</Typography>
          </div>
        )
      }),

      columnHelper.accessor('Email', {
        header: 'Email',
        cell: ({ row }) => (
          <div className="flex flex-col">
            <Typography color='text.primary' >
              {row.original.Email}
            </Typography>
            <Typography variant='body2' color='#FF0000'>{row.original?.errors?.email}</Typography>
          </div>
        )
      }),
      columnHelper.accessor('PhoneNo', {
        header: 'Phone',
        cell: ({ row }) => (
          <div className="flex flex-col">
            <Typography color='text.primary' >
              {row.original.PhoneNo}
            </Typography>
            <Typography variant='body2' color='#FF0000'>{row.original?.errors?.phone}</Typography>
          </div>
        )
      }),

      columnHelper.accessor('EmpId', {
        header: 'EmpID',
        cell: ({ row }) => (
          <div className="flex flex-col">
            <Typography color='text.primary' >
              {row.original.EmpID}
            </Typography>
            <Typography variant='body2' color="#FF0000">{row.original?.errors?.emp_id}</Typography>
          </div>
        )
      }),

      columnHelper.accessor('Country', {
        header: 'Country',
        cell: ({ row }) => (
          <div className="flex flex-col">
            <Typography color='text.primary' >
              {row.original.Country}
            </Typography>
            <Typography variant='body2' color="#FF0000">{row.original?.errors?.country}</Typography>
          </div>
        )
      }),

      columnHelper.accessor('State', {
        header: 'State',
        cell: ({ row }) => (
          <div className="flex flex-col">
            <Typography color='text.primary' >
              {row.original.State}
            </Typography>
            <Typography variant='body2' color="#FF0000">{row.original?.errors?.state}</Typography>
          </div>
        )
      }),

      columnHelper.accessor('City', {
        header: 'City',
        cell: ({ row }) => (
          <div className="flex flex-col">
            <Typography color='text.primary' >
              {row.original.City}
            </Typography>
            <Typography variant='body2' color="#FF0000">{row.original?.errors?.city}</Typography>
          </div>
        )
      }),

      columnHelper.accessor('Designation', {
        header: 'Designation',
        cell: ({ row }) => (
          <div className="flex flex-col">
            <Typography color='text.primary' >
              {row.original.Designation}
            </Typography>
            <Typography variant='body2' color="#FF0000">{row.original?.errors?.designation}</Typography>
          </div>
        )
      }),

      columnHelper.accessor('Department', {
        header: 'Designation',
        cell: ({ row }) => (
          <div className="flex flex-col">
            <Typography color='text.primary' >
              {row.original.Department}
            </Typography>
            <Typography variant='body2' color="#FF0000">{row.original?.errors?.department}</Typography>
          </div>
        )
      }),

      columnHelper.accessor('ParticipationType', {
        header: 'ParticipationType',
        cell: ({ row }) => (
          <div className="flex flex-col">
            <Typography color='text.primary' >
              {row.original.ParticipationType}
            </Typography>
            <Typography variant='body2' color="#FF0000">{row.original?.errors?.participationType}</Typography>
          </div>
        )
      }),

      columnHelper.accessor('EmployeeType', {
        header: 'EmployeeType',
        cell: ({ row }) => (
          <div className="flex flex-col">
            <Typography color='text.primary' >
              {row.original.EmployeeType}
            </Typography>
            <Typography variant='body2' color="#FF0000">{row.original?.errors?.employeeType}</Typography>
          </div>
        )
      }),

      columnHelper.accessor('Zone', {
        header: 'Zone',
        cell: ({ row }) => (
          <div className="flex flex-col">
            <Typography color='text.primary' >
              {row.original.Zone}
            </Typography>
            <Typography variant='body2' color="#FF0000">{row.original?.errors?.zone}</Typography>
          </div>
        )
      }),

      columnHelper.accessor('Region', {
        header: 'Region',
        cell: ({ row }) => (
          <div className="flex flex-col">
            <Typography color='text.primary' >
              {row.original.Region}
            </Typography>
            <Typography variant='body2' color="#FF0000">{row.original?.errors?.zone}</Typography>
          </div>
        )
      }),

      columnHelper.accessor('Branch', {
        header: 'Branch',
        cell: ({ row }) => (
          <div className="flex flex-col">
            <Typography color='text.primary' >
              {row.original.Branch}
            </Typography>
            <Typography variant='body2' color="#FF0000">{row.original?.errors?.zone}</Typography>
          </div>
        )
      }),

      columnHelper.accessor('Status', {
        header: 'Status',
        cell: ({ row }) => (
          <div className="flex flex-col">
            <Typography color='text.primary' >
              {row.original.Status}
            </Typography>
          </div>
        )
      }),
    ],

    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  )

  const table = useReactTable({
    data: data,
    columns,
    filterFns: {
      fuzzy: fuzzyFilter
    },
    initialState: {
      pagination: {
        pageSize: 10
      }
    },
    enableRowSelection: true,
    globalFilterFn: fuzzyFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    getFacetedMinMaxValues: getFacetedMinMaxValues()
  })

  const tableItems = (
    <>
      <div className='overflow-x-auto'>
        <table className={tableStyles.table}>
          <thead>
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <th key={header.id}>
                    {header.isPlaceholder ? null : (
                      <>
                        <div
                          className={classnames({
                            'flex items-center': header.column.getIsSorted(),
                            'cursor-pointer select-none': header.column.getCanSort()
                          })}
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {(
                            {
                              asc: <i className="tabler-chevron-up text-xl" />,
                              desc: <i className="tabler-chevron-down text-xl" />
                            }[header.column.getIsSorted?.()] ?? null
                          )}

                        </div>
                      </>
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          {table.getFilteredRowModel().rows.length === 0 ? (
            <tbody>
              <tr>
                <td colSpan={table.getVisibleFlatColumns().length} className='text-center'>
                  No data available
                </td>
              </tr>
            </tbody>
          ) : (
            <tbody>
              {table
                .getRowModel()
                .rows.slice(0, table.getState().pagination.pageSize)
                .map(row => {
                  return (
                    <tr key={row.id} className={classnames({ selected: row.getIsSelected() })}>
                      {row.getVisibleCells().map(cell => (
                        <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                      ))}
                    </tr>
                  )
                })}
            </tbody>
          )}
        </table>
      </div>
      <TablePagination
        component={() => <TablePaginationComponent table={table} />}
        count={table.getFilteredRowModel().rows.length}
        rowsPerPage={table.getState().pagination.pageSize}
        page={table.getState().pagination.pageIndex}
        onPageChange={(_, page) => {
          table.setPageIndex(page)
        }}
      />
    </>
  )

  return (
    <>
      <Card>
        <CardHeader
          title='Import Users'
          action={
            <Button onClick={onBack} variant="outlined" color="primary" size='small'>
              Back
            </Button>
          }
          className='pbe-4'
        />
        <CardContent>
          <div className="flex gap-2 flex-col">
            {showError ? (
              <Alert severity='error'>
                {showError}
              </Alert>
            ) : (

              <Alert severity='info'>
                Note: Allowed only Excel files with *.xls or *.xlsx extension.
              </Alert>
            )}

            {missingHeadersData.length > 0 &&
              <Alert severity='error'
                action={
                  <IconButton size='small' color='inherit' aria-label='close' onClick={() => setMissingHeaders([])}>
                    <i className='tabler-x' />
                  </IconButton>
                }
              >
                <AlertTitle>Missing Headers:</AlertTitle>
                {missingHeadersData.join(', ')}
              </Alert>
            }
            <Typography>Use the same format as given below :<Button className='ml-2' variant='contained' href="/sample/users_import.xlsx" download="Users Sample File">Download</Button></Typography>
            <Controller
              name="roles"
              control={control}
              defaultValue={[]} // ensure it's initialized as an array
              render={({ field }) => (
                <CustomTextField
                  {...field}
                  select
                  fullWidth
                  label="Assign role*"
                  value={userRoles}  // array of role IDs
                  error={!!errors.roles}
                  helperText={errors.roles?.message}
                  slotProps={{
                    select: {
                      multiple: true,
                      onChange: (event) => {
                        const value = event.target.value;

                        setUserRoles(value);
                        field.onChange(value); // update react-hook-form state
                      },
                      renderValue: (selectedIds) => {
                        const selectedNames = roles.filter(role => selectedIds.includes(role._id)).map(role => role.name);

                        return selectedNames.join(', ');
                      }
                    }
                  }}
                >
                  {roles?.length > 0 ? (
                    roles.map((role, index) => (
                      <MenuItem key={index} value={role._id}>
                        <Checkbox checked={userRoles.includes(role._id)} />
                        <ListItemText primary={role.name} />
                      </MenuItem>
                    ))
                  ) : (
                    <MenuItem disabled>No roles</MenuItem>
                  )}
                </CustomTextField>

              )}
            />
          </div>
        </CardContent>
        <div className='overflow-x-auto'>
          <table className={tableStyles.table}>
            <thead>
              {/* <tr>
                {batch ?
                  ExpectedStudentExcelHeadersWithoutBatchId.map((header, index) => (
                    <th key={index}>{header}</th>
                  ))
                  :
                  ExpectedStudentExcelHeaders.map((header, index) => (
                    <th key={index}>{header}</th>
                  ))
                }
              </tr> */}
            </thead>
            <tbody>
              {/* <tr>
                <td colSpan={ExpectedStudentExcelHeaders.length} className='text-center'></td>
              </tr> */}
            </tbody>
          </table>
        </div>
        <CardContent>
          <AppReactDropzone>
            <div {...getRootProps({ className: 'dropzone' })}>
              <input {...getInputProps()} />
              <div className='flex items-center flex-col'>
                <Avatar variant='rounded' className='bs-12 is-12 mbe-9'>
                  <i className='tabler-upload' />
                </Avatar>
                <Typography variant='h4' className='mbe-2.5'>
                  Drop files here or click to upload.
                </Typography>
                <Typography>Allowed *.xls, *.xlsx</Typography>
                <Typography>Max 1 file and max size of 2 MB</Typography>
              </div>
            </div>
            {loading && (
              <div className='flex items-center gap-3'>
                <div className='is-full'>
                  <LinearProgress variant='determinate' color='success' value={progress} />
                </div>
                <Typography variant='body2' color='text.secondary' className='font-medium'>{`${progress}%`}</Typography>
              </div>
            )}
            {fileInput ? (
              <>
                <List>
                  <ListItem>
                    <div className='file-details'>
                      <div className='file-preview'><i className='vscode-icons-file-type-excel w-6 h-6' /></div>
                      <div>
                        <Typography className='file-name'>{fileInput.name}</Typography>
                        <Typography className='file-size' variant='body2'>
                          {Math.round(fileInput.size / 100) / 10 > 1000
                            ? `${(Math.round(fileInput.size / 100) / 10000).toFixed(1)} mb`
                            : `${(Math.round(fileInput.size / 100) / 10).toFixed(1)} kb`}
                        </Typography>
                      </div>
                    </div>
                    <IconButton onClick={() => handleRemoveFile()}>
                      <i className='tabler-x text-xl' />
                    </IconButton>
                  </ListItem>
                </List>
                <div className='flex gap-4 mt-4'>
                  <Button variant='contained' color='warning' onClick={handleRemoveFile} endIcon={<i className='tabler-trash' />}>
                    Remove
                  </Button>

                  <Button variant='contained' onClick={handleUploadData} disabled={uploadData.length === 0 || isProgress} startIcon={<i className='tabler-send' />}>
                    {isProgress ? (
                      <CircularProgress
                        size={24}
                        sx={{
                          color: 'white',
                          position: 'absolute',
                          top: '50%',
                          left: '50%',
                          marginTop: '-12px',
                          marginLeft: '-12px',
                        }}
                      />
                    ) : (
                      'Start Import'
                    )}
                  </Button>
                  {/* <Button color='error' variant='outlined'  onClick={handleRemoveFile}>
                    Remove All
                  </Button>
                  <Button variant='contained' onClick={handleUploadData} disabled={uploadData.length === 0}>Import Users</Button> */}
                </div>
              </>
            ) : null}
          </AppReactDropzone>
        </CardContent>
        {data.length > 0 ? tableItems : ''}
      </Card >
      <ImportSuccessDialog open={openSuccessDialog} setOpen={setOpenSuccessDialog} />
    </>

  );
};

export default ImportUsers;
