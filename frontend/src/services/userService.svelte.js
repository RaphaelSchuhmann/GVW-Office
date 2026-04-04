import { viewport } from "../stores/viewport.svelte";
import { addToast } from "../stores/toasts.svelte";
import { push } from "svelte-spa-router";
import { auth } from "../stores/auth.svelte.js";
import { clearValue } from "./store";
import { user } from "../stores/user.svelte";
import { handleGlobalApiError } from "../api/globalErrorHandler.svelte";
import { getUserData, updateUserData } from "../api/apiUser.svelte";
import { normalizeResponse } from "../api/http.svelte";
import { resetPageState } from "./filterService.svelte";

const USER_CACHE_TTL_MS = 2 * 60 * 1000; // 2 minutes

/**
 * Attempts to retrieve the latest user data from the API.
 * 
 * Only calls the API if `user` store is either empty, the `lastFetched`
 * is null or empty, or the last request was 2 minutes ago.
 * 
 * @returns {Promise<{void}>}
 */
export async function ensureUserData() {
    const { lastFetched, email } = user;

    if ((!lastFetched || isStale(lastFetched)) || !email) {
        const { resp, body } = await getUserData();
        const normalizedResponse = normalizeResponse(resp);
        if (handleGlobalApiError(normalizedResponse)) return;
        
        if (!normalizedResponse.ok) {
            if (normalizedResponse.status === 404) {
                addToast({
                    title: "Benutzer nicht gefunden",
                    subTitle: viewport.isMobile ? "" : "Es wurde kein Benutzer unter den angegebenen Daten gefunden.",
                    type: "error"
                });
                logout();
                await push("/?cpwErr=false");
                return;
            }
            return;
        }

        Object.assign(user, { ...body, loaded: true, lastFetched: Date.now() });
    }
}

/**
 * Determines if the last request is 2 minutes or older.
 * 
 * @param {number} lastFetched - the timestamp of the last request
 * @returns {boolean}
 * If `lastFetched` is older than the `USER_CACHE_TTL_MS` it returns true.
 * Else it returns false.
 */
function isStale(lastFetched) {
    if (!lastFetched) return true;
    return Date.now() - lastFetched > USER_CACHE_TTL_MS;
}

/**
  * Attempts to update the user data and its associated member data.
 * 
 * Sends a POST request to `/user/update` endpoint with an Authorization header.
 * The server identifies the user from the authSvelte token.
 * 
 * @param {Object} data - the updated user data.
 * @param {string} data.email - the user's email address
 * @param {string} data.phone - the user's phone number
 * @param {string} data.address - the user's address
 * @returns {Promise<{void}>}
 */
export async function tryUpdateUserData(data) {
    const { resp } = await updateUserData(data);

    const normalizedResponse = normalizeResponse(resp);
    if (handleGlobalApiError(normalizedResponse)) return;

    if (normalizedResponse.errorType === "NOTFOUND") {
        addToast({
            title: "Konto nicht gefunden",
            subTitle: viewport.isMobile ? "" : "Ihr Konto konnte nicht gefunden werden. Bitte melden Sie sich erneut an, um fortzufahren.",
            type: "error"
        });
        logout();
        await push("/?cpwErr=false");
        return;
    }

    Object.assign(user, { email: data.email, phone: data.phone, address: data.address });
    addToast({
        title: "Erfolgreich gespeichert",
        subTitle: viewport.isMobile ? "" : "Ihre persönlichen Daten wurden erfolgreich aktualisiert und sind nun in Ihrem Benutzerkonto gespeichert.",
        type: "success"
    });
}

/**
 * Logs out the current user by clearing all user-related data and authentication state.
 * 
 * - Resets the `user` store to its initial empty state.
 * - Clears teh authSvelte token from the `authSvelte` store.
 * - Removes the persisted authSvelte token from local storage.
 * 
 * This effectively de-authenticates teh user and should be called whenever
 * the user needs to be logged out (e.g., manual logout or session expiration).
 * 
 * @returns {void}
 */
export function logout() {
    Object.assign(user, {
        name: "",
        email: "",
        role: "",
        loaded: false,
        phone: "",
        address: "",
        lastFetched: 0,
    });

    resetPageState();

    Object.assign(auth, { token: "" });
    clearValue("authToken");
}