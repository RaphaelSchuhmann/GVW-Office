import {
    apiAddReport,
    apiCheckReport,
    apiDeleteReport,
    apiGetReport,
    apiUpdateDescription
} from "../api/apiReports.svelte.js";
import { normalizeResponse } from "../api/http.svelte.js";
import { handleGlobalApiError } from "../api/globalErrorHandler.svelte.js";
import { addToast } from "../stores/toasts.svelte.js";
import { viewport } from "../stores/viewport.svelte.js";
import { sanitize } from "./utils.js";

export const reportTypeMap = {
    "Jahresbericht": "annualReport",
    "Protokoll": "protocol",
    "Versammlungsbericht": "gatheringReport",
    "Sonstigerbericht": "other",
    "annualReport": "Jahresbericht",
    "protocol": "Protokoll",
    "gatheringReport": "Versammlungsbericht",
    "other": "Sonstigerbericht"
};

export const reportTypeFilterMap = {
    "": "all",
    "Alle Typen": "all",
    "Jahresbericht": "annualReport",
    "Protokoll": "protocol",
    "Versammlungsbericht": "gatheringReport",
    "Sonstigerbericht": "other",
    "all": "Alle Typen",
    "annualReport": "Jahresbericht",
    "protocol": "Protokoll",
    "gatheringReport": "Versammlungsbericht",
    "other": "Sonstigerbericht"
};

let isFetching = {
    add: false,
    delete: false,
    check: false,
    getReport: false,
    updateDescription: false
};

const pendingChecks = new Map();

/**
 * Checks whether an event with the given ID exists in the system.
 *
 * Responsibilities:
 * - Prevents duplicate API calls by reusing an in-flight request (`pendingChecks`)
 * - Validates input (returns false if no ID is provided)
 * - Performs API request to verify existence
 * - Delegates global API errors to the global handler
 *
 * Behavior:
 * - Returns `false` if:
 *   - No ID is provided
 *   - The API responds with HTTP 404 (event does not exist)
 * - Returns `true` if:
 *   - The event exists (any non-404 successful response)
 *   - A global API error occurs (e.g. UNAUTHORIZED, NETWORK)
 *   - An unexpected exception is thrown
 *
 * Notes:
 * - Concurrent calls share the same promise via `pendingChecks`
 *   to avoid redundant network requests.
 * - Errors default to `true` to avoid blocking dependent flows
 *   (e.g. route guards or navigation logic).
 *
 * @async
 * @function reportExists
 * @param {string} id - ID of the event to check
 * @returns {Promise<boolean>} Whether the event exists or should be treated as existing
 */
export async function reportExists(id) {
    if (!id) return false;

    if (pendingChecks.has(id)) return await pendingChecks.get(id);

    isFetching.check = true;

    const request = (async () => {
        try {
            const { resp } = await apiCheckReport(id);
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

export async function getReport(id) {
    if (!id) return null;
    isFetching.getReport = true;

    try {
        const { resp, body } = await apiGetReport(id);
        const normalized = normalizeResponse(resp);

        if (handleGlobalApiError(normalized)) return null;

        if (!normalized.ok) {
            handleError(normalized.errorType, "GET");
            return null;
        }

        return body;
    } finally {
        isFetching.getReport = false;
    }
}

export async function addReport(report) {
    if (isFetching.add) return;
    isFetching.add = true;

    try {
        const { resp } = await apiAddReport(report);
        const normalizedResp = normalizeResponse(resp);

        if (handleGlobalApiError(normalizedResp)) return;

        if (!normalizedResp.ok) {
            if (normalizedResp.errorType === "BADREQUEST") {
                addToast({
                    title: "Ungültige Daten",
                    subTitle: viewport.isMobile ? "" : "Die übergebenen Daten sind ungültig. Bitte überprüfen Sie Ihre Eingaben.",
                    type: "error"
                });
            } else {
                addToast({
                    title: "Fehler beim Erstellen",
                    subTitle: viewport.isMobile ? "" : "Beim Erstellen des Berichts ist ein Fehler aufgetreten. Bitte versuchen Sie es später erneut.",
                    type: "error"
                });
            }
            return;
        }

        addToast({
            title: "Bericht erstellt",
            subTitle: viewport.isMobile ? "" : "Der Bricht wurde erfolgreich erstellt.",
            type: "success"
        });
    } finally {
        isFetching.add = false;
    }
}

export async function deleteReport(reportId) {
    if (isFetching.delete) return;
    isFetching.delete = true;

    try {
        const { resp } = await apiDeleteReport(reportId);
        const normalizedResp = normalizeResponse(resp);

        if (handleGlobalApiError(normalizedResp)) return;

        if (!normalizedResp.ok) {
            handleError(normalizedResp.errorType, "DELETE");
            return;
        }

        addToast({
            title: "Bericht gelöscht",
            subTitle: viewport.isMobile ? "" : "Der Bericht wurde erfolgreich gelöscht.",
            type: "success"
        });
    } finally {
        isFetching.delete = false;
    }
}

/**
 * Maps API error types to user-facing toast messages for report deletion.
 *
 * Supported error types:
 * - NOTFOUND → report does not exist
 * - BADREQUEST → invalid report ID or malformed request
 * - DEFAULT → fallback for unknown errors
 *
 * Adjusts subtitle visibility depending on viewport (mobile vs desktop).
 *
 * @param {string} errorType - Error identifier returned from API
 * @param {string} context - Action performed before the error (DELETE, GET)
 * @returns {void}
 */
function handleError(errorType, context) {
    const errorConfigs = {
        NOTFOUND: {
            title: "Bericht nicht gefunden",
            subTitle: "Der angegebene Bericht konnte nicht gefunden werden. Bitte versuchen Sie es später erneut."
        },
        BADREQUEST: {
            title: "Ungültiger Bericht",
            subTitle: "Der angegebene Bericht ist ungültig. Bitte versuchen Sie es später erneut."
        },
        DELETE_DEFAULT: {
            title: "Fehler beim Löschen",
            subTitle: "Beim Löschen des Berichts ist ein Fehler aufgetreten. Bitte versuchen Sie es später erneut."
        },
        GET_DEFAULT: {
            title: "Fehler beim Laden",
            subTitle: "Beim Laden des Berichts ist ein Fehler aufgetreten. Bitte versuchen Sie es später erneut."
        },
    };

    const config = errorConfigs[errorType] || context === "DELETE" ? errorConfigs.DELETE_DEFAULT : errorConfigs.GET_DEFAULT;

    addToast({
        title: config.title,
        subTitle: viewport.isMobile ? "" : config.subTitle,
        type: "error"
    });
}

/**
 * Wraps matches in <mark> tags
 * @param {string} text - The full text to search in
 * @param {string} term - The word to highlight
 */
export function highlight(text, term) {
    let safeText = sanitize(text);

    if (!term || term.length < 2) return safeText;

    const safeTerm = sanitize(term.trim());

    const escapedTerm = safeTerm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`(${escapedTerm})`, "gi");

    return safeText.replace(regex, "<mark class=\"highlight\">$1</mark>");
}

export async function updateDescription(reportId, rev, description) {
    if (isFetching.updateDescription || !reportId || !rev || !description) return { success: false, rev: null };
    isFetching.updateDescription = true;

    try {
        const { resp, body } = await apiUpdateDescription(reportId, rev, description);
        const normalizedResp = normalizeResponse(resp);

        if (!normalizedResp.ok) {
            // NOTE: SonarQube issues can be ignored as error handling will be
            //       refactored in the next task!
            if (normalizedResp.errorType === "BADREQUEST") {
                addToast({
                    title: "Ungültige Beschreibung",
                    subTitle: "Die angegebene Beschreibung ist ungültig. Bitte versuchen Sie es später erneut.",
                    type: "error"
                });
            } else if (normalizedResp.errorType === "NOTFOUND") {
                addToast({
                    title: "Bericht nicht gefunden",
                    subTitle: "Der angegebene Bericht konnte nicht gefunden werden. Bitte versuchen Sie es später erneut.",
                    type: "error"
                });
            } else {
                addToast({
                    title: "Fehler beim Speichern",
                    subTitle: "Beim Speichern des Berichts ist ein Fehler aufgetreten. Bitte versuchen Sie es später erneut.",
                    type: "error"
                });
            }
        }

        return { success: true, rev: body.rev };
    } finally {
        isFetching.updateDescription = false;
    }
}