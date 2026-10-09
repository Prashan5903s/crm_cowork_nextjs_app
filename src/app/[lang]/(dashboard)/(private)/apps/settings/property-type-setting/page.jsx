import PermissionGuard from '@/hocs/PermissionGuard';
import PropertyType from '@/views/apps/settings/property-type-setting/index';

export default async function TowerApp({ params }) {

    const { lang } = await params;

    return (
        <PermissionGuard locale={lang} element="isCompany">
            <PropertyType />
        </PermissionGuard>
    );
}
