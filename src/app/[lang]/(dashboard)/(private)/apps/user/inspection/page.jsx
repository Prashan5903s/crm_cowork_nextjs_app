'use client';

import { useEffect, useState } from 'react';

import { useSession } from 'next-auth/react';

import { useParams } from "next/navigation"

import {
    Alert,
    Box,
    Button,
    Card,
    CardActionArea,
    CardActions,
    CardContent,
    Chip,
    CircularProgress,
    Divider,
    FormControl,
    FormControlLabel,
    MenuItem,
    Radio,
    RadioGroup,
    Select,
    Snackbar,
    Stack,
    TextField,
    Typography
} from '@mui/material';

import Grid from "@mui/material/Grid2"

import PermissionGuard from '@/hocs/PermissionClientGuard';
import { toast } from 'react-toastify';

const statusColor = {
    Pending: 'warning',
    'In Progress': 'info',
    Overdue: 'error',
    Completed: 'success',
    Cancelled: 'default'
};

const formatDate = (d) => {
    if (!d) return '-';
    const date = new Date(d);
    if (Number.isNaN(date.getTime())) return '-';
    return date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    });
};

const InspectionResult = () => {

    const { lang: locale, } = useParams()

    const API_URL = process.env.NEXT_PUBLIC_API_URL;
    const { data: session } = useSession();
    const token = session?.user?.token;

    const [data, setData] = useState();

    // Holds the full list of inspections assigned to this user
    const [schedules, setSchedules] = useState([]);

    // Which schedule (by _id) the user is currently filling out.
    // null => show the "pick an inspection" list instead of the form.
    const [selectedScheduleId, setSelectedScheduleId] = useState(null);

    const [responses, setResponses] = useState({});
    const [remarks, setRemarks] = useState('');
    const [overallStatus, setOverallStatus] = useState('Pass');

    const [submitting, setSubmitting] = useState(false);
    const [snackbar, setSnackbar] = useState({ open: false, severity: 'success', message: '' });

    const handleChange = (id, field, value) => {
        setResponses(prev => ({
            ...prev,
            [id]: {
                ...prev[id],
                [field]: value
            }
        }));
    };

    const fetchData = async () => {
        try {
            const response = await fetch(`${API_URL}/user/inspection/result/data`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            })

            const value = await response.json()

            if (response.ok) {

                setData(value?.data)

                const scheduleList = value?.data?.inspectionSchedule || [];

                setSchedules(scheduleList);

                // If there's only a single inspection assigned, jump straight
                // to the form instead of making the user pick from a list of one.
                if (scheduleList.length === 1) {
                    setSelectedScheduleId(scheduleList[0]._id);
                }
            }

        } catch (error) {
            throw new Error(error)
        }
    }

    useEffect(() => {
        if (API_URL && token) {

            fetchData()
        }
    }, [API_URL, token])

    const selectedSchedule = schedules.find(s => s._id === selectedScheduleId);

    const startInspection = (scheduleId) => {
        // Reset any in-progress answers when switching between inspections
        setResponses({});
        setRemarks('');
        setOverallStatus('Pass');
        setSelectedScheduleId(scheduleId);
    };

    const backToList = () => {
        setSelectedScheduleId(null);
    };

    // The form keeps responses keyed by checklist item id for easy editing,
    // but InspectionResult.responses expects [{ question, answer }].
    const buildResponsesPayload = (schedule) => {
        const checklist = schedule?.inspection_template_id?.checklist || [];

        return checklist.map((item) => {
            const itemId = item._id || item.id;
            const entry = responses[itemId] || {};

            const value = item.type === 'boolean' ? entry.status : entry.answer;

            return {
                question: item.title,
                answer: {
                    value: value ?? null,
                    remarks: entry.remarks || ''
                }
            };
        });
    };

    const validateInspection = () => {
        const checklist = selectedSchedule.inspection_template_id?.checklist || [];

        for (const item of checklist) {
            if (!item.required) continue;

            const value =
                item.type === "boolean"
                    ? responses[item._id]?.status
                    : responses[item._id]?.answer;

            if (value === undefined || value === null || value === "") {
                toast.error(`${item.title} is required.`);
                return false;
            }
        }

        return true;
    };

    const handleSubmit = async () => {

        if (!selectedSchedule) return;

        if (!validateInspection()) {
            return;
        }

        setSubmitting(true);

        try {
            const response = await fetch(`${API_URL}/user/inspection/save/data`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    inspection_schedule_id: selectedSchedule._id,
                    overall_status: overallStatus,
                    responses: buildResponsesPayload(selectedSchedule),
                    remarks,
                    images: []
                })
            });

            const value = await response.json();

            if (!response.ok) {
                throw new Error(value?.message || 'Failed to submit inspection.');
            }

            toast.success((value?.message || 'Inspection submitted successfully.'), {
                autoClose: 1000
            })

            await fetchData();
            setSelectedScheduleId(null);

        } catch (error) {

            toast.error((error.message || 'Something went wrong while submitting.'), {
                autoClose: 1000
            })

        } finally {
            setSubmitting(false);
        }
    };

    return (
        <PermissionGuard locale={locale} element={'isOfficeBearer'}>

            <Box p={3}>

                <Stack direction="row" alignItems="center" justifyContent="space-between" mb={3}>

                    <Typography variant="h4">
                        Perform Inspection
                    </Typography>

                    {/* Only show "back" once we're inside a specific inspection
                        and there's more than one to choose from */}
                    {selectedSchedule && schedules.length > 1 && (
                        <Button variant="outlined" onClick={backToList}>
                            Back to My Inspections
                        </Button>
                    )}

                </Stack>

                {/* No inspection selected yet: show the list to pick from.
                    This is the state that was previously impossible to reach -
                    before, schedules[1], schedules[2], etc. were silently ignored. */}
                {!selectedSchedule && (

                    <Card>

                        <CardContent>

                            <Typography variant="h6" gutterBottom>
                                My Assigned Inspections
                            </Typography>

                            <Divider sx={{ mb: 3 }} />

                            {schedules.length === 0 && (
                                <Typography color="text.secondary">
                                    You have no inspections assigned right now.
                                </Typography>
                            )}

                            <Grid container spacing={2}>

                                {schedules.map((schedule) => (

                                    <Grid item size={{ xs: 12, md: 6 }} key={schedule._id}>

                                        <Card variant="outlined">

                                            <CardActionArea onClick={() => startInspection(schedule._id)}>

                                                <CardContent>

                                                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={1}>

                                                        <Typography fontWeight={600}>
                                                            {schedule.asset_id?.name || 'Unnamed Asset'}
                                                        </Typography>

                                                        <Chip
                                                            size="small"
                                                            color={statusColor[schedule.status] || 'default'}
                                                            label={schedule.status}
                                                        />

                                                    </Stack>

                                                    <Typography variant="body2" color="text.secondary">
                                                        {schedule.asset_id?.location_id?.name || 'Location not set'}
                                                    </Typography>

                                                    <Typography variant="body2" color="text.secondary">
                                                        Due: {formatDate(schedule.due_date)}
                                                    </Typography>

                                                </CardContent>

                                            </CardActionArea>

                                        </Card>

                                    </Grid>

                                ))}

                            </Grid>

                        </CardContent>

                    </Card>

                )}

                {/* An inspection has been picked (or was the only one assigned):
                    show the original checklist form, scoped to that schedule */}
                {selectedSchedule && (

                    <>

                        {/* Inspection Details */}

                        <Card sx={{ mb: 3 }}>
                            <CardContent>

                                <Typography variant="h6" gutterBottom>
                                    Inspection Information
                                </Typography>

                                <Divider sx={{ mb: 3 }} />

                                <Grid container spacing={3}>

                                    <Grid item size={{ xs: 12, md: 4 }}>
                                        <TextField
                                            fullWidth
                                            label="Asset"
                                            value={selectedSchedule.asset_id?.name || ''}
                                            InputProps={{
                                                readOnly: true
                                            }}
                                        />
                                    </Grid>

                                    <Grid item size={{ xs: 12, md: 4 }}>
                                        <TextField
                                            fullWidth
                                            label="Location"
                                            value={selectedSchedule.asset_id?.location_id?.name || ''}
                                            InputProps={{
                                                readOnly: true
                                            }}
                                        />
                                    </Grid>

                                    <Grid item size={{ xs: 12, md: 4 }}>
                                        <TextField
                                            fullWidth
                                            label="Inspection Date"
                                            value={formatDate(selectedSchedule.scheduled_date)}
                                            InputProps={{
                                                readOnly: true
                                            }}
                                        />
                                    </Grid>

                                    <Grid item size={{ xs: 12, md: 4 }}>
                                        <Chip
                                            color={statusColor[selectedSchedule.status] || 'warning'}
                                            label={selectedSchedule.status}
                                        />
                                    </Grid>

                                </Grid>

                            </CardContent>
                        </Card>

                        {/* Checklist */}

                        <Card>

                            <CardContent>

                                <Typography variant="h6" mb={3}>
                                    Inspection Checklist
                                </Typography>

                                {selectedSchedule.inspection_template_id?.checklist?.map((item) => (

                                    <Card
                                        key={item._id || item.id}
                                        variant="outlined"
                                        sx={{ mb: 3 }}
                                    >

                                        <CardContent>

                                            <Typography
                                                fontWeight={600}
                                                mb={2}
                                            >
                                                {item.title}
                                            </Typography>

                                            {item.type === 'boolean' && (

                                                <RadioGroup
                                                    row
                                                    value={responses[item._id || item.id]?.status || ''}
                                                    onChange={(e) => {
                                                        const value = e.target.value;

                                                        handleChange(item._id || item.id, 'status', value);

                                                        // Any single failed checklist item fails the whole
                                                        // inspection by default. The user can still override
                                                        // it manually in the Summary card below.
                                                        if (value === 'Fail') {
                                                            setOverallStatus('Fail');
                                                        }
                                                    }}
                                                >

                                                    <FormControlLabel
                                                        value="Pass"
                                                        control={<Radio />}
                                                        label="Pass"
                                                    />

                                                    <FormControlLabel
                                                        value="Fail"
                                                        control={<Radio />}
                                                        label="Fail"
                                                    />

                                                    <FormControlLabel
                                                        value="NA"
                                                        control={<Radio />}
                                                        label="N/A"
                                                    />

                                                </RadioGroup>

                                            )}

                                            {item.type === 'date' && (

                                                <TextField
                                                    fullWidth
                                                    type="date"
                                                    onChange={(e) =>
                                                        handleChange(item._id || item.id, 'answer', e.target.value)
                                                    }
                                                    InputLabelProps={{
                                                        shrink: true
                                                    }}
                                                />

                                            )}

                                            {(item.type === 'text' || item.type === 'number') && (

                                                <TextField
                                                    fullWidth
                                                    type={item.type === 'number' ? 'number' : 'text'}
                                                    placeholder="Enter value..."
                                                    onChange={(e) =>
                                                        handleChange(item._id || item.id, 'answer', e.target.value)
                                                    }
                                                />

                                            )}

                                            <TextField
                                                fullWidth
                                                multiline
                                                rows={2}
                                                label="Remarks"
                                                sx={{ mt: 2 }}
                                                onChange={(e) =>
                                                    handleChange(item._id || item.id, 'remarks', e.target.value)
                                                }
                                            />

                                        </CardContent>

                                    </Card>

                                ))}

                            </CardContent>

                        </Card>

                        {/* Overall */}

                        <Card sx={{ mt: 3 }}>
                            <CardContent>

                                <Typography variant="h6" mb={3}>
                                    Inspection Summary
                                </Typography>

                                <Grid container spacing={3}>

                                    <Grid item size={{ xs: 12, }}>

                                        <FormControl fullWidth>

                                            <Select
                                                value={overallStatus}
                                                onChange={(e) =>
                                                    setOverallStatus(e.target.value)
                                                }
                                            >

                                                <MenuItem value="Pass">
                                                    Pass
                                                </MenuItem>

                                                <MenuItem value="Fail">
                                                    Fail
                                                </MenuItem>

                                                <MenuItem value="Needs Repair">
                                                    Needs Repair
                                                </MenuItem>

                                            </Select>

                                        </FormControl>

                                    </Grid>

                                    <Grid item size={{ xs: 12 }}>

                                        <TextField
                                            fullWidth
                                            multiline
                                            rows={4}
                                            label="Overall Remarks"
                                            value={remarks}
                                            onChange={(e) =>
                                                setRemarks(e.target.value)
                                            }
                                        />

                                    </Grid>

                                </Grid>

                            </CardContent>

                            <CardActions sx={{ justifyContent: "center", alignItems: "center", }}>
                                <Button
                                    variant="contained"
                                    onClick={handleSubmit}
                                    disabled={submitting}
                                    startIcon={
                                        submitting ? (
                                            <CircularProgress size={16} color="inherit" />
                                        ) : null
                                    }
                                >
                                    {submitting ? "Submitting..." : "Submit Inspection"}
                                </Button>

                                <Button
                                    variant="outlined"
                                    disabled={submitting}
                                >
                                    Save Draft
                                </Button>

                            </CardActions>
                        </Card>

                    </>

                )}

                <Snackbar
                    open={snackbar.open}
                    autoHideDuration={4000}
                    onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                >
                    <Alert
                        severity={snackbar.severity}
                        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
                    >
                        {snackbar.message}
                    </Alert>
                </Snackbar>

            </Box>

        </PermissionGuard>
    );
};

export default InspectionResult;
