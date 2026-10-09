// Do NOT add 'use client' here — this is a Server Component

import PermissionGuard from '@/hocs/PermissionGuard';
import Parking from '@views/apps/parking';

export default  function ParkingApp({ params }) {
    const locale = params.lang;

    return (
        <PermissionGuard locale={locale} element="isCompany">
            <Parking />
        </PermissionGuard>
    );
}
