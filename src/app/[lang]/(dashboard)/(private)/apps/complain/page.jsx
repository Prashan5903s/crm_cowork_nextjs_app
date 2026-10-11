'use client'

import { useParams } from "next/navigation";

import Complain from "@views/apps/Complain/page"

import PermissionGuard from '@/hocs/PermissionClientGuard'

const ComplainDashboard = () => {

    const { lang: locale } = useParams();

    return (
        <>
            <PermissionGuard locale={locale} element="hasComplainPermission">
                <Complain />
            </PermissionGuard>
        </>
    )
}

export default ComplainDashboard;
