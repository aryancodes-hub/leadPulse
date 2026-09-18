import api from "@/api/api";

const getData = (response) =>
    response.data?.data ??
    response.data;

/*
GET /campaigns
*/

export async function getCampaigns(
    params = {}
) {
    const response =
        await api.get(
            "/campaigns",
            { params }
        );

    return getData(response);
}

/*
POST /campaigns
*/

export async function createCampaign(
    payload
) {
    const response =
        await api.post(
            "/campaigns",
            payload
        );

    return getData(response);
}

/*
GET /campaigns/:id
*/

export async function getCampaign(id) {
    const response =
        await api.get(
            `/campaigns/${id}`
        );

    return getData(response);
}

/*
PATCH /campaigns/:id
*/

export async function updateCampaign(
    id,
    payload
) {
    const response =
        await api.patch(
            `/campaigns/${id}`,
            payload
        );

    return getData(response);
}

/*
DELETE /campaigns/:id
*/

export async function deleteCampaign(
    id
) {
    const response =
        await api.delete(
            `/campaigns/${id}`
        );

    return getData(response);
}

/*
PATCH /campaigns/:id/status
*/

export async function updateCampaignStatus(
    id,
    payload
) {
    const response =
        await api.patch(
            `/campaigns/${id}/status`,
            payload
        );

    return getData(response);
}

/*
POST /campaigns/:id/approve
*/

export async function approveCampaign(
    id
) {
    const response =
        await api.post(
            `/campaigns/${id}/approve`
        );

    return getData(response);
}

/*
GET /campaigns/:id/executives
*/

export async function getCampaignExecutives(
    id
) {
    const response =
        await api.get(
            `/campaigns/${id}/executives`
        );

    return getData(response);
}

/*
POST /campaigns/:id/executives
*/

export async function assignExecutive(
    campaignId,
    payload
) {
    const response =
        await api.post(
            `/campaigns/${campaignId}/executives`,
            payload
        );

    return getData(response);
}

/*
DELETE /campaigns/:id/executives/:executiveUserId
*/

export async function unassignExecutive(
    campaignId,
    executiveUserId
) {
    const response =
        await api.delete(
            `/campaigns/${campaignId}/executives/${executiveUserId}`
        );

    return getData(response);
}

/*
POST /campaigns/:id/queue/next
*/

export async function getNextQueueLead(
    campaignId
) {
    const response =
        await api.post(
            `/campaigns/${campaignId}/queue/next`
        );

    return getData(response);
}

/*
POST /campaigns/:id/queue/:campaignLeadId/skip
*/

export async function skipQueueLead(
    campaignId,
    campaignLeadId
) {
    const response =
        await api.post(
            `/campaigns/${campaignId}/queue/${campaignLeadId}/skip`
        );

    return getData(response);
}

/*
POST /campaigns/:id/dispatch-email
*/

export async function dispatchEmail(
    campaignId,
    payload = {}
) {
    const response =
        await api.post(
            `/campaigns/${campaignId}/dispatch-email`,
            payload
        );

    return getData(response);
}