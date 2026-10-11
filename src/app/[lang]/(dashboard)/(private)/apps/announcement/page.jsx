'use client'

import { useParams } from "next/navigation";

import Notice from "@views/apps/notice/index"

import PermissionGuard from '@/hocs/PermissionClientGuard'

const NoticePage = () => {

    const { lang: locale } = useParams();

    return (
        <>
            <PermissionGuard locale={locale} element="hasBillingPermission">
                <Notice />
            </PermissionGuard>
        </>
    )
}

export default NoticePage;
