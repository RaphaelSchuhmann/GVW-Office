import { addToast } from "../stores/toasts.svelte";
import { viewport } from "../stores/viewport.svelte";
import { logout } from "../services/userService.svelte.js";
import { push } from "svelte-spa-router";

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

    const codeStr = error?.response?.data?.errorCode || "0000500";
    const status = codeStr.substring(4, 7);

    const domain = codeStr.substring(0, 2);

    switch (result.errorType) {
        case "UNAUTHORIZED" && domain === "10" && status === "401":
            addToast({
                title: "E-Mail oder Passwort falsch",
                subTitle: viewport.isMobile ? "" : "Die E-Mail oder das Passwort ist falsch.",
                type: "error"
            });
            return true;
        case "UNAUTHORIZED":
            addToast({
                title: "Ungültiger Token",
                subTitle: viewport.isMobile ? "" : "Ihr Authentifizierungstoken ist ungültig oder abgelaufen. Bitte melden Sie sich erneut an, um Zugriff zu erhalten.",
                type: "error"
            });
            logout();
            push("/");
            return true;
        case "SERVER":
            addToast({
                title: "Interner Serverfehler",
                subTitle: viewport.isMobile ? "" : "Beim Verarbeiten Ihrer Anfrage ist ein Fehler aufgetreten. Bitte versuchen Sie es erneut.",
                type: "error"
            });
            return true;
        case "NETWORK":
            addToast({
                title: "Keine Verbindung zum Server",
                subTitle: viewport.isMobile ? "" : "Es konnte keine Verbindung zum Server aufgebaut werden. Bitte versuchen Sie es später erneut.",
                type: "error"
            });
            return true;
    }

    // Default fallback
    // TODO: v1.0.1 Replace this with actual error messages
    let title = "Fehler aufgetreten";
    let subTitle = `Details im System. (Code: ${codeStr})`;

    addToast({
        title: title,
        subTitle: viewport.isMobile ? "" : subTitle,
        type: "error"
    });

    return true;
}

