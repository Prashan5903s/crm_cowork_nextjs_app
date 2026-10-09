'use client'

import PermissionGuardServer from '@/hocs/PermissionClientGuard'
import Channel from '@views/apps/channel'

export default  function ChannelApp() {

    const { lang: locale } = useParams();

    return (
        <PermissionGuardServer locale={locale} element={'hasDepartmentPermission'}>
            <Channel />
        </PermissionGuardServer>
    )

}
