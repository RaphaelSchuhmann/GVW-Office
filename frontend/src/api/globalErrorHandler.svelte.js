import { addToast, toasts } from "../stores/toasts.svelte";
import { viewport } from "../stores/viewport.svelte";
import { logout } from "../services/userService.svelte.js";
import { push } from "svelte-spa-router";

export const DOMAINS = {
    "10": { default: "Authentifizierung" },
    "20": { default: "Systemeinstellungen" },
    "30": { default: "Benutzer" },
    "40": { default: "Dashboarddaten" },
    "50": { default: "Mitglied" },
    "60": { default: "Veranstaltung" },
    "70": { default: "Bericht" },
    "80": { default: "Noteneintrag" },
    "90": { default: "Feedback" },
    "11": { default: "Fehlerbericht" },
    "12": { default: "Changelog" },
    "13": { default: "Datei" },
    "14": {
        default: "Dokument",
        "99": "Dokumentinhalt"
    }
};

export const ACTIONS = {
    "01": "Laden",
    "02": "Abrufen",
    "03": "Hinzufügen",
    "04": "Speichern",
    "05": "Löschen",
    "06": "Synchronisierung",
    "07": "Login",
    "99": "Verarbeitung"
};

const STATUS_TEMPLATES = {
    "400": {
        title: "{action} fehlgeschlagen",
        subTitle: "{domain} - Fehlerhafte oder unvollständige Daten."
    },
    "404": {
        title: "{domain} nicht gefunden",
        subTitle: "Die gesuchte Ressource existiert nicht oder wurde gelöscht."
    },
    "409": {
        title: "Datenkonflikt",
        subTitle: "{domain} - Die Daten sind nicht aktuell oder bereits vergeben."
    }
};

/**
 * Handles global API errors that should be treated uniformly across the application.
 *
 * This function checks the normalized API response and:
 * - Displays a toast message for known global error types
 * - Signals whether the error was handled
 *
 * Important:
 * - Returns `true` → error was handled, caller should STOP further processing
 * - Returns `false` → no global error, caller may continue handling the response
 *
 * Handled error types:
 * - UNAUTHORIZED → invalid or expired authentication token
 * - SERVER → internal backend error
 * - NETWORK → connection failure / unreachable server
 *
 * @param {Object} result - Normalized API response
 * @param {boolean} result.ok - Indicates if the request was successful
 * @param {string} [result.errorType] - Error identifier from backend
 * @param {string} [result.message] - Error code from backend
 *
 * @returns {boolean} Whether the error was handled globally
 */
export function handleGlobalApiError(result) {
    if (result.ok) return false;

    const codeStr = result.message || "0000500";

    const domain = codeStr.substring(0, 2);
    const action = codeStr.substring(2, 4);
    const status = codeStr.substring(4, 7);

    // Handle generic errors like network or 500 or 401
    if (handleGenericErrors(result)) return true;

    const domainConfig = DOMAINS[domain];
    let domainWord = "System";
    if (domainConfig) {
        domainWord = domainConfig[action] || domainConfig.default;
    }

    const actionWord = ACTIONS[action] || "Verarbeitung";
    const template = STATUS_TEMPLATES[status];

    let title = "Fehler aufgetreten";
    let subTitle = `Ein Fehler mit dem Code ${codeStr} ist aufgetreten`;

    if (template) {
        title = template.title.replace("{action}", actionWord).replace("{domain}", domainWord);
        subTitle = template.subTitle.replace("{domain}", domainWord);
    }

    addToast({
        title: title,
        subTitle: viewport.isMobile ? "" : subTitle,
        type: "error"
    });

    return true;
}

// Type IDs:
// 2: unauthorized (bad token)
// 3: network error
// 4: internal server error
export function handleGenericErrors(result) {
    if (result.ok) return false;

    const codeStr = result.message || "0000500";

    const domain = codeStr.substring(0, 2);
    const action = codeStr.substring(2, 4);
    const status = codeStr.substring(4, 7);

    if (result.errorType === "UNAUTHORIZED" && domain === "10" && action === "07") {
        addToast({
            title: "E-Mail oder Passwort falsch",
            subTitle: viewport.isMobile ? "" : "Die E-Mail-Adresse oder das Passwort ist ungültig.",
            type: "error",
            typeId: "1"
        });

        return true;
    }

    // General Session Expiration / Bad Token Middleware interceptor
    if (result.errorType === "UNAUTHORIZED") {
        if (toastAlreadyExists("2")) return true;

        addToast({
            title: "Ungültiger Token",
            subTitle: viewport.isMobile ? "" : "Ihr Authentifizierungstoken ist abgelaufen. Bitte melden Sie sich erneut an.",
            type: "error",
            typeId: "2"
        });
        logout();
        push("/");
        return true;
    }

    // Infrastructure Outage Fallbacks
    if (codeStr === "0000000" || result.errorType === "NETWORK") {
        if (toastAlreadyExists("3")) return true;

        addToast({
            title: "Keine Verbindung zum Server",
            subTitle: viewport.isMobile ? "" : "Es konnte keine Verbindung zum Server aufgebaut werden. Bitte versuchen Sie es später erneut.",
            type: "error",
            typeId: "3"
        });
        return true;
    }

    if (codeStr === "0000500" || result.errorType === "SERVER") {
        if (toastAlreadyExists("4")) return true;

        addToast({
            title: "Interner Serverfehler",
            subTitle: viewport.isMobile ? "" : "Beim Verarbeiten Ihrer Anfrage ist ein Fehler aufgetreten. (Code: 0000500)",
            type: "error",
            typeId: "4"
        });
        return true;
    }

    if (codeStr === "0000400") {
        addToast({
            title: "Eingabe ungültig",
            subTitle: viewport.isMobile ? "" : "Die übermittelten Daten sind fehlerhaft oder unvollständig.",
            type: "error",
            typeId: "5"
        });
        return true;
    }

    return false
}

function toastAlreadyExists(typeId) {
    const toastsWithTypeId = toasts.filter(t => t.typeId === typeId);
    return toastsWithTypeId.length > 0;
}
