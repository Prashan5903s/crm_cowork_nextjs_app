'use client'

import { useState, useEffect } from 'react'

// MUI Imports
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Grid from '@mui/material/Grid2'
import Typography from '@mui/material/Typography'
import Avatar from '@mui/material/Avatar'
import AvatarGroup from '@mui/material/AvatarGroup'
import IconButton from '@mui/material/IconButton'
import Button from '@mui/material/Button'

// Component Imports
import BillDialog from '@components/dialogs/bill-dialog/page';


import Link from '@components/Link'

import { usePermissionList } from '@/utils/getPermission'

// Dummy Role Data
const cardData = [
  { totalUsers: 4, title: 'Administrator', avatars: ['1.png', '2.png', '3.png', '4.png'] },
  { totalUsers: 7, title: 'Editor', avatars: ['5.png', '6.png', '7.png'] },
  { totalUsers: 5, title: 'Users', avatars: ['4.png', '5.png', '6.png'] },
  { totalUsers: 6, title: 'Support', avatars: ['1.png', '2.png', '3.png'] },
  { totalUsers: 10, title: 'Restricted User', avatars: ['4.png', '5.png', '6.png'] }
]

const BillCards = ({ fetchZoneData, tableData, type }) => {

  const getPermissions = usePermissionList(); // returns an async function
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

  return (
    <Grid container spacing={6}>

      {/* Add Role Card */}
      {/* {permissions && permissions?.['hasZoneAddPermission'] && ( */}
      <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
        
      </Grid>
      {/* )} */}
    </Grid>
  )
}

export default BillCards
