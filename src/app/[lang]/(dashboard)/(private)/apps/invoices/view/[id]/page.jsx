
import InvoicePreviewComponent from "../../component/InvoicePreviewComponent";

const InvoiceViewPage = async ({ params }) => {

    const { id, lang } = await params;

    return (
        <InvoicePreviewComponent id={id} lang={lang} />
    );
};

export default InvoiceViewPage;
