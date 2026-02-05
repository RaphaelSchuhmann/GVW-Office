import { get } from "svelte/store";
import { auth } from "../stores/auth";
import { addToast } from "../stores/toasts";
import { logout } from "./userService";
import { push } from "svelte-spa-router";

export const typeMap = {
    "all": "Alle Typen",
    "practice": "Proben",
    "meeting": "Meeting",
    "concert": "Konzerte",
    "other": "Sonstiges",
    // Reversed
    "Alle Typen": "all",
    "Proben": "practice",
    "Meeting": "meeting",
    "Konzerte": "concert",
    "Sonstiges": "other"
};

export const statusMap = {
    "upcoming": "Bevorstehend",
    "finished": "Abgeschlossen",
    "Bevorstehend": "upcoming",
    "Abgeschlossen": "finished"
};

export const ordinalMap = {
    "1": "ersten",
    "2": "zweiten",
    "3": "dritten",
    "4": "vierten",
    "5": "fünften",
};

export const weekDayMap = {
    "1": "Montag",
    "2": "Dienstag",
    "3": "Mittwoch",
    "4": "Donnerstag",
    "5": "Freitag",
    "6": "Samstag",
    "7": "Sonntag"
}

export const modeMap = {
    "Einmalig": "single",
    "Wöchentlich": "weekly",
    "Monatlich": "monthly",
    "single": "Einmalig",
    "weekly": "Wöchentlich",
    "monthly": "Monatlich"
}

// @ts-ignore
const apiUrl = __API_URL__;

/**
 * Adds a new event to the system
 * @param {Object} event - Event object with all event details
 * @returns {Promise<void>} Shows toast notification based on API response
 */
export async function addEvent(event) {
    const token = get(auth).token;
    const resp = await fetch(`${apiUrl}/events/add`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ event: event })
    });

    if (resp.status === 200) {
        addToast({
            title: "Veranstaltung hinzugefügt",
            subTitle: "Die neue Veranstaltung wurde erfolgreich angelegt und ist ab sofort in der Veranstaltungsübersicht verfügbar.",
            type: "success"
        });
    } else if (resp.status === 401) {
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

/**
 * Updates an existing event in the system
 * @param {Object} event - Event object with updated details
 * @returns {Promise<void>} Shows toast notification based on API response
 */
export async function updateEvent(event) {
    const token = get(auth).token;
    const resp = await fetch(`${apiUrl}/events/update`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ event: event })
    });

    if (resp.status === 200) {
        addToast({
            title: "Erfolgreich gespeichert",
            subTitle: "Ihre Änderungen wurden erfolgreich übernommen und im System abgespeichert.",
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
    } else if (resp.status === 404) {
        addToast({
            title: "Veranstaltung nicht gefunden",
            subTitle: "Die ausgewählte Veranstaltung konnte nicht gefunden werden. Möglicherweise wurde sie bereits gelöscht.",
            type: "error"
        });
        await push("/events");
        return;
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
 * Toggles the status of an event between upcoming and finished
 * @param {string} id - Event ID to update
 * @returns {Promise<Response>} API response with update result
 */
export async function updateStatus(id) {
    const token = get(auth).token;
    return await fetch(`${apiUrl}/events/update/status`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ id })
    });
}

/**
 * Deletes an event from the system
 * @param {string} id - Event ID to delete
 * @returns {Promise<Response>} API response with deletion result
 */
export async function deleteEvent(id) {
    const token = get(auth).token;
    return await fetch(`${apiUrl}/events/delete`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ id })
    });
}