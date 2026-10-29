"use client";

import { useParams } from "next/navigation";

import ContractForm from "../../component/ContractFormPage";

export default function ContractEditPage() {
    const { id, lang } = useParams();
    return <ContractForm id={id} lang={lang} />;
}
