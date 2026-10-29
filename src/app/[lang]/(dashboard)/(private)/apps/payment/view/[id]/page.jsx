"use client";

import { useState, useEffect } from "react";

import { useRouter, useParams } from "next/navigation";
import { Box, Card, Divider, IconButton, Stack, Typography } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

import { useApi } from "@/utils/api";

// TODO: fetch the payment by id from your API
const MOCK = {
    id: 1, date: "2026-10-29", payee: "Prashant", method: "Cash", account: "Cash",
    invoice: "-", reference: "-", amount: 1, remarks: "", documents: [],
};

const Row = ({ label, value }) => (
    <Box>
        <Typography variant="caption" color="text.secondary">{label}</Typography>
        <Typography variant="body1" fontWeight={500}>{value || "-"}</Typography>
    </Box>
);

const PaymentViewPage = () => {

    const router = useRouter();
    const { id } = useParams();
    const payment = { ...MOCK, id }; // TODO: replace with fetched data

    const { doGet, token } = useApi();

    const [editData, setEditData] = useState();

    const fetchEditData = async () => {
        try {

            if (!token || !id) return;

            const response = await doGet(`company/payment/edit/data/${id}`)
            const result = response?.data ?? response;

            setEditData(result)

        } catch (error) {
            throw new Error(error)
        }
    }

    useEffect(() => {

        fetchEditData()
    }, [token, id])

    return (
        <Box sx={{ p: 2.5 }}>
            <Stack direction="row" alignItems="center" gap={1.5} sx={{ mb: 2.5 }}>
                <IconButton onClick={() => router.back()}><ArrowBackIcon /></IconButton>
                <Typography variant="h4" fontWeight={700}>#{editData?.receipt_no}</Typography>
            </Stack>

            <Card variant="outlined" sx={{ borderRadius: 3, p: 2.5 }}>
                <Typography fontWeight={700} sx={{ mb: 1 }}>Payment Information</Typography>
                <Divider sx={{ mb: 2.5 }} />
                <Box sx={{ display: "grid", gap: 2.5, gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" } }}>
                    <Row label="Payee" value={editData?.contract_id?.tenant?.full_name} />
                    <Row label="Total Payment Amount" value={`₹ ${Number(editData?.total_payment_amount).toLocaleString("en-IN")}`} />
                    <Row label="Payment Date" value={new Date(editData?.payment_date).toLocaleDateString("en-GB")} />
                    {/* <Row label="Invoice" value={payment.invoice} /> */}
                    <Row label="Payment Method" value={editData?.payment_method} />
                    <Row label="Reference Number" value={editData?.ref_no} />
                </Box>
            </Card>

            <Card variant="outlined" sx={{ borderRadius: 3, p: 2.5, mt: 2.5 }}>
                <Typography fontWeight={700} sx={{ mb: 1 }}>Additional Information</Typography>
                <Divider sx={{ mb: 2.5 }} />
                <Row label="Additional Remarks" value={payment.remarks} />
                <Box sx={{ mt: 2.5 }}>
                    <Typography variant="caption" color="text.secondary">Documents</Typography>
                    {editData?.documents?.length === 0 ? (
                        <Typography variant="body2">No documents attached</Typography>
                    ) : (
                        editData?.documents?.map((d) => (
                            <Typography key={d.url} variant="body2">
                                <a href={d.url} target="_blank" rel="noreferrer">{d.name}</a>
                            </Typography>
                        ))
                    )}
                </Box>
            </Card>
        </Box>
    );
};

export default PaymentViewPage;
