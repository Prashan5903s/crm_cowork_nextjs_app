import PermissionGuard from '@/hocs/PermissionGuard';
import LeadDocumentTypeIndex from '@/views/apps/settings/lead-document-type-setting/index';

export default async function LeadDocumentType({ params }) {

    const { lang } = await params;

    return (
        <PermissionGuard locale={lang} element="isCompany">
            <LeadDocumentTypeIndex />
        </PermissionGuard>
    );
}
