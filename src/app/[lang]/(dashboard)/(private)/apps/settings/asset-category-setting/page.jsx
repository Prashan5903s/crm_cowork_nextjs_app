import PermissionGuard from '@/hocs/PermissionGuard';
import AssetCategory from '@/views/apps/settings/asset-category-setting/index';

export default async function AssetCategorySetting({ params }) {

    const { lang } = await params;

    return (
        <PermissionGuard locale={lang} element="isCompany">
            <AssetCategory />
        </PermissionGuard>
    );
}
