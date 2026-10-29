import PaymentFormComponent from "../component/PaymentFormComponent";

const AddPaymentPage = async ({ params }) => {
    const { lang } = await params;

    return <PaymentFormComponent lang={lang} />;
};

export default AddPaymentPage;
