'use client'

import { useState, useEffect } from "react";

import { useParams } from "next/navigation";

import { useSession } from "next-auth/react";

import ProgramCardComponent from "@/components/program-component/CardComponent";

const ContentComponent = () => {

    const [loading, setLoading] = useState(true);
    const [cardData, setCardData] = useState();
    const [totalItem, setTotalItems] = useState()

    const API_URL = process.env.NEXT_PUBLIC_API_URL;
    const { data: session } = useSession();
    const token = session?.user?.token;
    const { lang: locale, id: id } = useParams();

    const fetchCardData = async () => {
        try {
            setLoading(true);

            const response = await fetch(`${API_URL}/company/content-folder/${id}`, {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            const result = await response.json();

            if (response.ok) {
                const value = result?.data;
                
                setCardData(value);
                setTotalItems(value?.length || 0);
            }
        } catch (error) {
            console.error('Failed to fetch card data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (API_URL && token) {
            fetchCardData();
        }
    }, [API_URL, token]);

    return (
        <>
            <ProgramCardComponent
                locale={locale}
                stage={"Content Folder"}
                currentId={id}
                parent={"Program"}
                formLink={`/${locale}/apps/content-folder/${id}/create`}
                data={cardData}
                loading={loading}
                totalItems={totalItem}
                nextLink={`/${locale}/apps/modules`}
                parentCategory={`/${locale}/apps/content-folder`}
            />
        </>
    )

}

export default ContentComponent;
