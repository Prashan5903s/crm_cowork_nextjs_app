import PermissionGuard from '@/hocs/PermissionGuard';
import TicketType from '@views/apps/settings/ticket-type-setting/index';

export default async function TowerApp({ params }) {

    const { lang } = await params;

    return (
        <PermissionGuard locale={lang} element="isCompany">
            <TicketType />
        </PermissionGuard>
    );
}
