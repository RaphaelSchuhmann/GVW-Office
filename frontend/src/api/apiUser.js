import { httpGet, httpPost } from "./http";

// @ts-ignore
const apiUrl = __API_URL__;

/**
 * Fetches the authenticated user's data
 * 
 * Sends a GET request to `/user/data` endpoint with an Authorization header.
 * The server identifies the user from the auth token.
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
 * const { resp, body } = await getUserData();
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

/**
 * Attempts to update the user data and its associated member data.
 * 
 * Sends a POST request to `/user/update` endpoint with an Authorization header.
 * The server identifies the user from the auth token.
 * 
 * @param {Object} data - the updated user data.
 * @param {string} data.email - the user's email address
 * @param {string} data.phone - the user's phone number
 * @param {string} data.address - the user's address
 * @returns {Promise<{ resp: Response | null, body: any | null }>}
 * An object containing the raw fetch Response (`resp`) and the parsed
 * JSON response body (`body`). Returns `{ resp: null, body: null }`
 * if the request fails before a response is received.
 * 
 * The response body may include an ok flag which can be discarded.
 * 
 * @example
 * const { resp } = await updateUserData();
 * 
 * if (resp?.ok) {
 *   console.log("Data updated");
 * }
 */
export async function updateUserData(data) {
    const resp = await httpPost(`${apiUrl}/user/update`, data);
    if (!resp) return { resp: null, body: null };
    const body = await resp.json();
    return { resp, body };
}