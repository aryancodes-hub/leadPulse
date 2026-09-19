import api from "@/api/api";
const getData = (response) => response.data?.data ?? response.data;

export async function getEmailJobStatus(jobId) {
    const response = await api.get( `/email-jobs/${jobId}/status` );
    return getData(response);
}