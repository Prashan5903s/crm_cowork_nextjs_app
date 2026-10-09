import PermissionGuardServer from '@/hocs/PermissionGuard'
import Department from '@views/apps/departments'

export default  function DepartmentApp({ params }) {

    const locale = params.lang;

    return (
        <PermissionGuardServer locale={locale} element={'hasDepartmentPermission'}>
            <Department />
        </PermissionGuardServer>
    )

}
