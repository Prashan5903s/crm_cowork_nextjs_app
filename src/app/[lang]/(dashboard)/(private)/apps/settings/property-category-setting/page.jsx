import PermissionGuard from '@/hocs/PermissionGuard';
import PropertyCategory from '@/views/apps/settings/property-category-setting/index';

export default async function TowerApp({ params }) {

    const { lang } = await params;

    return (
        <PermissionGuard locale={lang} element="isCompany">
            <PropertyCategory />
        </PermissionGuard>
    );
}
