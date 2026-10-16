"use client"

import { useParams } from "next/navigation"

import FormComponenetPage from "../../component/FormComponent"

const EditAmenityPage = () => {

    const { id, lang } = useParams()

    return (
        <>

            <FormComponenetPage id={id} lang={lang} />
        </>
    )
}

export default EditAmenityPage
