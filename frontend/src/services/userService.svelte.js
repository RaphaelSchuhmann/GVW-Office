import { viewport } from "../stores/viewport.svelte";
import { addToast } from "../stores/toasts.svelte";
import { push } from "svelte-spa-router";
import { auth } from "../stores/auth.svelte.js";
import { clearValue } from "./store";
import { user } from "../stores/user.svelte";
import { handleGlobalApiError } from "../api/globalErrorHandler.svelte";
import { apiAddUserAD, apiGetUserData } from "../api/apiUser.svelte";
import { normalizeResponse } from "../api/http.svelte";
import { resetPageState } from "./filterService.svelte";
import { teardownEventSource } from "./sse-handler.js";

const USER_CACHE_TTL_MS = 2 * 60 * 1000; // 2 minutes

export const roleMap = {
    "Admin": "admin",
    "Mitglied": "member",
    "Vorstand": "board_member",
    "Schriftführer": "secretary",
    "Chorleitung": "conductor",
    "Notenwart": "librarian",
    "admin": "Admin",
    "secretary": "Schriftführer",
    "board_member": "Vorstand",
    "member": "Mitglied",
    "conductor": "Chorleitung",
    "librarian": "Notenwart"
};

export const filterRoleMap = {
    "Alle Rollen": "all",
    "Admin": "admin",
    "Mitglied": "member",
    "Vorstand": "board_member",
    "Schriftführer": "secretary",
    "Chorleitung": "conductor",
    "Notenwart": "librarian",
    "all": "Alle Rollen",
    "admin": "Admin",
    "secretary": "Schriftführer",
    "board_member": "Vorstand",
    "member": "Mitglied",
    "conductor": "Chorleitung",
    "librarian": "Notenwart"
};

let isFetching = {
    add: false,
};

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
        const { resp, body } = await apiGetUserData();
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
 * Logs out the current user by clearing all user-related data and authentication state.
 * 
 * - Resets the `user` store to its initial empty state.
 * - Resets the filterService page state.
 * - Does a teardown of the EventSource.
 * - Clears the authSvelte token from the `authSvelte` store.
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
    teardownEventSource();

    Object.assign(auth, { token: "" });
    clearValue("authToken");
}

export async function addUser(user) {
    if (isFetching.add || !user) return;
    isFetching.add = true;

    try {
        const { resp } = await apiAddUserAD(user);
        const normalizedResponse = normalizeResponse(resp);

        if (handleGlobalApiError(normalizedResponse)) return;

        if (!normalizedResponse.ok) {
            if (normalizedResponse.errorType === "CONFLICT") {
                addToast({
                    title: "E-Mail-Adresse bereits verwendet",
                    subTitle: viewport.isMobile ? "" : "Die E-Mail-Adresse ist bereits einem anderen Mitglied oder Benutzer zugeordnet.",
                    type: "error"
                });
            } else {
                addToast({
                    title: "Fehler beim Hinzufügen", 
                    subTitle: viewport.isMobile ? "" : "Beim Hinzufügen des neuen Mitglieds ist ein Fehler aufgetreten.",
                    type: "error"
                });
            }
            return;
        }

        addToast({
            title: "Benutzer hinzugefügt",
            subTitle: viewport.isMobile ? "" : "Der neue Benutzer wurde erfolgreich im System hinzugefügt.",
            type: "success"
        });
    } finally {
        isFetching.add = false;
    }
}