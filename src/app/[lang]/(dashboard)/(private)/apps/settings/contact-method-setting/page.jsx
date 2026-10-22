import PermissionGuard from '@/hocs/PermissionGuard';
import ContactMethodIndex from '@/views/apps/settings/contact-method-setting/index';

export default async function ContactMethod({ params }) {

    const { lang } = await params;

    return (
        <PermissionGuard locale={lang} element="isCompany">
            <ContactMethodIndex />
        </PermissionGuard>
    );
}
