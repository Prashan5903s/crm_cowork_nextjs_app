// ---- Replace these with real API calls ----
export const contacts = [
    { value: "c1", label: "Karuna (Contact)", sub: "Mobile: +918968378701" },
    { value: "c2", label: "Prashant (Contact)", sub: "Mobile: +919026731276" },
    { value: "c3", label: "Praveen kumar (Contact)", sub: "Email: praveenkumar@gmail.com" },
    { value: "c4", label: "Support (Contact)", sub: "Email: support@propexcel.com" },
];

export const bankAccounts = [
    { value: "b1", label: "HDFC Bank - XXXX1234" },
    { value: "b2", label: "SBI - XXXX9876" },
];

export const upiIds = [
    { value: "u1", label: "dreamweavers@hdfc" },
    { value: "u2", label: "dreamweavers@sbi" },
];

export const categories = [
    { value: "Property Rent", label: "Property Rent" },
    { value: "Deposit", label: "Deposit" },
    { value: "Other", label: "Other" },
];

const addr =
    "Dreamweavers Cowork, 4th Floor, Gate No. 3, PPR Mall, Mithapur Road, Ravindra Nagar, Phase 2, Urban Estate phase II, Jalandhar, Punjab, INDIA-144001";

export const properties = ["Custom Cabin 01", "Custom Cabin 02", "Custom Cabin 03", "Cabin-1"].map((n) => ({
    value: n, label: n, sub: addr,
}));

export const chartOfAccounts = [
    { value: "1000 - Cash", label: "1000 - Cash (Asset / Current Asset)" },
    { value: "4000 - Rental Income", label: "4000 - Rental Income (Revenue)" },
    { value: "2100 - Security Deposits", label: "2100 - Security Deposits (Liability)" },
];

export const taxes = [
    { value: "0", label: "No Tax" },
    { value: "18", label: "GST (18%)" },
    { value: "12", label: "GST (12%)" },
    { value: "5", label: "GST (5%)" },
];

export const company = {
    name: "DREAMWEAVERS COWORK",
    address: addr.replace("Dreamweavers Cowork, ", ""),
    email: "hello@dreamweaverscowork.com",
};

const blank = (ref, due) => ({
    id: String(ref), ref, billedTo: "", billedToName: "-", invoiceDate: due, dueDate: due,
    sequence: ref, status: "DRAFT", items: [],
});

export const invoices = [
    {
        id: "11", ref: 11, billedTo: "c2", billedToName: "Prashant", invoiceDate: "2026-10-28", dueDate: "2027-10-28",
        sequence: 11, status: "DRAFT",
        items: [{
            id: "i1", category: "Property Rent", property: "Cabin-1", item: "Cabin-1",
            chartOfAccount: "1000 - Cash", amount: 1233, taxRate: 18
        }],
    },
    blank(10, "2027-10-28"), blank(9, "2026-10-28"), blank(8, "2026-10-27"), blank(7, "2026-10-27"),
    blank(6, "2026-10-27"), blank(5, "2026-10-27"), blank(2, "2026-10-21"), blank(1, "2026-10-07"),
];

export const getInvoice = (id) => invoices.find((i) => i.id === id);
