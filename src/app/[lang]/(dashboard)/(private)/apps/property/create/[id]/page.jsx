"use client"

import { useParams } from "next/navigation";

import AddFormPage from "../../component/AddFormPage";

const EditPropertyPage = () => {

    const { id, lang } = useParams()

    return (
        <>
            <AddFormPage id={id} lang={lang} />
        </>
    )
}

export default EditPropertyPage;

