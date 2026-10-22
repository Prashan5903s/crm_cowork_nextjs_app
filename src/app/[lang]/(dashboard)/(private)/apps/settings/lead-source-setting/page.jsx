import PermissionGuard from '@/hocs/PermissionGuard';
import LeadSourceIndex from '@/views/apps/settings/lead-source-setting/index';

export default async function LeadSource({ params }) {

    const { lang } = await params;

    return (
        <PermissionGuard locale={lang} element="isCompany">
            <LeadSourceIndex />
        </PermissionGuard>
    );
}
