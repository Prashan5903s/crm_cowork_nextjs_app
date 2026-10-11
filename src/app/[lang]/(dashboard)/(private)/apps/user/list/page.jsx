'use client'

import { useParams } from 'next/navigation';

import PermissionGuard from '@/hocs/PermissionClientGuard'

import UserList from '@/views/apps/user/list'

export default function () {

  const { lang: locale } = useParams();

  return (
    <PermissionGuard locale={locale} element={'hasUserPermission'}>
      <UserList />
    </PermissionGuard>
  )

}
