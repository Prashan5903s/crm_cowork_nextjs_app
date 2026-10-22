"use client"

import { useParams } from "next/navigation"

import AddDepartmentPage from "../../component/page"

const EditDepartmentPage = () => {

    const { id, lang } = useParams()

    return (
        <>
            <AddDepartmentPage id={id} lang={lang} />
        </>
    )
}

export default EditDepartmentPage;
