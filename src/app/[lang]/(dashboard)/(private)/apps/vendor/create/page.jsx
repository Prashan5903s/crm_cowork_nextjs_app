'use client'

import { useParams } from "next/navigation"

import VendorPage from "../../vendor/component/page"

const AddAssetPage = () => {

    const { lang } = useParams()

    return (
        <>
            <VendorPage lang={lang} />
        </>
    )
}

export default AddAssetPage;
