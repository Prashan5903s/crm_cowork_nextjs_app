"use client"

import { useEffect, useState, useMemo } from 'react'

import { useParams } from 'next/navigation'

import { useSession } from 'next-auth/react'

import Grid from '@mui/material/Grid2'

import {
  Card,
  CardContent,
  Typography,
  Divider,
  Box,
  Chip,
  Avatar,
  Pagination,
  Stack,
  Skeleton
} from '@mui/material'

import { format } from "date-fns";

import PermissionGuard from '@/hocs/PermissionClientGuard'

import FormatTime from '@/utils/formatTime'

import LogisticsStatisticsCard from '@/views/pages/widget-examples/statistics/LogisticsStatisticsCard'

const monthMap = {
  Jan: "Jan",
  Feb: "Feb",
  Mar: "Mar",
  Apr: "Apr",
  May: "May",
  Jun: "Jun",
  Jul: "Jul",
  Aug: "Aug",
  Sep: "Sept",
  Oct: "Oct",
  Nov: "Nov",
  Dec: "Dec"
};

function formatDateCustom(date) {
  if (!date) return "-";
  const d = new Date(date);
  const day = format(d, "dd");
  const month = monthMap[format(d, "MMM")];
  const year = format(d, "yyyy");

  return `${day} ${month} ${year}`;
}

const StyledCard = ({ children }) => (
  <Card
    sx={{
      borderRadius: 3,
      boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
      transition: 'all 0.3s ease',
      '&:hover': {
        boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
        transform: 'translateY(-2px)',
      },
    }}
  >
    {children}
  </Card>

)

function formatTimeTo12Hour(timeStr) {
  if (!timeStr) return "-";

  const [hours, minutes] = timeStr.split(":").map(Number);
  let h = hours % 12 || 12; // 0 → 12
  let ampm = hours >= 12 ? "PM" : "AM";

  return `${String(h).padStart(2, "0")}:${String(minutes).padStart(2, "0")} ${ampm}`;
}

const UserDashboard = () => {

  const { lang: locale } = useParams();

  const URL = process.env.NEXT_PUBLIC_API_URL
  const { data: session } = useSession() || {}
  const token = session?.user?.token

  const [billData, setBillData] = useState({
    'pendingBill': 0,
    'paidBill': 0
  })

  const [dashboardData, setDashboardData] = useState()

  const fetchDashboardData = async () => {
    try {
      const response = await fetch(`${URL}/company/dashboard`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      const result = await response.json()

      if (response.ok) {
        const value = result?.data;

        setDashboardData(value)
      }

    } catch (error) {
      throw new Error(error)
    }
  }

  useEffect(() => {
    if (URL && token) {
      fetchDashboardData()
    }
  }, [URL, token])

  const fixedCostMap = useMemo(() => {
    const map = new Map();

    if (Array.isArray(dashboardData?.fixedCost) && dashboardData?.fixedCost.length > 0) {
      dashboardData.fixedCost.forEach((item) => {
        map.set(item.apartment_type, String(item.unit_value || ""));
      });
    } else if (dashboardData?.fixedCost && typeof dashboardData.fixedCost === "object") {
      map.set("default", String(dashboardData.fixedCost.unit_value || ""));
    }


    return map;
  }, [dashboardData?.fixedCost]);

  useEffect(() => {
    if (dashboardData) {
      let unpaid = 0;
      let paid = dashboardData?.['paidUtilityBill']?.length + dashboardData?.['paidCommanAreaBill']?.length

      let processedData = {};

      const grouped = {};

      dashboardData?.userBill?.forEach((row) => {
        const billId = row?.bill_id?._id;
        const apartmentId = row?.apartment_id?._id;
        const key = `${billId}-${apartmentId}`;

        if (!grouped[key]) {
          grouped[key] = {
            ...row,
            paid_cost: 0,
            total_cost: 0,
            status: "Unpaid",
          };
        }

        // total_cost calculation
        const additionalCost = row?.bill_id?.additional_cost || [];
        const apartmentTypeRaw = row?.apartment_id?.apartment_type || "";
        const apartmentArea = row?.apartment_id?.apartment_area;

        const fixedCost = Array.isArray(dashboardData?.fixedCost)
          ? Number(fixedCostMap.get(apartmentTypeRaw) || 0)
          : Number(fixedCostMap.get("default") || 0) * Number(apartmentArea).toFixed(0);

        const additionalTotal = additionalCost.reduce(
          (sum, val) => sum + (val.amount || 0),
          0
        );

        grouped[key].total_cost = Number(fixedCost) + Number(additionalTotal);

        // sum paid cost
        grouped[key].paid_cost += row?.payments?.reduce(
          (sum, val) => sum + (val.amount || 0),
          0
        ) || 0;

        // status
        grouped[key].status =
          grouped[key].paid_cost >= grouped[key].total_cost
            ? "Paid"
            : "Unpaid";
      });

      processedData = Object.values(grouped);

      const paidUserBill = processedData.filter(
        (row) => row.paid_cost === row.total_cost
      );

      const unpaidUserBill = processedData.filter(
        (row) => row.paid_cost !== row.total_cost
      );

      paid += paidUserBill?.length;
      unpaid += unpaidUserBill?.length;

      setBillData({
        'pendingBill': unpaid,
        'paidBill': paid
      })
    }
  }, [dashboardData])


  const data = [
    {
      title: 'Tower',
      stats: dashboardData?.['tower'].length || 0,
      trendNumber: 18.2,
      avatarIcon: 'tabler-report',
      color: 'primary'
    },
    {
      title: 'Apartment',
      stats: dashboardData?.['apartment'].length || 0,
      trendNumber: -8.7,
      avatarIcon: 'tabler-checklist',
      color: 'success'
    },
    {
      title: 'Unsold apartment',
      stats: dashboardData?.['unsoldApartment'].length || 0,
      trendNumber: 4.3,
      avatarIcon: 'tabler-receipt',
      color: 'error'
    },
    {
      title: 'Maintenance dues',
      stats: billData?.pendingBill,
      trendNumber: 2.5,
      avatarIcon: 'tabler-receipt',
      color: 'info'
    },
    {
      title: 'Owner',
      stats: dashboardData?.owner?.length || 0,
      trendNumber: 2.5,
      avatarIcon: 'tabler-user',
      color: 'info'
    }
  ]

  const [page, setPage] = useState(1);
  const rowsPerPage = 5;

  const pendingComplaints = dashboardData?.pendingComplain || [];

  const totalPages = Math.ceil(pendingComplaints.length / rowsPerPage);

  const paginatedComplaints = pendingComplaints.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage
  );

  if (!dashboardData) {
    return (
      <PermissionGuard locale={locale} element={'isCompany'}>
        <Grid container spacing={6}>
          {/* Row 1 - Stats placeholder */}
          <Grid size={{ xs: 12 }}>
            <StyledCard>
              <CardContent>
                <Skeleton variant="text" width={200} height={30} />
                <Skeleton variant="rectangular" height={120} sx={{ mt: 2, borderRadius: 2 }} />
              </CardContent>
            </StyledCard>
          </Grid>

          {/* Row 2 */}
          <Grid size={{ xs: 12, md: 6 }}>
            <StyledCard>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Skeleton variant="text" width={180} height={30} />
                  <Box display="flex" gap={1}>
                    <Skeleton variant="rectangular" width={60} height={24} />
                    <Skeleton variant="rectangular" width={60} height={24} />
                  </Box>
                </Box>

                {/* Tickets Skeleton */}
                <Box display="flex" flexDirection="column" gap={2}>
                  {[1, 2].map((i) => (
                    <Skeleton key={i} variant="rectangular" height={60} sx={{ borderRadius: 2 }} />
                  ))}
                </Box>
              </CardContent>
            </StyledCard>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <StyledCard>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Skeleton variant="text" width={180} height={30} />
                  <Skeleton variant="rectangular" width={100} height={28} />
                </Box>

                {/* Bills Skeleton */}
                <Box display="flex" flexDirection="column" gap={2}>
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} variant="rectangular" height={60} sx={{ borderRadius: 2 }} />
                  ))}
                </Box>
              </CardContent>
            </StyledCard>
          </Grid>

          {/* Row 3 */}
          <Grid size={{ xs: 12, md: 6 }}>
            <StyledCard>
              <CardContent>
                <Skeleton variant="text" width={150} height={30} />
                <Skeleton variant="text" width={120} height={20} sx={{ mb: 2 }} />
                <Box display="flex" flexDirection="column" gap={2}>
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} variant="rectangular" height={60} sx={{ borderRadius: 2 }} />
                  ))}
                </Box>
              </CardContent>
            </StyledCard>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <StyledCard>
              <CardContent>
                <Skeleton variant="text" width={150} height={30} sx={{ mb: 2 }} />
                <Box display="flex" flexDirection="column" gap={1}>
                  {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} variant="rectangular" height={50} sx={{ borderRadius: 2 }} />
                  ))}
                </Box>
              </CardContent>
            </StyledCard>
          </Grid>
        </Grid>
      </PermissionGuard>
    );
  }

  return (
    <PermissionGuard locale={locale} element={'isCompany'}>


      <Grid container spacing={6}>
        {/* Row 1 - Stats placeholder */}
        <Grid size={{ xs: 12 }}>
          <LogisticsStatisticsCard data={data} />
        </Grid>

        {/* Row 2 */}
        <Grid size={{ xs: 12, md: 6 }}>
          <StyledCard>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">Open and Pending Tickets</Typography>
                <Box>
                  <Chip label={`${dashboardData?.['inProgressComplain']?.length || 0} Pending`} color="warning" size="small" sx={{ mr: 1 }} />
                  <Chip label={`${dashboardData?.['pendingComplain']?.length || 0} open`} color="primary" size="small" />
                </Box>
              </Box>
              <Divider sx={{ mb: 2 }} />

              {
                pendingComplaints.length > 0 ? (
                  <>
                    {paginatedComplaints.map((item, index) => (
                      <Box
                        key={index}
                        display="flex"
                        justifyContent="space-between"
                        alignItems="center"
                        sx={{
                          p: 2,
                          border: '1px solid #eee',
                          borderRadius: 2,
                          mb: 2,
                          transition: '0.3s',
                          '&:hover': { backgroundColor: '#fafafa' },
                        }}
                      >
                        <Box display="flex" alignItems="center">
                          <Avatar sx={{ mr: 2 }}>
                            <i className="tabler-report"></i>
                          </Avatar>
                          <Box>
                            <Typography fontWeight={600}>
                              {item.complain_no}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Owner
                            </Typography>
                          </Box>
                        </Box>

                        <Chip
                          label="Open"
                          color="primary"
                          variant="outlined"
                          size="small"
                        />
                      </Box>
                    ))}

                    {totalPages > 1 && (
                      <Stack alignItems="center" mt={2}>
                        <Pagination
                          count={totalPages}
                          page={page}
                          color="primary"
                          onChange={(event, value) => setPage(value)}
                        />
                      </Stack>
                    )}
                  </>
                ) : (
                  <Box display="flex" flexDirection="column" alignItems="center" py={6}>
                    <Avatar sx={{ width: 56, height: 56, mb: 2 }}>
                      <i className="tabler-report"></i>
                    </Avatar>
                    <Typography color="text.secondary">
                      No complain found
                    </Typography>
                  </Box>
                )
              }
            </CardContent>
          </StyledCard>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <StyledCard>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">Utility Bills Payments Due</Typography>
                <Chip
                  label={`₹${(
                    dashboardData?.unpaidUtilityBill?.reduce(
                      (sum, bill) => sum + (bill.bill_amount || 0),
                      0
                    ) || 0
                  ) || 0} Total Due`}
                />
              </Box>
              <Divider sx={{ mb: 2 }} />

              {(dashboardData && dashboardData?.['unpaidUtilityBill'].length > 0)
                ?
                dashboardData?.['unpaidUtilityBill'].map((bill, i) => (
                  <Box
                    key={i}
                    display="flex"
                    justifyContent="space-between"
                    alignItems="center"
                    sx={{
                      p: 2,
                      border: '1px solid #eee',
                      borderRadius: 2,
                      mb: 2,
                      transition: '0.3s',
                      '&:hover': { backgroundColor: '#fafafa' },
                    }}
                  >
                    <Box display="flex" alignItems="center">
                      <Avatar sx={{ mr: 2 }}>
                        <i className='tabler-invoice'></i>
                      </Avatar>
                      <Box>
                        <Typography fontWeight={600}>{bill?.bill_type?.name}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          &#8377;{bill?.bill_amount}
                        </Typography>
                      </Box>
                    </Box>
                    <Box textAlign="right">
                      <Typography fontWeight={600}>{bill.amount}</Typography>
                      <Chip label={bill?.status ? "Paid" : "Unpaid"} color={bill?.status ? "success" : "warning"} size="small" />
                    </Box>
                  </Box>
                ))
                :
                (
                  <Box display="flex" flexDirection="column" alignItems="center" py={6}>
                    <Avatar sx={{ width: 56, height: 56, mb: 2 }}>
                      <i className='tabler-receipt'></i>
                    </Avatar>
                    <Typography color="text.secondary">No Bills found</Typography>
                  </Box>
                )
              }
            </CardContent>
          </StyledCard>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <StyledCard>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">Common Area Bills Payments Due</Typography>
                <Chip
                  label={`₹${(
                    dashboardData?.unpaidCommanAreaBill?.reduce(
                      (sum, bill) => sum + (bill.bill_amount || 0),
                      0
                    ) || 0
                  ) || 0} Total Due`}
                />
              </Box>
              <Divider sx={{ mb: 2 }} />

              {(dashboardData && dashboardData?.['unpaidCommanAreaBill'].length > 0)
                ?
                dashboardData?.['unpaidCommanAreaBill'].map((bill, i) => (
                  <Box
                    key={i}
                    display="flex"
                    justifyContent="space-between"
                    alignItems="center"
                    sx={{
                      p: 2,
                      border: '1px solid #eee',
                      borderRadius: 2,
                      mb: 2,
                      transition: '0.3s',
                      '&:hover': { backgroundColor: '#fafafa' },
                    }}
                  >
                    <Box display="flex" alignItems="center">
                      <Avatar sx={{ mr: 2 }}>
                        <i className='tabler-invoice'></i>
                      </Avatar>
                      <Box>
                        <Typography fontWeight={600}>{bill?.bill_type?.name}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          &#8377;{bill?.bill_amount}
                        </Typography>
                      </Box>
                    </Box>
                    <Box textAlign="right">
                      <Typography fontWeight={600}>{bill.amount}</Typography>
                      <Chip label={bill?.status ? "Paid" : "Unpaid"} color={bill?.status ? "success" : "warning"} size="small" />
                    </Box>
                  </Box>
                ))
                :
                (
                  <Box display="flex" flexDirection="column" alignItems="center" py={6}>
                    <Avatar sx={{ width: 56, height: 56, mb: 2 }}>
                      <i className='tabler-receipt'></i>
                    </Avatar>
                    <Typography color="text.secondary">No Bills found</Typography>
                  </Box>
                )
              }
            </CardContent>
          </StyledCard>
        </Grid>

        {/* Row 3 */}
        <Grid size={{ xs: 12, md: 6 }}>
          <StyledCard>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Today&apos;s Visitors
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {FormatTime(Date.now())}
              </Typography>
              <Divider sx={{ mb: 4 }} />
              {dashboardData?.visitor?.length ? dashboardData?.visitor?.map((val, i) => (
                <Box
                  key={i}
                  display="flex"
                  flexDirection="column"
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    mb: 1,
                    transition: '0.3s',
                    '&:hover': { backgroundColor: '#fafafa' },
                  }}
                >
                  <Box display="flex" alignItems="center" mb={1}>
                    <Avatar sx={{ mr: 2, width: 42, height: 42 }}>
                      <i className="tabler-users"></i>
                    </Avatar>
                    <Grid>
                      <Typography fontWeight={600}>
                        {val?.visitor_name}
                      </Typography>
                      <Typography>
                        {formatDateCustom(val.check_in_date)}
                      </Typography>
                      <Typography>
                        {formatTimeTo12Hour(val?.check_in_from_time)}-{formatTimeTo12Hour(val?.check_in_to_time)}
                      </Typography>
                    </Grid>
                  </Box>
                </Box>
              ))
                :
                (
                  <Box display="flex" flexDirection="column" alignItems="center" py={6}>
                    <Avatar sx={{ width: 56, height: 56, mb: 2 }}>
                      <i className='tabler-user'></i>
                    </Avatar>
                    <Typography color="text.secondary">No visitors found</Typography>
                  </Box>
                )

              }
            </CardContent>
          </StyledCard>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <StyledCard>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Announcement
              </Typography>
              <Divider sx={{ mb: 2 }} />

              {(dashboardData && dashboardData?.['notice'].length > 0)
                ?
                dashboardData?.['notice'].map((notice, i) => (
                  <Box
                    key={i}
                    display="flex"
                    alignItems="center"
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      mb: 1,
                      transition: '0.3s',
                      '&:hover': { backgroundColor: '#fafafa' },
                    }}
                  >
                    <Avatar sx={{ mr: 2, width: 42, height: 42 }}>
                      <i className='tabler-bell'></i>
                    </Avatar>
                    <Typography>{notice.title}</Typography>
                  </Box>
                ))
                :
                (
                  <Box display="flex" flexDirection="column" alignItems="center" py={6}>
                    <Avatar sx={{ width: 56, height: 56, mb: 2 }}>
                      <i className='tabler-bell'></i>
                    </Avatar>
                    <Typography color="text.secondary">No announcement found</Typography>
                  </Box>
                )}
            </CardContent>
          </StyledCard>
        </Grid>
      </Grid >
    </PermissionGuard>
  )
}

export default UserDashboard
