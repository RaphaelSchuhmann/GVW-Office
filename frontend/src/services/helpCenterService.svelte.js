import { apiAddCategory } from "../api/apiHelpCenter.svelte.js";
import { handleGenericErrors, handleGlobalApiError } from "../api/globalErrorHandler.svelte.js";
import { normalizeResponse } from "../api/http.svelte.js";
import { addToast } from "../stores/toasts.svelte.js";
import { viewport } from "../stores/viewport.svelte.js";
import { appSettings } from "../stores/appSettings.svelte.js";

const isFetching = {
    addCategory: false,
    deleteCategory: false,
}

export async function addHelpCenterCategory(inputs) {
    if (isFetching.addCategory) return false;

    try {
        const { resp, body } = await apiAddCategory(inputs);
        const normalizedResp = await normalizeResponse(resp);

        if (handleGlobalApiError(normalizedResp)) return;

        if (!body.rev) {
            handleGenericErrors({ ok: false, message: "0000500", errorType: "SERVER" });
            return;
        }

        appSettings.rev = body.rev;

        addToast({
            title: "Kategorie hinzugefügt",
            subTitle: viewport.isMobile ? "" : "Kategorie wurde erfolgreich hinzugefügt.",
            type: "success",
        });
    } finally {
        isFetching.addCategory = false;
    }
}