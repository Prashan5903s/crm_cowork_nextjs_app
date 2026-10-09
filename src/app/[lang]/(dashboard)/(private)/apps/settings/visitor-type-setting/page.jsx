import PermissionGuard from '@/hocs/PermissionGuard';
import VisitorType from '@views/apps/settings/visitor-type-setting/index';

export default async function TowerApp({ params }) {

    const { lang } = await params;

    return (
        <PermissionGuard locale={lang} element="isCompany">
            <VisitorType />
        </PermissionGuard>
    );
}
