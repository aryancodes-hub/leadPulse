import api from "@/api/api";

export async function getCampaignSummary(
    campaignId
) {
    const response =
        await api.get(
            `/reports/campaign-summary/${campaignId}`
        );

    return response.data;
}

export async function exportLeadEngagements() {
    try {
        const response = await api.get("/reports/export/engagements", {
            responseType: "blob",
        });
        return response.data;
    } catch (err) {
        if (err.response?.status === 404) {
            const response = await api.get("/reports/export/lead-engagements", {
                responseType: "blob",
            });
            return response.data;
        }
        throw err;
    }
}

export async function exportConvertedLeads() {
    try {
        const response = await api.get("/reports/export/converted", {
            responseType: "blob",
        });
        return response.data;
    } catch (err) {
        if (err.response?.status === 404) {
            const response = await api.get("/reports/export/converted-leads", {
                responseType: "blob",
            });
            return response.data;
        }
        throw err;
    }
}