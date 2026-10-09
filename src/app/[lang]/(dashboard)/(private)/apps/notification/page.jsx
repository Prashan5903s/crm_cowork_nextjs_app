'use client'

import { useEffect, useState, useCallback } from 'react'

import { useSession } from 'next-auth/react'

import {
    Box,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    Checkbox,
    FormControlLabel,
    Stack,
    Typography,
    Skeleton,
    Tab,
    Switch,
    Card,
    CardContent
} from '@mui/material'

import Grid from '@mui/material/Grid2'

import { useForm, Controller } from 'react-hook-form'

import { TabContext, TabList, TabPanel } from '@mui/lab'

import { useEditor, EditorContent } from '@tiptap/react'

import { StarterKit } from '@tiptap/starter-kit'

import { Underline } from '@tiptap/extension-underline'

import { Placeholder } from '@tiptap/extension-placeholder'

import { TextAlign } from '@tiptap/extension-text-align'

import { TextStyle } from '@tiptap/extension-text-style'

import { Color } from '@tiptap/extension-color'

import { Heading } from '@tiptap/extension-heading'

import { valibotResolver } from '@hookform/resolvers/valibot'

import { object, string, pipe, minLength, maxLength } from 'valibot'

import { toast } from 'react-toastify'

import classnames from 'classnames'

import CustomTextField from '@/@core/components/mui/TextField'
import CustomIconButton from '@/@core/components/mui/IconButton'
import DialogCloseButton from '@/components/dialogs/DialogCloseButton'


const schema = object({
    subject: pipe(minLength(1, 'Subject is required'), maxLength(100)),
    message: pipe(minLength(1, 'Message is required'), maxLength(5000)),
    footer: pipe(minLength(1, 'Footer is required'), maxLength(500)),
})

const groupByCategory = (notifications) =>
    notifications.reduce((acc, item) => {
        if (!acc[item.category]) acc[item.category] = []
        acc[item.category].push(item)

        return acc
    }, {})

const EditorToolbar = ({ editor }) => {
    if (!editor) return null

    const buttons = [
        { icon: 'tabler-bold', action: () => editor.chain().focus().toggleBold().run(), active: editor.isActive('bold') },
        { icon: 'tabler-underline', action: () => editor.chain().focus().toggleUnderline().run(), active: editor.isActive('underline') },
        { icon: 'tabler-italic', action: () => editor.chain().focus().toggleItalic().run(), active: editor.isActive('italic') },
        { icon: 'tabler-strikethrough', action: () => editor.chain().focus().toggleStrike().run(), active: editor.isActive('strike') },
        { icon: 'tabler-align-left', action: () => editor.chain().focus().setTextAlign('left').run(), active: editor.isActive({ textAlign: 'left' }) },
        { icon: 'tabler-align-center', action: () => editor.chain().focus().setTextAlign('center').run(), active: editor.isActive({ textAlign: 'center' }) },
        { icon: 'tabler-align-right', action: () => editor.chain().focus().setTextAlign('right').run(), active: editor.isActive({ textAlign: 'right' }) },
        { icon: 'tabler-align-justified', action: () => editor.chain().focus().setTextAlign('justify').run(), active: editor.isActive({ textAlign: 'justify' }) },
    ]

    return (
        <div className="flex flex-wrap gap-x-3 gap-y-1 plb-2 pli-4 border-b items-center">
            {buttons.map((btn, idx) => (
                <CustomIconButton
                    key={idx}
                    variant="tonal"
                    size="small"
                    color={btn.active ? 'primary' : undefined}
                    onClick={btn.action}
                >
                    <i className={classnames(btn.icon, { 'text-textSecondary': !btn.active })} />
                </CustomIconButton>
            ))}
        </div>
    )
}

const SkeletonComponent = () => {
    return (
        <Card>
            <CardContent>
                {/* Skeleton for Tabs */}
                <Stack direction="row" spacing={2} sx={{ overflowX: 'auto' }}>
                    {[...Array(4)].map((_, idx) => (
                        <Skeleton key={idx} variant="rectangular" width={100} height={40} />
                    ))}
                </Stack>

                {/* Skeleton for Tab Panel Content */}
                <Box mt={4}>
                    <Skeleton variant="text" height={40} width="60%" />
                    <Skeleton variant="text" height={30} width="40%" />
                    <Skeleton variant="rectangular" height={200} sx={{ mt: 2 }} />
                </Box>
            </CardContent>
        </Card>
    )
}

const NotificationTabs = () => {
    const { data: session } = useSession()
    const token = session?.user?.token
    const URL = process.env.NEXT_PUBLIC_API_URL

    const [tabValue, setTabValue] = useState('')
    const [data, setData] = useState(null)
    const [formData, setFormData] = useState(null)
    const [loading, setLoading] = useState(true)
    const [openDialog, setOpenDialog] = useState(false)
    const [editData, setEditData] = useState(null)

    const fetchCreate = useCallback(async () => {
        try {
            const res = await fetch(`${URL}/company/notification/create`, {
                headers: { Authorization: `Bearer ${token}` }
            })

            const json = await res.json()
            const result = json?.data?.notification

            setData(result)
            setTabValue(result?.notification_data?.[0]?._id?.toString() || '')
        } catch (err) {
            console.error('Fetch error:', err)
        } finally {
            setLoading(false)
        }
    }, [URL, token])

    const fetchNotificationFormData = async (tabId) => {
        setLoading(true)

        try {
            const res = await fetch(`${URL}/company/notification/form/${tabId}`, {
                headers: { Authorization: `Bearer ${token}` }
            })

            const json = await res.json()

            setFormData(json?.data || [])
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (token && URL) fetchCreate()
    }, [fetchCreate, token, URL])

    useEffect(() => {
        if (tabValue) fetchNotificationFormData(tabValue)
    }, [tabValue])

    const handleClose = () => {
        setOpenDialog(false)
        setEditData(null)
    }

    const updateNotificationAPI = async (value, datas) => {
        try {

            const response = await fetch(`${URL}/company/notification/form/update/${datas._id ?? datas}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(value),
            });

            const data = await response.json();

            if (!response.ok) {
                console.error("API Error:", data);
                throw new Error(data?.message || "Failed to update notification");
            }

            await fetchNotificationFormData(tabValue);
            toast.success('Notification updated successfully', { autoClose: 1000 });

            setOpenDialog(false);
            setEditData(null);
        } catch (error) {
            console.error("Update Notification Error:", error.message);
            throw error;
        }
    };

    const EmailDialog = () => {
        const editor = useEditor({
            extensions: [
                StarterKit.configure({ heading: false }),
                Heading.configure({ levels: [1, 2, 3] }),
                Underline, TextStyle, Color,
                Placeholder.configure({ placeholder: 'Message' }),
                TextAlign.configure({ types: ['heading', 'paragraph'] })
            ],
            content: editData?.message || ''
        })

        const footerEditor = useEditor({
            extensions: [
                StarterKit.configure({ heading: false }),
                Heading.configure({ levels: [1, 2, 3] }),
                Underline, TextStyle, Color,
                Placeholder.configure({ placeholder: 'Footer' }),
                TextAlign.configure({ types: ['heading', 'paragraph'] })
            ],
            content: editData?.footer || ''
        })

        const {
            control,
            handleSubmit,
            formState: { errors },
            reset
        } = useForm({
            resolver: valibotResolver(schema),
            defaultValues: {
                subject: editData?.subject || '',
                message: editData?.message || '',
                footer: editData?.footer || '',
                default_select: editData?.default_select || true
            }
        })

        const handleContainerClick = () => {
            if (editor) editor.chain().focus().run()
        }

        const handleFooterClick = () => {
            if (footerEditor) footerEditor.chain().focus().run()
        }

        const onSubmit = async (values) => {
            const payload = {
                subject: values.subject,
                message: editor?.getHTML() || '',
                footer: footerEditor?.getHTML() || '',
                default_select: editData?.default_select
            };

            try {
                await updateNotificationAPI(payload, editData);
            } catch (err) {
                console.log("Error", err);

            }
        };

        useEffect(() => {
            reset({
                subject: editData?.subject || '',
                message: editData?.message || '',
                footer: editData?.footer || '',
                default_select: editData?.default_select
            });

            // Set initial content in editors
            editor?.commands.setContent(editData?.message || '');
            footerEditor?.commands.setContent(editData?.footer || '');
        }, [editData, reset, editor, footerEditor]);


        return (
            <Dialog open={openDialog} fullWidth maxWidth="md" sx={{ '& .MuiDialog-paper': { overflow: 'visible' } }}>
                <DialogCloseButton onClick={handleClose}><i className='tabler-x' /></DialogCloseButton>
                <DialogTitle variant='h4' className='text-center'>Edit Email Notification</DialogTitle>
                <form onSubmit={handleSubmit(onSubmit)} noValidate>
                    <DialogContent>
                        <Grid container spacing={4}>
                            <Grid size={{ xs: 12 }}>
                                <Controller
                                    name="subject"
                                    control={control}
                                    render={({ field }) => (
                                        <CustomTextField
                                            {...field}
                                            fullWidth
                                            size="small"
                                            label="Subject"
                                            required
                                            error={!!errors.subject}
                                            helperText={errors.subject?.message}
                                        />
                                    )}
                                />
                            </Grid>

                            <Grid size={{ xs: 12 }}>
                                <Typography>Message <span>*</span></Typography>
                                <EditorToolbar editor={editor} />
                                <Box
                                    onClick={handleContainerClick}
                                    sx={{
                                        border: '1px solid #ccc',
                                        borderRadius: 0,
                                        p: 2,
                                        fontSize: '0.875rem',
                                        lineHeight: 1.5,
                                        minHeight: 150,
                                        '&:focus-within': {
                                            borderColor: 'primary.main',
                                        },
                                        '& .ProseMirror': {
                                            outline: 'none',
                                        },
                                    }}
                                >
                                    <EditorContent editor={editor} spellCheck={false} />
                                </Box>
                                {errors.message && <Typography color="error" variant="body2" mt={1}>{errors.message.message}</Typography>}
                            </Grid>

                            <Grid size={{ xs: 12 }}>
                                <Typography>Footer <span>*</span></Typography>
                                <EditorToolbar editor={footerEditor} />
                                <Box
                                    onClick={handleFooterClick}
                                    sx={{
                                        border: '1px solid #ccc',
                                        borderRadius: 0,
                                        p: 2,
                                        fontSize: '0.875rem',
                                        lineHeight: 1.5,
                                        minHeight: 150,
                                        '&:focus-within': {
                                            borderColor: 'primary.main',
                                        },
                                        '& .ProseMirror': {
                                            outline: 'none',
                                        },
                                    }}
                                >
                                    <EditorContent editor={footerEditor} spellCheck={false} />
                                </Box>
                                {errors.footer && <Typography color="error" variant="body2" mt={1}>{errors.footer.message}</Typography>}
                            </Grid>

                            <Grid size={{ xs: 12 }} display="flex" justifyContent="center" gap={2}>
                                <Button variant="contained" type="submit">Submit</Button>
                                <Button variant="tonal" color="error" onClick={handleClose}>Cancel</Button>
                            </Grid>
                        </Grid>
                    </DialogContent>
                </form>
            </Dialog>
        )
    }

    const handleCheckboxChange = (category, id, val) => async (event) => {
        const updatedDefault = event.target.checked

        const payload = {
            subject: val.subject,
            message: val.message,
            footer: val.footer,
            default_select: updatedDefault
        }

        try {
            await updateNotificationAPI(payload, val._id)
        } catch (e) {
            console.error(e)
        }
    }

    const EmailNotificationTab = () => {
        const grouped = groupByCategory(formData)

        return (
            <Box>
                {Object.entries(grouped).map(([category, items]) => (
                    <Box key={category} mb={4}>
                        <Typography variant="subtitle1" fontWeight={800} mb={2}>
                            {category}
                        </Typography>
                        <Stack spacing={2}>
                            {items.map(item => (
                                <Box key={item._id} display="flex" justifyContent="space-between" alignItems="center" border="1px solid #ddd" borderRadius={2} p={2}>
                                    <FormControlLabel
                                        control={
                                            <Checkbox
                                                checked={!!item.default_select}
                                                onChange={handleCheckboxChange(category, item._id, item)}
                                                color="primary"
                                            />
                                        }
                                        label={item.template_name}
                                    />
                                    <a onClick={() => {
                                        setEditData(item)
                                        setOpenDialog(true)
                                    }}><i className='tabler-edit'></i></a>
                                </Box>
                            ))}
                        </Stack>
                    </Box>
                ))}
                {editData && <EmailDialog />}
            </Box>
        )
    }

    const AppPushNotificationTab = () => (
        <Box>
            <Typography variant="h6" mb={2}>In-App & Push Notifications</Typography>
            <Stack spacing={2}>
                {formData?.map(item => (
                    <Box key={item._id} display="flex" justifyContent="space-between" alignItems="center" border="1px solid #ddd" borderRadius={2} p={2}>
                        <Typography flex={1}>{item.template_name}</Typography>
                        <Switch onChange={handleCheckboxChange(null, item._id, item)} checked={!!item?.default_select} color="primary" />
                    </Box>
                ))}
            </Stack>
        </Box>
    )

    const SMSNotificationTab = () => (
        <Box>
            <Typography variant="h6" mb={2}>SMS Notifications</Typography>
            <Stack spacing={2}>
                {formData?.map(item => (
                    <Box key={item._id} display="flex" justifyContent="space-between" alignItems="center" border="1px solid #ddd" borderRadius={2} p={2}>
                        <Typography flex={1}>{item.template_name}</Typography>
                        <Switch onChange={handleCheckboxChange(null, item._id, item)} checked={!!item?.default_select} color="primary" />
                    </Box>
                ))}
            </Stack>
        </Box>
    )

    const renderTabContent = () => {
        if (!formData) return <Box>Loading data...</Box>

        switch (tabValue) {
            case '687752877c5f232a7b35c975':
                return <EmailNotificationTab />
            case '687752877c5f232a7b35c97a':
                return <AppPushNotificationTab />
            case '687752877c5f232a7b35c97b':
                return <SMSNotificationTab />
            default:
                return <Box>No tab selected</Box>
        }
    }

    if (loading) return <SkeletonComponent />

    return (
        <Card>
            <CardContent>
                <TabContext value={tabValue}>
                    <TabList onChange={(_, newVal) => setTabValue(newVal)} variant="scrollable" className="border-b">
                        {data?.notification_data?.map(item => (
                            <Tab key={item._id} label={item.type} value={item._id.toString()} />
                        ))}
                    </TabList>
                    <Box mt={4}>
                        <TabPanel value={tabValue} className="p-0">
                            {renderTabContent()}
                        </TabPanel>
                    </Box>
                </TabContext>
            </CardContent>
        </Card>
    )
}

export default NotificationTabs
