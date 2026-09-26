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

export async function getClientPortal(clientId) {
    const url = clientId ? `/dashboards/client-portal?clientId=${clientId}` : `/dashboards/client-portal`;
    const response = await api.get(url);
    return getData(response);
}