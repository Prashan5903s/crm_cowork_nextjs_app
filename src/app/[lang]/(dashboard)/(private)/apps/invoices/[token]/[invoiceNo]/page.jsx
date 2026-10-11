'use client'

import { useEffect, useState } from 'react'

import { useParams } from "next/navigation";

import {
  Card,
  Typography,
  CardContent
} from '@mui/material'

import Grid from '@mui/material/Grid2'

import { toWords } from 'number-to-words'

import { toast } from 'react-toastify'

import tableStyles from '@core/styles/table.module.css'

import Logo from '@components/layout/shared/Logo'

const ViewInvoiceModal = () => {

  const API_URL = process.env.NEXT_PUBLIC_API_URL

  const [selectedZone, setSelectedZone] = useState()

  const { token: token, invoiceNo: invoiceNo } = useParams();

  const fetchInvoiceData = async () => {
    try {

      const response = await fetch(`${API_URL}/company/invoice/pdf/page/${invoiceNo}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      const data = await response.json()

      if (response.ok) {

        const value = data?.data

        setSelectedZone(value)
      } else {

        toast.error(data?.message, {
          autoClose: 1000
        })
      }

    } catch (error) {
      throw new Error(error)
    }
  }

  useEffect(() => {
    if (API_URL && token) {
      fetchInvoiceData()
    }
  }, [API_URL, token])

  const formattedDate = (date) => {

    return new Date(date).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  };

  const total = selectedZone?.payments?.reduce(
    (acc, item) => acc + item.amount,
    0
  ) || 0;

  const payData = {
    "utilityBills": "Utility Bill",
    "common-area-bill": "Common Area Bill",
  }

  return (
    <>
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
                    <Typography variant='h5'>{`Invoice #${selectedZone?.invoice_no}`}</Typography>
                    <div className='flex flex-col gap-1'>
                      <Typography color='text.primary'>{`Date Issued: ${formattedDate(selectedZone?.bill_date)}`}</Typography>
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
                      <th className='!bg-transparent'>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedZone?.payments.map((item, index) => (
                      <tr key={index}>
                        <td>
                          <Typography color='text.primary'>{index + 1}</Typography>
                        </td>
                        <td>
                          <Typography color='text.primary'>1</Typography>
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
    </>
  )

}

export default ViewInvoiceModal;
