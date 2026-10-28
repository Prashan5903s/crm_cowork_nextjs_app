export const INVOICE_BASE = "/invoice"; // change to your real route prefix

export const unwrapResponse = (response) => {
    const body = response?.data ?? response;
    return body?.data ?? body;
};

export const toDateInput = (value) => {
    if (!value) return todayISO();

    const date = new Date(value);

    return Number.isNaN(date.getTime())
        ? todayISO()
        : date.toISOString().slice(0, 10);
};

export const calcLine = (amount, taxRate) => {
    const tax = +(amount * (taxRate / 100)).toFixed(2);
    return { tax, total: +(amount + tax).toFixed(2) };
};

export const calcTotals = (items) => {
    const sub = items.reduce((s, i) => s + i.amount, 0);
    const tax = items.reduce((s, i) => s + calcLine(i.amount, i.taxRate).tax, 0);
    return { sub, tax, total: +(sub + tax).toFixed(2) };
};

export const inr = (n) =>
    Number(n).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const todayISO = () => new Date().toLocaleDateString("en-CA"); // yyyy-mm-dd (local)

export const daysFromToday = (iso) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return Math.round((new Date(iso + "T00:00:00") - today) / 86400000);
};

export const prettyDate = (iso) =>
    new Date(iso + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

export const ddmmyyyy = (iso) => iso.split("-").reverse().join("/");

const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve",
    "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
const below100 = (n) => (n < 20 ? ones[n] : tens[Math.floor(n / 10)] + (n % 10 ? " " + ones[n % 10] : ""));
const below1000 = (n) =>
    (n >= 100 ? ones[Math.floor(n / 100)] + " Hundred" + (n % 100 ? " " : "") : "") + (n % 100 ? below100(n % 100) : "");

export const amountInWords = (value) => {
    let rupees = Math.floor(value);
    const paise = Math.round((value - rupees) * 100);
    if (rupees === 0 && paise === 0) return "Zero Rupees";
    const parts = [];
    const crore = Math.floor(rupees / 10000000); rupees %= 10000000;
    const lakh = Math.floor(rupees / 100000); rupees %= 100000;
    const thousand = Math.floor(rupees / 1000); rupees %= 1000;
    if (crore) parts.push(below1000(crore) + " Crore");
    if (lakh) parts.push(below100(lakh) + " Lakh");
    if (thousand) parts.push(below100(thousand) + " Thousand");
    if (rupees) parts.push(below1000(rupees));
    let out = parts.join(" ") + " Rupees";
    if (paise) out += ` and ${below100(paise)} Paise`;
    return out;
};
