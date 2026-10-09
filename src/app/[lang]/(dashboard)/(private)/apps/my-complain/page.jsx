"use client"

import { useParams } from "next/navigation";

import Complain from "@views/apps/MyComplain/page"

import PermissionGuard from '@/hocs/PermissionClientGuard'

const MyComplainPage = () => {
    const { type, lang: locale } = useParams();

    return (
        <>
            <PermissionGuard locale={locale} element="hasComplainPermission">
                <Complain type={type} />
            </PermissionGuard>
        </>
    )
}

export default MyComplainPage;
