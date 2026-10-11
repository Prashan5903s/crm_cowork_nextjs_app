import PermissionGuardServer from '@/hocs/PermissionGuard'
import DesignationComponent from '@/views/apps/designation/index'

export default  function DesignationApp({ params }) {

  const locale = params.lang;

  return (
    <PermissionGuardServer locale={locale} element={'hasDesignationPermission'}>
      <DesignationComponent />
    </PermissionGuardServer>
  )
}
