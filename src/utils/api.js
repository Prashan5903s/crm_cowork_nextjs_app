import { useSession } from 'next-auth/react';
import { toast } from 'react-toastify'

export const useApi = () => {
    
    const { data: session } = useSession();
    const token = session?.user?.token;

    const doGet = async (endpoint, params = {}, options = {}) => {

        const url = `${process.env.NEXT_PUBLIC_API_URL}/${endpoint}`;
        const query = new URLSearchParams(params).toString();
        const finalUrl = query ? `${url}?${query}` : url;

        const response = await fetch(finalUrl, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                ...(token && {
                    Authorization: `Bearer ${token}`,
                }),
            },
            signal: options.signal,
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data?.message || "Something went wrong");
        }

        return data?.data;
    };

    const doPost = async (endpoint, body = {}) => {
        const finalUrl = `${process.env.NEXT_PUBLIC_API_URL}/${endpoint}`;

        try {
            const isFormData = body instanceof FormData;

            const response = await fetch(finalUrl, {
                method: "POST",
                headers: {
                    ...(token && {
                        Authorization: `Bearer ${token}`,
                    }),
                    ...(isFormData
                        ? {}
                        : {
                            "Content-Type": "application/json",
                        }),
                },
                body: isFormData ? body : JSON.stringify(body),
            });

            const data = await response.json();

            if (!response.ok || data?.success === false) {
                throw new Error(
                    data?.message || "Failed to create amenity."
                );
            }

            return data?.data ?? data;
        } catch (error) {
            console.error("POST Request Error:", error.message);
            throw error;
        }
    };

    const doPostFormData = async ({
        endpoint,
        values,
        method = "POST",
        onSuccess = () => { },
        onError = () => { },
    }) => {
        try {
            const finalUrl = `${process.env.NEXT_PUBLIC_API_URL}/${endpoint}`;

            const formData =
                values instanceof FormData
                    ? values
                    : (() => {
                        const fd = new FormData();

                        Object.entries(values || {}).forEach(([key, value]) => {
                            if (value === null || value === undefined) return;

                            if (value instanceof File) {
                                fd.append(key, value);
                            } else if (Array.isArray(value)) {
                                fd.append(key, JSON.stringify(value));
                            } else if (typeof value === "object") {
                                fd.append(key, JSON.stringify(value));
                            } else {
                                fd.append(key, String(value));
                            }
                        });

                        return fd;
                    })();

            const response = await fetch(finalUrl, {
                method,
                headers: {
                    ...(token && {
                        Authorization: `Bearer ${token}`,
                    }),
                },
                body: formData,
            });

            const data = await response.json();

            if (!response.ok || data?.success === false) {
                throw new Error(
                    data?.message || "Failed to save amenity."
                );
            }

            onSuccess(data);
            return data?.data ?? data;
        } catch (error) {
            onError(error);
            console.error("Form Data Request Error:", error.message);
            throw error;
        }
    };

    const doPut = async (endpoint, body = {}) => {
        const finalUrl = `${process.env.NEXT_PUBLIC_API_URL}/${endpoint}`;

        try {
            const isFormData = body instanceof FormData;

            const response = await fetch(finalUrl, {
                method: "PUT",
                headers: {
                    ...(token && {
                        Authorization: `Bearer ${token}`,
                    }),
                    ...(isFormData
                        ? {}
                        : {
                            "Content-Type": "application/json",
                        }),
                },
                body: isFormData ? body : JSON.stringify(body),
            });

            const data = await response.json();

            if (!response.ok || data?.success === false) {
                throw new Error(
                    data?.message || "Failed to update amenity."
                );
            }

            return data?.data ?? data;
        } catch (error) {
            console.error("PUT Request Error:", error.message);
            throw error;
        }
    };

    const doDelete = async ({
        endpoint,
        params = {},
        onSuccess = () => { },
        onError = () => { }
    }) => {
        const url = `${process.env.NEXT_PUBLIC_API_URL}/${endpoint}`;
        const query = new URLSearchParams(params).toString();
        const finalUrl = query ? `${url}?${query}` : url;

        try {
            const response = await fetch(finalUrl, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token && { Authorization: `Bearer ${token}` }),
                },
            });

            const data = await response.json();

            if (response.ok) {
                onSuccess(data);
            } else {
                toast.error(data?.message || 'Error occurred', { autoClose: 1200 });
                console.error('Error', data);
            }
        } catch (error) {
            onError(error);
            toast.error(error, { autoClose: 1200 });
            console.error('DELETE Request Error', error);
        }
    };

    return { doGet, doPost, doDelete, doPostFormData, doPut, token, doPostFormData };
};
