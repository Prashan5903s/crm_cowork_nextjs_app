import { redirect } from 'next/navigation'

import { getServerSession } from 'next-auth'

import PermissionGuardClient from '@/components/PermissionGuardClient'

import { authOptions } from '@/libs/auth'

const fetchPermission = async (url, token) => {
    try {
        const response = await fetch(`${url}/admin/role/allow/permission`, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${token}`,
            },
            cache: 'no-store',
        })

        if (!response.ok) {
            console.error('Permission API error:', await response.text())
            
            return null
        }

        const data = await response.json()
        
        return data?.data || null
    } catch (error) {
        console.error('Permission fetch error:', error)
        
        return null
    }
}

export default async function PermissionGuardServer({
    children,
    locale,
    element,
}) {
    const session = await getServerSession(authOptions)

    const token = session?.user?.token
    const API_URL = process.env.NEXT_PUBLIC_API_URL

    const permissions = await fetchPermission(API_URL, token)

    // Normalize permissions (ensure it's an object with arrays)
    const allowedPermissions = permissions?.[element]
    const listingId = session?.user?.listing

    // ❌ Block access if missing permissions
    if (
        !permissions ||
        !permissions[element] ||
        (Array.isArray(allowedPermissions) &&
            !allowedPermissions.includes(listingId))
    ) {
        if (permissions?.isUser) {
            redirect(`/${locale}/dashboards/user/owner`)
        }

        if (permissions?.notUser) {
            redirect(`/${locale}/dashboards/society`)
        }

        // fallback redirect
        redirect(`/${locale}/unauthorized`)
    }

    // ✅ If passed, render client wrapper
    return <PermissionGuardClient>{children}</PermissionGuardClient>
}
