// Component Imports
import Role from '@views/apps/role'

import PermissionGuard from '@/hocs/PermissionGuard';

export default async function RoleApp({ params }) {

  const { lang } = await params;

  return (
    <PermissionGuard locale={lang} element={'hasRolePermission'}>
      <Role />
    </PermissionGuard>
  )

}
