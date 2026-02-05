import { clearValue } from "./store";
import { get } from "svelte/store";
import { user } from "../stores/user";
import { auth } from "../stores/auth";

const apiUrl = __API_URL__;

/**
 * Updates user data on the server
 * @param {string} originalEmail - Original email before any changes
 * @returns {Promise<Response>} API response with update result
 */
export async function updateData(originalEmail) {
    const currentUser = get(user);
    const currentAuth = get(auth);

    return await fetch(`${apiUrl}/user/update`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${currentAuth.token}`
        },
        body: JSON.stringify({
            originalEmail: originalEmail,
            email: currentUser.email,
            name: currentUser.name,
            phone: currentUser.phone,
            address: currentUser.address
        })
    });
}

/**
 * Logs out the user by clearing all user data and auth token
 * Resets user and auth stores to initial state
 */
export function logout() {
    user.set({
        name: "",
        email: "",
        role: "",
        loaded: false,
        phone: "",
        address: "",
        lastFetched: 0,
    });

    // remove auth token
    auth.set({ token: "" });
    clearValue("authToken");
}