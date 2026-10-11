import PermissionGuard from '@/hocs/PermissionGuard';
import Towers from '@views/apps/tower';

export default async function TowerApp({ params }) {

    const { lang } = await params;

    return (
        <PermissionGuard locale={lang} element="isCompany">
            <Towers />
        </PermissionGuard>
    );
}
