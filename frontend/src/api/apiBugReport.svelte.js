import { httpGet, parseBodySafe } from "./http.svelte";

const apiUrl = __API_URL__;

/**
 * Fetches all bug reports
 *
 * Sends a GET request to `/support/bugs/all` endpoint with an Authorization header.
 *
 * @returns {Promise<{ resp: Response | null, body: any | null }>}
 * An object containing the raw fetch Response (`resp`) and the parsed
 * JSON response body (`body`). Returns `{ resp: null, body: null }`
 * if the request fails before a response is received.
 *
 * The response body may include complete bug report objects
 *
 * @example
 * const { resp, body } = await apiGetBugReports();
 *
 * if (resp?.ok) {
 *   console.log("Bug Reports: ", body);
 * }
 */
export async function apiGetBugReports() {
    const resp = await httpGet(`${apiUrl}/support/bugs/all`);
    if (!resp) return { resp: null, body: null };
    const body = await parseBodySafe(resp);
    return { resp, body };
}


/**
 * Fetches details of a bug report
 *
 * Sends a GET request to `/support/bugs/details/{id}` endpoint with an Authorization header.
 *
 * @param {string} id - the id of the bug report
 * 
 * @returns {Promise<{ resp: Response | null, body: any | null }>}
 * An object containing the raw fetch Response (`resp`) and the parsed
 * JSON response body (`body`). Returns `{ resp: null, body: null }`
 * if the request fails before a response is received.
 *
 * The response body may include a complete bug report object
 *
 * @example
 * const { resp, body } = await apiGetBugReportDetails();
 *
 * if (resp?.ok) {
 *   console.log("Bug Report: ", body);
 * }
 */
export async function apiGetBugReportDetails(id) {
    const resp = await httpGet(`${apiUrl}/support/bugs/details/${id}`);
    if (!resp) return { resp: null, body: null };
    const body = await parseBodySafe(resp);
    return { resp, body };
}