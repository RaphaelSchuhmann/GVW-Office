import { appSettings } from "../stores/appSettings";
import { updateMaxMembers } from "../api/apiAppSettings";
import { normalizeResponse } from "../api/http";
import { handleGlobalApiError } from "../api/globalErrorHandler";
import { addToast } from "../stores/toasts";
import { get } from "svelte/store";
import { isMobile } from "../stores/viewport";

/**
 * Updates the maximum members app settings on the server and
 * synchronizes the local `appSettings` store on success.
 *
 * This function handles all API error cases internally via the
 * global error handler and user-facing toasts. It does not return
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

    appSettings.update(s => ({ ...s, maxMembers: value }));

    addToast({
        title: "Erfolgreich gespeichert",
        subTitle: !get(isMobile)
            ? "Die maximale Anzahl and Mitgliedern pro Stimme wurde erfolgreich aktualisiert und gespeichert."
            : "",
        type: "success"
    });
}