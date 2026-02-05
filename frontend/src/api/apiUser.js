import { httpGet, httpPost } from "./http";

const apiUrl = __API_URL__;

/**
 * Attempts to get the user data using the user's email address
 * 
 * Sends a POST request to `/user/data` endpoint with an Authorization header.
 * 
 * @returns {Promise<{ resp: Response | null, body: any | null }>}
 * An object containing the raw fetch Response (`resp`) and the parsed
 * JSON response body (`body`). Returns `{ resp: null, body: null }`
 * if the request fails before a response is received.
 * 
 * The response body may include user-related data such as
 * email, role, name, address, and phone
 *  
 * @example
 * const { resp, body } = await getUserData("email@email.com");
 * 
 * if (resp?.ok) {
 *   console.log("User data: ", body);
 * }
 */
export async function getUserData() {
    const resp = await httpGet(`${apiUrl}/user/data`);
    if (!resp) return { resp: null, body: null };
    const body = await resp.json();
    return { resp, body };
}

