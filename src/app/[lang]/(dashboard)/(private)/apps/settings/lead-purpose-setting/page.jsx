import PermissionGuard from '@/hocs/PermissionGuard';
import LeadPurposeIndex from '@/views/apps/settings/lead-purpose-setting/index';

export default async function LeadPurpose({ params }) {

    const { lang } = await params;

    return (
        <PermissionGuard locale={lang} element="isCompany">
            <LeadPurposeIndex />
        </PermissionGuard>
    );
}
