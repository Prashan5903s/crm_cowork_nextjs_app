import PermissionGuard from '@/hocs/PermissionGuard';
import LeadTypeIndex from '@/views/apps/settings/lead-property-type-setting/index';

export default async function LeadType({ params }) {

    const { lang } = await params;

    return (
        <PermissionGuard locale={lang} element="isCompany">
            <LeadTypeIndex />
        </PermissionGuard>
    );
}
