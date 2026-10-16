import PermissionGuard from '@/hocs/PermissionGuard';
import AmenityType from '@/views/apps/settings/amnity-type-setting/index';

export default async function TowerApp({ params }) {

    const { lang } = await params;

    return (
        <PermissionGuard locale={lang} element="isCompany">
            <AmenityType />
        </PermissionGuard>
    );
}
