"use client"

import { useParams } from "next/navigation"

import AddAssetPage from "../../component/page"

const EditAssetPage = () => {

    const { id, lang } = useParams()

    return (
        <>
            <AddAssetPage id={id} lang={lang} />
        </>
    )
}

export default EditAssetPage;
