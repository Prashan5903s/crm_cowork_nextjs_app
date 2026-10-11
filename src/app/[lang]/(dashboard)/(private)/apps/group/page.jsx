// Component Imports

import Group from '@/views/apps/group/index'

// Data Imports

import PermissionGuard from '@/hocs/PermissionGuard';

export default function GroupApp({ params }) {

    const locale = params.lang;

    return (
        <PermissionGuard locale={locale} element={'hasGroupPermission'}>
            <Group />
        </PermissionGuard>
    )

}
