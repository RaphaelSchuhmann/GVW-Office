const apiUrl = __API_URL__;

/**
 * Changes user's password
 * @param {string} oldPw - Current password
 * @param {string} newPw - New password
 * @param {string} email - User's email address
 * @returns {Promise<Response>} API response confirming password change
 */
export async function changePw(oldPw, newPw, email) {
    return await fetch(`${apiUrl}/auth/changePw`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ email, oldPw, newPw })
    });
}

/**
 * Validates authentication token with server
 * @param {string} token - JWT authentication token
 * @returns {Promise<Response>} API response with token validation result
 */
export async function authenticate(token) {
    return await fetch(`${apiUrl}/auth/auto`, {
        method: "GET",
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
}