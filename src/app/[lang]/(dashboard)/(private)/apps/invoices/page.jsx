
import InvoiceListComponent from "./component/InvoiceListComponent";
import { invoices } from "./data/page";

const InvoicePage = async () => {
  // TODO: replace with your real data fetch
  return (
    <InvoiceListComponent invoices={invoices} />
  );
};

export default InvoicePage;
