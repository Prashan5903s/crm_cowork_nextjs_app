import PermissionGuard from '@/hocs/PermissionGuard';
import ContractDocumentTypeIndex from '@/views/apps/settings/contract-document-type-setting/index';

export default async function ContractDocumentType({ params }) {

    const { lang } = await params;

    return (
        <PermissionGuard locale={lang} element="isCompany">
            <ContractDocumentTypeIndex />
        </PermissionGuard>
    );
}
