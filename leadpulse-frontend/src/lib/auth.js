import api, {
    setAccessToken,
    clearAccessToken,
} from "@/api/api";

const getData = (response) => {
    return (
        response.data?.data ??
        response.data
    );
};

export function getAuthErrorMessage(
    error,
    fallback = "Something went wrong."
) {
    return (
        error.response?.data?.message ??
        error.response?.data?.error ??
        error.message ??
        fallback
    );
}

export async function login(credentials) {
    const response = await api.post(
        "/auth/login",
        credentials
    );

    const data = getData(response);

    if (!data?.accessToken) {
        throw new Error(
            "Login response did not contain an access token."
        );
    }

    setAccessToken(data.accessToken);
    
    // NEW: Leave a breadcrumb that the user has an active session
    if (typeof window !== "undefined") {
        localStorage.setItem("hasSession", "true");
    }

    return data;
}

export async function logout() {
    try {
        await api.post("/auth/logout");
    } finally {
        clearAccessToken();
        
        // NEW: Clear the breadcrumb on logout
        if (typeof window !== "undefined") {
            localStorage.removeItem("hasSession");
        }
    }
}

export async function refreshToken() {
    try {
        const response = await api.post("/auth/refresh-token");
        const data = getData(response);

        if (!data?.accessToken) {
            throw new Error("Refresh endpoint did not return an access token.");
        }

        setAccessToken(data.accessToken);
        
        if (typeof window !== "undefined") {
            localStorage.setItem("hasSession", "true");
        }

        return data;
    } catch(error) {
        if (error.response?.status === 401) {
            clearAccessToken();
            
            if (typeof window !== "undefined") {
                localStorage.removeItem("hasSession");
            }
            
            if (typeof window !== "undefined" && window.location.pathname !== "/login") {
                window.location.href = "/login";
            }
        }
        throw error;
    }
}

export async function forgotPassword(email) {
    const response = await api.post("/auth/forgot-password", { email });
    return getData(response);
}

export async function resetPassword(email, token, newPassword) {
    const response = await api.post("/auth/reset-password", {
        email,
        token,
        newPassword,
    });
    return getData(response);
}

export async function register(payload) {
    const response = await api.post(
            "/auth/register",
            payload
        );

    return getData(response);
}