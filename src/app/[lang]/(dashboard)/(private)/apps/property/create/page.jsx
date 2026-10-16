"use client"

import { useParams } from "next/navigation";

import AddFormPage from "../component/AddFormPage";

const AddPropertyPage = () => {

  const { lang } = useParams()

  return (
    <>
      <AddFormPage lang={lang} />
    </>
  )
}

export default AddPropertyPage;

