import { apiAddChangelog, apiDeleteChangelog, apiGetChangelogs } from "../api/apiChangelogs.svelte.js";
import { normalizeResponse } from "../api/http.svelte.js";
import { handleGlobalApiError } from "../api/globalErrorHandler.svelte.js";
import { addToast } from "../stores/toasts.svelte.js";
import { viewport } from "../stores/viewport.svelte.js";
import { changelogsStore } from "../stores/changelogs.svelte.js";

let isFetching = {
    get: false,
    add: false,
    delete: false,
};

/**
 * Fetches all changelogs from the backend and stores them in `changelogsStore`.
 *
 * Responsibilities:
 * - Prevents concurrent fetch requests
 * - Calls the changelogs API endpoint
 * - Normalizes and validates the response
 * - Handles global API errors
 * - Displays user feedback via toast notifications
 * - Updates the changelog store on success
 *
 * Behavior:
 * - Returns early if a fetch is already in progress
 * - Shows an error toast if the request fails
 * - Shows a warning toast if the response structure is invalid
 * - Updates `changelogsStore.data` when successful
 *
 * @async
 * @function getChangelogs
 * @returns {Promise<void>}
 */
export async function getChangelogs() {
    if (isFetching.get) return;
    isFetching.get = true;

    try {
        const { resp, body } = await apiGetChangelogs();
        const normalizedResponse = normalizeResponse(resp);

        if (handleGlobalApiError(normalizedResponse)) return;

        if (!normalizedResponse.ok) {
            addToast({
                title: "Fehler beim laden der Changelogs",
                subTitle: viewport.isMobile ? "" : "Während dem Laden der Changelogs ist ein unerwarteter Fehler aufgetreten",
                type: "error",
            });
            return;
        }

        if (!Array.isArray(body?.changelogs)) {
            addToast({
                title: "Fehler beim laden  der Changelogs",
                subTitle: viewport.isMobile ? "" : "Die Changelog Daten sind unvollständig zurückgekommen.",
                type: "warning"
            });
            return;
        }

        changelogsStore.data = body.changelogs;
    } finally {
        isFetching.get = false;
    }
}

/**
 * Sends a new changelog entry to the backend.
 *
 * Responsibilities:
 * - Prevents concurrent add requests
 * - Adds a timestamp to the changelog before sending
 * - Calls the API to persist the changelog
 * - Handles global and local API errors
 * - Displays success or error feedback via toast notifications
 *
 * Behavior:
 * - Returns early if another add request is in progress
 * - Adds `timestamp` as ISO string before sending
 * - Shows validation error toast for BADREQUEST responses
 * - Shows generic error toast for other failures
 * - Shows success toast when the changelog is added successfully
 *
 * @async
 * @function addChangelog
 * @param {Object} changelog - Changelog data to be created
 * @returns {Promise<void>}
 */
export async function addChangelog(changelog) {
    if (isFetching.add) return;
    isFetching.add = true;

    try {
        changelog.timestamp = new Date().toISOString();

        const { resp } = await apiAddChangelog(changelog);
        const normalizedResponse = normalizeResponse(resp);

        if (handleGlobalApiError(normalizedResponse)) return;

        if (!normalizedResponse.ok) {
            if (normalizedResponse.errorType === "BADREQUEST") {
                addToast({
                    title: "Ungülite Eingabe",
                    subTitle: viewport.isMobile ? "" : "Bitte überprüfen Sie Ihre Eingaben. Einige Felder sind leer oder enthalten ungültige Werte.",
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
            title: "Changelog hinzugefügt",
            subTitle: viewport.isMobile ? "" : "Der neue Changelog wurde erfolgreich im System hinzugefügt.",
            type: "success"
        });
    } finally {
        isFetching.add = false;
    }
}

/**
 * Deletes a changelog entry by its ID.
 *
 * Responsibilities:
 * - Prevents concurrent delete requests
 * - Calls the API to delete the changelog
 * - Handles global API errors
 * - Delegates error-specific handling
 * - Displays success feedback via toast notifications
 *
 * Behavior:
 * - Returns early if a delete request is already in progress
 * - Calls `handleDeleteError` for non-OK responses
 * - Shows success toast when deletion succeeds
 *
 * @async
 * @function deleteChangelog
 * @param {string|number} changelogId - ID of the changelog to delete
 * @returns {Promise<void>}
 */
export async function deleteChangelog(changelogId) {
    if (isFetching.delete) return;
    isFetching.delete = true;

    try {
        const { resp } = await apiDeleteChangelog(changelogId);
        const normalizedResponse = normalizeResponse(resp);

        if (handleGlobalApiError(normalizedResponse)) return;

        if (!normalizedResponse.ok) {
            handleDeleteError(normalizedResponse.errorType);
            return;
        }

        addToast({
            title: "Changelog gelöscht",
            subTitle: viewport.isMobile ? "" : "Die Changelog wurde erfolgreich gelöscht.",
            type: "success"
        });
    } finally {
        isFetching.delete = false;
    }
}

/**
 * Handles error responses for changelog deletion.
 *
 * Responsibilities:
 * - Maps API error types to user-friendly messages
 * - Falls back to a default error configuration
 * - Displays an error toast
 *
 * Behavior:
 * - Uses predefined configurations for:
 *   - NOTFOUND
 *   - BADREQUEST
 *   - DEFAULT (fallback)
 *
 * @function handleDeleteError
 * @param {string} errorType - Error type returned from the API
 * @returns {void}
 */
function handleDeleteError(errorType) {
    const errorConfigs = {
        NOTFOUND: {
            title: "Changelog nicht gefunden",
            subTitle: "Der angegebene Changelog konnte nicht gefunden werden. Bitte versuchen Sie es später erneut."
        },
        BADREQUEST: {
            title: "Ungültiger Changelog",
            subTitle: "Der angegebene Changelog ist ungültig. Bitte versuchen Sie es später erneut."
        },
        DEFAULT: {
            title: "Fehler beim Löschen",
            subTitle: "Beim Löschen des Changelog ist ein Fehler aufgetreten. Bitte versuchen Sie es später erneut."
        }
    };

    const config = errorConfigs[errorType] || errorConfigs.DEFAULT;

    addToast({
        title: config.title,
        subTitle: viewport.isMobile ? "" : config.subTitle,
        type: "error"
    });
}

/**
 * Formats raw changelog text into HTML.
 *
 * Responsibilities:
 * - Splits text into lines
 * - Converts lines starting with "-" into list items
 * - Converts lines ending with ":" into section headers
 *
 * Behavior:
 * - Returns an empty string if input is falsy
 * - Ignores lines that do not match any formatting rule
 *
 * @function formatChangelog
 * @param {string} rawText - Raw changelog text (newline-separated)
 * @returns {string} HTML-formatted changelog string
 */
export function formatChangelog(rawText) {
    if (!rawText) return "";

    return rawText
        .split("\n")
        .map(line => {
            if (line.trim().startsWith("-")) {
                return `<li class="ml-4 list-disc">${line.trim().substring(1).trim()}</li>`;
            }

            if (line.trim().endsWith(":")) {
                return `<p class="font-bold mt-2">${line}</p>`
            }

            return line;
        })
        .join("");
}