"use client";

import { Suspense } from "react";

import { useSearchParams } from "next/navigation";

import ContractForm from "../component/ContractFormPage";

function AddContract() {
    const kind = useSearchParams().get("kind") || "org-tenant";
    return <ContractForm kind={kind} />;
}

export default function AddContractPage() {
    return (
        <Suspense fallback={null}>
            <AddContract />
        </Suspense>
    );
}
