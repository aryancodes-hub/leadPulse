import api from "@/api/api";

const getData = (response) =>
    response.data?.data ??
    response.data;

export async function uploadLeadList(
    formData
) {
    const response =
        await api.post(
            "/lead-lists/upload",
            formData,
            {
                headers: {
                    "Content-Type":
                        "multipart/form-data",
                },
            }
        );

    return getData(response);
}

export async function getImportStatus(
    jobId
) {
    const response =
        await api.get(
            `/lead-imports/${jobId}/status`
        );

    return getData(response);
}

export async function getLeadLists(
    params = {}
) {
    const response =
        await api.get(
            "/lead-lists",
            { params }
        );

    return getData(response);
}

export async function getLeadList(id) {
    const response =
        await api.get(
            `/lead-lists/${id}`
        );

    return getData(response);
}

export async function getLeadListMembers(
    id,
    params = {}
) {
    const response =
        await api.get(
            `/lead-lists/${id}/members`,
            { params }
        );

    return getData(response);
}