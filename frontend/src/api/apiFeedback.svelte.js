import { httpGet, parseBodySafe } from "./http.svelte";

const apiUrl = __API_URL__;

/**
 * Fetches all feedbacks
 *
 * Sends a GET request to `/support/feedback/all` endpoint with an Authorization header.
 *
 * @returns {Promise<{ resp: Response | null, body: any | null }>}
 * An object containing the raw fetch Response (`resp`) and the parsed
 * JSON response body (`body`). Returns `{ resp: null, body: null }`
 * if the request fails before a response is received.
 *
 * The response body may include complete feedback objects
 *
 * @example
 * const { resp, body } = await apiGetFeedbacks();
 *
 * if (resp?.ok) {
 *   console.log("Feedbacks: ", body);
 * }
 */
export async function apiGetFeedbacks() {
    const resp = await httpGet(`${apiUrl}/support/feedback/all`);
    if (!resp) return { resp: null, body: null };
    const body = await parseBodySafe(resp);
    return { resp, body };
}

/**
 * Fetches details of a user feedback
 *
 * Sends a GET request to `/support/feedback/details/{id}` endpoint with an Authorization header.
 *
 * @param {string} id - the id of the user feedback
 * 
 * @returns {Promise<{ resp: Response | null, body: any | null }>}
 * An object containing the raw fetch Response (`resp`) and the parsed
 * JSON response body (`body`). Returns `{ resp: null, body: null }`
 * if the request fails before a response is received.
 *
 * The response body may include a complete feedback object
 *
 * @example
 * const { resp, body } = await apiGetFeedbackDetails();
 *
 * if (resp?.ok) {
 *   console.log("Feedback: ", body);
 * }
 */
export async function apiGetFeedbackDetails(id) {
    const resp = await httpGet(`${apiUrl}/support/feedback/details/${id}`);
    if (!resp) return { resp: null, body: null };
    const body = await parseBodySafe(resp);
    return { resp, body };
}