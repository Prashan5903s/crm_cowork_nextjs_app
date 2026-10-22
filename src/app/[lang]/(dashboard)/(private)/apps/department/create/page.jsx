'use client'

import { useParams } from "next/navigation"

import DepartmentPage from "../component/page"

const AddAssetPage = () => {

    const { lang } = useParams()

    return (
        <>
            <DepartmentPage lang={lang} />
        </>
    )
}

export default AddAssetPage;
