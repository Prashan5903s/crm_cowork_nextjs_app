import PermissionGuard from '@/hocs/PermissionGuard';
import VendorCategoryIndex from '@/views/apps/settings/vendor-category-setting/index';

export default async function VendorCategory({ params }) {

    const { lang } = await params;

    return (
        <PermissionGuard locale={lang} element="isCompany">
            <VendorCategoryIndex />
        </PermissionGuard>
    );
}
