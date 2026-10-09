'use client'

import { useParams } from "next/navigation";

import Complain from "@views/apps/MyComplainResolved/page"

import PermissionGuard from '@/hocs/PermissionClientGuard'

const MyComplainResolvedDashboard = () => {

    const { type, lang: locale } = useParams();

    return (
        <>
            <PermissionGuard locale={locale} element="hasTicketPermission">
                <Complain type={type} />
            </PermissionGuard>
        </>
    )
}

export default MyComplainResolvedDashboard

