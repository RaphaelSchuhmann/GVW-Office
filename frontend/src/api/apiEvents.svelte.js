import { httpGet, httpPost, parseBodySafe } from "./http.svelte";

const apiUrl = __API_URL__;

/**
 * Fetches all events
 *
 * Sends a GET request to `/events/all` endpoint with an Authorization header.
 *
 * @returns {Promise<{ resp: Response | null, body: any | null }>}
 * An object containing the raw fetch Response (`resp`) and the parsed
 * JSON response body (`body`). Returns `{ resp: null, body: null }`
 * if the request fails before a response is received.
 *
 * The response body may include complete event objects
 *
 * @example
 * const { resp, body } = await getEvents();
 *
 * if (resp?.ok) {
 *   console.log("Events: ", body);
 * }
 */
export async function apiGetEvents() {
    const resp = await httpGet(`${apiUrl}/events/all`);
    if (!resp) return { resp: null, body: null };
    const body = await parseBodySafe(resp);
    return { resp, body };
}

/**
 * Adds an event
 *
 * Sends a POST request to `/events/add` endpoint with an Authorization header.
 *
 * @param {Object} event - The event to add
 * @returns {Promise<{ resp: Response | null, body: any | null }>}
 * An object containing the raw fetch Response (`resp`) and the parsed
 * JSON response body (`body`). Returns `{ resp: null, body: null }`
 * if the request fails before a response is received.
 *
 * @example
 * const { resp } = await addEvent({
 *     name: "Test Event",
 *     description: "This is a test event",
 *     date: "2026-01-01",
 *     time: "12:00",
 *     location: "Test Location",
 *     maxParticipants: 10,
 * });
 *
 * if (resp?.ok) {
 *   console.log("Event added");
 * }
 */
export async function apiAddEvent(event) {
    const resp = await httpPost(`${apiUrl}/events/add`, event);
    if (!resp) return { resp: null, body: null };
    const body = await parseBodySafe(resp);
    return { resp, body };
}

/**
 * Deletes an event
 *
 * Sends a POST request to `/events/delete` endpoint with an Authorization header.
 *
 * @param {number} id - The id of the event to delete
 * @returns {Promise<{ resp: Response | null, body: any | null }>}
 * An object containing the raw fetch Response (`resp`) and the parsed
 * JSON response body (`body`). Returns `{ resp: null, body: null }`
 * if the request fails before a response is received.
 *
 * @example
 * const { resp } = await deleteEvent(1);
 *
 * if (resp?.ok) {
 *   console.log("Event deleted");
 * }
 */
export async function apiDeleteEvent(id) {
    const resp = await httpPost(`${apiUrl}/events/delete`, { id: id });
    if (!resp) return { resp: null, body: null };
    const body = await parseBodySafe(resp);
    return { resp, body };
}

/**
 * Switches an event's status
 *
 * Sends a POST request to `/events/update/status` endpoint with an Authorization header.
 *
 * @param {number} id - The id of the event to update
 * @returns {Promise<{ resp: Response | null, body: any | null }>}
 * An object containing the raw fetch Response (`resp`) and the parsed
 * JSON response body (`body`). Returns `{ resp: null, body: null }`
 * if the request fails before a response is received.
 *
 * @example
 * const { resp } = await switchEventStatus(1);
 *
 * if (resp?.ok) {
 *   console.log("Event status updated");
 * }
 */
export async function apiUpdateEventStatus(id) {
    const resp = await httpPost(`${apiUrl}/events/update/status`, { id: id });
    if (!resp) return { resp: null, body: null };
    const body = await parseBodySafe(resp);
    return { resp, body };
}

/**
 * Updates an event
 *
 * Sends a POST request to `/events/update` endpoint with an Authorization header.
 *
 * @param {Object} event - The event to update
 * @returns {Promise<{ resp: Response | null, body: any | null }>}
 * An object containing the raw fetch Response (`resp`) and the parsed
 * JSON response body (`body`). Returns `{ resp: null, body: null }`
 * if the request fails before a response is received.
 *
 * @example
 * const { resp } = await updateEvent({
 *     id: 1,
 *     name: "Test Event",
 *     description: "This is a test event",
 *     date: "2026-01-01",
 *     time: "12:00",
 *     location: "Test Location",
 *     maxParticipants: 10,
 * });
 *
 * if (resp?.ok) {
 *   console.log("Event updated");
 * }
 */
export async function apiUpdateEvent(event) {
    const resp = await httpPost(`${apiUrl}/events/update`, event);
    if (!resp) return { resp: null, body: null };
    const body = await parseBodySafe(resp);
    return { resp, body };
}