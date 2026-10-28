"use client"

import { useParams } from "next/navigation";

import InvoiceFormComponent from "../../component/InvoiceFormComponent";

const InvoiceEditPage = () => {

    const { id, lang } = useParams();
    
    return (
        <InvoiceFormComponent invoiceId={id} lang={lang} />
    );
};

export default InvoiceEditPage;
