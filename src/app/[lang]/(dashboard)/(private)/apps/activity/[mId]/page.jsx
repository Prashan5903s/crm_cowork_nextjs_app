'use client'

import { createHash } from "crypto";

import { useEffect, useState, useMemo, useCallback } from "react"

import { useRouter } from "next/navigation"

import { useParams } from "next/navigation"

import Error from "next/error"

import { useSession } from "next-auth/react"

import ReactPlayer from 'react-player'

import JSZip from 'jszip'

import { rankItem } from '@tanstack/match-sorter-utils'

import { XMLParser } from 'fast-xml-parser'

import classnames from 'classnames'

import {
    Box,
    Button,
    Card,
    InputBase,
    Dialog,
    DialogActions,
    CardContent,
    List,
    ListItem,
    Avatar,
    FormControlLabel,
    Radio,
    LinearProgress,
    RadioGroup,
    Checkbox,
    Typography,
    IconButton,
    TextField,
    DialogTitle,
    MenuItem,
    Switch,
    Alert,
    InputAdornment,
    Tab,
    DialogContent,
    CircularProgress,
} from '@mui/material'

import Grid from '@mui/material/Grid2'

import { useDropzone } from 'react-dropzone'

import { valibotResolver } from '@hookform/resolvers/valibot'

import {
    object,
    string,
    pipe,
    maxLength,
    minLength,
    regex
} from 'valibot'

import {
    createColumnHelper,
    flexRender,
    getCoreRowModel,
    useReactTable,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel
} from '@tanstack/react-table'

import { useForm, Controller } from 'react-hook-form'

import { TabContext, TabList, TabPanel } from "@mui/lab"

import { toast } from "react-toastify"

import * as XLSX from 'xlsx';

import DatePicker from "react-datepicker";

import "react-datepicker/dist/react-datepicker.css";

import tableStyles from '@core/styles/table.module.css'

import TablePaginationComponent from '@components/TablePaginationComponent'

import PermissionGuard from "@/hocs/PermissionClientGuard"

import AppReactDropzone from '@/libs/styles/AppReactDropzone'

import DialogCloseButton from "@/components/dialogs/DialogCloseButton"

import CustomTextField from "@/@core/components/mui/TextField"

const ENCRYPTION_KEY = Buffer.from(process.env.NEXT_PUBLIC_ENCRYPTION_KEY, "base64");

function normalizeEmail(email) {

    return email.trim().toLowerCase();
}

function hash(text) {

    return createHash("sha256").update(text).digest("hex");
}

const ImportQuizModal = ({ open, onClose, activityId, handleClose }) => {

    const API_URL = process.env.NEXT_PUBLIC_API_URL;
    const { data: session } = useSession();
    const token = session?.user?.token;

    const router = useRouter()

    const [missingHeaders, setMissingHeaders] = useState([])
    const [validationErrors, setValidationErrors] = useState([])

    const [fileInput, setFileInput] = useState();
    const [progress, setProgress] = useState(0);
    const [uploadData, setUploadData] = useState();
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState([]);
    const [srNoArr, setSRNOArr] = useState([])
    const [rowSelection, setRowSelection] = useState({})
    const [globalFilter, setGlobalFilter] = useState('')
    const { mId: mId, lang: lang } = useParams();

    const columnHelper = createColumnHelper()

    const DebouncedInput = ({ value: initialValue, onChange, debounce = 500, ...props }) => {
        const [value, setValue] = useState(initialValue)


        useEffect(() => { setValue(initialValue) }, [initialValue])
        useEffect(() => {
            const timeout = setTimeout(() => { onChange(value) }, debounce)

            return () => clearTimeout(timeout)
        }, [value])

        return <CustomTextField {...props} value={value} onChange={e => setValue(e.target.value)} />
    }

    const fuzzyFilter = (row, columnId, value, addMeta) => {
        const itemRank = rankItem(row.getValue(columnId), value)

        addMeta({ itemRank })

        return itemRank.passed
    }

    const handleRemoveFile = () => {
        setData([]);
        setFileInput(null)
        setUploadData([]);
        setValidationErrors([])
        setMissingHeaders([])
        setLoading(false);
    }

    const { getRootProps, getInputProps } = useDropzone({
        multiple: false,
        maxSize: 2000000,
        accept: {
            'application/vnd.ms-excel': ['.xls'],
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
        },
        onDrop: (acceptedFiles) => {

            setFileInput(null);
            setMissingHeaders([]);
            setValidationErrors([]);
            setLoading(true);
            setProgress(0);
            setData([]);
            setUploadData([]); // reset previous data on new upload

            const reader = new FileReader();

            reader.onload = async (e) => {
                if (e.target?.result) {
                    try {
                        const arrayBuffer = e.target.result;
                        const workbook = XLSX.read(new Uint8Array(arrayBuffer), { type: 'array' });
                        const sheetName = workbook.SheetNames[0];
                        const worksheet = workbook.Sheets[sheetName];
                        const jsonData = XLSX.utils.sheet_to_json(worksheet);

                        //Validate header
                        const headers = XLSX.utils.sheet_to_json(worksheet, { header: 1 })[0];
                        const requiredHeaders = ['Sno', 'Question', 'Option 1', 'Option 2', 'Option 3', 'Option 4', 'Option 5', 'Option 6', 'Correct Answer', 'Difficulty Level', 'Section', 'Answer Explanation'];
                        const missingHeadersList = requiredHeaders.filter(h => !headers.includes(h));

                        if (missingHeadersList.length > 0) {
                            setMissingHeaders(missingHeadersList);
                            setLoading(false);

                            return;
                        }

                        //Validate difficulty level, correct answer, and length constraints
                        let difficultyErrors = [];
                        let correctAnswerErrors = [];
                        let lengthErrors = [];

                        jsonData.forEach((row, index) => {
                            const rowNum = index + 2;
                            const difficulty = row['Difficulty Level']?.toString().trim();
                            const correctAnswer = row['Correct Answer']?.toString().trim();
                            const section = row['Section']?.toString().trim() || '';
                            const answerExplanation = row['Answer Explanation']?.toString().trim() || '';
                            const question = row['Question']?.toString().trim() || '';

                            // Difficulty level check
                            if (!['1', '2', '3'].includes(difficulty)) {
                                difficultyErrors.push(`Row ${rowNum}: Difficulty Level must be 1, 2, or 3`);
                            }

                            //Correct answer check
                            if (!['1', '2', '3', '4', '5', '6'].includes(correctAnswer)) {
                                correctAnswerErrors.push(`Row ${rowNum}: Correct Answer must be 1–6`);
                            }

                            //Section length check
                            if (section.length > 10) {
                                lengthErrors.push(`Row ${rowNum}: Section length must not exceed 10 characters`);
                            }

                            //Answer Explanation length check
                            if (answerExplanation.length > 500) {
                                lengthErrors.push(`Row ${rowNum}: Answer Explanation length must not exceed 500 characters`);
                            }

                            //Question length check
                            if (question.length > 500) {
                                lengthErrors.push(`Row ${rowNum}: Question length must not exceed 500 characters`);
                            }
                        });

                        if (difficultyErrors.length > 0 || correctAnswerErrors.length > 0 || lengthErrors.length > 0) {
                            const allErrors = [...difficultyErrors, ...correctAnswerErrors, ...lengthErrors];

                            setValidationErrors(allErrors);
                            setLoading(false);

                            return;
                        }

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
                        toast.error('Error in processing the Excel file.', { hideProgressBar: false });
                    }
                }
            };

            reader.onerror = (error) => {
                console.error('Error reading the file:', error);
                setLoading(false);
                setProgress(0);
                setUploadData([]);
                setData([]);
            };

            if (acceptedFiles[0]) {
                reader.readAsArrayBuffer(acceptedFiles[0]);
            }
        },
        onDropRejected: (rejectedFiles) => {
            setLoading(false);
            setProgress(0);
            setUploadData([]);
            setData([]);
            rejectedFiles.forEach(file => {
                file.errors.forEach(error => {
                    switch (error.code) {
                        case 'file-invalid-type':
                            toast.error(`Invalid file type for ${file.file.name}`);
                            break;
                        case 'file-too-large':
                            toast.error(`File ${file.file.name} is too large.`);
                            break;
                        default:
                            toast.error(`Error with file ${file.file.name}`);
                    }
                });
            });
        }
    });

    const handleDialogClose = () => {
        onClose();
    }

    const submitAnswer = async (data) => {
        try {
            const response = await fetch(
                `${API_URL}/company/quiz/question/${mId}/${activityId}`,
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(data)
                }
            );

            // Try to parse JSON only if there is content
            let datas = null;
            const text = await response.text();

            if (text) {
                try {
                    datas = JSON.parse(text);
                } catch (err) {
                    console.error("Invalid JSON from server:", text);
                    throw err;
                }
            }

            if (response.ok) {
                router.replace(`/${lang}/apps/quiz/${mId}/${activityId}`)
                toast.success(`Quiz has been imported`, {
                    autoClose: 900
                })
                onClose()
                handleClose()
            } else {
                console.error("Error:", datas || response.statusText);
            }

        } catch (error) {
            console.error("Submit answer error:", error);
            throw error;
        }
    };

    const handleUploadData = () => {
        if (uploadData.length > 0) {
            submitAnswer(uploadData).then(() => {
                // Clear everything after save
                setData([]);
                setFileInput(null);
                setUploadData([]);
                setValidationErrors([]);
                setMissingHeaders([]);
                setLoading(false);
                setProgress(0);
                setRowSelection({});
                setGlobalFilter('');
            });
        }
    };

    const columns = useMemo(() => [
        columnHelper.accessor('Sno', { header: 'Sno', cell: info => <Typography>{info.getValue()}</Typography> }),
        columnHelper.accessor('Question', { header: 'Question', cell: info => <Typography>{info.getValue()}</Typography> }),
        columnHelper.accessor('Option 1', { header: 'Option 1', cell: info => <Typography>{info.getValue()}</Typography> }),
        columnHelper.accessor('Option 2', { header: 'Option 2', cell: info => <Typography>{info.getValue()}</Typography> }),
        columnHelper.accessor('Option 3', { header: 'Option 3', cell: info => <Typography>{info.getValue()}</Typography> }),
        columnHelper.accessor('Option 4', { header: 'Option 4', cell: info => <Typography>{info.getValue()}</Typography> }),
        columnHelper.accessor('Option 5', { header: 'Option 5', cell: info => <Typography>{info.getValue()}</Typography> }),
        columnHelper.accessor('Option 6', { header: 'Option 6', cell: info => <Typography>{info.getValue()}</Typography> }),
        columnHelper.accessor('Difficulty Level', { header: 'Difficulty Level', cell: info => <Typography>{info.getValue()}</Typography> }),
        columnHelper.accessor('Correct Answer', { header: 'Correct Answer', cell: info => <Typography>{info.getValue()}</Typography> }),
        columnHelper.accessor('Section', { header: 'Section', cell: info => <Typography>{info.getValue()}</Typography> }),
        columnHelper.accessor('Answer Explanation', { header: 'Answer Explanation', cell: info => <Typography>{info.getValue()}</Typography> }),
    ], [srNoArr]);

    const table = useReactTable({
        data: uploadData || [],
        columns,
        state: { rowSelection, globalFilter },
        filterFns: { fuzzy: fuzzyFilter },
        globalFilterFn: fuzzyFilter,
        onRowSelectionChange: setRowSelection,
        onGlobalFilterChange: setGlobalFilter,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getPaginationRowModel: getPaginationRowModel()
    })

    const TableImportComponent = () => (
        <Card className='mt-4'>
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
                        <MenuItem value={200}>200</MenuItem>
                    </CustomTextField>
                </div>
                <DebouncedInput
                    value={globalFilter ?? ''}
                    className='max-sm:is-full min-is-[250px]'
                    onChange={value => setGlobalFilter(String(value))}
                    placeholder='Search Question'
                />
            </CardContent>
            <div className='overflow-x-auto'>
                <table className={tableStyles.table}>
                    <thead>
                        {table.getHeaderGroups().map(headerGroup => (
                            <tr key={headerGroup.id}>
                                {headerGroup.headers.map(header => (
                                    <th key={header.id}>
                                        <div
                                            className={classnames({
                                                'flex items-center': true,
                                                'cursor-pointer': header.column.getCanSort()
                                            })}
                                            onClick={header.column.getToggleSortingHandler()}
                                        >
                                            {flexRender(header.column.columnDef.header, header.getContext())}
                                            {header.column.getIsSorted() === 'asc' && <i className='tabler-chevron-up text-xl' />}
                                            {header.column.getIsSorted() === 'desc' && <i className='tabler-chevron-down text-xl' />}
                                        </div>
                                    </th>
                                ))}
                            </tr>
                        ))}
                    </thead>
                    <tbody>
                        {table.getRowModel().rows.length === 0 ? (
                            <tr>
                                <td colSpan={columns.length} className='text-center'>No data available</td>
                            </tr>
                        ) : (
                            table.getRowModel().rows.map(row => (
                                <tr key={row.id}>
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
    )

    return (
        <Dialog fullWidth maxWidth='md' scroll='body' open={open} onClose={onClose} sx={{ '& .MuiDialog-paper': { overflow: 'visible' } }}>
            <DialogCloseButton onClick={onClose}><i className="tabler-x" /></DialogCloseButton>
            <DialogTitle variant='h4' className='text-center'>Import Users</DialogTitle>

            <Card>
                <CardContent>
                    <Alert severity='info'>Note: Allowed only Excel files with *.xls or *.xlsx extension.</Alert>
                    {missingHeaders.length > 0 && (
                        <Alert severity='error'>Missing Headers: {missingHeaders.join(', ')}</Alert>
                    )}
                    {validationErrors.length > 0 && (
                        <Alert severity='error' className='mt-2'>
                            {validationErrors.map((err, idx) => <div key={idx}>{err}</div>)}
                        </Alert>
                    )}
                    <Typography className='mt-3'>
                        Use this format:
                        <span style={{ marginLeft: '0.5rem' }}>
                            <Button variant='outlined' href="/sample/QuizSection.xlsx" download>Download sample file</Button>
                        </span>
                    </Typography>
                </CardContent>

                <CardContent>
                    <AppReactDropzone>
                        <div {...getRootProps()} className='dropzone'>
                            <input {...getInputProps()} />
                            <div className='flex items-center flex-col'>
                                <Avatar variant='rounded' className='bs-12 is-12 mbe-9'><i className='tabler-upload' /></Avatar>
                                <Typography variant='h4'>Drop files here or click to upload</Typography>
                                <Typography>Allowed *.xls, *.xlsx – Max 2 MB</Typography>
                            </div>
                        </div>

                        {loading && <LinearProgress variant='determinate' color='success' value={progress} />}

                        {fileInput && (
                            <List className='mt-3'>
                                <ListItem>
                                    <div className='file-details'>
                                        <div className='file-preview'><i className='vscode-icons-file-type-excel w-6 h-6' /></div>
                                        <Typography>{fileInput.name}</Typography>
                                    </div>
                                    <IconButton onClick={handleRemoveFile}><i className='tabler-x text-xl' /></IconButton>
                                </ListItem>
                            </List>
                        )}

                        {uploadData && uploadData.length > 0 && <TableImportComponent />}
                    </AppReactDropzone>
                </CardContent>
            </Card>

            <DialogActions className='justify-center'>
                {uploadData && uploadData.length > 0 && missingHeaders.length === 0 && validationErrors.length === 0 && (
                    <Button variant='contained' onClick={handleUploadData}>Start Import</Button>
                )}
                <Button variant='tonal' type='button' color='secondary' onClick={handleDialogClose}>Close</Button>
            </DialogActions>
        </Dialog>
    )
}

const QuizCard = ({ title, onClick, badge }) => {
    return (
        <div
            className="relative bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition cursor-pointer w-64 text-center"
            onClick={onClick}
        >
            {badge && (
                <span className="absolute top-3 right-3 bg-green-500 text-white text-xs px-2 py-0.5 rounded-full">
                    {badge}
                </span>
            )}

            {title === 'Import from Spreadsheet' && (
                <svg xmlns="http://www.w3.org/2000/svg" fill="green" viewBox="0 0 24 24" width="40" height="40">
                    <path d="M6 2h9l5 5v15a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z" fill="#34a853" />
                    <path d="M14 2v6h6" fill="#2c7" />
                    <path fill="#fff" d="M8 10h8v2H8zm0 3h8v2H8z" />
                </svg>
            )}

            {title === 'Create Manually' && (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" stroke="dodgerblue" strokeWidth="2" viewBox="0 0 24 24" width="40" height="40">
                    <path d="M12 5v14M5 12h14" strokeLinecap="round" />
                </svg>
            )}

            <p className="text-sm font-semibold text-gray-800">{title}</p>
        </div>
    );
};

const ShowFileModal = ({ open, setOpen, docURL }) => {

    const router = useRouter()
    const ASSET_URL = process.env.NEXT_PUBLIC_ASSETS_URL
    const fullURL = `${ASSET_URL}/activity/${docURL}`
    const ext = docURL?.split('.').pop()?.toLowerCase()
    const backURL = '/activities'

    const [isOnlineEnv, setIsOnlineEnv] = useState(false)

    useEffect(() => {
        if (typeof window !== 'undefined') {
            setIsOnlineEnv(!window.location.origin.includes('localhost'))
        }
    }, [])

    const handleClose = () => setOpen(false)

    const isPDF = ext === 'pdf'
    const isOfficeFile = ['doc', 'docx', 'ppt', 'pptx'].includes(ext)

    const officeViewerURL = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(fullURL)}`
    const googleViewerURL = `https://docs.google.com/gview?url=${encodeURIComponent(fullURL)}&embedded=true`

    return (
        <Dialog open={open} fullWidth maxWidth="md" onClose={handleClose}>
            <DialogTitle>Document Preview</DialogTitle>

            <DialogContent dividers sx={{ minHeight: 600 }}>
                {isPDF ? (
                    <iframe
                        src={fullURL}
                        style={{ width: '100%', height: '100%', minHeight: '600px', border: 'none' }}
                        title="PDF Viewer"
                    />
                ) : isOfficeFile && isOnlineEnv ? (
                    <iframe
                        src={officeViewerURL}
                        style={{ width: '100%', height: '100%', minHeight: '600px', border: 'none' }}
                        title="Office Viewer"
                    />
                ) : isOfficeFile && !isOnlineEnv ? (
                    <iframe
                        src={googleViewerURL}
                        style={{ width: '100%', height: '100%', minHeight: '600px', border: 'none' }}
                        title="Google Viewer"
                    />
                ) : (
                    <Typography variant="body2">
                        File preview not supported.{' '}
                        <a href={fullURL} target="_blank" rel="noopener noreferrer">
                            Click here to download
                        </a>
                    </Typography>
                )}
            </DialogContent>

            <DialogActions sx={{ justifyContent: 'center', gap: 2, mt: "18px" }}>
                <Button variant="contained">Submit</Button>
                <Button
                    variant="outlined"
                    color="error"
                    onClick={() => {
                        handleClose()
                    }}
                >
                    Cancel
                </Button>
            </DialogActions>
        </Dialog>
    )
}

const ActivityModal = ({ open, id, setISOpen, editData, API_URL, token, mId, activityId, fetchActivities }) => {

    const { lang } = useParams();

    const [preview, setPreview] = useState()
    const [imageError, setImageError] = useState()
    const [loading, setLoading] = useState(false)
    const [file, setFile] = useState()

    const [isModalOpen, setIsModalOpen] = useState(false);

    const isYoutube = id == '688723af5dd97f4ccae68836'
    const isVideo = id == '688723af5dd97f4ccae68835'
    const isScrom = id == '688723af5dd97f4ccae68837'
    const isQuiz = id == '68886902954c4d9dc7a379bd';

    const router = useRouter();

    const schema = object({
        title: pipe(
            string(),
            minLength(1, 'Title is required'),
            maxLength(100, 'Title can be max of 100 characters'),
            regex(/^[A-Za-z0-9\s]+$/, 'Only letters and numbers allowed')
        ),
        live_session_type: pipe(),
        video_url: (isYoutube || isVideo)
            ? pipe(
                minLength(1, 'Video URL is required'),
                maxLength(200, 'Video URL too long'),
                regex(/^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/[^\s]+$/, 'Enter a valid YouTube URL')
            )
            : pipe()
    })

    const {
        reset,
        control,
        watch,
        handleSubmit,
        formState: { errors }
    } = useForm({
        resolver: valibotResolver(schema),
        defaultValues: {
            title: '',
            video_url: '',
            live_session_type: ''
        }
    })

    useEffect(() => {
        if (editData && open) {
            if (isYoutube || isVideo) {
                reset({
                    title: editData?.video_data?.title || '',
                    video_url: editData?.video_data?.video_url || '',
                    live_session_type: ''
                })
            } else if (isScrom) {
                reset({
                    title: editData?.scrom_data?.title,
                    video_url: '',
                    live_session_type: ''
                })
            } else {
                reset({
                    title: editData?.title || '',
                    video_url: '',
                    live_session_type: ''
                })
                setPreview(editData?.file_url)
            }
        }
    }, [editData, id, open, isYoutube, isVideo, reset])

    const getFileConfig = () => {
        if (id === '688723af5dd97f4ccae68834') {
            return {
                accept: {
                    'application/pdf': ['.pdf'],
                    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
                    'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
                    'application/msword': ['.doc']
                },
                maxSize: 5 * 1024 * 1024,
                type: 'Document'
            }
        }

        if (id === '688723af5dd97f4ccae68835') {
            return {
                accept: { 'video/mp4': ['.mp4'] },
                maxSize: 500 * 1024 * 1024,
                type: 'Video'
            }
        }

        if (id === '688723af5dd97f4ccae68837') {
            return {
                accept: { 'application/zip': ['.zip'] },
                maxSize: 500 * 1024 * 1024,
                type: 'SCORM Content'
            }
        }

        if (id === '688723af5dd97f4ccae68836') {
            return { type: 'Youtube videos' }
        }

        if (isQuiz) {
            return {
                accept: { 'application/zip': ['.zip'] },
                maxSize: 500 * 1024 * 1024,
                type: 'Objective Quiz'
            }
        }

        return { accept: {}, maxSize: 0, type: '' }
    }

    const fileConfig = getFileConfig()

    const { getRootProps, getInputProps } = useDropzone({
        multiple: false,
        maxSize: fileConfig.maxSize,
        accept: fileConfig.accept,
        onDrop: async (acceptedFiles) => {
            if (acceptedFiles && !acceptedFiles.length) return
            const selectedFile = acceptedFiles[0]

            setFile(null)
            setImageError('')
            setPreview(null)

            if (fileConfig.type === 'SCORM Content') {
                try {
                    const zip = await JSZip.loadAsync(selectedFile)
                    const manifestFile = zip.file("imsmanifest.xml")

                    if (!manifestFile) {
                        const msg = "SCORM zip must include 'imsmanifest.xml' at the root level."

                        toast.error(msg)
                        setImageError(msg)

                        return
                    }

                    const manifestText = await manifestFile.async("string")
                    const parser = new XMLParser({ ignoreAttributes: false })
                    const manifest = parser.parse(manifestText)

                    if (!manifest?.manifest) {
                        const msg = "'imsmanifest.xml' is not a valid SCORM manifest file."

                        toast.error(msg)
                        setImageError(msg)

                        return
                    }
                } catch (err) {
                    console.error(err)
                    const msg = "Invalid SCORM zip. Could not parse 'imsmanifest.xml'."

                    toast.error(msg)

                    setImageError(msg)

                    return
                }
            }

            setFile(selectedFile)

            if (fileConfig.type === 'Video') {
                setPreview(URL.createObjectURL(selectedFile))
            }
        },
        onDropRejected: (rejectedFiles) => {
            rejectedFiles.forEach(file => {
                file.errors.forEach(error => {
                    let msg = ''

                    switch (error.code) {
                        case 'file-invalid-type':
                            msg = `Invalid file type for ${fileConfig.type}.`
                            break
                        case 'file-too-large':
                            msg = `File is too large. Max allowed size is ${fileConfig.maxSize / (1024 * 1024)}MB.`
                            break
                        case 'too-many-files':
                            msg = `Only one ${fileConfig.type} can be uploaded.`
                            break
                        default:
                            msg = `There was an issue with the uploaded file.`
                    }

                    toast.error(msg)
                    setImageError(msg)
                })
            })
        }
    })

    const handleDataSave = async (data) => {

        const isEdit = !!editData;

        // Determine if a file is required based on conditions
        const requiresFile =
            !isYoutube &&
            !isVideo &&
            !isScrom &&
            (!file && (!isEdit || !editData?.file_url));

        if (requiresFile) {
            setImageError(`Please upload a ${fileConfig.type.toLowerCase()}.`);

            return;
        }

        setLoading(true);

        try {
            const formData = new FormData();

            formData.append('title', data.title);
            formData.append('file_type', fileConfig.type);

            if (file) formData.append('file', file);
            if (isYoutube) formData.append('video_url', data.video_url);

            const response = await fetch(`${API_URL}/company/activity/data/${mId}/${id}/${activityId}`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
                body: formData
            });

            if (response.ok) {
                toast.success(`${fileConfig.type} uploaded successfully`);
                fetchActivities();
                handleClose();
                setISOpen(false);
            }
        } catch (error) {
            toast.error('Upload failed');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setFile()
        setPreview()
        setImageError()
        reset({ title: '', video_url: '', live_session_type: '' })
        setISOpen(false)
    }

    const onClose = () => {
        setIsModalOpen(false);
    }

    return (
        <Dialog open={open} fullWidth maxWidth="md" sx={{ '& .MuiDialog-paper': { overflow: 'visible' } }}>
            <DialogCloseButton onClick={handleClose} disableRipple>
                <i className="tabler-x"></i>
            </DialogCloseButton>

            <DialogTitle>Upload {fileConfig.type}</DialogTitle>

            <form onSubmit={handleSubmit(handleDataSave)} noValidate>
                <DialogContent sx={{ maxHeight: '80vh', overflowY: 'auto' }}>
                    <Grid container spacing={5}>

                        {isQuiz && (
                            <Box py={4} sx={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
                                <Grid container spacing={4} justifyContent="center" alignItems="center">

                                    <QuizCard
                                        title="Import from Spreadsheet"
                                        onClick={() => {
                                            setIsModalOpen(true)
                                        }}
                                    />
                                    <QuizCard
                                        title="Create Manually"
                                        onClick={() => {
                                            router.replace(`/${lang}/apps/quiz/${mId}/${activityId}`)
                                        }}
                                    />

                                </Grid>
                            </Box>
                        )}

                        {!isQuiz && (
                            <Grid item size={{ xs: 12 }}>
                                <Controller
                                    name="title"
                                    control={control}
                                    render={({ field }) => (
                                        <CustomTextField
                                            {...field}
                                            fullWidth
                                            label="Title*"
                                            placeholder="Enter title"
                                            error={!!errors.title}
                                            helperText={errors.title?.message}
                                        />
                                    )}
                                />
                            </Grid>
                        )}

                        {!isYoutube && !isQuiz && (
                            <Grid item size={{ xs: 12 }}>
                                <Typography variant="body1" fontWeight={500} gutterBottom>
                                    {fileConfig.type} <span>*</span>
                                </Typography>

                                <AppReactDropzone>
                                    <div
                                        {...getRootProps()}
                                        style={{
                                            minHeight: '150px',
                                            border: '2px dashed #ccc',
                                            padding: '1rem',
                                            borderRadius: '8px',
                                            textAlign: 'center',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '1rem'
                                        }}
                                    >
                                        <input {...getInputProps()} />
                                        <Avatar variant="rounded" className="bs-12 is-12 mbe-1">
                                            <i className="tabler-upload" />
                                        </Avatar>

                                        <Typography variant="body2">
                                            {fileConfig.type === 'Document' && 'Allowed *.pdf, *.pptx, *.docx, *.doc. Max 5MB'}
                                            {fileConfig.type === 'Video' && 'Allowed *.mp4. Max 500MB'}
                                            {fileConfig.type === 'SCORM Content' && 'Allowed *.zip. Must include imsmanifest.xml. Max 500MB'}
                                        </Typography>

                                        {(file || editData?.file_url) && (
                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                                                <Avatar variant="rounded" sx={{ bgcolor: '#f5f5f5', color: '#0A2E73', width: 48, height: 48 }}>
                                                    <i className="tabler-file" />
                                                </Avatar>

                                                <Typography variant="body2" fontWeight={500}>
                                                    {file?.name || editData?.file_url}
                                                </Typography>

                                                <Typography variant="caption" color="textSecondary">
                                                    {file && `${(file.size / 1024 / 1024).toFixed(2)} MB`}
                                                </Typography>
                                            </div>
                                        )}

                                        {imageError && (
                                            <Typography variant="caption" color="var(--mui-palette-error-main)" sx={{ mt: 1 }}>
                                                {imageError}
                                            </Typography>
                                        )}
                                    </div>
                                </AppReactDropzone>
                            </Grid>
                        )}

                        {isYoutube && (
                            <>
                                <Grid item size={{ xs: 12 }}>
                                    <Controller
                                        name="video_url"
                                        control={control}
                                        render={({ field }) => (
                                            <CustomTextField
                                                {...field}
                                                fullWidth
                                                label="Video URL*"
                                                placeholder="Enter YouTube video URL"
                                                error={!!errors.video_url}
                                                helperText={errors.video_url?.message}
                                            />
                                        )}
                                    />
                                </Grid>

                                {ReactPlayer.canPlay(watch('video_url')) && (
                                    <Grid item size={{ xs: 12 }}>
                                        <Typography variant="subtitle1" gutterBottom>Video Preview</Typography>
                                        <Box sx={{ position: 'relative', width: '100%', height: '300px', borderRadius: 2, overflow: 'hidden', boxShadow: 1 }}>
                                            <ReactPlayer
                                                url={watch('video_url')}
                                                controls
                                                width="100%"
                                                height="100%"
                                                style={{ position: 'absolute', top: 0, left: 0 }}
                                            />
                                        </Box>
                                    </Grid>
                                )}
                            </>
                        )}
                    </Grid>

                    <DialogActions sx={{ justifyContent: 'center', gap: 2, mt: 4 }}>
                        <Button type="submit" variant="contained" disabled={loading} sx={{ height: 40, position: 'relative' }}>
                            {loading ? (
                                <CircularProgress size={24} sx={{
                                    color: 'white', position: 'absolute', top: '50%', left: '50%',
                                    mt: '-12px', ml: '-12px'
                                }} />
                            ) : 'Submit'}
                        </Button>
                        <Button variant="tonal" color="error" onClick={handleClose}>Cancel</Button>
                    </DialogActions>
                </DialogContent>
            </form>
            <ImportQuizModal open={isModalOpen} onClose={onClose} activityId={activityId} handleClose={handleClose} />
        </Dialog>
    )
}

const ContentFlowComponent = ({ setOpen, activities, API_URL, token, fetchActivities, mId }) => {



    const [editingId, setEditingId] = useState(null);
    const [editingTitle, setEditingTitle] = useState("");
    const [editingError, setEditingError] = useState("");
    const [selectedId, setSelectedId] = useState();
    const [isOpen, setISOpen] = useState(false);
    const [activityId, setActivityId] = useState();
    const [docURL, setDocURL] = useState();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [logData, setLogData] = useState();

    const { lang } = useParams()

    const router = useRouter();

    const handleChangeName = async (id) => {
        const data = { title: editingTitle };

        try {
            const response = await fetch(`${API_URL}/company/activity/set-name/${mId}/${id}`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(data),
            });

            if (response.ok) {
                toast.success("Activity name saved successfully", { autoClose: 1000 });
                fetchActivities();
            } else {
                const result = await response.json();

                toast.error(result.message || "Failed to update name");
            }
        } catch (error) {
            toast.error("Error updating activity name");
        }
    };

    const handleSave = async (id) => {
        if (!editingTitle.trim()) {

            setEditingError("Title is required");

            return;
        }

        if (editingTitle.length > 150) {
            setEditingError("Title cannot exceed 150 characters");

            return;
        }

        setEditingError("");
        await handleChangeName(id);
        setEditingId(null);
        setEditingTitle("");
    };

    const handleEditClick = (activity) => {
        setEditingId(activity._id);
        setEditingTitle(activity?.name || activity?.activity_type?.activity_data?.title || "");
        setEditingError("");
    };

    const handleActivity = () => setOpen(true);

    const handleDeleteContent = async (id) => {
        try {
            const response = await fetch(`${API_URL}/company/activity/delete/${mId}/${id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            });

            const data = await response.json();

            if (response.ok) {
                toast.success("Activity deleted successfully", { autoClose: 1000 });
                fetchActivities();
            } else {
                toast.error(data.message || "Failed to delete activity");
            }
        } catch (error) {
            toast.error("Error deleting activity");
        }
    };

    const handleCardClick = (activity) => {
        const isDocumentType = activity.module_type_id === "688723af5dd97f4ccae68834";

        const quesLength = activity?.questions?.length

        if (quesLength > 0) {

            router.replace(`/${lang}/apps/quiz/${mId}/${activity?._id}`)

        } else {

            // Close modals first to force re-render
            setISOpen(false);
            setIsModalOpen(false);

            // Delay to ensure proper re-opening
            setTimeout(() => {
                setLogData(activity);
                setActivityId(activity._id);
                setSelectedId(activity.module_type_id);

                if (isDocumentType && activity.document_data?.image_url) {
                    setDocURL(activity.document_data.image_url);
                    setIsModalOpen(true);
                } else {
                    setISOpen(true);
                }
            }, 10);
        }
    };

    return (
        <Box p={3}>
            <Grid container spacing={3}>

                <Grid item size={{ xs: 12, md: 8 }}>
                    <Box sx={{
                        maxHeight: '70vh',
                        overflowY: 'auto',
                        pr: 1
                    }}>
                        {activities && activities.length > 0 ? (
                            activities.map((activity, index) => (
                                <Card
                                    key={index}
                                    variant="outlined"
                                    sx={{
                                        borderColor: '#0A2E73',
                                        borderRadius: 2,
                                        p: 2,
                                        mb: 4,
                                        mt: 1,
                                        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                                        '&:hover': {
                                            boxShadow: 3,
                                            transform: 'translateY(-2px)',
                                            borderColor: '#0845b3',
                                        },
                                    }}
                                >
                                    <Grid container alignItems="center" justifyContent="space-between" spacing={2}>
                                        <Grid item xs>
                                            <Box display="flex" alignItems="flex-start" gap={2}>
                                                <Box
                                                    sx={{
                                                        inlineSize: 40,
                                                        blockSize: 40,
                                                        cursor: 'pointer',
                                                        '& svg': {
                                                            transform: 'scale(0.6)',
                                                            transformOrigin: 'center',
                                                            display: 'block',
                                                        },
                                                    }}
                                                    onClick={() => handleCardClick(activity)}
                                                    dangerouslySetInnerHTML={{
                                                        __html: activity?.activity_type?.activity_data?.svg_content,
                                                    }}
                                                />
                                                <Box flex={1}>
                                                    <Box display="flex" alignItems="center">
                                                        <Typography component="div" fontWeight={600}>
                                                            <Box ml={1} display="flex" alignItems="center" color="#0A2E73">
                                                                {editingId === activity._id ? (
                                                                    <>
                                                                        <Box>
                                                                            <InputBase
                                                                                value={editingTitle}
                                                                                onChange={(e) => setEditingTitle(e.target.value)}
                                                                                sx={{
                                                                                    fontWeight: 600,
                                                                                    fontSize: 16,
                                                                                    borderBottom: editingError
                                                                                        ? '1px solid red'
                                                                                        : '1px solid #ccc',
                                                                                    mr: 1,
                                                                                    width: '100%',
                                                                                }}
                                                                                autoFocus
                                                                                placeholder="Enter title"
                                                                            />
                                                                            {editingError && (
                                                                                <Typography variant="caption" color="error" ml={0.5}>
                                                                                    {editingError}
                                                                                </Typography>
                                                                            )}
                                                                        </Box>
                                                                        <IconButton
                                                                            onClick={() => handleSave(activity._id)}
                                                                            size="small"
                                                                            sx={{ color: "#0A2E73", ml: 1 }}
                                                                        >
                                                                            <i className="tabler-check" />
                                                                        </IconButton>
                                                                    </>
                                                                ) : (
                                                                    <Typography
                                                                        component="div"
                                                                        fontWeight={600}
                                                                        display="flex"
                                                                        alignItems="center"
                                                                    >
                                                                        {activity?.name || activity?.activity_type?.activity_data?.title}
                                                                        <IconButton
                                                                            onClick={() => handleEditClick(activity)}
                                                                            size="small"
                                                                            sx={{ ml: 1, color: "#0A2E73" }}
                                                                        >
                                                                            <i className="tabler-edit" style={{ fontSize: 18 }} />
                                                                        </IconButton>
                                                                    </Typography>
                                                                )}
                                                            </Box>
                                                        </Typography>
                                                    </Box>

                                                    <Typography color="error" variant="body2" sx={{ mt: 0.5 }}>
                                                        {activity.description}
                                                    </Typography>

                                                    <Button
                                                        size="small"
                                                        variant="contained"
                                                        sx={{
                                                            mt: 1,
                                                            fontSize: '0.75rem',
                                                            textTransform: 'none',
                                                            backgroundColor: '#00b66c',
                                                            '&:hover': { backgroundColor: '#009956' },
                                                            borderRadius: 10,
                                                            px: 2,
                                                            minWidth: 'unset',
                                                        }}
                                                    >
                                                        Draft
                                                    </Button>
                                                </Box>
                                            </Box>
                                        </Grid>

                                        <Grid item>
                                            <IconButton
                                                size="small"
                                                sx={{ color: '#0A2E73' }}
                                                onClick={() => handleDeleteContent(activity._id)}
                                            >
                                                <i className="tabler-trash" />
                                            </IconButton>
                                        </Grid>
                                    </Grid>
                                </Card>
                            ))
                        ) : (
                            <Typography textAlign="center">No activity found</Typography>
                        )}
                    </Box>
                </Grid>

                <Grid item size={{ xs: 12, md: 4 }}>
                    <Box display="flex" justifyContent="flex-start" gap={2} mb={2}>
                        <Button variant="contained" color="primary" onClick={handleActivity}>
                            Add Activity
                        </Button>
                    </Box>

                    <RadioGroup defaultValue="any" sx={{ mb: 3 }}>
                        <FormControlLabel
                            value="ordered"
                            control={<Radio />}
                            label="Learner needs to follow the order"
                        />
                        <FormControlLabel
                            value="any"
                            control={<Radio />}
                            label="Learner can attempt any order"
                        />
                    </RadioGroup>

                    <Typography variant="subtitle1" gutterBottom>
                        On completion of Module launch the following
                    </Typography>

                    <Box display="flex" flexDirection="column" gap={2}>
                        <FormControlLabel
                            control={<Checkbox />}
                            label={
                                <Box display="flex" alignItems="center">
                                    Certificate
                                    <Button size="small" sx={{ ml: 2 }} variant="outlined">
                                        Quick Preview
                                    </Button>
                                </Box>
                            }
                        />
                        <FormControlLabel
                            control={<Checkbox />}
                            label={
                                <Box display="flex" alignItems="center">
                                    Feedback survey
                                    <Button size="small" sx={{ ml: 2 }} variant="text">
                                        Add A Survey
                                    </Button>
                                </Box>
                            }
                        />
                    </Box>
                </Grid>
            </Grid>

            <ShowFileModal
                open={isModalOpen}
                setOpen={setIsModalOpen}
                docURL={docURL}
            />

            <ActivityModal
                fetchActivities={fetchActivities}
                key={activityId}
                open={isOpen}
                id={selectedId}
                setISOpen={setISOpen}
                editData={logData}
                API_URL={API_URL}
                token={token}
                mId={mId}
                activityId={activityId}
            />
        </Box>
    );
};

const ImportUserModal = ({
    open, handleClose, API_URL, mId, id, activityId, token,
    fetchActivities, users, setAllData
}) => {
    const { control, handleSubmit } = useForm();
    const [file, setFile] = useState(null);
    const [imageError, setImageError] = useState("");
    const [loading, setLoading] = useState(false);
    const [excelData, setExcelData] = useState([]);
    const [rowErrors, setRowErrors] = useState({});
    const [matchedUsers, setMatchedUsers] = useState([]);

    // Save uploaded data
    const handleDataSave = async () => {
        if (Object.keys(rowErrors).length > 0) {
            toast.error("Please fix the errors in the table before submitting.");

            return;
        }

        if (!file) {
            setImageError("Please upload a valid .xlsx file.");

            return;
        }

        setAllData(matchedUsers);

        // Close after state update
        setTimeout(() => {
            handleClose();
        }, 0);
    };

    const DebouncedInput = ({ value: initialValue, onChange, debounce = 500, ...props }) => {
        const [value, setValue] = useState(initialValue);

        useEffect(() => { setValue(initialValue); }, [initialValue]);
        useEffect(() => {

            const timeout = setTimeout(() => { onChange(value); }, debounce);


            return () => clearTimeout(timeout);
        }, [value]);

        return <CustomTextField {...props} value={value} onChange={e => setValue(e.target.value)} />;
    };

    const validateExcelHeaders = (headers) => {
        const requiredHeaders = ["sno", "empid/email"];

        for (let req of requiredHeaders) {
            if (!headers.includes(req.toLowerCase())) {
                throw new Error(`Missing required column: ${req}`);
            }
        }
    };

    const { getRootProps, getInputProps } = useDropzone({
        multiple: false,
        maxSize: 5 * 1024 * 1024,
        accept: {
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"]
        },
        onDrop: async (acceptedFiles) => {
            if (!acceptedFiles.length) return;
            const selectedFile = acceptedFiles[0];

            try {
                const data = await selectedFile.arrayBuffer();
                const workbook = XLSX.read(data, { type: "array" });
                const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });

                if (!jsonData.length) {
                    throw new Error("Excel file is empty.");
                }

                const headerRow = jsonData[0].map(h => String(h || "").trim());
                const cleanHeaders = headerRow.map((h, idx) => h || `Column${idx + 1}`);

                validateExcelHeaders(cleanHeaders.map(h => h.toLowerCase()));

                const rows = XLSX.utils.sheet_to_json(firstSheet, {
                    header: cleanHeaders,
                    range: 1,
                    defval: ""
                });

                const errors = {};
                const matchedUsersArray = [];

                rows.forEach((row, index) => {
                    const snoVal = String(row["Sno"] || "").trim();
                    const empVal = String(row["EmpId/Email"] || "").trim();

                    const snoFilled = snoVal !== "";
                    const empFilled = empVal !== "";

                    if (snoFilled !== empFilled) {
                        errors[index] = "Sno and EmpId/Email must both be filled or both be empty.";

                        return;
                    }

                    if (empFilled) {
                        const isEmail = empVal.includes("@");
                        let matchedUser = null;

                        if (isEmail) {
                            const norm = normalizeEmail(empVal);
                            const hashed = hash(norm);

                            matchedUser = users.find(user => user.email_hash === hashed);
                        } else {
                            matchedUser = users.find(user =>
                                user.codes.some(c => String(c.code).trim().toLowerCase() === empVal.trim().toLowerCase())
                            );
                        }


                        if (matchedUser) {
                            matchedUsersArray.push(matchedUser._id);
                        } else {
                            errors[index] = `${empVal} does not exist`;
                        }
                    }
                });

                setRowErrors(errors);
                setExcelData(rows);
                setFile(selectedFile);
                setImageError("");
                setMatchedUsers(matchedUsersArray);

            } catch (err) {
                setFile(null);
                setExcelData([]);
                setRowErrors({});
                setMatchedUsers([]);
                setImageError(err.message);
                toast.error(err.message);
            }
        },
        onDropRejected: (rejectedFiles) => {
            rejectedFiles.forEach(file => {

                file.errors.forEach(error => {
                    let msg = "";

                    switch (error.code) {
                        case "file-invalid-type":
                            msg = `Invalid file type. Only .xlsx files are allowed.`;
                            break;
                        case "file-too-large":
                            msg = `File is too large. Max allowed size is 5MB.`;
                            break;
                        case "too-many-files":
                            msg = `Only one file can be uploaded.`;
                            break;
                        default:
                            msg = `There was an issue with the uploaded file.`;
                    }

                    toast.error(msg);
                    setImageError(msg);
                });
            });
        }
    });

    const columns = useMemo(() => {
        if (!excelData.length) return [];

        return Object.keys(excelData[0]).map(key => ({
            header: key,
            accessorKey: key,
            cell: ({ row, getValue }) => {
                const value = getValue();

                const error = rowErrors[row.index];

                return (
                    <div>
                        {value}
                        {key === "EmpId/Email" && (
                            <div>
                                {error && (
                                    <Typography variant="caption" color="var(--mui-palette-error-main)">
                                        {error}
                                    </Typography>
                                )}
                            </div>
                        )}
                    </div>
                );
            }
        }));
    }, [excelData, rowErrors]);

    const table = useReactTable({
        data: excelData,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getSortedRowModel: getSortedRowModel()
    });

    const TableImportComponent = () => (
        <Card className="mt-4">
            <CardContent className="flex justify-between flex-col gap-4 items-start sm:flex-row sm:items-center">
                <div className="flex items-center gap-2">
                    <Typography>Show</Typography>
                    <CustomTextField
                        select
                        value={table.getState().pagination.pageSize}
                        onChange={e => table.setPageSize(Number(e.target.value))}
                        className="max-sm:is-full sm:is-[70px]"
                    >
                        <MenuItem value={10}>10</MenuItem>
                        <MenuItem value={25}>25</MenuItem>
                        <MenuItem value={50}>50</MenuItem>
                        <MenuItem value={200}>200</MenuItem>
                    </CustomTextField>
                </div>
                <DebouncedInput
                    value={table.getState().globalFilter ?? ""}
                    className="max-sm:is-full min-is-[250px]"
                    onChange={value => table.setGlobalFilter(String(value))}
                    placeholder="Search"
                />
            </CardContent>
            <div className="overflow-x-auto">
                <table className={tableStyles.table}>
                    <thead>
                        {table.getHeaderGroups().map(headerGroup => (
                            <tr key={headerGroup.id}>
                                {headerGroup.headers.map(header => (
                                    <th key={header.id}>
                                        <div
                                            className={classnames({
                                                "flex items-center": true,
                                                "cursor-pointer": header.column.getCanSort()
                                            })}
                                            onClick={header.column.getToggleSortingHandler()}
                                        >
                                            {flexRender(header.column.columnDef.header, header.getContext())}
                                            {header.column.getIsSorted() === "asc" && <i className="tabler-chevron-up text-xl" />}
                                            {header.column.getIsSorted() === "desc" && <i className="tabler-chevron-down text-xl" />}
                                        </div>
                                    </th>
                                ))}
                            </tr>
                        ))}
                    </thead>
                    <tbody>
                        {table.getRowModel().rows.length === 0 ? (
                            <tr>
                                <td colSpan={columns.length} className="text-center">No data available</td>
                            </tr>
                        ) : (
                            table.getRowModel().rows.map(row => (
                                <tr key={row.id}>
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
    );

    return (
        <Dialog open={open} fullWidth maxWidth="md" sx={{ "& .MuiDialog-paper": { overflow: "visible" } }}>
            <DialogTitle>Import User</DialogTitle>
            <form onSubmit={handleSubmit(handleDataSave)} noValidate>
                <DialogContent sx={{ maxHeight: "80vh", overflowY: "auto" }}>
                    <Grid container spacing={5}>
                        <Grid size={{ xs: 12 }} item>
                            <Typography variant="body1" fontWeight={500} gutterBottom>
                                XLSX <span>*</span>
                                <Button variant="contained" href="/sample/import_user_sample.xlsx" sx={{ ml: 2 }}>
                                    Download sample file
                                </Button>
                            </Typography>
                            <div
                                {...getRootProps()}
                                style={{
                                    minHeight: "150px",
                                    border: "2px dashed #ccc",
                                    padding: "1rem",
                                    borderRadius: "8px",
                                    textAlign: "center",
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    gap: "1rem"
                                }}
                            >
                                <input {...getInputProps()} />
                                <Avatar variant="rounded" sx={{ bgcolor: "#f5f5f5", width: 48, height: 48 }}>
                                    <i className="tabler-upload" />
                                </Avatar>
                                <Typography variant="body2">Allowed: *.xlsx, Max 5MB</Typography>

                                {file && (
                                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem" }}>
                                        <Avatar variant="rounded" sx={{ bgcolor: "#f5f5f5", color: "#0A2E73", width: 48, height: 48 }}>
                                            <i className="tabler-file" />
                                        </Avatar>
                                        <Typography variant="body2" fontWeight={500}>{file.name}</Typography>
                                        <Typography variant="caption" color="textSecondary">
                                            {(file.size / 1024 / 1024).toFixed(2)} MB
                                        </Typography>
                                    </div>
                                )}

                                {imageError && (
                                    <Typography variant="caption" color="var(--mui-palette-error-main)" sx={{ mt: 1 }}>
                                        {imageError}
                                    </Typography>
                                )}
                            </div>
                        </Grid>
                    </Grid>

                    {excelData.length > 0 && <TableImportComponent />}

                    <DialogActions sx={{ justifyContent: "center", gap: 2, mt: 4 }}>
                        {excelData.length > 0 && Object.keys(rowErrors).length === 0 && (
                            <Button
                                onClick={handleSubmit(handleDataSave)}
                                variant="contained"
                                sx={{ height: 40 }}
                                disabled={loading}
                            >
                                {loading ? "Uploading..." : "Submit"}
                            </Button>
                        )}

                        <Button
                            type="button"
                            variant="contained"
                            color="secondary"
                            onClick={() => {
                                setFile(null);
                                setExcelData([]);
                                setRowErrors({});
                                handleClose();
                            }}
                        >
                            Close
                        </Button>
                    </DialogActions>
                </DialogContent>
            </form>
        </Dialog>
    );
};

const MAX_PAIRS = 5;

// Helper to normalize values into strings
const normalizeOptions = (val) => {
    if (!val) return [];
    if (Array.isArray(val)) return val.map((v) => String(v));

    return [String(val)];
};

const SettingComponent = ({ activities }) => {
    const API_URL = process.env.NEXT_PUBLIC_API_URL;
    const { data: session } = useSession();
    const token = session?.user?.token;
    const { mId } = useParams();

    const [pushEnrollmentSetting, setPushEnrollmentSetting] = useState("3");
    const [selfEnrollmentSetting, setSelfEnrollmentSetting] = useState("3");

    const [dueType, setDueType] = useState("relative");
    const [startDate, setStartDate] = useState(new Date());
    const [endDate, setEndDate] = useState(new Date());
    const [dueDays, setDueDays] = useState(5);
    const [lockModule, setLockModule] = useState(false);

    const [selectedPairIndex, setSelectedPairIndex] = useState(null);
    const [allData, setAllData] = useState([]);
    const [isOpen, setIsOpen] = useState(false);

    const [createData, setCreateData] = useState({
        designation: [],
        department: [],
        group: [],
        region: [],
        user: [],
    });

    const [targetOptionPairs, setTargetOptionPairs] = useState([
        { target: "", options: [], secondOptions: [] },
    ]);

    // Fetch available designations, departments, groups, etc.
    const fetchCreateData = useCallback(async () => {
        if (!API_URL || !token) return;

        try {
            const res = await fetch(`${API_URL}/company/program/schedule/create`, {
                method: "GET",
                headers: { Authorization: `Bearer ${token}` },
            });

            const body = await res.json();

            if (res.ok) {
                const cd = {
                    designation: body?.data?.designation || [],
                    department: body?.data?.department || [],
                    group: body?.data?.group || [],
                    region: body?.data?.region || [],
                    user: body?.data?.user || [],
                };

                setCreateData(cd);

                return cd;
            } else {
                console.error("Error fetching create data:", body);
            }
        } catch (err) {
            console.error("Error fetching create data:", err);
        }

        return null;
    }, [API_URL, token]);

    useEffect(() => {
        if (API_URL && token) {
            fetchCreateData();
        }
    }, [API_URL, token, fetchCreateData]);

    // Fetch program schedule
    useEffect(() => {
        const fetchProgramSchedule = async () => {
            try {
                if (!token || !mId) return;

                const res = await fetch(
                    `${API_URL}/company/program/schedule/data/${mId}`,
                    {
                        headers: { Authorization: `Bearer ${token}` },
                    }
                );

                if (!res.ok) {
                    const errText = await res.text();

                    throw new Error(
                        `Request failed with ${res.status} ${res.statusText}: ${errText}`
                    );
                }

                const body = await res.json();
                const result = body?.data || {};

                setPushEnrollmentSetting(
                    (result.pushEnrollmentSetting ?? "3").toString()
                );
                setSelfEnrollmentSetting(
                    (result.selfEnrollmentSetting ?? "3").toString()
                );
                setLockModule(result.lockModule ?? false);

                if (result.start_date && result.end_date) {
                    setDueType("fixed");
                    setStartDate(new Date(result.start_date));
                    setEndDate(new Date(result.end_date));
                } else if (result.dueDays != null) {
                    setDueType("relative");
                    setDueDays(result.dueDays);
                }

                if (Array.isArray(result.targetPairs) && result.targetPairs.length > 0) {

                    const enriched = result.targetPairs.map((pair) => {
                        let secondOptions = [];

                        switch (pair.target) {
                            case "1":
                                secondOptions = createData.designation || [];
                                break;
                            case "2":
                                secondOptions = createData.department || [];
                                break;
                            case "3":
                                secondOptions = createData.group || [];
                                break;
                            case "4":
                                secondOptions = createData.region || [];
                                break;
                            case "5":
                                secondOptions = createData.user || [];
                                break;
                            default:
                                secondOptions = [];
                        }

                        return {
                            target: pair.target ?? "",
                            options: normalizeOptions(pair.options ?? []),
                            secondOptions,
                        };
                    });

                    setTargetOptionPairs(enriched);
                } else {
                    setTargetOptionPairs([{ target: "", options: [], secondOptions: [] }]);
                }
            } catch (err) {
                console.error("Error fetching program schedule:", err);
            }
        };

        fetchProgramSchedule();
    }, [API_URL, token, mId, createData]);

    // Re-enrich secondOptions when createData changes
    useEffect(() => {

        setTargetOptionPairs((prev) =>
            prev.map((pair) => {
                let secondOptions = [];

                switch (pair.target) {
                    case "1":
                        secondOptions = createData.designation || [];
                        break;
                    case "2":
                        secondOptions = createData.department || [];
                        break;
                    case "3":
                        secondOptions = createData.group || [];
                        break;
                    case "4":
                        secondOptions = createData.region || [];
                        break;
                    case "5":
                        secondOptions = createData.user || [];
                        break;
                    default:
                        secondOptions = [];
                }

                return { ...pair, secondOptions, options: normalizeOptions(pair.options) };
            })
        );
    }, [createData]);

    // Auto-select users from modal
    useEffect(() => {
        if (
            allData.length > 0 &&
            selectedPairIndex !== null &&
            targetOptionPairs[selectedPairIndex]?.target === "5"
        ) {

            setTargetOptionPairs((prevPairs) => {
                const updatedPairs = prevPairs.map((p, i) => ({ ...p }));
                const users = updatedPairs[selectedPairIndex]?.secondOptions || [];

                const selectedUsers = users
                    .filter((u) => allData.includes(String(u._id)))
                    .map((u) => String(u._id));

                updatedPairs[selectedPairIndex].options = normalizeOptions(selectedUsers);

                return updatedPairs;
            });
        }
    }, [allData, selectedPairIndex, targetOptionPairs]);

    // Handlers
    const handleFirstChange = (index, value) => {

        setTargetOptionPairs((prev) => {
            const updated = prev.map((p) => ({ ...p }));

            updated[index].target = value;
            updated[index].options = [];

            switch (value) {
                case "1":
                    updated[index].secondOptions = createData.designation || [];
                    break;
                case "2":
                    updated[index].secondOptions = createData.department || [];
                    break;
                case "3":
                    updated[index].secondOptions = createData.group || [];
                    break;
                case "4":
                    updated[index].secondOptions = createData.region || [];
                    break;
                case "5":
                    updated[index].secondOptions = createData.user || [];
                    break;
                default:
                    updated[index].secondOptions = [];
            }

            return updated;
        });
    };

    const handleSecondChange = (index, value) => {
        setTargetOptionPairs((prev) => {
            const updated = prev.map((p) => ({ ...p }));

            updated[index].options = normalizeOptions(value);

            return updated;
        });
    };

    const handleAddClick = () => {
        setTargetOptionPairs((prev) => {
            if (prev.length >= MAX_PAIRS) return prev;

            return [...prev, { target: "", options: [], secondOptions: [] }];
        });
    };

    const handleRemoveClick = (index) => {
        setTargetOptionPairs((prev) => {
            if (prev.length === 1) return prev;
            const copy = [...prev];

            copy.splice(index, 1);

            return copy;
        });
    };

    const handleImportUser = (index) => {
        setSelectedPairIndex(index);
        setIsOpen(true);
    };

    const handleDataSave = async (value) => {

        if (!API_URL || !token || !mId) return;

        try {
            const res = await fetch(`${API_URL}/company/program/schedule/${mId}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(value),
            });

            const body = await res.json();

            if (res.ok) {
                toast.success(body?.message || "Setting saved successfully", {
                    autoClose: 1000,
                });
            } else {
                toast.error(body?.message || "Failed to save settings");
            }
        } catch (err) {
            console.error("❌ Error saving settings:", err?.message || err);
            toast.error("Something went wrong!");
        }
    };

    const onSubmit = (e) => {
        e.preventDefault();

        if (dueType === "fixed" && startDate > endDate) {
            toast.error("Start date cannot be later than end date");

            return;
        }

        const payload = {
            pushEnrollmentSetting,
            selfEnrollmentSetting,
            targetPairs: targetOptionPairs.map((p) => ({
                target: p.target,
                options: p.options,
            })),
            lockModule,
            dueType,
            start_date: dueType === "fixed" ? startDate.toISOString() : null,
            end_date: dueType === "fixed" ? endDate.toISOString() : null,
            dueDays: dueType === "relative" ? Number(dueDays) : null,
        };

        handleDataSave(payload);
    };

    const handleClose = () => {
        setIsOpen(false);
        setSelectedPairIndex(null);
        setAllData([]);
    };

    const dateInputStyle = {
        width: "200px",
        padding: "10px 12px",
        borderRadius: "8px",
        border: "1px solid #ccc",
        fontSize: "14px",
        fontFamily: "Roboto, sans-serif",
        outline: "none",
        boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
        cursor: "pointer",
    };

    return (
        <form onSubmit={onSubmit}>
            <Grid container spacing={4}>
                <Grid item size={{ xs: 12, md: 9 }}>
                    {/* Push Enrollment */}
                    <Typography variant="h6" gutterBottom>
                        Push Enrollment Settings
                    </Typography>
                    <RadioGroup
                        value={pushEnrollmentSetting}
                        onChange={(e) => setPushEnrollmentSetting(e.target.value)}
                        sx={{ mb: 3 }}
                    >
                        <FormControlLabel
                            value="1"
                            control={<Radio />}
                            label="To all existing & new Learners on this Content Folder"
                        />
                        <FormControlLabel
                            value="2"
                            control={<Radio />}
                            label="To all existing & new Learners under this Content Folder who meet Target audience criteria"
                        />
                        <FormControlLabel
                            value="3"
                            control={<Radio />}
                            label="Let me select Learners while publishing"
                        />
                    </RadioGroup>

                    {/* Self Enrollment */}
                    <Typography variant="h6" gutterBottom>
                        Self-Enrollment Settings
                    </Typography>
                    <RadioGroup
                        value={selfEnrollmentSetting}
                        onChange={(e) => setSelfEnrollmentSetting(e.target.value)}
                        sx={{ mb: 3 }}
                    >
                        <FormControlLabel
                            value="1"
                            control={<Radio />}
                            label="Do not allow self enrollment"
                        />
                        <FormControlLabel
                            value="2"
                            control={<Radio />}
                            label="Allow any Learner to self-enrol"
                        />
                        <FormControlLabel
                            value="3"
                            control={<Radio />}
                            label='Allow Learners who meet the "target audience" criteria below to self-enrol'
                        />
                    </RadioGroup>

                    {/* Target Audience */}
                    <Typography variant="h6" gutterBottom>
                        This Module Is Targeted At
                    </Typography>
                    {targetOptionPairs.map((pair, idx) => (
                        <Grid container spacing={2} alignItems="center" mb={3} key={idx}>
                            <Grid item size={{ xs: 12, md: 3 }}>
                                <TextField
                                    select
                                    label="Select module targets"
                                    fullWidth
                                    size="small"
                                    value={pair.target}
                                    onChange={(e) => handleFirstChange(idx, e.target.value)}
                                >
                                    <MenuItem value="">Select Module Target</MenuItem>
                                    <MenuItem
                                        value="1"
                                        disabled={targetOptionPairs.some(
                                            (p, i) => p.target === "1" && i !== idx
                                        )}
                                    >
                                        Designation
                                    </MenuItem>
                                    <MenuItem
                                        value="2"
                                        disabled={targetOptionPairs.some(
                                            (p, i) => p.target === "2" && i !== idx
                                        )}
                                    >
                                        Department
                                    </MenuItem>
                                    <MenuItem
                                        value="3"
                                        disabled={targetOptionPairs.some(
                                            (p, i) => p.target === "3" && i !== idx
                                        )}
                                    >
                                        Group
                                    </MenuItem>
                                    <MenuItem
                                        value="4"
                                        disabled={targetOptionPairs.some(
                                            (p, i) => p.target === "4" && i !== idx
                                        )}
                                    >
                                        Region
                                    </MenuItem>
                                    <MenuItem
                                        value="5"
                                        disabled={targetOptionPairs.some(
                                            (p, i) => p.target === "5" && i !== idx
                                        )}
                                    >
                                        User
                                    </MenuItem>
                                </TextField>
                            </Grid>

                            <Grid item size={{ xs: 12, md: 6 }}>
                                <TextField
                                    select
                                    label="Select option"
                                    fullWidth
                                    size="small"
                                    value={pair.options}
                                    onChange={(e) => handleSecondChange(idx, e.target.value)}
                                    SelectProps={{ multiple: true }}
                                >
                                    {pair.target !== "5" &&
                                        (pair.secondOptions || []).map((item, i) => (
                                            <MenuItem
                                                key={String(item._id ?? i)}
                                                value={String(item._id ?? item.id ?? item)}
                                            >
                                                {item.name || item.title || item.label || item._id}
                                            </MenuItem>
                                        ))}
                                    {pair.target === "5" &&
                                        (pair.secondOptions || []).map((item, i) => (
                                            <MenuItem
                                                key={String(item._id ?? i)}
                                                value={String(item._id ?? item.id ?? item)}
                                            >
                                                {item.first_name} {item.last_name}
                                            </MenuItem>
                                        ))}
                                </TextField>
                            </Grid>

                            {pair.target === "5" && (
                                <Grid item size={{ xs: 12, md: 2 }}>
                                    <Button
                                        variant="outlined"
                                        onClick={() => handleImportUser(idx)}
                                    >
                                        Import User
                                    </Button>
                                </Grid>
                            )}

                            <Grid
                                item
                                size={{ xs: 12, md: 1 }}
                                display="flex"
                                justifyContent="center"
                            >
                                {idx === 0 ? (
                                    <Button
                                        variant="contained"
                                        onClick={handleAddClick}
                                        disabled={targetOptionPairs.length >= MAX_PAIRS}
                                    >
                                        + Add
                                    </Button>
                                ) : (
                                    <IconButton
                                        color="error"
                                        onClick={() => handleRemoveClick(idx)}
                                    >
                                        <i className="tabler-trash" />
                                    </IconButton>
                                )}
                            </Grid>
                        </Grid>
                    ))}

                    {/* Due Date Settings */}
                    <Typography variant="h6" gutterBottom>
                        Due Date Settings
                    </Typography>
                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={lockModule}
                                onChange={(e) => setLockModule(e.target.checked)}
                            />
                        }
                        label="Lock Module Post Due Date"
                    />

                    <RadioGroup
                        value={dueType}
                        onChange={(e) => setDueType(e.target.value)}
                        sx={{ mt: 1, mb: 2 }}
                    >
                        {/* Fixed Due Date */}
                        <FormControlLabel
                            value="fixed"
                            control={<Radio />}
                            label={
                                <Box
                                    display="flex"
                                    flexDirection="column"
                                    alignItems="flex-start"
                                    gap={2}
                                >
                                    <Typography variant="subtitle1">Fixed due date</Typography>

                                    <Box display="flex" flexDirection="row" gap={4}>
                                        {/* Start Time */}
                                        {dueType === "fixed" && (
                                            <Box>
                                                <Typography variant="body2" gutterBottom>
                                                    Start time
                                                </Typography>
                                                <DatePicker
                                                    selected={startDate}
                                                    onChange={(date) => setStartDate(date)}
                                                    showTimeSelect
                                                    dateFormat="Pp"
                                                    placeholderText="Select start time"
                                                    customInput={
                                                        <input
                                                            style={dateInputStyle}
                                                            placeholder="Select start time"
                                                        />
                                                    }
                                                />
                                            </Box>
                                        )}

                                        {/* End Date */}
                                        {dueType === "fixed" && (
                                            <Box>
                                                <Typography variant="body2" gutterBottom>
                                                    End date
                                                </Typography>
                                                <DatePicker
                                                    selected={endDate}
                                                    onChange={(date) => setEndDate(date)}
                                                    showTimeSelect
                                                    dateFormat="Pp"
                                                    placeholderText="Select end date"
                                                    customInput={
                                                        <input
                                                            style={dateInputStyle}
                                                            placeholder="Select end date"
                                                        />
                                                    }
                                                />
                                            </Box>
                                        )}
                                    </Box>
                                </Box>
                            }
                        />

                        {/* Relative Due Date */}
                        <FormControlLabel
                            value="relative"
                            control={<Radio />}
                            label={
                                <Box display="flex" alignItems="center" gap={2}>
                                    <Typography variant="subtitle1">
                                        Relative due date (days)
                                    </Typography>
                                    {dueType === "relative" && (
                                        <TextField
                                            type="number"
                                            size="small"
                                            value={dueDays}
                                            onChange={(e) => setDueDays(Number(e.target.value))}
                                            inputProps={{ min: 1 }}
                                        />
                                    )}
                                </Box>
                            }
                        />
                    </RadioGroup>

                    {/* Save Button */}
                    <Button
                        type="submit"
                        variant="contained"
                        color="primary"
                        sx={{ mt: 3 }}
                        disabled={!activities || activities.length === 0}
                    >
                        Publish
                    </Button>
                </Grid>
            </Grid>

            {/* Import User Modal */}
            <ImportUserModal
                open={isOpen}
                handleClose={handleClose}
                allData={allData}
                setAllData={setAllData}
            />
        </form>
    );
};

const ContentFlowModal = ({ open, data, setOpen, setSelected, selected, setNext, API_URL, token, mId, fetchActivities }) => {

    const handleChange = (selectedItem) => {
        setSelected(selectedItem?._id);
    }

    const submitActivity = async () => {
        try {
            const response = await fetch(`${API_URL}/company/activity/form/${mId}/${selected}`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`
                }
            })

            const result = await response.json();

            if (response.ok) {
                const value = result?.data;

                toast.success("Activity added successfully", {
                    autoClose: 1000
                })
                fetchActivities()
                setSelected()
                setOpen(false)
            }

        } catch (error) {
            throw new Error(error)
        }
    }

    const handleNext = () => {
        submitActivity();
        setNext(true)
    }

    return (
        <>
            <Dialog
                fullWidth
                open={open}
                onClose={() => setOpen(false)}
                maxWidth="md"
                scroll="body"
                closeAfterTransition={false}
                sx={{ '& .MuiDialog-paper': { overflow: 'visible' } }}
            >
                <DialogCloseButton onClick={() => {
                    setOpen(false)
                    setSelected()
                }} disableRipple>
                    <i className="tabler-x" />
                </DialogCloseButton>

                <DialogTitle
                    variant="h4"
                    className="flex flex-col gap-2 text-center sm:pbs-5 sm:pbe-5 sm:pli-5"
                >
                    <Typography component="span" className="flex flex-col items-center">
                        Select any Activity to create
                    </Typography>
                </DialogTitle>

                <DialogContent>
                    <Box sx={{ px: 2 }}>
                        <RadioGroup
                            name="custom-radios-icons"
                            value={selected || ''}
                            onChange={(e) => {


                                const selectedItem = data?.appConfig?.activity_data?.find(
                                    (item) => item.title === e.target.value
                                )

                                handleChange(selectedItem)
                            }}
                        >
                            <Grid container spacing={4}>
                                {data?.appConfig?.activity_data?.map((item, index) => {
                                    const isSelected = selected === item._id

                                    return (
                                        <Grid item size={{ xs: 12, sm: 3 }} key={index}>
                                            <Card
                                                variant="outlined"
                                                onClick={() => item.status && handleChange(item)}
                                                sx={{
                                                    height: '100%',
                                                    cursor: 'pointer',
                                                    opacity: item.status ? 0.5 : 1,
                                                    borderColor: isSelected ? 'primary.main' : 'grey.300',
                                                    '&:hover': {
                                                        borderColor: item.status ? 'primary.main' : 'grey.300', // ✅ Prevent color change if disabled
                                                    },
                                                }}
                                            >
                                                <CardContent
                                                    sx={{
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        alignItems: 'center',
                                                        textAlign: 'center',
                                                        gap: 1.5,
                                                        px: 2,
                                                        py: 3,
                                                    }}
                                                >
                                                    <Box
                                                        component="div"
                                                        sx={{ inlineSize: 40, blockSize: 40 }}
                                                        color={"black"}
                                                        dangerouslySetInnerHTML={{ __html: item.svg_content }}
                                                    />

                                                    <Radio
                                                        color="primary"
                                                        checked={isSelected}
                                                        value={item.title}
                                                    />

                                                    <Box>
                                                        <Typography variant="subtitle1" fontWeight={1000} color="black">
                                                            {item.title}
                                                        </Typography>
                                                        <Typography variant="body2" color="black">
                                                            {item.description}
                                                        </Typography>
                                                    </Box>
                                                </CardContent>
                                            </Card>

                                        </Grid>
                                    )
                                })}
                            </Grid>
                        </RadioGroup>
                    </Box>
                </DialogContent>

                <DialogActions sx={{ justifyContent: 'center', pb: 3 }}>
                    <Button variant="outlined" disabled={!selected} onClick={handleNext}>
                        Next
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    )
}

const AcitivityCard = () => {
    const [value, setValue] = useState('content_flow')
    const handleTabChange = (e, value) => setValue(value)
    const [data, setData] = useState();

    const API_URL = process.env.NEXT_PUBLIC_API_URL;
    const { data: session } = useSession();
    const token = session?.user?.token;
    
    const { lang: locale, mId: mId } = useParams()
    const [open, setOpen] = useState(false);
    const [selected, setSelected] = useState();
    const [next, setNext] = useState(false);
    const [activity, setActivity] = useState()

    const fetchActivities = async () => {
        try {
            const response = await fetch(`${API_URL}/company/activity/${mId}`, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token}`
                }
            })

            const result = await response?.json();

            if (response.ok) {

                const value = result?.data;

                setActivity(value)
            }
        } catch (error) {
            throw new Error(error)
        }
    }

    const fetchFormData = async () => {
        try {
            const response = await fetch(`${API_URL}/company/activity/create/data`, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token}`
                }
            })

            const result = await response?.json();

            if (response.ok) {

                const value = result?.data;

                setData(value)
            }

        } catch (error) {
            throw new Error(error)
        }
    }

    useEffect(() => {
        if (API_URL && token) {
            fetchFormData();
            fetchActivities()
        }
    }, [API_URL, token])

    return (
        <PermissionGuard locale={locale} element={'isCompany'}>
            <Card>
                <CardContent>

                    <TabContext value={value}>
                        <TabList
                            variant='scrollable'
                            onChange={handleTabChange}
                            className='border-b px-0 pt-0'
                        >
                            <Tab key={1} label='Content Flow' value='content_flow' />
                            <Tab key={2} label='Setting' value='setting' />
                        </TabList>

                        <Box mt={3}>
                            <TabPanel value='content_flow' className='p-0'>
                                <ContentFlowComponent setOpen={setOpen} activities={activity} API_URL={API_URL} token={token} fetchActivities={fetchActivities} mId={mId} />
                            </TabPanel>
                            <TabPanel value='setting' className='p-0'>
                                <SettingComponent activities={activity} />
                            </TabPanel>
                        </Box>
                    </TabContext>
                </CardContent>
            </Card>
            <ContentFlowModal open={open} setOpen={setOpen} data={data} setSelected={setSelected} selected={selected} setNext={setNext} API_URL={API_URL} token={token} mId={mId} fetchActivities={fetchActivities} />
        </PermissionGuard>
    )
}

export default AcitivityCard;
