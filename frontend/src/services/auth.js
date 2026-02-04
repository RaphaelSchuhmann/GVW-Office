const apiUrl = __API_URL__;

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