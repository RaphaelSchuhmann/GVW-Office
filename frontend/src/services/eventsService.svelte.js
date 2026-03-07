import { apiAddEvent, apiDeleteEvent, apiUpdateEvent, apiUpdateEventStatus } from "../api/apiEvents.svelte";
import { handleGlobalApiError } from "../api/globalErrorHandler.svelte";
import { normalizeResponse } from "../api/http.svelte";
import { addToast } from "../stores/toasts.svelte";
import { viewport } from "../stores/viewport.svelte";
import { eventsStore } from "../stores/events.svelte";
import { getLastDayOfCurrentMonth, makeDateFromMonthAndDay, parseDMYToDate } from "./utils";

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
    "5": "fünften"
};

export const weekDayMap = {
    "1": "Montag",
    "2": "Dienstag",
    "3": "Mittwoch",
    "4": "Donnerstag",
    "5": "Freitag",
    "6": "Samstag",
    "7": "Sonntag"
};

export const modeMap = {
    "Einmalig": "single",
    "Wöchentlich": "weekly",
    "Monatlich": "monthly",
    "single": "Einmalig",
    "weekly": "Wöchentlich",
    "monthly": "Monatlich"
};

const isFetching = {
    newEvent: false,
    updateEvent: false,
    updateStatus: false,
    deleteEvent: false
};

/**
 * Returns a human-readable description or next occurrence for a given event.
 *
 * The function looks up the event in `eventsStore.display` by its ID and
 * determines how the event repeats based on its `mode` and `recurrence` data.
 *
 * Behavior:
 * - **Weekly events** → Returns a string like `"Jede Woche am Montag"`.
 * - **Monthly weekday recurrence** → Returns a string like `"Jeden Monat am 2. Dienstag"`.
 * - **Monthly date recurrence** → Calculates the next occurrence date in the current
 *   or next month depending on whether the day has already passed.
 *   If the configured day exceeds the last day of the current month, the last
 *   valid day of that month is used instead.
 * - **Non-recurring events** → Returns the stored event date.
 * - **Missing event** → Returns `"Unbekannt"`.
 *
 * @param {number|string} eventId - The unique identifier of the event to evaluate.
 * @returns {string} A formatted occurrence description or date string.
 */
export function getEventOccurrence(eventId) {
    const event = eventsStore.display.filter(item => item.id === eventId)[0];

    if (!event) return "Unbekannt";

    if (event.mode === "weekly") {
        const date = parseDMYToDate(event.date);
        return `Jede Woche am ${weekDayMap[date.getDay()]}`;
    }

    if (event.recurrence) {
        if (event.mode === "monthly" && event.recurrence.monthlyKind === "weekday") {
            return `Jeden Monat am ${ordinalMap[event.recurrence.ordinal]} ${weekDayMap[event.recurrence.weekDay]}`;
        } else if (event.mode === "monthly" && event.recurrence.monthlyKind === "date") {
            let dateVal = event.recurrence.dayOfMonth;
            const lastDate = getLastDayOfCurrentMonth();

            if (dateVal > lastDate) dateVal = lastDate;

            const today = new Date();
            if (dateVal < today.getDate()) {
                const month = (today.getMonth() + 1) > 11 ? 0 : today.getMonth() + 1;
                return makeDateFromMonthAndDay(dateVal, month);
            } else {
                return makeDateFromMonthAndDay(dateVal, today.getMonth());
            }
        }
    }

    return event.date;
}

/**
 * Adds a new event using the provided event data.
 *
 * Handles:
 * - Duplicate request prevention.
 * - API call to add the event.
 * - Global API error delegation.
 * - Error-specific and success toast feedback.
 *
 * Error cases handled explicitly:
 * - BADREQUEST
 * - CONFLICT
 * - Generic fallback error
 *
 * On success, a confirmation toast is displayed.
 *
 * @async
 * @function addEvent
 * @param {Object} event - The event object to be added.
 * @returns {Promise<void>}
 */
export async function addEvent(event) {
    if (isFetching.newEvent) return;
    isFetching.newEvent = true;

    try {
        const { resp } = await apiAddEvent(event);

        const normalizedResponse = normalizeResponse(resp);
        if (handleGlobalApiError(normalizedResponse)) return;

        if (!normalizedResponse.ok) {
            if (normalizedResponse.errorType === "BADREQUEST") {
                addToast({
                    title: "Ungültige Daten",
                    subTitle: !viewport.isMobile ? "Die übergebenen Daten sind ungültig. Bitte überprüfen Sie Ihre Eingaben." : "",
                    type: "error"
                });
            } else {
                addToast({
                    title: "Fehler beim Erstellen",
                    subTitle: !viewport.isMobile ? "Beim Erstellen der Veranstaltung ist ein Fehler aufgetreten. Bitte versuchen Sie es später erneut." : "",
                    type: "error"
                });
            }
            return;
        }

        addToast({
            title: "Veranstaltung erstellt",
            subTitle: !viewport.isMobile ? "Die Veranstaltung wurde erfolgreich erstellt." : "",
            type: "success"
        });
    } finally {
        isFetching.newEvent = false;
    }
}

/**
 * Deletes an event by its ID.
 *
 * Handles:
 * - Duplicate request prevention.
 * - API call to delete the event.
 * - Global API error delegation.
 * - Error-specific and success toast feedback.
 *
 * Error cases handled explicitly:
 * - NOTFOUND
 * - BADREQUEST
 * - Generic fallback error
 *
 * On success, a confirmation toast is displayed.
 *
 * @async
 * @function deleteEvent
 * @param {string} id - Event UUID to delete.
 * @returns {Promise<void>}
 */
export async function deleteEvent(id) {
    if (isFetching.deleteEvent) return;
    isFetching.deleteEvent = true;

    try {
        const { resp } = await apiDeleteEvent(id);

        const normalizedResponse = normalizeResponse(resp);
        if (handleGlobalApiError(normalizedResponse)) return;

        if (!normalizedResponse.ok) {
            if (normalizedResponse.errorType === "NOTFOUND") {
                addToast({
                    title: "Veranstaltung nicht gefunden",
                    subTitle: !viewport.isMobile ? "Die angegebene Veranstaltung konnte nicht gefunden werden. Bitte versuchen Sie es später erneut." : "",
                    type: "error"
                });
            } else if (normalizedResponse.errorType === "BADREQUEST") {
                addToast({
                    title: "Ungültige Veranstaltung",
                    subTitle: !viewport.isMobile ? "Die angegebene Veranstaltung ist ungültig. Bitte versuchen Sie es später erneut." : "",
                    type: "error"
                });
            } else {
                addToast({
                    title: "Fehler beim Löschen",
                    subTitle: !viewport.isMobile ? "Beim Löschen der Veranstaltung ist ein Fehler aufgetreten. Bitte versuchen Sie es später erneut." : "",
                    type: "error"
                });
            }
            return;
        }

        addToast({
            title: "Veranstaltung gelöscht",
            subTitle: !viewport.isMobile ? "Die Veranstaltung wurde erfolgreich gelöscht." : "",
            type: "success"
        });
    } finally {
        isFetching.deleteEvent = false;
    }
}

/**
 * Updates the status of a given event ID.
 *
 * Handles:
 * - Duplicate request prevention.
 * - API call to update the event status.
 * - Global API error delegation.
 * - Error-specific and success toast feedback.
 *
 * Error cases handled explicitly:
 * - NOTFOUND
 * - BADREQUEST
 * - Generic fallback error
 *
 * On success, a confirmation toast is displayed.
 *
 * @async
 * @function updateStatus
 * @param {string} id - Event UUID to update.
 * @returns {Promise<void>}
 */
export async function updateStatus(id) {
    if (isFetching.updateStatus) return;
    isFetching.updateStatus = true;

    try {
        const { resp } = await apiUpdateEventStatus(id);

        const normalizedResponse = normalizeResponse(resp);
        if (handleGlobalApiError(normalizedResponse)) return;

        if (!normalizedResponse.ok) {
            if (normalizedResponse.errorType === "NOTFOUND") {
                addToast({
                    title: "Veranstaltung nicht gefunden",
                    subTitle: !viewport.isMobile ? "Die angegebene Veranstaltung konnte nicht gefunden werden. Bitte versuchen Sie es später erneut." : "",
                    type: "error"
                });
            } else if (normalizedResponse.errorType === "BADREQUEST") {
                addToast({
                    title: "Ungültige Veranstaltung",
                    subTitle: !viewport.isMobile ? "Die angegebene Veranstaltung ist ungültig. Bitte versuchen Sie es später erneut." : "",
                    type: "error"
                });
            }

            return;
        }

        addToast({
            title: "Veranstaltungsstatus aktualisiert",
            subTitle: !viewport.isMobile ? "Der Status der Veranstaltung wurde erfolgreich aktualisiert." : "",
            type: "success"
        });
    } finally {
        isFetching.updateStatus = false;
    }
}

/**
 * Updates an event with the provided data.
 *
 * Handles:
 * - Duplicate request prevention.
 * - API call to update the event.
 * - Global API error delegation.
 * - Error-specific and success toast feedback.
 *
 * Error cases handled explicitly:
 * - BADREQUEST
 * - CONFLICT
 * - NOTFOUND
 * - Generic fallback error
 *
 * On success, a confirmation toast is displayed.
 *
 * @async
 * @function updateEvent
 * @param {Object} data - The updated event data.
 * @returns {Promise<boolean>} successful - If update was successful
 */
export async function updateEvent(data) {
    if (isFetching.updateEvent) return;
    isFetching.updateEvent = true;

    try {
        const { resp } = await apiUpdateEvent(data);

        const normalizedResponse = normalizeResponse(resp);
        if (handleGlobalApiError(normalizedResponse)) return false;

        if (!normalizedResponse.ok) {
            if (normalizedResponse.errorType === "BADREQUEST") {
                addToast({
                    title: "Ungültige Daten",
                    subTitle: !viewport.isMobile ? "Die übergebenen Daten sind ungültig. Bitte überprüfen Sie Ihre Eingaben." : "",
                    type: "error"
                });
            } else if (normalizedResponse.errorType === "NOTFOUND") {
                addToast({
                    title: "Veranstaltung nicht gefunden",
                    subTitle: !viewport.isMobile ? "Die angegebene Veranstaltung konnte nicht gefunden werden. Bitte versuchen Sie es später erneut." : "",
                    type: "error"
                });
            } else {
                addToast({
                    title: "Fehler beim Aktualisieren",
                    subTitle: !viewport.isMobile ? "Beim Aktualisieren der Veranstaltung ist ein Fehler aufgetreten. Bitte versuchen Sie es später erneut." : "",
                    type: "error"
                });
            }
            return false;
        }

        addToast({
            title: "Veranstaltung aktualisiert",
            subTitle: !viewport.isMobile ? "Die Veranstaltung wurde erfolgreich aktualisiert." : "",
            type: "success"
        });
        return true;
    } finally {
        isFetching.updateEvent = false;
    }
}