"use client"

import { useParams } from "next/navigation"

import FormComponenetPage from "../component/FormComponent"

const AddAmenityPage = () => {

  const { lang } = useParams()


  return (
    <>

      <FormComponenetPage lang={lang} />
    </>
  )
}

export default AddAmenityPage
