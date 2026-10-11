'use client'

import { useEffect, useState } from 'react';

import { useParams } from 'next/navigation';

import { useSession } from 'next-auth/react';

import PermissionGuard from '@/hocs/PermissionClientGuard'

import ModuleCardComponent from '@components/program-component/CardComponent';

const MyCoursePage = () => {

  const { lang: locale, cId: cid } = useParams();

  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  const { data: session } = useSession();
  const token = session?.user?.token;

  const [createData, setCreateData] = useState();

  const fetchCardData = async () => {
    try {
      const response = await fetch(`${API_URL}/company/module/${cid}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      const data = await response.json()

      if (response.ok) {
        const result = data?.data;

        setCreateData(result)
      }

    } catch (error) {
      throw new Error(error)
    }
  }

  useEffect(() => {
    if (API_URL && token) {
      fetchCardData();
    }
  }, [API_URL, token])

  return (
    <PermissionGuard locale={locale} element={'isCompany'}>
      <ModuleCardComponent
        contentFolderId={cid}
        locale={locale}
        stage={'Module'}
        currentId={cid}
        parent={"Content Folder"}
        formLink={`/${locale}/apps/modules/${cid}/form`}
        parentCategory={`/${locale}/apps/modules`}
        data={createData}
        nextLink={`/${locale}/apps/activity`}
      />
    </PermissionGuard>
  )
}

export default MyCoursePage;
