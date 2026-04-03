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
 * Returns a human-readable description of how often an event occurs.
 *
 * Supports:
 * - weekly events → "Jede Woche am <Wochentag>"
 * - monthly events (by weekday or date)
 *
 * @param {string} eventId - ID of the event to resolve
 * @returns {string|undefined} Localized description of the occurrence or "Unbekannt" if event not found
 */
export function getEventOccurrence(eventId) {
    const event = eventsStore.raw.find(item => item.id === eventId);

    if (!event) return "Unbekannt";
    if (event.mode === "weekly") return getWeeklyOccurrence(event);
    if (event.mode === "monthly" && event.recurrence) return getMonthlyOccurrence(event);

    return "Unbekannt";
}

/**
 * Generates a weekly recurrence string based on the event's base date.
 *
 * @param {Object} event
 * @param {string} event.date - Date string in DMY format (dd.mm.yyyy)
 * @returns {string} e.g. "Jede Woche am Montag"
 */
function getWeeklyOccurrence(event) {
    const date = parseDMYToDate(event.date);
    if (Number.isNaN(date.getTime())) return "Unbekannt";
    const dayIndex = date.getDay();
    const weekDayKey = dayIndex === 0 ? "7" : String(dayIndex);
    return `Jede Woche am ${weekDayMap[weekDayKey]}`;
}

/**
 * Generates a monthly recurrence description.
 *
 * Supports two types:
 * - "weekday": e.g. "Jeden Monat am 2. Dienstag"
 * - "date": calculates next valid occurrence date
 *
 * @param {Object} event
 * @param {Object} event.recurrence - Recurrence configuration
 * @returns {string}
 */
function getMonthlyOccurrence(event) {
    const { recurrence } = event;

    if (recurrence.monthlyKind === "weekday") {
        return `Jeden Monat am ${ordinalMap[recurrence.ordinal]} ${weekDayMap[recurrence.weekDay]}`;
    }

    if (recurrence.monthlyKind === "date") {
        return calculateMonthlyDateOccurrence(recurrence.dayOfMonth);
    }

    return "Unbekannt";
}

/**
 * Calculates the next valid occurrence date for a fixed day-of-month recurrence.
 *
 * Handles:
 * - Months with fewer days (e.g. Feb → fallback to last day)
 * - If the day already passed this month → shift to next month
 *
 * @param {number} dayOfMonth - Desired day of month (1–31)
 * @returns {string} Formatted date string (via makeDateFromMonthAndDay)
 */
function calculateMonthlyDateOccurrence(dayOfMonth) {
    const today = new Date();
    const targetDate = new Date(today.getFullYear(), today.getMonth(), 1);
    const currentMonthDay = Math.min(dayOfMonth, getLastDayOfCurrentMonth());

    if (currentMonthDay < today.getDate()) {
        targetDate.setMonth(targetDate.getMonth() + 1);
    }

    const lastDayOfTargetMonth = new Date(
        targetDate.getFullYear(),
        targetDate.getMonth() + 1,
        0
    ).getDate();
    targetDate.setDate(Math.min(dayOfMonth, lastDayOfTargetMonth));

    const dd = String(targetDate.getDate()).padStart(2, "0");
    const mm = String(targetDate.getMonth() + 1).padStart(2, "0");
    const yyyy = targetDate.getFullYear();
    return `${dd}.${mm}.${yyyy}`;
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
                    subTitle: viewport.isMobile ? "" : "Die übergebenen Daten sind ungültig. Bitte überprüfen Sie Ihre Eingaben.",
                    type: "error"
                });
            } else {
                addToast({
                    title: "Fehler beim Erstellen",
                    subTitle: viewport.isMobile ? "" : "Beim Erstellen der Veranstaltung ist ein Fehler aufgetreten. Bitte versuchen Sie es später erneut.",
                    type: "error"
                });
            }
            return;
        }

        addToast({
            title: "Veranstaltung erstellt",
            subTitle: viewport.isMobile ? "" : "Die Veranstaltung wurde erfolgreich erstellt.",
            type: "success"
        });
    } finally {
        isFetching.newEvent = false;
    }
}

/**
 * Deletes an event by its ID via API call and handles all related UI feedback.
 *
 * Features:
 * - Prevents duplicate requests using `isFetching.deleteEvent`
 * - Handles global API errors centrally
 * - Displays success or error toasts based on response
 *
 * @param {string} id - ID of the event to delete
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
            handleDeleteError(normalizedResponse.errorType);
            return;
        }

        addToast({
            title: "Veranstaltung gelöscht",
            subTitle: viewport.isMobile ? "" : "Die Veranstaltung wurde erfolgreich gelöscht.",
            type: "success"
        });
    } finally {
        isFetching.deleteEvent = false;
    }
}

/**
 * Maps API error types to user-facing toast messages for event deletion.
 *
 * Supported error types:
 * - NOTFOUND → event does not exist
 * - BADREQUEST → invalid event ID or malformed request
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
            title: "Veranstaltung nicht gefunden",
            subTitle: "Die angegebene Veranstaltung konnte nicht gefunden werden. Bitte versuchen Sie es später erneut."
        },
        BADREQUEST: {
            title: "Ungültige Veranstaltung",
            subTitle: "Die angegebene Veranstaltung ist ungültig. Bitte versuchen Sie es später erneut."
        },
        DEFAULT: {
            title: "Fehler beim Löschen",
            subTitle: "Beim Löschen der Veranstaltung ist ein Fehler aufgetreten. Bitte versuchen Sie es später erneut."
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
                    subTitle: viewport.isMobile ? "" : "Die angegebene Veranstaltung konnte nicht gefunden werden. Bitte versuchen Sie es später erneut.",
                    type: "error"
                });
            } else if (normalizedResponse.errorType === "BADREQUEST") {
                addToast({
                    title: "Ungültige Veranstaltung",
                    subTitle: viewport.isMobile ? "" : "Die angegebene Veranstaltung ist ungültig. Bitte versuchen Sie es später erneut.",
                    type: "error"
                });
            }

            return;
        }

        addToast({
            title: "Veranstaltungsstatus aktualisiert",
            subTitle: viewport.isMobile ? "" : "Der Status der Veranstaltung wurde erfolgreich aktualisiert.",
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
            handleUpdateError(normalizedResponse.errorType);
            return false;
        }

        addToast({
            title: "Veranstaltung aktualisiert",
            subTitle: viewport.isMobile ? "" : "Die Veranstaltung wurde erfolgreich aktualisiert.",
            type: "success"
        });
        return true;
    } finally {
        isFetching.updateEvent = false;
    }
}

/**
 * Maps API error types to user-facing toast messages for event updates.
 *
 * Supported error types:
 * - NOTFOUND → event does not exist
 * - BADREQUEST → malformed request
 * - DEFAULT → fallback for unknown errors
 *
 * Adjusts subtitle visibility depending on viewport (mobile vs desktop).
 *
 * @param {string} errorType - Error identifier returned from API
 * @returns {void}
 */
function handleUpdateError(errorType) {
    const errorConfigs = {
        NOTFOUND: {
            title: "Veranstaltung nicht gefunden",
            subTitle: "Die angegebene Veranstaltung konnte nicht gefunden werden. Bitte versuchen Sie es später erneut."
        },
        BADREQUEST: {
            title: "Ungültige Daten",
            subTitle: "Die übergebenen Daten sind ungültig. Bitte überprüfen Sie Ihre Eingaben."
        },
        DEFAULT: {
            title: "Fehler beim Aktualisieren",
            subTitle: "Beim Aktualisieren der Veranstaltung ist ein Fehler aufgetreten. Bitte versuchen Sie es später erneut."
        }
    };

    const config = errorConfigs[errorType] || errorConfigs.DEFAULT;

    addToast({
        title: config.title,
        subTitle: viewport.isMobile ? "" : config.subTitle,
        type: "error"
    });
}