'use client'

import { useParams } from "next/navigation";

import Visitor from "@views/apps/visitor/page"

import PermissionGuard from '@/hocs/PermissionClientGuard'

const VisitorDashboard = () => {

    const { lang: locale } = useParams();

    return (
        <>
            <PermissionGuard locale={locale} element="hasVisitorPermission">
                <Visitor />
            </PermissionGuard>
        </>
    )
}

export default VisitorDashboard;
