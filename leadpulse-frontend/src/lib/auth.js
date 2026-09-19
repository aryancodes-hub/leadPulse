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

    return data;
}

export async function logout() {
    try {
        await api.post("/auth/logout");
    } finally {
        clearAccessToken();
    }
}

export async function refreshToken() {
    const response = await api.post(
            "/auth/refresh-token"
        );

    const data = getData(response);

    if (!data?.accessToken) {
        throw new Error(
            "Refresh endpoint did not return an access token."
        );
    }

    setAccessToken(data.accessToken);

    return data;
}

export async function forgotPassword(email) {
    const response = await api.post(
            "/auth/forgot-password",
            { email }
        );

    return getData(response);
}

export async function resetPassword(
    token,
    password
) {
    const response = await api.post(
            "/auth/reset-password",
            {
                token,
                password,
            }
        );

    return getData(response);
}

export async function register(payload) {
    const response = await api.post(
            "/auth/register",
            payload
        );

    return getData(response);
}