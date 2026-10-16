import PermissionGuard from '@/hocs/PermissionGuard';
import PropertyGroup from '@/views/apps/settings/property-group-setting/index';

export default async function TowerApp({ params }) {

    const { lang } = await params;

    return (
        <PermissionGuard locale={lang} element="isCompany">
            <PropertyGroup />
        </PermissionGuard>
    );
}
