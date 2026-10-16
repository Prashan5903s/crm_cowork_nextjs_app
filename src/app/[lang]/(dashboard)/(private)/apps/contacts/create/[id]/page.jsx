import ContactCreatePage from "../../component/AddForm";

const EditContactPage = async ({ params }) => {

    const { id, lang } = await params;

    return (
        <>
            <ContactCreatePage id={id} lang={lang} />
        </>
    )
}

export default EditContactPage;
