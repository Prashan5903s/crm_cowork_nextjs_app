"use client"

import { useParams } from "next/navigation";

import InvoiceFormComponent from "../component/InvoiceFormComponent";

const InvoiceAddPage = () => {

    const { lang } = useParams()

    return (
        <InvoiceFormComponent lang={lang} />
    );
};

export default InvoiceAddPage;
