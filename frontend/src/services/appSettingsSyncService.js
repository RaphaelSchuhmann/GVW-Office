import { get } from "svelte/store";
import { getSettings } from "../api/apiAppSettings";
import { handleGlobalApiError } from "../api/globalErrorHandler";
import { normalizeResponse } from "../api/http";
import { addToast } from "../stores/toasts";
import { isMobile } from "../stores/viewport";
import { appSettings } from "../stores/appSettings";

let isRunning = false;
let intervalId;
let isFetching = false;

/**
 * Starts the periodic synchronization of global application settings.
 * 
 * If the sync service is already running, this function is a no-op.
 * When started, it immediately fetches the current app settings and
 * then refreshes them at a fixed interval (every 40 seconds).
 * 
 * Intended to be called from a view lifecycle (e.g. onMount).
 * 
 * @returns {void}
 */
export function startSyncService() {
    if (isRunning) return;

    isRunning = true;
    loadAppSettings(); // Immediate fetch when starting
    intervalId = setInterval(loadAppSettings, 40000)
}

/**
 * Fetches the latest global application settings from the API
 * and updates the `appSettings` store.
 *
 * Prevents concurrent fetches using an internal `isFetching` flag,
 * ensuring that multiple calls (e.g., from an interval) do not cause
 * overlapping updates or race conditions.
 *
 * Handles global API errors and user-facing error feedback internally.
 * This function does not return the fetched data and is safe to call
 * repeatedly.
 *
 * @async
 * @returns {Promise<void>}
 */
export async function loadAppSettings() {
    if (isFetching) return;
    isFetching = true;
    try {
        const { resp, body } = await getSettings();
    
        const normalizedResponse = normalizeResponse(resp);
        if (handleGlobalApiError(normalizedResponse)) return;
    
        if (!resp.ok) {
            addToast({
                title: "App Einstellungen nicht verfügbar",
                subTitle: !get(isMobile) ? "Beim Laden der globalen App Einstellungen ist ein unerwarteter Fehler aufgetreten." : "",
                type: "error",
            });
            console.error("Unable to load app settings");
            return;
        }
    
        appSettings.set(body);
    } catch (err) {
        console.error("Unable to load app settings", err);
    } finally {
        isFetching = false;
    }
}

/**
 * Stops the periodic synchronization of global application settings.
 * 
 * Clears the active refresh interval and resets the internal running state.
 * If the sync service is not running, this function is a no-op.
 * 
 * Intended to be called from a view cleanup phase (e.g. onDestroy)
 * 
 * @returns {void}
 */
export function stopSyncService() {
    if (!isRunning) return;

    clearInterval(intervalId);
    intervalId = null;
    isRunning = false;
}