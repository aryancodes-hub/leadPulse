import api from "@/api/api";

const getData = (response) =>
    response.data?.data ??
    response.data;

export async function createCallRemark(
    payload
) {
    const response =
        await api.post(
            "/call-remarks",
            payload
        );

    return getData(response);
}

export async function getCampaignCallRemarks(
    campaignId,
    params = {}
) {
    const response =
        await api.get(
            `/campaigns/${campaignId}/call-remarks`,
            { params }
        );

    return getData(response);
}

export async function confirmCallRemark(
    id,
    payload = {}
) {
    const response =
        await api.patch(
            `/call-remarks/${id}/confirm`,
            payload
        );

    return getData(response);
}