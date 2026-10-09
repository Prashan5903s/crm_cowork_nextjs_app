'use client'

// Component Imports

import { useEffect, useState } from 'react'

import { useSession } from 'next-auth/react'

import Grid from '@mui/material/Grid2'

import SkeletonTableComponent from '@/components/skeleton/table/page'

import UserListTable from './UserListTable'

import UserListCards from './UserListCards'

import { useApi } from '../../../../utils/api';

import { usePermissionList } from '@/utils/getPermission'

// MUI Imports

const UserList = () => {

  const URL = process.env.NEXT_PUBLIC_API_URL
  const { data: session } = useSession() || {}
  const token = session?.user?.token
  const [userData, setUserData] = useState();
  const [statsData, setStatsData] = useState();
  const { doGet, doPost } = useApi();
  const [isUserCardShow, setIsUserCardShow] = useState(true);

  const [roleData, setRoleData] = useState();

  const [filterUser, setFilterUser] = useState([]);

  const getPermissions = usePermissionList();
  const [permissions, setPermissions] = useState({});

  useEffect(() => {
    const fetchPermissions = async () => {
      try {
        const result = await getPermissions();

        setPermissions(result);
      } catch (error) {
        console.error('Error fetching permissions:', error);
      }
    };

    if (getPermissions) {
      fetchPermissions();
    }
  }, [getPermissions]); // Include in dependency array

  const loadData = async () => {
    try {
      const response = await fetch(`${URL}/admin/company`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      })

      const data = await response.json();

      if (response.ok) {

        setRoleData(data?.data?.role);
        setUserData(data?.data?.users);
      }
    } catch (error) {
      console.log('Error occured', error);

    }
  }

  const getStatsCount = async () => {
    const statsData = await doGet(`admin/users/stats`);

    if (statsData) {
      setStatsData(statsData);
    }
  }

  useEffect(() => {
    if (URL && token) {
      loadData();
      getStatsCount();
    }
  }, [URL, token])

  if (!userData) {
    return (
      <Grid container spacing={6}>
        <Grid size={{ xs: 12 }}>
          <UserListCards />
        </Grid>
        <Grid size={{ xs: 12 }}>
          <SkeletonTableComponent />
        </Grid>
      </Grid>
    )
  }

  return (
    <Grid container spacing={6}>
      <Grid size={{ xs: 12 }}>
        {isUserCardShow ? (
          <UserListCards {...statsData} />
        ) : (
          <></>
        )}
      </Grid>
      <Grid size={{ xs: 12 }}>
        <UserListTable userData={userData} roleData={roleData} filterUser={filterUser} setFilterUser={setFilterUser} loadData={loadData} setIsUserCardShow={setIsUserCardShow} getStatsCount={getStatsCount} permissions={permissions} />
      </Grid>
    </Grid>
  )
}

export default UserList
