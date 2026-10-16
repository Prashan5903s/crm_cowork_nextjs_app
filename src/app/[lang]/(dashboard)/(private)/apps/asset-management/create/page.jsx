'use client'

import { useParams } from "next/navigation"

import AssetPage from "../component/page"

const AddAssetPage = () => {

    const { lang } = useParams()

    return (
        <>
            <AssetPage lang={lang} />
        </>
    )
}

export default AddAssetPage;
