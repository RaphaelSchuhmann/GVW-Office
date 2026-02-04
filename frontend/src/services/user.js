import { clearValue } from "./store";
import { get } from "svelte/store";
import { push } from "svelte-spa-router";
import { user } from "../stores/user";
import { auth } from "../stores/auth";
import { addToast } from "../stores/toasts";
import { authenticateUser } from "./loginService";

const apiUrl = __API_URL__;

/**
 * Fetches user data from the server
 * @param {string} email - User's email address
 * @param {string} token - Authentication token
 * @returns {Promise<Response>} API response with user data
 */
export async function getData(email, token) {
    return await fetch(`${apiUrl}/user/data`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ email })
    });
}

/**
 * Loads and updates user data in the store from the server
 * Handles authentication errors and redirects if necessary
 * @returns {Promise<void>} Updates user store or shows error toast
 */
export async function loadUserData() {
    const authStore = get(auth);
    let email = "";

    try {
        const { resp, body } = await authenticateUser(authStore.token);

        if (resp && body && resp.status === 200) {
            email = body.email;
        } else {
            logout();
            await push("/?cpwErr=false");
            return;
        }
    } catch (error) {
        logout();
        await push("/?cpwErr=false");
        return;
    }


    // Get user data
    const response = await getData(email, authStore.token);
    const body = await response.json();

    if (response.status === 200) {
        user.update(u => ({ ...u, name: body.name, email: body.email, role: body.role, address: body.address, phone: body.phone, loaded: true }));
    } else if (response.status === 401) {
        // Auth token invalid / unauthorized
        addToast({
            title: "Ungültiges Token",
            subTitle: "Ihr Authentifizierungstoken ist ungültig oder abgelaufen. Bitte melden Sie sich erneut an, um Zugriff zu erhalten.",
            type: "error"
        });
        logout();
        await push("/?cpwErr=false");
    } else if (response.status === 404) {
        // user not found route back to log in
        addToast({
            title: "Konto nicht gefunden",
            subTitle: "Ihr Konto konnte nicht gefunden werden. Bitte melden Sie sich erneut an, um fortzufahren.",
            type: "error"
        });
        logout();
        await push("/?cpwErr=false");
    } else {
        // internal server error / unknown error
        addToast({
            title: "Interner Serverfehler",
            subTitle: "Beim Verarbeiten Ihrer Anfrage ist ein Fehler aufgetreten. Bitte versuchen Sie es erneut.",
            type: "error"
        });
    }
}

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
        address: ""
    });

    // remove auth token
    auth.set({ token: "" });
    clearValue("authToken");
}