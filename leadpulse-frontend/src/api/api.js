import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const api = axios.create({
    baseURL: API_URL,
    withCredentials: true,
    headers: {
        "Content-Type": "application/json",
    },
});

let accessToken = null;

export function setAccessToken(token) {
    accessToken = token;
    if (typeof window !== "undefined") {
        localStorage.setItem("accessToken", token);
    }
}

export function getAccessToken() {
    if (!accessToken && typeof window !== "undefined") {
        accessToken = localStorage.getItem("accessToken");
    }
    return accessToken;
}

export function clearAccessToken() {
    accessToken = null;
    if (typeof window !== "undefined") {
        localStorage.removeItem("accessToken");
    }
}

function decodeJwtPayload(token) {
    try {
        const base64Url = token.split(".")[1];

        const base64 = base64Url
            .replace(/-/g, "+")
            .replace(/_/g, "/");

        const padded =
            base64 +
            "=".repeat((4 - (base64.length % 4)) % 4);

        return JSON.parse(atob(padded));
    } catch {
        return null;
    }
}

function isTokenExpired(token) {
    if (!token) {
        return true;
    }

    const payload = decodeJwtPayload(token);

    if (!payload?.exp) {
        return true;
    }

    return (
        payload.exp <=
        Math.floor(Date.now() / 1000)
    );
}

let refreshPromise = null;

async function refreshAccessToken() {
    if (!refreshPromise) {
        refreshPromise = axios
            .post(
                `${API_URL}/auth/refresh-token`,
                {},
                {
                    withCredentials: true,
                    headers: { Authorization: `Bearer ${getAccessToken()}` }
                }
            )
            .then((response) => {
                const data =
                    response.data?.data ??
                    response.data;

                if (!data?.accessToken) {
                    throw new Error(
                        "Refresh endpoint did not return an access token."
                    );
                }

                setAccessToken(data.accessToken);

                return data.accessToken;
            })
            .finally(() => {
                refreshPromise = null;
            });
    }

    return refreshPromise;
}

/*
|--------------------------------------------------------------------------
| REQUEST INTERCEPTOR
|--------------------------------------------------------------------------
*/

api.interceptors.request.use(
    async (config) => {
        const isRefreshRequest =
            config.url?.includes(
                "/auth/refresh-token"
            );

        if (
            !isRefreshRequest &&
            accessToken &&
            isTokenExpired(accessToken)
        ) {
            try {
                await refreshAccessToken();
            } catch {
                clearAccessToken();
            }
        }

        const token = getAccessToken();
        if (token) {
            config.headers = config.headers ?? {};
            config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
    },

    (error) => {
        return Promise.reject(error);
    }
);

/*
|--------------------------------------------------------------------------
| RESPONSE INTERCEPTOR
|--------------------------------------------------------------------------
*/

api.interceptors.response.use(
    (response) => response,

    async (error) => {
        const originalRequest =
            error.config;

        if (!error.response) {
            return Promise.reject(error);
        }

        const excludedEndpoints = [
            "/auth/login",
            "/auth/register",
            "/auth/forgot-password",
            "/auth/reset-password",
            "/auth/refresh-token",
        ];

        const isExcluded =
            excludedEndpoints.some(
                (endpoint) =>
                    originalRequest?.url?.includes(
                        endpoint
                    )
            );

        if (isExcluded) {
            return Promise.reject(error);
        }

        if (
            error.response.status !== 401 ||
            !originalRequest
        ) {
            return Promise.reject(error);
        }

        if (originalRequest._retry) {
            clearAccessToken();

            return Promise.reject(error);
        }

        originalRequest._retry = true;

        try {
            const newToken =
                await refreshAccessToken();

            originalRequest.headers =
                originalRequest.headers ?? {};

            originalRequest.headers.Authorization =
                `Bearer ${newToken}`;

            return api(originalRequest);
        } catch (refreshError) {
            clearAccessToken();

            return Promise.reject(
                refreshError
            );
        }
    }
);

export default api;