import { appSettings } from "../stores/appSettings.svelte.js";
import { updateMaxMembers } from "../api/apiAppSettings.svelte";
import { normalizeResponse } from "../api/http.svelte";
import { handleGlobalApiError } from "../api/globalErrorHandler.svelte";
import { addToast } from "../stores/toasts.svelte";
import { viewport } from "../stores/viewport.svelte";

/**
 * Updates the maximum members app settings on the server and
 * synchronizes the local `appSettings` store on success.
 *
 * This function handles all API error cases internally via the
 * global error handler and user-facing toastsSvelte. It does not return
 * the updated value and is intended to be called directly from
 * UI or service layers.
 *
 * @param {number} value - The new maximum number of members per voice.
 * @returns {Promise<void>}
 */
export async function tryUpdateMaxMembers(value) {
    const { resp } = await updateMaxMembers(value);

    // In this case the global api error should handle all possible api errors
    const normalizedResponse = normalizeResponse(resp);
    if (handleGlobalApiError(normalizedResponse)) return;

    Object.assign(appSettings, { maxMembers: value });

    addToast({
        title: "Erfolgreich gespeichert",
        subTitle: !viewport.isMobile
            ? "Die maximale Anzahl and Mitgliedern pro Stimme wurde erfolgreich aktualisiert und gespeichert."
            : "",
        type: "success"
    });
}