import { get } from "svelte/store";
import { auth } from "../stores/auth";
import { addToast } from "../stores/toasts";
import { logout } from "./user";
import { push } from "svelte-spa-router";

export const reportsTypeMap = {
    "all": "Alle Typen",
    "attendance": "Anwesenheit",
    "finance": "Finanzen",
    "event": "Veranstaltung",
    "annualReport": "Jahresbericht",
    "protocol": "Protokoll",
    "birthday": "Geburtstag",
    "death": "Todesfall",
    "anniversary": "Vereinsjubiläum",
    "internalEvent": "Vereinsveranstaltung",
    "weeding": "Hochzeit",
    "other": "Sonstiges",
    // Reversed
    "Alle Typen": "all",
    "Anwesenheit": "attendance",
    "Finanzen": "finance",
    "Veranstaltung": "event",
    "Jahresbericht": "annualReport",
    "Protokoll": "protocol",
    "Geburtstag": "birthday",
    "Todesfall": "death",
    "Vereinsjubiläum": "anniversary",
    "Vereinsveranstaltung": "internalEvent",
    "Hochzeit": "weeding",
    "Sonstiges": "other",
}

const apiUrl = import.meta.env.DEV_API_URL || "http://localhost:3500";

/**
 * Adds a new report to the system
 * @param {Object} report - Report object with all report details
 * @returns {Promise<void>} Shows toast notification based on API response
 */
export async function addReport(report) {
    const token = get(auth).token;
    const resp = await fetch(`${apiUrl}/reports/add`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ report: report })
    });

    if (resp.status === 200) {
        addToast({
            title: "Bericht hinzugefügt",
            subTitle: "Der neue Bericht wurde erfolgreich angelegt und ist ab sofort in der Berichtsübersicht verfügbar.",
            type: "success"
        });
    }else if (resp.status === 401) {
        // Auth token invalid / unauthorized
        addToast({
            title: "Ungültiges Token",
            subTitle: "Ihr Authentifizierungstoken ist ungültig oder abgelaufen. Bitte melden Sie sich erneut an, um Zugriff zu erhalten.",
            type: "error"
        });
        logout();
        await push("/?cpwErr=false");
        return;
    } else if (resp.status === 400) {
        // user not found route back to log in
        addToast({
            title: "Eingaben unvollständig",
            subTitle: "Bitte überprüfen Sie Ihre Angaben. Einige Pflichtfelder sind entweder leer oder enthalten ungültige Werte.",
            type: "error"
        });
    } else {
        // internal server error / unknown error
        addToast({
            title: "Interner Serverfehler",
            subTitle: "Beim Verarbeiten Ihrer Anfrage ist ein Fehler aufgetreten. Bitte versuchen Sie es erneut.",
            type: "error"
        });
    }
}