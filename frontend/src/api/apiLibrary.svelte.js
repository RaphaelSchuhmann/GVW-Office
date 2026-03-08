import { httpGet, httpPost, parseBodySafe } from "./http.svelte";

const apiUrl = __API_URL__;

/**
 * Fetches all scores
 *
 * Sends a GET request to `/library/all` endpoint with an Authorization header.
 *
 * @returns {Promise<{ resp: Response | null, body: any | null }>}
 * An object containing the raw fetch Response (`resp`) and the parsed
 * JSON response body (`body`). Returns `{ resp: null, body: null }`
 * if the request fails before a response is received.
 *
 * The response body may include complete score objects
 *
 * @example
 * const { resp, body } = await getScores();
 *
 * if (resp?.ok) {
 *   console.log("Scores: ", body);
 * }
 */
export async function apiGetScores() {
    const resp = await httpGet(`${apiUrl}/library/all`);
    if (!resp) return { resp: null, body: null };
    const body = await parseBodySafe(resp);
    return { resp, body };
}

/**
 * Deletes a score with the given ID
 *
 * Sends a POST request to `/library/delete` endpoint with an Authorization header
 * and a JSON body containing the score ID.
 *
 * @param {string} id - The ID of the score to delete
 * @returns {Promise<{ resp: Response | null, body: any | null }>}
 * An object containing the raw fetch Response (`resp`) and the parsed
 * JSON response body (`body`). Returns `{ resp: null, body: null }`
 * if the request fails before a response is received.
 *
 * The response body will be empty on success.
 *
 * @example
 * const { resp, body } = await deleteScore("1234567890");
 *
 * if (resp?.ok) {
 *   console.log("Deleted score with ID 1234567890");
 * }
 */
export async function apiDeleteScore(id) {
    const resp = await httpPost(`${apiUrl}/library/delete`, { id });
    if (!resp) return { resp: null, body: null };
    const body = await parseBodySafe(resp);
    return { resp, body };
}