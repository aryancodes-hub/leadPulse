import api from "@/api/api";
const getData = (response) =>
    response.data?.data ??
    response.data;

export async function getUsers(params = {}) {
    const response = await api.get( "/users", { params } );
    return getData(response);
}

export async function createUser(
    payload
) {
    const response = await api.post( "/users", payload );
    return getData(response);
}

export async function getUser(id) {
    const response = await api.get( `/users/${id}` );
    return getData(response);
}

export async function updateUser(id,payload) {
    const response = await api.patch( `/users/${id}`, payload );
    return getData(response);
}