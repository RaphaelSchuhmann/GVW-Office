import { apiAddReport, apiDeleteReport } from "../api/apiReports.svelte.js";
import { normalizeResponse } from "../api/http.svelte.js";
import { handleGlobalApiError } from "../api/globalErrorHandler.svelte.js";
import { addToast } from "../stores/toasts.svelte.js";
import { viewport } from "../stores/viewport.svelte.js";

export const reportTypeMap = {
    "Jahresbericht": "annualReport",
    "Protokoll": "protocol",
    "Versammlungsbericht": "gatheringReport",
    "Sonstigerbericht": "other",
    "annualReport": "Jahresbericht",
    "protocol": "Protokoll",
    "gatheringReport": "Versammlungsbericht",
    "other": "Sonstigerbericht"
}

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
}

let isFetching = {
    add: false,
    delete: false,
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
            handleDeleteError(normalizedResp.errorType);
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
 * @returns {void}
 */
function handleDeleteError(errorType) {
    const errorConfigs = {
        NOTFOUND: {
            title: "Bericht nicht gefunden",
            subTitle: "Der angegebene Bericht konnte nicht gefunden werden. Bitte versuchen Sie es später erneut."
        },
        BADREQUEST: {
            title: "Ungültiger Bericht",
            subTitle: "Der angegebene Bericht ist ungültig. Bitte versuchen Sie es später erneut."
        },
        DEFAULT: {
            title: "Fehler beim Löschen",
            subTitle: "Beim Löschen des Berichts ist ein Fehler aufgetreten. Bitte versuchen Sie es später erneut."
        }
    };

    const config = errorConfigs[errorType] || errorConfigs.DEFAULT;

    addToast({
        title: config.title,
        subTitle: viewport.isMobile ? "" : config.subTitle,
        type: "error"
    });
}