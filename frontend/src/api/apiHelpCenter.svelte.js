import { httpPost, httpDelete, httpPatch, parseBodySafe } from "./http.svelte.js";

const apiUrl = __API_URL__;

export async function apiAddCategory(inputs) {
    const resp = await httpPost(`${apiUrl}/help/category/add`, {
        title: inputs.title,
        icon: inputs.icon,
        description: inputs.description
    });
    if (!resp) return { resp: null, body: null };
    const body = await parseBodySafe(resp);
    return { resp, body };
}

export async function apiDeleteCategory(id) {
    const resp = await httpDelete(`${apiUrl}/help/category/delete/${id}`);
    if (!resp) return { resp: null, body: null };
    const body = await parseBodySafe(resp);
    return { resp, body };
}

export async function apiUpdateFeaturedCategories(featured) {
    const resp = await httpPatch(`${apiUrl}/help/category/update/featured`, { featured: Object.fromEntries(featured) });
    if (!resp) return { resp: null, body: null };
    const body = await parseBodySafe(resp);
    return { resp, body };
}