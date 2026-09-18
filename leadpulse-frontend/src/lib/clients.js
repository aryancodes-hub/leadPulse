import api from "@/api/api";

const getData = (response) =>
    response.data?.data ??
    response.data;

export async function getClients(
    params = {}
) {
    const response =
        await api.get(
            "/clients",
            { params }
        );

    return getData(response);
}

export async function createClient(
    payload
) {
    const response =
        await api.post(
            "/clients",
            payload
        );

    return getData(response);
}

export async function getClient(id) {
    const response =
        await api.get(
            `/clients/${id}`
        );

    return getData(response);
}

export async function updateClient(
    id,
    payload
) {
    const response =
        await api.patch(
            `/clients/${id}`,
            payload
        );

    return getData(response);
}