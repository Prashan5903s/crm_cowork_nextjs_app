'use client'

import { useParams } from 'next/navigation';

import PermissionGuard from '@/hocs/PermissionClientGuard';

import Apartment from '@views/apps/apartment';

export default function ApartmentApp() {

    const { lang: locale } = useParams();

    return (
        <PermissionGuard locale={locale} element="hasApartmentPermission">
            <Apartment />
        </PermissionGuard>
    );
}
