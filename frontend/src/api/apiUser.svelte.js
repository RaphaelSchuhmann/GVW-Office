import { httpGet, httpPost, parseBodySafe } from "./http.svelte";

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
export async function apiGetUserData() {
    const resp = await httpGet(`${apiUrl}/user/data`);
    if (!resp) return { resp: null, body: null };
    const body = await parseBodySafe(resp);
    return { resp, body };
}

/**
 * Fetches all users for admin dashboard
 *
 * Sends a GET request to `/user/admin/users` endpoint with an Authorization header.
 *
 * @returns {Promise<{ resp: Response | null, body: any | null }>}
 * An object containing the raw fetch Response (`resp`) and the parsed
 * JSON response body (`body`). Returns `{ resp: null, body: null }`
 * if the request fails before a response is received.
 *
 * The response body may include complete admin dashboard user objects
 *
 * @example
 * const { resp, body } = await apiGetUsersAD();
 *
 * if (resp?.ok) {
 *   console.log("Users: ", body);
 * }
 */
export async function apiGetUsersAD() {
    const resp = await httpGet(`${apiUrl}/user/admin/users`);
    if (!resp) return { resp: null, body: null };
    const body = await parseBodySafe(resp);
    return { resp, body };
}

/**
 * Adds a user
 *
 * Sends a POST request to `/user/admin/addUser` endpoint with an Authorization header.
 *
 * @param {Object} user - The user to add
 * @returns {Promise<{ resp: Response | null, body: any | null }>}
 * An object containing the raw fetch Response (`resp`) and the parsed
 * JSON response body (`body`). Returns `{ resp: null, body: null }`
 * if the request fails before a response is received.
 *
 * @example
 * const { resp } = await apiAddUserAD({
 *     name: "Max Mustermann",
 *     email: "mail@test.com",
 *     phone: "01234",
 *     address: "Hauptstr. 1, 12345 Musterstadt",
 *     role: "member",
 * });
 *
 * if (resp?.ok) {
 *   console.log("User added");
 * }
 */
export async function apiAddUserAD(user) {
    const resp = await httpPost(`${apiUrl}/user/admin/addUser`, {
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address,
        role: user.role
    });
    if (!resp) return { resp: null, body: null };
    const body = await parseBodySafe(resp);
    return { resp, body };
}