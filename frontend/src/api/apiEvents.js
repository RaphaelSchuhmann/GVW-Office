import { httpGet, httpPost, parseBodySafe } from "./http";

const apiUrl = __API_URL__;

/**
 * Fetches all events
 *
 * Sends a GET request to `/events/all` endpoint with an Authorization header.
 *
 * @returns {Promise<{ resp: Response | null, body: any | null }>}
 * An object containing the raw fetch Response (`resp`) and the parsed
 * JSON response body (`body`). Returns `{ resp: null, body: null }`
 * if the request fails before a response is received.
 *
 * The response body may include complete event objects
 *
 * @example
 * const { resp, body } = await getEvents();
 *
 * if (resp?.ok) {
 *   console.log("Events: ", body);
 * }
 */
export async function getEvents() {
    const resp = await httpGet(`${apiUrl}/events/all`);
    if (!resp) return { resp: null, body: null };
    const body = await parseBodySafe(resp);
    return { resp, body };
}