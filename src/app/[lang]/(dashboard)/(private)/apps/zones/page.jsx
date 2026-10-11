// Do NOT add 'use client' here — this is a Server Component

import PermissionGuard from '@/hocs/PermissionGuard';
import Zones from '@views/apps/zones';

export default  function ZonesApp({ params }) {
  const locale = params.lang;

  return (
    <PermissionGuard locale={locale} element="hasZonePermission">
      <Zones />
    </PermissionGuard>
  );
}
