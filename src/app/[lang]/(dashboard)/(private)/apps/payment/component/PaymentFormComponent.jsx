"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { useRouter } from "next/navigation";

import {
    Alert,
    Box,
    Button,
    Card,
    Chip,
    FormControl,
    FormHelperText,
    IconButton,
    MenuItem,
    Select,
    Skeleton,
    Stack,
    TextField,
    Typography,
} from "@mui/material";

import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import AttachFileIcon from "@mui/icons-material/AttachFile";

import { useApi } from "@/utils/api";

const ACCEPT = ".jpeg,.jpg,.png,.pdf,.doc,.docx";
const METHODS = ["Cash", "Cheque", "Bank Transfer", "UPI", "Card"];

const today = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
};

/* ---------------- money helpers (integer paise, no float errors) ---------------- */

const toPaise = (v) => Math.round(Number(v) * 100);

const formatMoney = (v) =>
    Number(v).toLocaleString("en-IN", { maximumFractionDigits: 2 });

// Sum of ALL payments already made on the contract.
const getPaidTotal = (contract) =>
    (contract?.payment ?? []).reduce((sum, p) => {
        const amt = Number(p?.total_payment_amount);

        return Number.isFinite(amt) ? sum + toPaise(amt) : sum;
    }, 0) / 100;

// LIMIT = contract amount - paid amount (null if contract amount invalid).
const getContractLimit = (contract) => {
    const value = contract?.value;

    if (
        value === null ||
        value === undefined ||
        value === "" ||
        !Number.isFinite(Number(value))
    ) {
        return null;
    }

    return Math.max(toPaise(value) - toPaise(getPaidTotal(contract)), 0) / 100;
};

const getContractLabel = (contract) => {
    const name = contract?.tenant?.full_name || "Unnamed tenant";

    return contract?.id !== undefined ? `#${contract.id} - ${name}` : name;
};

const validateAmount = (value, limit) => {
    const text = String(value ?? "").trim();

    if (!text) return "Payment amount is required.";

    const amount = Number(text);

    if (!Number.isFinite(amount)) return "Enter a valid payment amount.";
    if (amount <= 0) return "Payment amount must be greater than zero.";
    if (limit === null) return "The selected contract has no valid amount.";
    if (limit <= 0) return "This contract is already fully paid.";

    if (Math.abs(amount * 100 - Math.round(amount * 100)) > 1e-6) {
        return "Amount can have at most 2 decimal places.";
    }

    if (toPaise(amount) > toPaise(limit)) {
        return `Payment cannot exceed the remaining balance of ${formatMoney(limit)}.`;
    }

    return "";
};

/* ---------------- UI pieces ---------------- */

const Section = ({ icon, title, children }) => (
    <Card variant="outlined" sx={{ borderRadius: 3, p: 2.5, mb: 2.5 }}>
        <Stack
            direction="row"
            alignItems="center"
            gap={1}
            sx={{ pb: 1, mb: 2, borderBottom: "1px solid #eee" }}
        >
            {icon}
            <Typography fontWeight={700}>{title}</Typography>
        </Stack>

        {children}
    </Card>
);

const Field = ({ label, required, helper, error, children }) => (
    <Box>
        <Typography variant="body2" fontWeight={600} sx={{ mb: 0.75 }}>
            {label}
            {required && <span style={{ color: "#d32f2f" }}> *</span>}
        </Typography>

        <FormControl fullWidth error={!!error}>
            {children}

            {(error || helper) && (
                <FormHelperText sx={{ mx: 0 }}>
                    {error || helper}
                </FormHelperText>
            )}
        </FormControl>
    </Box>
);

const FieldSkeleton = () => (
    <Box>
        <Skeleton variant="text" width="40%" height={22} sx={{ mb: 0.75 }} />
        <Skeleton variant="rounded" height={40} sx={{ borderRadius: 2 }} />
    </Box>
);

const SectionSkeleton = ({ fields = 6, children }) => (
    <Card variant="outlined" sx={{ borderRadius: 3, p: 2.5, mb: 2.5 }}>
        <Stack
            direction="row"
            alignItems="center"
            gap={1}
            sx={{ pb: 1, mb: 2, borderBottom: "1px solid #eee" }}
        >
            <Skeleton variant="text" width={180} height={28} />
        </Stack>

        {children || (
            <Box
                sx={{
                    display: "grid",
                    gap: 2.5,
                    gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
                }}
            >
                {Array.from({ length: fields }).map((_, i) => (
                    <FieldSkeleton key={i} />
                ))}
            </Box>
        )}
    </Card>
);

const PaymentFormSkeleton = () => (
    <Box sx={{ p: 1 }}>
        <Stack direction="row" alignItems="center" gap={1.5} sx={{ mb: 2.5 }}>
            <Skeleton variant="circular" width={40} height={40} />
            <Skeleton variant="text" width={280} height={44} />
        </Stack>

        <SectionSkeleton fields={5} />

        <SectionSkeleton>
            <FieldSkeleton />
            <Skeleton
                variant="text"
                width={100}
                height={22}
                sx={{ mt: 2.5, mb: 0.75 }}
            />
            <Skeleton variant="rounded" height={110} sx={{ borderRadius: 2 }} />
        </SectionSkeleton>

        <Stack direction="row" justifyContent="center" gap={1.5}>
            <Skeleton variant="rounded" width={130} height={36} />
            <Skeleton variant="rounded" width={90} height={36} />
        </Stack>
    </Box>
);

/* ---------------- component ---------------- */

const PaymentFormComponent = ({ lang }) => {
    const router = useRouter();

    const { doGet, doPost, token } = useApi();

    const fileRef = useRef(null);

    const [createData, setCreateData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState("");
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState({});
    const [files, setFiles] = useState([]);

    // `payee` holds the selected contract's _id.
    const [form, setForm] = useState({
        payee: "",
        amount: "",
        date: today(),
        method: "",
        reference: "",
        remarks: "",
    });

    const fetchCreateData = useCallback(async () => {
        if (!token) {
            setLoading(true);
            return;
        }

        setLoading(true);
        setLoadError("");

        try {
            const response = await doGet("company/payment/create/data");
            const result = response?.data ?? response;

            if (!result || !Array.isArray(result.contract)) {
                throw new Error("Invalid payment create data received.");
            }

            setCreateData(result);
        } catch (error) {
            console.error("Failed to load payment create data:", error);
            setLoadError("Unable to load contracts. Please try again.");
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        fetchCreateData();
    }, [token]);

    const contracts = createData?.contract ?? [];

    const selectedContract = contracts.find(
        (contract) => contract._id === form.payee
    );

    const paidAmount = getPaidTotal(selectedContract);
    const maxAmount = getContractLimit(selectedContract); // value - paid

    const validate = () => {
        const nextErrors = {};

        if (!form.payee) {
            nextErrors.payee = "Please select a contract.";
            nextErrors.amount = "Select a contract first.";
        } else {
            const amountError = validateAmount(form.amount, maxAmount);

            if (amountError) nextErrors.amount = amountError;
        }

        if (!form.date) {
            nextErrors.date = "Payment date is required.";
        }

        if (!form.method) {
            nextErrors.method = "Please select a payment method.";
        }

        setErrors(nextErrors);

        return Object.keys(nextErrors).length === 0;
    };

    const handleSave = async (e) => {
        e?.preventDefault();

        if (saving || !validate()) return;

        setSaving(true);
        setLoadError("");

        try {
            const data = new FormData();

            data.append("contract_id", form.payee);
            data.append("total_payment_amount", form.amount);
            data.append("payment_date", form.date);
            data.append("payment_method", form.method);
            data.append("ref_no", form.reference.trim());
            data.append("remark", form.remarks.trim());

            files.forEach((file) => {
                data.append("documents", file);
            });

            const response = await doPost("company/payment/save/data", data);
            const result = response?.data ?? response;

            if (result?.success === false) {
                throw new Error(result.message || "Unable to save payment.");
            }

            router.push(`/${lang}/apps/payment`);
        } catch (error) {
            console.error("Failed to save payment:", error);

            setLoadError(
                error?.response?.data?.message ||
                error?.message ||
                "Unable to save payment. Please try again."
            );
        } finally {
            setSaving(false);
        }
    };

    const set = (key) => (e) => {
        const value = e.target.value;

        setForm((previous) => ({ ...previous, [key]: value }));
        setErrors((previous) => ({ ...previous, [key]: "" }));
    };

    const handlePayeeChange = (e) => {
        const payee = e.target.value;

        setForm((previous) => ({ ...previous, payee, amount: "" }));
        setErrors((previous) => ({ ...previous, payee: "", amount: "" }));
    };

    const handleAmountChange = (e) => {
        const value = e.target.value;

        setForm((previous) => ({ ...previous, amount: value }));
        setErrors((previous) => ({
            ...previous,
            amount: value === "" ? "" : validateAmount(value, maxAmount),
        }));
    };

    const handleFiles = (e) => {
        const selectedFiles = Array.from(e.target.files || []);

        setFiles((previous) => {
            const existing = new Set(
                previous.map(
                    (file) => `${file.name}-${file.size}-${file.lastModified}`
                )
            );

            const newFiles = selectedFiles.filter(
                (file) =>
                    !existing.has(
                        `${file.name}-${file.size}-${file.lastModified}`
                    )
            );

            return [...previous, ...newFiles];
        });

        e.target.value = "";
    };

    const selectSx = { borderRadius: 2 };

    const placeholder = (text) => (
        <MenuItem value="" disabled>
            <em>{text}</em>
        </MenuItem>
    );

    if (loading) {
        return <PaymentFormSkeleton />;
    }

    if (loadError && !createData) {
        return (
            <Box sx={{ p: 2 }}>
                <Alert
                    severity="error"
                    action={
                        <Button color="inherit" onClick={fetchCreateData}>
                            Retry
                        </Button>
                    }
                >
                    {loadError}
                </Alert>
            </Box>
        );
    }

    const amountHelper = !form.payee
        ? "Select a contract first."
        : maxAmount === null
            ? "The selected contract has no valid amount."
            : maxAmount <= 0
                ? "This contract is already fully paid."
                : `Maximum allowed: ${formatMoney(maxAmount)}`;

    return (
        <Box sx={{ p: 1 }}>
            <Stack direction="row" alignItems="center" gap={1.5} sx={{ mb: 2.5 }}>
                <IconButton onClick={() => router.back()}>
                    <ArrowBackIcon />
                </IconButton>

                <Typography variant="h4" fontWeight={700}>
                    Receive New Payment
                </Typography>
            </Stack>

            {loadError && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {loadError}
                </Alert>
            )}

            <Box component="form" onSubmit={handleSave} noValidate>
                <Section title="Payment Information">
                    <Box
                        sx={{
                            display: "grid",
                            gap: 2.5,
                            gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
                        }}
                    >
                        <Field label="Contract" required error={errors.payee}>
                            <Select
                                size="small"
                                displayEmpty
                                value={form.payee}
                                onChange={handlePayeeChange}
                                error={!!errors.payee}
                                sx={selectSx}
                            >
                                {placeholder("Select contract...")}

                                {contracts.map((contract) => (
                                    <MenuItem
                                        key={contract._id}
                                        value={contract._id}
                                    >
                                        {getContractLabel(contract)}
                                    </MenuItem>
                                ))}
                            </Select>
                        </Field>

                        <Field
                            label="Total Payment Amount"
                            required
                            error={errors.amount}
                            helper={amountHelper}
                        >
                            <TextField
                                fullWidth
                                size="small"
                                type="number"
                                placeholder="Enter total payment amount..."
                                value={form.amount}
                                onChange={handleAmountChange}
                                onKeyDown={(e) => {
                                    if (["e", "E", "+", "-"].includes(e.key)) {
                                        e.preventDefault();
                                    }
                                }}
                                disabled={
                                    !form.payee ||
                                    maxAmount === null ||
                                    maxAmount <= 0
                                }
                                error={!!errors.amount}
                                inputProps={{
                                    min: 0.01,
                                    max: maxAmount ?? undefined,
                                    step: "0.01",
                                }}
                                InputProps={{ sx: selectSx }}
                            />
                        </Field>

                        <Field label="Payment Date" required error={errors.date}>
                            <TextField
                                fullWidth
                                size="small"
                                type="date"
                                value={form.date}
                                onChange={set("date")}
                                error={!!errors.date}
                                InputProps={{ sx: selectSx }}
                            />
                        </Field>

                        <Field
                            label="Payment Method"
                            required
                            error={errors.method}
                        >
                            <Select
                                size="small"
                                displayEmpty
                                value={form.method}
                                onChange={set("method")}
                                error={!!errors.method}
                                sx={selectSx}
                            >
                                {placeholder("Select payment method...")}

                                {METHODS.map((method) => (
                                    <MenuItem key={method} value={method}>
                                        {method}
                                    </MenuItem>
                                ))}
                            </Select>
                        </Field>

                        <Field label="Reference Number">
                            <TextField
                                fullWidth
                                size="small"
                                placeholder="Enter reference number..."
                                value={form.reference}
                                onChange={set("reference")}
                                InputProps={{ sx: selectSx }}
                            />
                        </Field>
                    </Box>
                </Section>

                <Section
                    icon={
                        <DescriptionOutlinedIcon
                            sx={{ color: "#2563eb" }}
                            fontSize="small"
                        />
                    }
                    title="Additional Information"
                >
                    <Field label="Additional Remarks">
                        <TextField
                            fullWidth
                            multiline
                            minRows={2}
                            value={form.remarks}
                            onChange={set("remarks")}
                            placeholder="Add any additional notes, comments, or special instructions..."
                            InputProps={{ sx: selectSx }}
                        />
                    </Field>

                    <Typography
                        variant="body2"
                        fontWeight={600}
                        sx={{ mt: 2.5, mb: 0.75 }}
                    >
                        Documents
                    </Typography>

                    <input
                        ref={fileRef}
                        type="file"
                        hidden
                        multiple
                        accept={ACCEPT}
                        onChange={handleFiles}
                    />

                    <Box
                        onClick={() => fileRef.current?.click()}
                        sx={{
                            border: "1.5px dashed #888",
                            borderRadius: 2,
                            py: 4,
                            textAlign: "center",
                            cursor: "pointer",
                            "&:hover": { bgcolor: "#fafafa" },
                        }}
                    >
                        <AttachFileIcon sx={{ color: "#555" }} />

                        <Typography variant="body2" fontWeight={600}>
                            Click to upload documents
                        </Typography>

                        <Typography variant="caption" color="text.secondary">
                            JPEG, JPG, PNG, PDF, DOC, DOCX (multiple files supported)
                        </Typography>
                    </Box>

                    {files.length > 0 && (
                        <Stack
                            direction="row"
                            gap={1}
                            flexWrap="wrap"
                            sx={{ mt: 1.5 }}
                        >
                            {files.map((file, index) => (
                                <Chip
                                    key={`${file.name}-${file.size}-${index}`}
                                    label={file.name}
                                    size="small"
                                    onDelete={() =>
                                        setFiles((previous) =>
                                            previous.filter((_, i) => i !== index)
                                        )
                                    }
                                />
                            ))}
                        </Stack>
                    )}
                </Section>

                <Stack direction="row" justifyContent="center" gap={1.5}>
                    <Button
                        type="submit"
                        variant="contained"
                        disabled={saving || loading}
                    >
                        {saving ? "Saving..." : "Save Payment"}
                    </Button>

                    <Button
                        type="button"
                        variant="outlined"
                        onClick={() => router.push(`/${lang}/apps/payment`)}
                        sx={{ textTransform: "none" }}
                    >
                        Cancel
                    </Button>
                </Stack>
            </Box>
        </Box>
    );
};

export default PaymentFormComponent;
