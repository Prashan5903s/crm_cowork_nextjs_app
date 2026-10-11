'use client'

import { useParams } from "next/navigation";

import Bill from "@views/apps/MyBill/page"

import PermissionGuard from '@/hocs/PermissionClientGuard'

const BillType = () => {

    const { type, lang: locale } = useParams();

    return (
        <>
            <PermissionGuard locale={locale} element="hasBillingPermission">
                <Bill type={type} />
            </PermissionGuard>
        </>
    )
}

export default BillType;
