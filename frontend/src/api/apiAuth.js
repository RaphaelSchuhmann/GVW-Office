import { httpGet, httpPost } from "./http";

const apiUrl = __API_URL__;

/**
 * Attempts to authenticate a user with the given email and password.
 * 
 * Sends a POST request to the /auth/login endpoint without an Authorization header.
 * 
 * @param {string} email - The user's email address used for login
 * @param {string} password - The user's password.
 * @returns {Promise<{ resp: Response, body: any }>} 
 *           An object containing the raw fetch Response (`resp`) and the parsed JSON body (`body`).
 *          `body` typically includes `authToken`, `email`, `changePassword`, and `firstLogin` flags.
 * 
 * @example
 * const { resp, body } = await login("user@example.com", "password123");
 * if (resp.ok) {
 *   console.log(body.authToken)
 * }
 */
export async function login(email, password) {
    const resp = await httpPost(`${apiUrl}/auth/login`, { email: email, password: password }, false);
    const body = await resp.json();
    return { resp, body };
}

/**
 * Attempts to change the usere's password with the given data.
 * 
 * Sends a POST request to the /auth/changePw endpoint without an Authorization header.
 * 
 * @param {Object} data - The user's new password, old password, and email
 * @returns {Promise<{ resp: Response, body: any }>} 
 *           An object containing the raw fetch Response (`resp`) and the parsed JSON body (`body`).
 *          `body` typically includes `ok` flag which can be discarded.
 * 
 * @example
 * const { resp } = await changePw({email: "user@example.com", oldPw: "password123" newPw: "NewPassword"});
 * if (resp.ok) {
 *   console.log("Password changed")
 * }
 */
export async function changePw(data) {
    const resp = await httpPost(`${apiUrl}/auth/changePw`, data, false);
    const body = await resp.json();
    return { resp, body };
}

/**
 * Attempts to automatically a authenticate the user using a token.
 * 
 * Sends a GET request to the /auth/auto endpoint with an Authorization header.
 * 
 * @param {string} token - the from localstorage loaded auth token
 * @returns {Promise<{ resp: Response, body: any }>} 
 *           An object containing the raw fetch Response (`resp`) and the parsed JSON body (`body`).
 *          `body` typically includes `ok` flag which can be discarded.
 * 
 * @example
 * const { resp, body } = await authenticate("token123");
 * if (resp.ok) {
 *   console.log("Authenticated");
 * }
 */
export async function authenticate(token) {
    const resp = await httpGet(`${apiUrl}/auth/auto`, token);
    const body = await resp.json();
    return { resp, body };
}