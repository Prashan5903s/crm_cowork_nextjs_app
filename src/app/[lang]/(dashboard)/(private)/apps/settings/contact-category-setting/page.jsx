import PermissionGuard from '@/hocs/PermissionGuard';
import ContactCategory from '@/views/apps/settings/contact-category-setting/index';

const ContactCategoryPage = async ({ params }) => {

    const { lang } = await params;

    return (
        <PermissionGuard locale={lang} element="isCompany">
            <ContactCategory />
        </PermissionGuard>
    )
}

export default ContactCategoryPage;
