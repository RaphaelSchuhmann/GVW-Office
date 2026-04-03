import { httpGet, parseBodySafe } from "./http.svelte";

const apiUrl = __API_URL__;

/**
 * Fetches all reports
 *
 * Sends a GET request to `/reports/all` endpoint with an Authorization header.
 *
 * @returns {Promise<{ resp: Response | null, body: any | null }>}
 * An object containing the raw fetch Response (`resp`) and the parsed
 * JSON response body (`body`). Returns `{ resp: null, body: null }`
 * if the request fails before a response is received.
 *
 * The response body may include complete report objects
 *
 * @example
 * const { resp, body } = await getReports();
 *
 * if (resp?.ok) {
 *   console.log("Reports: ", body);
 * }
 */
export async function getReports() {
    const resp = await httpGet(`${apiUrl}/reports/all`);
    if (!resp) return { resp: null, body: null };
    const body = await parseBodySafe(resp);
    return { resp, body };
}