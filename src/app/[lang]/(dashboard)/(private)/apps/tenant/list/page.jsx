'use client'

import { useParams } from 'next/navigation';

import PermissionGuard from '@/hocs/PermissionClientGuard'

import TenantList from '@/views/apps/tenant/list/index'

export default function () {

  const { lang: locale } = useParams();

  return (
    <PermissionGuard locale={locale} element={'isCompany'}>
      <TenantList />
    </PermissionGuard>
  )

}
