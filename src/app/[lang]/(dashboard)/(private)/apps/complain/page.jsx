'use client'

import { useParams } from "next/navigation";

import Complain from "@views/apps/Complain/page"

import PermissionGuard from '@/hocs/PermissionClientGuard'

const ComplainDashboard = () => {

  const { lang: locale } = useParams();

  return (
    <>
      <Complain />
    </>
  )
}

export default ComplainDashboard;
