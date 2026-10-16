"use client"

import { useParams } from "next/navigation";

import ContactCreatePage from "../component/AddForm";

const AddContactPage = () => {

    const { lang } = useParams()

    return (
        <>
            <ContactCreatePage lang={lang} />
        </>
    )
}

export default AddContactPage;
