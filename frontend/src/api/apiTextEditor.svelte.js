import { httpGet, parseBodySafe } from "./http.svelte";

const apiUrl = __API_URL__;

export async function apiGetDocumentImage(feature, documentId, filename){
    const resp = await httpGet(`${apiUrl}/editor/assets/${feature}/${documentId}/${filename}`);
    if (!resp) return { resp: null, blob: null };
    const blob = await resp.blob();
    return { resp, blob };
}

export async function apiResolveURl(url) {
    const resp = await httpGet(`${apiUrl}/editor/resolve?url=${url}`);
    if (!resp) return { resp: null, body: null };
    const body = await parseBodySafe(resp);
    return { resp, body };
}