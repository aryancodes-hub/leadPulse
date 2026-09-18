"use client";

import {
    createContext,
    useContext,
    useEffect,
    useState,
} from "react";

import {
    login as loginService,
    logout as logoutService,
    refreshToken as refreshTokenService,
} from "@/lib/auth";

import {
    clearAccessToken,
} from "@/api/api";

const AuthContext = createContext(null);

export function AuthProvider({
    children,
}) {
    const [user, setUser] = useState(null);
    const [role, setRole] = useState(null);
    const [isAuthenticated, setIsAuthenticated,] = useState(false);
    const [isLoading, setIsLoading,] = useState(true);

    useEffect(() => {
        async function restoreSession() {
            /*
            --------------------------------------------------------------
            JWT SESSION RESTORE — disabled, no backend yet
            --------------------------------------------------------------
            This calls POST /auth/refresh-token on every load to turn the
            httpOnly refresh cookie into a fresh access token + role. Until
            the backend exists this always fails, which is what forced
            every dashboard back to /login. Uncomment once the backend
            is live.

            try {
                const data = await refreshTokenService();
                setUser( data?.user ?? null );
                setRole( data?.role ?? data?.user?.role ?? null );
                setIsAuthenticated(true);
            }
            catch {
                clearAccessToken();
                setUser(null);
                setRole(null);
                setIsAuthenticated(false);
            }
            finally { setIsLoading(false); }
            */

            setIsLoading(false);
        }

        restoreSession();
    }, []);

    async function login(credentials) {
        const data = await loginService(credentials);
        setUser( data?.user ?? null );
        setRole( data?.role ?? data?.user?.role ?? null );
        setIsAuthenticated(true);
        return data;
    }

    /*
    --------------------------------------------------------------------
    DEMO LOGIN — frontend-only stand-in for `login()` above
    --------------------------------------------------------------------
    `login()` still calls the real POST /auth/login endpoint and is left
    untouched for when the backend is ready. `loginDemo()` sets the same
    state locally so the navbar, AuthGuard and dashboards have a user/role
    to work with while there's nothing to authenticate against yet. Swap
    the login page back to calling `login()` once real JWTs exist, then
    this can be deleted.
    */
    function loginDemo({ name, email, role: demoRole }) {
        setUser({ name, email });
        setRole(demoRole);
        setIsAuthenticated(true);
    }

    async function logout() {
        try { await logoutService(); }
        finally {
            setUser(null);
            setRole(null);
            setIsAuthenticated(false);
        }
    }

    return (
        <AuthContext.Provider
            value={{
                user,
                role,
                isAuthenticated,
                isLoading,
                login,
                loginDemo,
                logout,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error(
            "useAuth must be used inside AuthProvider."
        );
    }

    return context;
}
