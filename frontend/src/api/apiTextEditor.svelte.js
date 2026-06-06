import { httpGet } from "./http.svelte";

const apiUrl = __API_URL__;

export async function apiGetDocumentImage(feature, documentId, filename){
    const resp = await httpGet(`${apiUrl}/editor/assets/${feature}/${documentId}/${filename}`);
    if (!resp) return { resp: null, blob: null };
    const blob = await resp.blob();
    return { resp, blob };
}