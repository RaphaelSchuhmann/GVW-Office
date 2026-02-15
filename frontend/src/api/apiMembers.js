import { httpGet, httpPost } from "./http";

const apiUrl = __API_URL__;

/**
 * Fetches all members
 *
 * Sends a GET request to `/members/all` endpoint with an Authorization header.
 *
 * @returns {Promise<{ resp: Response | null, body: any | null }>}
 * An object containing the raw fetch Response (`resp`) and the parsed
 * JSON response body (`body`). Returns `{ resp: null, body: null }`
 * if the request fails before a response is received.
 *
 * The response body may include complete member objects
 *
 * @example
 * const { resp, body } = await getMembers();
 *
 * if (resp?.ok) {
 *   console.log("Members: ", body);
 * }
 */
export async function getMembers() {
    const resp = await httpGet(`${apiUrl}/members/all`);
    if (!resp) return { resp: null, body: null };
    const body = await resp.json();
    return { resp, body };
}