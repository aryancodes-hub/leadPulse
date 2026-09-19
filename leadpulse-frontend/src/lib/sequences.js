import api from "@/api/api";

const getData = (response) =>
    response.data?.data ??
    response.data;

export async function getSequences(
    params = {}
) {
    const response =
        await api.get(
            "/sequences",
            { params }
        );

    return getData(response);
}

export async function createSequence(
    payload
) {
    const response =
        await api.post(
            "/sequences",
            payload
        );

    return getData(response);
}

export async function getSequence(id) {
    const response =
        await api.get(
            `/sequences/${id}`
        );

    return getData(response);
}