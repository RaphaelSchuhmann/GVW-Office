import { apiGetBugReportDetails, apiGetBugReports } from "../api/apiBugReport.svelte";
import { apiGetFeedbackDetails, apiGetFeedbacks } from "../api/apiFeedback.svelte";
import { handleGlobalApiError } from "../api/globalErrorHandler.svelte";
import { normalizeResponse } from "../api/http.svelte";
import { feedbackStore } from "../stores/reportHub.svelte";
import { addToast } from "../stores/toasts.svelte";
import { viewport } from "../stores/viewport.svelte";

let isFetching = {
    allFeedbacks: false,
    allBugReports: false,
}

export async function getAllFeedbacks() {
    if (isFetching.allFeedbacks) return;
    isFetching.allFeedbacks = true;

    try {
        const { resp, body } = await apiGetFeedbacks();
        const normalizedResponse = normalizeResponse(resp);

        if (handleGlobalApiError(normalizedResponse)) return;

        if (!normalizedResponse.ok) {
            addToast({
                title: "Fehler beim Laden",
                subTitle: "Beim Laden der Feedbackliste ist ein unerwarteter Fehler aufgetreten.",
                type: "error"
            });
            return;
        }

        feedbackStore.data = body.feedbacks;
    } finally {
        isFetching.allFeedbacks = false;
    }
}

export async function getAllBugReports() {
    if (isFetching.allBugReports) return;
    isFetching.allBugReports = true;

    try {
        const { resp, body } = await apiGetBugReports();
        const normalizedResponse = normalizeResponse(resp);

        if (handleGlobalApiError(normalizedResponse)) return;

        if (!normalizedResponse.ok) {
            addToast({
                title: "Fehler beim Laden",
                subTitle: "Beim Laden der Bugreportliste ist ein unerwarteter Fehler aufgetreten.",
                type: "error"
            });
            return;
        }

        feedbackStore.data = body.reports;
    } finally {
        isFetching.allFeedbacks = false;
    }
}

export async function getItemDetails(id, type) {
    if (!id || !type) return;

    switch (type) {
        case "feedback":
            return getFeedbackDetails(id);
    
        case "bug_reports":
            return getBugReportDetails(id);

        default:
            return null;
    }
}

async function getFeedbackDetails(id) {
    const { resp, body } = await apiGetFeedbackDetails(id);
    const normalizedResponse = normalizeResponse(resp);

    if (handleGlobalApiError(normalizedResponse)) return;

    if (!normalizedResponse.ok) {
        handleDetailsError(normalizedResponse.errorType, "Feedback");
        return;
    }

    return body;
}

async function getBugReportDetails(id) {
    const { resp, body } = await apiGetBugReportDetails(id);
    const normalizedResponse = normalizeResponse(resp);

    if (handleGlobalApiError(normalizedResponse)) return;

    if (!normalizedResponse.ok) {
        handleDetailsError(normalizedResponse.errorType, "BugReport");
        return;
    }

    return body;
}

function handleDetailsError(errorType, itemType) {
    itemType = itemType || "Feedback";
    
    const errorConfigs = {
        BADREQUEST: {
            title: "Ungültige Daten",
            subTitle: "Bitte überprüfen Sie Ihre Eingaben. Einige Felder enthalten ungültige Werte."
        },
        NOTFOUND: {
            title: `${itemType} nicht gefunden`,
            subTitle: itemType === "Feedback" 
                    ? "Das gewählte Feedback wurde im System nicht gefunden."
                    : "Der gewählte Bug Report wurde im System nicht gefunden."
        },
        DEFAULT: {
            title: "Fehler beim Laden",
            subTitle: itemType === "Feedback"
                    ? "Beim Laden des Feedbacks ist ein unerwarteter Fehler aufgetreten."
                    : "Beim Laden des Bug Reports ist ein unerwarteter Fehler aufgetreten."
        }
    }

    const config = errorConfigs[errorType] || errorConfigs.DEFAULT;

    addToast({
        title: config.title,
        subTitle: viewport.isMobile ? "" : config.subTitle,
        type: "error"
    });
}