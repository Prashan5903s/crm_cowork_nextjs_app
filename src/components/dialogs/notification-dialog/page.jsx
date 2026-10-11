'use client'

import { useEffect, useMemo, useState } from 'react'

import { useRouter, useParams } from 'next/navigation'

import { useSession } from 'next-auth/react'

import { useForm, Controller } from 'react-hook-form'

import { valibotResolver } from '@hookform/resolvers/valibot'

import {
    object, string, pipe, minLength, maxLength, optional
} from 'valibot'

import {
    Card,
    Button,
    Divider,
    MenuItem,
    CardHeader,
    Typography,
    CardActions,
    Checkbox,
    CardContent,
    FormControlLabel,
} from '@mui/material'

import Grid from '@mui/material/Grid2'
import { toast } from 'react-toastify'

import { useEditor, EditorContent } from '@tiptap/react'
import { StarterKit } from '@tiptap/starter-kit'
import { Underline } from '@tiptap/extension-underline'
import { Placeholder } from '@tiptap/extension-placeholder'
import { TextAlign } from '@tiptap/extension-text-align'
import { TextStyle } from '@tiptap/extension-text-style'
import { Color } from '@tiptap/extension-color'
import { Heading } from '@tiptap/extension-heading'

import classnames from 'classnames'
import '@/libs/styles/tiptapEditor.css'

import CustomTextField from '@core/components/mui/TextField'
import CustomIconButton from '@core/components/mui/IconButton'
import PermissionGuard from '@/hocs/PermissionClientGuard'

import SkeletonFormComponent from '@/components/skeleton/form/page'

function slugify(text) {
    return text
        ?.toString()
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '') // remove non-alphanumeric except space and hyphen
        .replace(/\s+/g, '-')         // replace spaces with hyphens
        .replace(/-+/g, '-')          // collapse multiple hyphens
        .replace(/^-+|-+$/g, '');     // trim hyphens from start and end
}

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
        { icon: 'tabler-align-justified', action: () => editor.chain().focus().setTextAlign('justify').run(), active: editor.isActive({ textAlign: 'justify' }) }
    ]

    return (
        <div className="flex flex-wrap gap-x-3 gap-y-1 plb-2 pli-4 border-bs items-center">
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

const NotificationForm = () => {
    
    const router = useRouter()
    const { lang: locale, id } = useParams()
    const { data: session } = useSession()
    const token = session?.user?.token
    const API_URL = process.env.NEXT_PUBLIC_API_URL

    const [createData, setCreateData] = useState()
    const [selectOpt, setSelectOpt] = useState()
    const [selectForm, setSelectForm] = useState(false)

    const [editData, setEditData] = useState()

    const [isEditorFocused, setIsEditorFocused] = useState(false);

    const [loading, setLoading] = useState(false);

    const [placeholder, setPlaceholder] = useState()

    const [selectedPlaceholder, setSelectedPlaceholder] = useState("");
    const [selectedVariable, setSelectedVariable] = useState("")

    const [selectedValue, setSelectedValue] = useState()

    useEffect(() => {
        if (selectedPlaceholder && selectedVariable) {
            setSelectedValue(`${slugify(selectedPlaceholder)}_${slugify(selectedVariable)}`)
        }
    }, [selectedPlaceholder, selectedVariable])

    const schema = useMemo(() => {
        return object({
            template_name: pipe(string(), minLength(1, 'Template name is required'), maxLength(50, 'Template name max length can be 50')),
            notification_type: pipe(string(), minLength(1, 'Notification Type is required')),
            category_type: (selectOpt && selectOpt === '687752877c5f232a7b35c975')
                ? pipe(string(), minLength(1, 'Category Type is required'))
                : pipe(),
            default_select: pipe(),
            subject: pipe(string(), minLength(1, 'Subject is required'), maxLength(100, 'Subject max length can be 100')),
            message: pipe(string(), minLength(1, 'Message is required'), maxLength(5000, 'Message max length can be 5000')),
            footer: pipe(string(), minLength(1, 'Footer is required'), maxLength(500, 'Footer max length can be 500')),
        })
    }, [selectOpt])

    const {
        control, reset, setValue, handleSubmit, formState: { errors }
    } = useForm({
        resolver: valibotResolver(schema),
        defaultValues: {
            template_name: '',
            notification_type: '',
            category_type: '',
            subject: '',
            message: '',
            footer: '',
            default_select: true
        }
    })

    const editor = useEditor({
        extensions: [
            StarterKit.configure({ heading: false }),
            Heading.configure({ levels: [1, 2, 3] }),
            Underline, TextStyle, Color,
            Placeholder.configure({ placeholder: 'Message' }),
            TextAlign.configure({ types: ['heading', 'paragraph'] })
        ],
        onUpdate: ({ editor }) => setValue('message', editor.getHTML())
    })

    const footerEditor = useEditor({
        extensions: [
            StarterKit.configure({ heading: false }),
            Heading.configure({ levels: [1, 2, 3] }),
            Underline, TextStyle, Color,
            Placeholder.configure({ placeholder: 'Footer' }),
            TextAlign.configure({ types: ['heading', 'paragraph'] })
        ],
        onUpdate: ({ editor }) => setValue('footer', editor.getHTML())
    })

    const fetchCreateData = async () => {
        try {
            const res = await fetch(`${API_URL}/company/notification/create`, {
                headers: { Authorization: `Bearer ${token}` }
            })

            const data = await res.json()

            if (res.ok) {

                setPlaceholder(data?.data?.placeholder?.placeholder_data)
                setCreateData(data?.data?.notification)
            }
        } catch (error) {
            toast.error('Failed to load create data')
        }
    }

    const fetchEditData = async () => {
        try {
            const res = await fetch(`${API_URL}/company/notification/edit/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            })

            const data = await res.json()

            if (res.ok) {
                const result = data?.data

                setEditData(result)
                setValue('template_name', result?.template_name)
                setValue('notification_type', result?.notification_type)
                setSelectOpt(result?.notification_type)
                setValue('category_type', result?.category_type)
                setValue('subject', result?.subject)
                setValue('message', result?.message)
                setValue('footer', result?.footer)
                setValue('default_select', !!result?.default_select)


                editor?.commands.setContent(result?.message || '')
                footerEditor?.commands.setContent(result?.footer || '')
            }
        } catch (error) {
            toast.error('Failed to load edit data')
        }
    }

    useEffect(() => {
        if (API_URL && token) {
            fetchCreateData()
            if (id) fetchEditData()
        }
    }, [API_URL, token, id])

    useEffect(() => {

        if (id) {

            if (createData && editData) {
                setLoading(true)
            }

        } else {

            if (createData) {
                setLoading(true)
            }

        }

    }, [id, createData, editData])

    useEffect(() => {
        if (createData && selectOpt && editor && footerEditor && selectForm) {
            const selected = createData?.notification_data?.find(item => item._id === selectOpt)

            if (selected) {
                const { default_message = '', default_footer = '' } = selected

                editor.commands.setContent(default_message)
                footerEditor.commands.setContent(default_footer)
                setValue('message', default_message)
                setValue('footer', default_footer)
            }
        }
    }, [createData, selectOpt, editor, footerEditor])

    const onSubmit = async (values) => {
        try {

            if (selectOpt !== '687752877c5f232a7b35c975') {
                values.category_type = null
            }

            const res = await fetch(
                id
                    ? `${API_URL}/company/notification/update/${id}`
                    : `${API_URL}/company/notification`,
                {
                    method: id ? 'PUT' : 'POST',
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(values)
                }
            )

            const result = await res.json()

            if (res.ok) {
                toast.success(`Notification ${id ? 'updated' : 'created'} successfully`, { autoClose: 1000 })
                router.push(`/${locale}/apps/admin/notification`)
            } else {
                toast.error(result.message || 'Something went wrong')
            }
        } catch (error) {
            toast.error('Submission failed')
        }
    }

    if (!loading) {
        return (
            <>
                <SkeletonFormComponent />
            </>
        )
    }

    return (
        <PermissionGuard locale={locale} element="isSuperAdmin">
            <Card>
                <CardHeader title="Notification Template" />
                <Divider />
                <form onSubmit={handleSubmit(onSubmit)} noValidate>
                    <CardContent>
                        <Grid container spacing={6}>
                            <Grid size={{ xs: 12 }}>
                                <Controller
                                    name="template_name"
                                    control={control}
                                    render={({ field }) => (
                                        <CustomTextField {...field} required fullWidth label="Template Name"
                                            placeholder="Template Name"
                                            error={!!errors.template_name}
                                            helperText={errors.template_name?.message}
                                        />
                                    )}
                                />
                            </Grid>

                            <Grid size={{ xs: 12 }}>
                                <Controller
                                    name="notification_type"
                                    control={control}
                                    render={({ field }) => (
                                        <CustomTextField {...field} select required fullWidth label="Notification Type"
                                            onChange={(e) => {
                                                field.onChange(e)
                                                setSelectOpt(e.target.value)
                                                setSelectForm(true)
                                            }}
                                            error={!!errors.notification_type}
                                            helperText={errors.notification_type?.message}
                                        >
                                            {(createData?.notification_data || []).map((item) => (
                                                <MenuItem key={item._id} value={item._id}>
                                                    {item.type}
                                                </MenuItem>
                                            ))}
                                        </CustomTextField>
                                    )}
                                />
                            </Grid>

                            {selectOpt === '687752877c5f232a7b35c975' && (
                                <Grid size={{ xs: 12 }}>
                                    <Controller
                                        name="category_type"
                                        control={control}
                                        render={({ field }) => (
                                            <CustomTextField
                                                {...field}
                                                select
                                                required
                                                fullWidth
                                                label="Category Type"
                                                error={!!errors.category_type}
                                                helperText={errors.category_type?.message}
                                            >
                                                {(createData?.notification_data?.find(item => item._id === selectOpt)?.category || []).map(item => (
                                                    <MenuItem key={item._id} value={item._id}>{item.name}</MenuItem>
                                                ))}
                                            </CustomTextField>
                                        )}
                                    />
                                </Grid>
                            )}

                            <Grid size={{ xs: 12 }}>
                                <Controller
                                    name="subject"
                                    control={control}
                                    render={({ field }) => (
                                        <CustomTextField {...field} required fullWidth label="Subject"
                                            placeholder="Subject"
                                            error={!!errors.subject}
                                            helperText={errors.subject?.message}
                                        />
                                    )}
                                />
                            </Grid>

                            <Grid item size={{ xs: 12 }}>
                                <FormControlLabel
                                    control={
                                        <Controller
                                            name="default_select"
                                            control={control}
                                            render={({ field }) => (
                                                <Checkbox
                                                    {...field}
                                                    checked={!!field.value}
                                                    onChange={(e) => {
                                                        field.onChange(e.target.checked)
                                                        setValue('default_select', e.target.checked)


                                                    }}

                                                />
                                            )}
                                        />
                                    }
                                    label={
                                        <Typography component="span">
                                            Default selected <Typography component="span" color="danger">*</Typography>
                                        </Typography>
                                    }
                                />
                            </Grid>

                            <Grid item size={{ xs: 12 }}>
                                <Typography>
                                    Message <span>*</span>
                                </Typography>
                            </Grid>

                            {/* Placeholder, Variable and Insert in one row */}
                            <Grid size={{ xs: 12 }}>
                                <Grid container spacing={2}>
                                    {/* Placeholder Dropdown */}
                                    <Grid size={{ xs: 5 }}>
                                        <CustomTextField
                                            select
                                            fullWidth
                                            value={selectedPlaceholder}
                                            onChange={(e) => {
                                                setSelectedPlaceholder(e.target.value);
                                                setSelectedVariable(""); // reset variable on placeholder change
                                            }}
                                        >
                                            {placeholder && placeholder.map((item, index) => (
                                                <MenuItem key={index} value={item.name}>
                                                    {item.name}
                                                </MenuItem>
                                            ))}
                                        </CustomTextField>
                                    </Grid>

                                    {/* Variable Dropdown */}
                                    <Grid size={{ xs: 5 }}>
                                        <CustomTextField
                                            select
                                            fullWidth
                                            value={selectedVariable}
                                            onChange={(e) => setSelectedVariable(e.target.value)}
                                            disabled={!selectedPlaceholder}
                                        >
                                            {(
                                                selectedPlaceholder && placeholder && placeholder.find((p) => p.name === selectedPlaceholder)
                                                    ?.variable || []
                                            ).map((v) => (
                                                <MenuItem key={v.name} value={v.name}>
                                                    {v.name}
                                                </MenuItem>
                                            ))}
                                        </CustomTextField>
                                    </Grid>

                                    {/* Insert Button */}
                                    <Grid size={{ xs: 2 }}>
                                        <Button
                                            fullWidth
                                            variant="outlined"
                                            onClick={() => {
                                                if (selectedValue && editor && isEditorFocused) {
                                                    setIsEditorFocused(false)
                                                    editor
                                                        .chain()
                                                        .insertContent(`{{${selectedValue}}}`)
                                                        .run();
                                                }
                                            }}
                                            disabled={!selectedPlaceholder || !selectedVariable}
                                        >
                                            Insert
                                        </Button>
                                    </Grid>
                                </Grid>
                            </Grid>


                            <Grid item size={{ xs: 12 }}>
                                <EditorToolbar editor={editor} />
                                <EditorContent
                                    editor={editor}
                                    onFocus={() => setIsEditorFocused(true)}
                                    className="border rounded p-2 min-h-[150px]"
                                />
                                {errors.message && (
                                    <p className="text-error text-sm mt-1">{errors.message?.message}</p>
                                )}
                            </Grid>

                            <Grid size={{ xs: 12 }}>
                                <Typography>Footer <span>*</span></Typography>
                                <EditorToolbar editor={footerEditor} />
                                <EditorContent editor={footerEditor} className="border rounded p-2 min-h-[150px]" />
                                {errors.footer && <p className="text-error text-sm mt-1">{errors.footer?.message}</p>}
                            </Grid>
                        </Grid>
                    </CardContent>
                    <Divider />
                    <CardActions>
                        <Button variant="contained" type="submit">Submit</Button>
                        <Button variant="tonal" color="error" type="button"
                            onClick={() => router.push(`/${locale}/apps/notification/list`)}
                        >
                            Cancel
                        </Button>
                    </CardActions>
                </form>
            </Card>
        </PermissionGuard>
    )
}

export default NotificationForm
