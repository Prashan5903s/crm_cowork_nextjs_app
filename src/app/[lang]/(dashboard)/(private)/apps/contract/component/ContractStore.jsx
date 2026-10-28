export const TENANTS = [];

export const TAXES = [
    { id: "none", label: "No Tax", rate: 0 },
    { id: "gst5", label: "GST 5%", rate: 5 },
    { id: "gst12", label: "GST 12%", rate: 12 },
    { id: "gst18", label: "GST 18%", rate: 18 },
];

export const DOC_TYPES = ["Agreement", "ID Proof", "Address Proof", "Other"];

export const ADDRESS = "Dreamweavers Cowork, 4th Floor, Gate No. 3, PPR Mall, Mithapur Road, Ravindra Nagar, Phase 3, Urban Estate phase II, Jalandhar, Punjab, INDIA-144001";

const pad = (n) => String(n).padStart(2, "0");

// Local-date ISO (toISOString() would shift the date by timezone)
export const toISO = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

// Today -> same day next year minus 1 day (e.g. 27 Oct 2026 -> 26 Oct 2027)
export const defaultTerm = () => {
    const s = new Date();
    const e = new Date(s);
    e.setFullYear(s.getFullYear() + 1);
    e.setDate(e.getDate() - 1);
    return { start: toISO(s), end: toISO(e) };
};

// ---- calculations ----
export const calcDetail = (d) => {
    const rent = Number(d.rentalValue) || 0;
    const discount = Number(d.discountValue) || 0;
    const after = Math.max(rent - discount, 0);
    const rate = TAXES.find((t) => t.id === d.tax)?.rate || 0;
    const tax = Math.round((after * rate) / 100);
    return { rent, discount, after, tax, total: after + tax };
};

export const inr = (n) => "₹ " + Number(n || 0).toLocaleString("en-IN");

const fmt = (iso, opts) => (iso ? new Date(iso + "T00:00:00").toLocaleDateString("en-GB", opts) : "-");
export const fmtShort = (iso) => fmt(iso, { day: "2-digit", month: "short", year: "numeric" });
export const fmtLong = (iso) => fmt(iso, { day: "numeric", month: "long", year: "numeric" });

export const summarize = (details) => {
    const totals = details.reduce(
        (a, d) => {
            const c = calcDetail(d);
            return {
                value: a.value + c.after,
                tax: a.tax + c.tax,
                total: a.total + c.total,
                payments: Math.max(a.payments, Number(d.payments || 0)),
            };
        },
        { value: 0, tax: 0, total: 0, payments: 0 }
    );

    const starts = details.map((d) => d.start).filter(Boolean).sort();
    const ends = details.map((d) => d.end).filter(Boolean).sort();
    const start = starts[0], end = ends[ends.length - 1];

    let duration = "-";
    if (start && end) {
        const days = Math.round((new Date(end) - new Date(start)) / 864e5) + 1;
        const months = Math.round(days / 30.44);
        duration = months >= 12 && months % 12 === 0
            ? `${months / 12} Year${months > 12 ? "s" : ""}`
            : `${months} Month${months === 1 ? "" : "s"}`;
        duration += ` (${fmtLong(start)} to ${fmtLong(end)})`;
    }

    return { ...totals, start, end, duration };
};

// Split each detail into equal monthly schedules
export const buildSchedules = (details) =>
    details.flatMap((d) => {
        const n = Math.max(Number(d.payments) || 1, 1);
        const { total } = calcDetail(d);
        return Array.from({ length: n }, (_, i) => {
            const due = new Date(d.start + "T00:00:00");
            due.setMonth(due.getMonth() + i);
            return { description: `${d.description} (${i + 1}/${n})`, due: toISO(due), amount: Math.round(total / n) };
        });
    });

// Amenity defaults. Your API sends no price, so monthly fee = free slots.
export const amenityDefaults = (a = {}) => ({
    freeSlots: Number(a.freeSlots ?? a.tenant_monthly_quota ?? 0) || 0,
    extraSlotPrice: 0,
    monthlyFee: Number(a.freeSlots) || 0,
});
