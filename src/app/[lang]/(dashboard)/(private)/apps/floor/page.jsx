// Do NOT add 'use client' here — this is a Server Component

import PermissionGuard from '@/hocs/PermissionGuard';
import Floor from '@views/apps/floor';

export default async function FloorApp({ params }) {

    const { lang } = await params;

    return (
        <PermissionGuard locale={lang} element="hasFloorPermission">
            <Floor />
        </PermissionGuard>
    );
}
