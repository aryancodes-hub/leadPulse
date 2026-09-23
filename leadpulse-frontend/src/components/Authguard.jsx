"use client";

import {
    useEffect,
} from "react";

import {
    usePathname,
    useRouter,
} from "next/navigation";

import {
    useAuth,
} from "@/context/AuthContext";

export default function AuthGuard({
    children,
    allowedRoles,
}) {
    const {
        isAuthenticated,
        isLoading,
        role,
    } = useAuth();

    const router =
        useRouter();

    const pathname =
        usePathname();

    useEffect(() => {
        if (isLoading) {
            return;
        }

        /*
        ------------------------------------------------------------------
        JWT ROLE CHECK — disabled, no backend yet
        ------------------------------------------------------------------
        With no backend, isAuthenticated/role never come from a real JWT,
        so this redirect would bounce every visitor straight to /login (or
        /unauthorized) before they ever saw a dashboard. Uncomment both
        blocks below once login issues real tokens and AuthContext's
        restoreSession is re-enabled.

        if (!isAuthenticated) {
            router.replace(
                `/login?returnUrl=${encodeURIComponent(
                    pathname
                )}`
            );

            return;
        }

        if (
            allowedRoles &&
            !allowedRoles.includes(role)
        ) {
            router.replace(
                "/unauthorized"
            );
        }
        */
    }, [
        isLoading,
        isAuthenticated,
        role,
        router,
        pathname,
        allowedRoles,
    ]);

    if (isLoading) {
        return (
            <div className="page">
                <div className="container">
                    <h2>Loading...</h2>
                </div>
            </div>
        );
    }

    
    if (!isAuthenticated) {
        return null;
    }

    if (
        allowedRoles &&
        !allowedRoles.includes(role)
    ) {
        return null;
    }
    

    return children;
}
