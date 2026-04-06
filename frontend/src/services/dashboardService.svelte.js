import { apiGetData } from "../api/apiDashboard.js";
import { normalizeResponse } from "../api/http.svelte.js";
import { handleGlobalApiError } from "../api/globalErrorHandler.svelte.js";
import { addToast } from "../stores/toasts.svelte.js";
import { viewport } from "../stores/viewport.svelte.js";
import { dashboardStore } from "../stores/dashboard.svelte.js";

let isFetching = false;

export async function loadDashboardData() {

    if (isFetching) return;
    isFetching = true;

    try {
        const { resp, body } = await apiGetData();
        const normalizedResponse = normalizeResponse(resp);

        if (handleGlobalApiError(normalizedResponse)) return;

        if (!normalizedResponse.ok) {
            addToast({
                title: "Fehler beim laden",
                subTitle: viewport.isMobile ? "" : "Beim Laden der Dashboard Daten ist ein Fehler aufgetreten.",
                type: "warning"
            });
        }

        dashboardStore.members = body.members;
        dashboardStore.totalEvents = body.totalEvents;
        dashboardStore.upcomingEvents = body.upcomingEvents;
        dashboardStore.totalScores = body.totalScores;
    } finally {
        isFetching = false;
    }
}