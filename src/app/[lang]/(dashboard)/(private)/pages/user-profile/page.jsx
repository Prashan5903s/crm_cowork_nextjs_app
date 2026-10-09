'use client'

import { useEffect, useState } from 'react'

import dynamic from 'next/dynamic'

import { useSession } from 'next-auth/react'

import UserProfile from '@views/pages/user-profile'

const ProfileTab = dynamic(() => import('@views/pages/user-profile/profile'))
const TeamsTab = dynamic(() => import('@views/pages/user-profile/teams'))
const ProjectsTab = dynamic(() => import('@views/pages/user-profile/projects'))
const ConnectionsTab = dynamic(() => import('@views/pages/user-profile/connections'))

// Tabs setup
const tabContentList = data => ({
  profile: <ProfileTab data={data} />,
  teams: <TeamsTab data={data?.users?.teams} />,
  projects: <ProjectsTab data={data?.users?.projects} />,
  connections: <ConnectionsTab data={data?.users?.connections} />
})

const ProfilePage = () => {
  const [profileData, setProfileData] = useState(null)
  const [loading, setLoading] = useState(true)

  const URL = process.env.NEXT_PUBLIC_API_URL;

  const { data: session } = useSession() || {};

  const token = session && session.user && session?.user?.token;

  useEffect(() => {
    const fetchUserData = async () => {
      if (!session?.user?.token) return

      try {

        const response = await fetch(`${URL}/user/profile/data`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })


        const data = await response.json()

        if (response.ok) {
          const result = data?.data

          setProfileData(result)
        }
      } catch (error) {

        console.error('Error fetching user data:', error)
      } finally {

        setLoading(false)
      }
    }

    fetchUserData()
  }, [token, URL])

  if (loading) return <p>Loading...</p>

  return <UserProfile data={profileData} tabContentList={tabContentList(profileData)} />
}

export default ProfilePage
