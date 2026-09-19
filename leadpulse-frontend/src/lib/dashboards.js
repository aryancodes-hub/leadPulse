import api from "@/api/api";

const getData = (response) =>
    response.data?.data ??
    response.data;

export async function getManagerSummary() {
    const response =
        await api.get(
            "/dashboards/manager-summary"
        );

    return getData(response);
}

export async function getExecutivePerformance() {
    try {
        const response = await api.get("/dashboards/exec-performance");
        return getData(response);
    } catch (err) {
        if (err.response?.status === 404) {
            const response = await api.get("/dashboards/executive-performance");
            return getData(response);
        }
        throw err;
    }
}

export async function getClientPortal() {
    const response =
        await api.get(
            "/dashboards/client-portal"
        );

    return getData(response);
}