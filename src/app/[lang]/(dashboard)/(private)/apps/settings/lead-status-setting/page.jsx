import PermissionGuard from '@/hocs/PermissionGuard';
import LeadStatusIndex from '@/views/apps/settings/lead-status-setting/index';

export default async function LeadStatus({ params }) {

    const { lang } = await params;

    return (
        <PermissionGuard locale={lang} element="isCompany">
            <LeadStatusIndex />
        </PermissionGuard>
    );
}
