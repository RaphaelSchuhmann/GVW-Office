import { viewport } from "../stores/viewport.svelte";
import { addToast } from "../stores/toasts.svelte";
import { push } from "svelte-spa-router";
import { auth } from "../stores/auth.svelte.js";
import { clearValue } from "./store";
import { user } from "../stores/user.svelte";
import { handleGlobalApiError } from "../api/globalErrorHandler.svelte";
import {
    apiAddUserAD,
    apiCheckUserAD,
    apiDeleteUserAD,
    apiGetUserData,
    apiResetUserPasswordAD,
    apiUpdateUserAD
} from "../api/apiUser.svelte";
import { normalizeResponse } from "../api/http.svelte";
import { resetPageState } from "./filterService.svelte";
import { teardownEventSource } from "./sse-handler.js";
import { userManagerStore } from "../stores/userManager.svelte.js";

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
    delete: false,
    update: false,
    check: false,
    resetPw: false
};

/**
 * Attempts to retrieve the latest user data from the API.
 *
 * Responsibilities:
 * - Fetches user data if it is missing or stale
 * - Updates the user store with fresh data
 * - Handles API errors and logout scenarios
 *
 * Behavior:
 * - Only calls the API if:
 *   - user data is missing, OR
 *   - lastFetched is stale, OR
 *   - email is missing
 * - Logs out and redirects if user is not found (404)
 *
 * @function ensureUserData
 * @returns {Promise<void>}
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
 * Determines whether cached user data is stale based on a time threshold.
 *
 * Responsibilities:
 * - Compares the last fetch timestamp against the configured TTL
 *
 * Behavior:
 * - Returns true if lastFetched is missing or older than USER_CACHE_TTL_MS
 * - Returns false otherwise
 *
 * @function isStale
 * @param {number} lastFetched - Timestamp of the last successful fetch
 * @returns {boolean} True if data is stale, otherwise false
 */
function isStale(lastFetched) {
    if (!lastFetched) return true;
    return Date.now() - lastFetched > USER_CACHE_TTL_MS;
}

/**
 * Logs out the current user by clearing all user-related data and authentication state.
 *
 * Responsibilities:
 * - Resets the user store to its initial empty state
 * - Resets the filter service page state
 * - Tears down active EventSource connections
 * - Clears the authentication token from the auth store
 * - Removes the persisted auth token from local storage
 *
 * Behavior:
 * - Fully de-authenticates the user
 * - Should be called on manual logout or session expiration
 *
 * @function logout
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
        lastFetched: 0
    });

    resetPageState();
    teardownEventSource();

    Object.assign(auth, { token: "" });
    clearValue("authToken");
}

const pendingChecks = new Map();

/**
 * Checks whether a user exists by ID.
 *
 * Responsibilities:
 * - Prevents duplicate concurrent checks using a request cache
 * - Calls the backend API to verify existence
 *
 * Behavior:
 * - Returns false if user is not found (404)
 * - Returns true for valid users or in case of API/global errors
 * - Returns false if ID is falsy
 *
 * @function userExists
 * @param {string|number} id - User ID to check
 * @returns {Promise<boolean>} True if user exists, otherwise false
 */
export async function userExists(id) {
    if (!id) return false;

    if (pendingChecks.has(id)) return await pendingChecks.get(id);

    isFetching.check = true;

    const request = (async () => {
        try {
            const { resp } = await apiCheckUserAD(id);
            const normalized = normalizeResponse(resp);

            if (normalized.status === 404) return false;

            if (handleGlobalApiError(normalized)) return true;

            return true;
        } catch (e) {
            return true;
        } finally {
            pendingChecks.delete(id);
            if (pendingChecks.size === 0) {
                isFetching.check = false;
            }
        }
    })();

    pendingChecks.set(id, request);
    return await request;
}

/**
 * Adds a new user to the system.
 *
 * Responsibilities:
 * - Prevents duplicate submissions
 * - Sends user data to the backend API
 * - Handles API errors and displays feedback to the user
 *
 * Behavior:
 * - Returns early if request is already in progress or user is missing
 * - Displays success or error toast depending on outcome
 *
 * @function addUser
 * @param {Object} user - User data payload
 * @returns {Promise<void>}
 */
export async function addUser(user) {
    if (isFetching.add || !user) return;
    isFetching.add = true;

    try {
        const { resp } = await apiAddUserAD(user);
        const normalizedResponse = normalizeResponse(resp); // NOSONAR

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

/**
 * Deletes a user by ID.
 *
 * Responsibilities:
 * - Prevents duplicate delete operations
 * - Calls the delete user API endpoint
 * - Handles API errors and displays feedback to the user
 *
 * Behavior:
 * - Returns early if request is in progress or ID is invalid
 * - Displays success or error toast depending on outcome
 *
 * @function deleteUser
 * @param {string|number} id - ID of the user to delete
 * @returns {Promise<void>}
 */
export async function deleteUser(id) {
    if (isFetching.delete || !id) return;
    isFetching.delete = true;

    try {
        const { resp } = await apiDeleteUserAD(id);
        const normalizedResponse = normalizeResponse(resp);

        if (handleGlobalApiError(normalizedResponse)) return;

        if (!normalizedResponse.ok) {
            handleApiErrors(normalizedResponse.errorType, "delete");
            return;
        }

        addToast({
            title: "Benutzer gelöscht",
            subTitle: viewport.isMobile ? "" : "Der Benutzer wurde erfolgreich gelöscht.",
            type: "success"
        });
    } finally {
        isFetching.delete = false;
    }
}

/**
 * Updates an existing user.
 *
 * Responsibilities:
 * - Prevents duplicate update operations
 * - Sends updated data to the backend API
 * - Updates the local userManager store on success
 *
 * Behavior:
 * - Returns early if request is already in progress
 * - Displays success or error toast depending on outcome
 *
 * @function updateUser
 * @param {Object} data - Updated user data
 * @returns {Promise<void>}
 */
export async function updateUser(data) {
    if (isFetching.update) return;
    isFetching.update = true;

    try {
        const { resp, body } = await apiUpdateUserAD(data);
        const normalizedResponse = normalizeResponse(resp);

        if (handleGlobalApiError(normalizedResponse)) return;

        if (!normalizedResponse.ok) {
            handleApiErrors(normalizedResponse.errorType, "update");
            return;
        }

        const index = userManagerStore.raw.findIndex(e => e.id === data.id);
        if (index !== -1) {
            userManagerStore.raw[index] = {
                ...userManagerStore.raw[index],
                ...data,
                rev: body.rev
            };
        }

        addToast({
            title: "Benutzer aktualisiert",
            subTitle: viewport.isMobile ? "" : "Der Benutzer wurde erfolgreich aktualisiert.",
            type: "success"
        });
    } finally {
        isFetching.update = false;
    }
}

/**
 * Resets a user's password to a temporary value.
 *
 * Responsibilities:
 * - Prevents duplicate reset operations
 * - Calls the password reset API endpoint
 * - Handles API errors and displays feedback to the user
 *
 * Behavior:
 * - Returns early if request is in progress or ID is invalid
 * - Displays success or error toast depending on outcome
 *
 * @function resetPassword
 * @param {string|number} id - ID of the user
 * @returns {Promise<void>}
 */
export async function resetPassword(id) {
    if (isFetching.resetPw || !id) return;
    isFetching.resetPw = true;

    try {
        const { resp } = await apiResetUserPasswordAD(id);
        const normalizedResponse = normalizeResponse(resp);

        if (handleGlobalApiError(normalizedResponse)) return;

        if (!normalizedResponse.ok) {
            handleApiErrors(normalizedResponse.errorType, "resetPw");
            return;
        }

        addToast({
            title: "Passwort zurückgesetzt",
            subTitle: viewport.isMobile ? "" : "Das Passwort wurde erfolgreich auf ein temporäres Passwort zurückgesetzt.",
            type: "success"
        });
    } finally {
        isFetching.resetPw = false;
    }
}

/**
 * Handles API errors for user management operations and displays toast messages.
 *
 * Responsibilities:
 * - Maps API error types to user-friendly messages
 * - Selects context-specific default messages
 * - Displays localized toast notifications
 *
 * Behavior:
 * - Falls back to context-based defaults if error type is unknown
 * - Adjusts message detail depending on viewport (mobile vs desktop)
 *
 * @function handleApiErrors
 * @param {string} errorType - API error type (e.g. NOTFOUND, BADREQUEST)
 * @param {string} context - Operation context ("delete", "update", "resetPw")
 */
function handleApiErrors(errorType, context) {
    const errors = {
        NOTFOUND: {
            title: "Benutzer nicht gefunden",
            subTitle: "Der angegebene Benutzer konnte nicht gefunden werden. Bitte versuchen Sie es später erneut."
        },
        BADREQUEST: {
            title: "Ungültiger Benutzer",
            subTitle: "Der angegebene Benutzer ist ungültig. Bitte versuchen Sie es später erneut."
        },
        DEFAULT_DELETE: {
            title: "Fehler beim Löschen",
            subTitle: "Beim Löschen des Benutzers ist ein Fehler aufgetreten. Bitte versuchen Sie es später erneut."
        },
        DEFAULT_UPDATE: {
            title: "Fehler beim Aktualisieren",
            subTitle: "Beim Aktualisieren des Benutzers ist ein Fehler aufgetreten. Bitte versuchen Sie es später erneut."
        },
        DEFAULT_RESET_PASSWORD: {
            title: "Fehler beim Passwort zurücksetzen",
            subTitle: "Beim Zurücksetzen des Passworts ist ein Fehler aufgetreten. Bitte versuchen Sie es später erneut.",
        }
    };

    const defaults = {
        delete: errors.DEFAULT_DELETE,
        update: errors.DEFAULT_UPDATE,
        resetPw: errors.DEFAULT_RESET_PASSWORD
    };

    const toastData = errors[errorType] ?? defaults[context] ?? errors.DEFAULT_UPDATE;

    addToast({
        title: toastData.title,
        subTitle: viewport.isMobile ? "" : toastData.subTitle,
        type: "error"
    });
}