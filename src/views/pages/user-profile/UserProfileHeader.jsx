'use client'

import { useRef, useState } from 'react'

import { useSession } from 'next-auth/react'
import {
  CircularProgress,
  IconButton,
  Typography,
  CardContent,
  CardMedia,
  Card
} from '@mui/material'
import { toast } from 'react-toastify'

const UserProfileHeader = ({ data, onImageUpload }) => {
  const frontURL = process.env.NEXT_PUBLIC_ASSETS_URL
  const API_URL = process.env.NEXT_PUBLIC_API_URL

  const { data: session, update } = useSession()
  const token = session?.user?.token

  const fileInputRef = useRef(null)
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState(null)

  // Handle file select
  const handleFileChange = async (event) => {
    const file = event.target.files[0]

    if (!file) return

    setPreview(URL.createObjectURL(file))
    setUploading(true)

    try {
      const formData = new FormData()

      formData.append('photo', file)

      const res = await fetch(`${API_URL}/user/profile/user/data`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      })

      const result = await res.json()

      if (res.ok && result?.data) {
        const uploadedPhoto = result.data

        // ✅ Update user session photo
        await update({
          ...session,
          user: {
            ...session.user,
            photo: uploadedPhoto
          }
        })

        toast.success('Image uploaded successfully', { autoClose: 1000 })

        if (onImageUpload) onImageUpload(uploadedPhoto)
      } else {
        toast.error(result?.message || 'Image upload failed')
      }
    } catch (error) {
      console.error('Upload failed:', error)
      toast.error('Upload failed')
    } finally {
      setUploading(false)
    }
  }

  return (
    <Card>
      {/* Banner */}
      <CardMedia
        image='/images/pages/profile-banner.png'
        className='h-[250px]'
      />

      <CardContent className='flex flex-col md:flex-row md:items-end justify-center md:justify-start gap-5 !pt-0'>
        {/* Profile Image Section */}
        <div className='relative flex m-[-40px_0_0_-5px] border-[5px] border-backgroundPaper bg-backgroundPaper rounded-md'>
          <img
            height={120}
            width={120}
            src={
              preview
                ? preview
                : !data?.photo
                ? '/images/avatars/11.png'
                : `${frontURL}/uploads/images/${data.photo}`
            }
            className='rounded-md object-cover'
            alt='Profile image'
          />

          {/* Edit Icon */}
          <IconButton
            size='small'
            className='absolute bottom-2 right-2 bg-white shadow-md hover:bg-gray-100'
            onClick={() => fileInputRef.current?.click()}
          >
            {uploading ? (
              <CircularProgress size={20} />
            ) : (
              <i className='tabler-edit'></i>
            )}
          </IconButton>

          {/* Hidden File Input */}
          <input
            type='file'
            accept='image/*'
            ref={fileInputRef}
            className='hidden'
            onChange={handleFileChange}
          />
        </div>

        {/* User Info */}
        <div className='flex flex-col sm:flex-row sm:justify-between sm:items-end items-center gap-6'>
          <div className='flex flex-col items-center sm:items-start gap-2'>
            <Typography variant='h4'>
              {data?.first_name} {data?.last_name}
            </Typography>

            <div className='flex flex-wrap gap-6 justify-center sm:justify-start'>
              {data?.first_name && (
                <div className='flex items-center gap-2'>
                  <i className='tabler-user' />
                  <Typography className='font-medium'>
                    {data?.first_name} {data?.last_name}
                  </Typography>
                </div>
              )}

              {data?.phone && (
                <div className='flex items-center gap-2'>
                  <i className='tabler-phone' />
                  <Typography className='font-medium'>{data?.phone}</Typography>
                </div>
              )}

              {data?.address && (
                <div className='flex items-center gap-2'>
                  <i className='tabler-map-pin' />
                  <Typography className='font-medium'>
                    {data?.address}
                  </Typography>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default UserProfileHeader
