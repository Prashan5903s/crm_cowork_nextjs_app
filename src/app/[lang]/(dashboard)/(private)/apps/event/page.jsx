'use client'

import { useParams } from "next/navigation";

import Event from "@views/apps/event/index"

import PermissionGuard from '@/hocs/PermissionClientGuard'

const EventPage = () => {

    const { lang: locale } = useParams();

    return (
        <>
            <PermissionGuard locale={locale} element="hasBillingPermission">
                <Event />
            </PermissionGuard>
        </>
    )
}

export default EventPage;
