import { login } from "../api/apiAuth";

/**
 * Attempts to authenticate a user with the given email and password.
 * 
 * @param {string} email - The user's email address used for login
 * @param {string} password - The user's password.
 * @returns {Promise<{ resp: Response, body: any }>} 
 *           An object containing the raw fetch Response (`resp`) and the parsed JSON body (`body`).
 *          `body` typically includes `authToken`, `email`, `changePassword`, and `firstLogin` flags.
 * 
 * @example
 * const { resp, body } = await loginUser("user@example.com", "password123");
 * if (resp.ok) {
 *   console.log(body.authToken)
 * }
 */
export async function loginUser(email, password) {
    const { resp, body } = await login(email, password);
    return { resp, body };
}