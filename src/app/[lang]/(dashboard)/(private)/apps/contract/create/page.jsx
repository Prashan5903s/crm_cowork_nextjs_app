"use client";

import { Suspense } from "react";

import { useSearchParams, useParams } from "next/navigation";

import ContractForm from "../component/ContractFormPage";

function AddContract() {

    const { lang } = useParams()
    const kind = useSearchParams().get("kind") || "org-tenant";

    return <ContractForm kind={kind} lang={lang} />;
}

export default function AddContractPage() {

    const { lang } = useParams()

    return (
        <Suspense fallback={null}>
            <AddContract lang={lang} />
        </Suspense>
    );
}
