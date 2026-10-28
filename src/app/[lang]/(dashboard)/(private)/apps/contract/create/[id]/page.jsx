"use client";

import { useParams } from "next/navigation";

import ContractForm from "../../component/ContractFormPage";

export default function ContractEditPage() {
    const { id } = useParams();
    return <ContractForm id={id} />;
}
