import { notFound } from "next/navigation";
import InvoicePreviewComponent from "../../component/InvoicePreviewComponent";
import { getInvoice, invoices } from "../../data/page";

const InvoiceViewPage = async ({ params }) => {

    const { id } = await params;
    const invoice = getInvoice(id); // TODO: fetch from your API
    // if (!invoice) notFound();

    return (
        <InvoicePreviewComponent invoice={invoices?.[0]} />
    );
};

export default InvoiceViewPage;
