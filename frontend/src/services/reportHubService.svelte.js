import {
    apiAddBugReport,
    apiDeleteBugReport,
    apiGetBugReportDetails,
    apiGetBugReports
} from "../api/apiBugReport.svelte";
import { apiAddFeedback, apiDeleteFeedback, apiGetFeedbackDetails, apiGetFeedbacks } from "../api/apiFeedback.svelte";
import { handleGlobalApiError } from "../api/globalErrorHandler.svelte";
import { normalizeResponse } from "../api/http.svelte";
import { appSettings } from "../stores/appSettings.svelte";
import { bugReportStore, feedbackStore } from "../stores/reportHub.svelte";
import { addToast } from "../stores/toasts.svelte";
import { viewport } from "../stores/viewport.svelte";

export const severityMap = {
    "_low": "Niedrig",
    "_medium": "Mittel",
    "_high": "Hoch",
    "_severe": "Schwer",
    "Niedrig": "_low",
    "Mittel": "_medium",
    "Hoch": "_high",
    "Schwer": "_severe"
};

let currentlyDeleting = {
    FEEDBACK: new Set(),
    BUG_REPORT: new Set()
}

let isFetching = {
    allFeedbacks: false,
    allBugReports: false,
    submitFeedback: false,
    submitBugReport: false,
}

function handleReportHubError(errorType, context) {
    const errorConfigs = {
        ADD_FEEDBACK: {
            BADREQUEST: { title: "Ungültige Daten", sub: "Bitte überprüfen Sie Ihre Eingaben. Einige Felder enthalten ungültige Werte." },
            DEFAULT: { title: "Fehler beim Hinzufügen", sub: "Beim Hinzufügen des neuen Mitglieds ist ein Fehler aufgetreten." },
        },
        ADD_BUG: {
            BADREQUEST: { title: "Ungültige Daten", sub: "Bitte überprüfen Sie Ihre Eingaben. Einige Felder enthalten ungültige Werte." },
            DEFAULT: { title: "Fehler beim Hinzufügen", sub: "Beim Hinzufügen des neuen Mitglieds ist ein Fehler aufgetreten." },
        },
        DELETE_FEEDBACK: {
            BADREQUEST: { title: "Unvollständige Daten", sub: "Es wurden unvollständige Daten übermittelt. Bitte versuchen Sie es erneut." },
            NOTFOUND: { title: "Feedback nicht gefunden", sub: "Das gewählte Feedback wurde im System nicht gefunden." },
            DEFAULT: { title: "Fehler beim Entfernen", sub: "Beim Entfernen des Feedbacks ist ein Fehler aufgetreten. Bitte versuchen Sie es erneut." }
        },
        DELETE_BUG: {
            BADREQUEST: { title: "Unvollständige Daten", sub: "Es wurden unvollständige Daten übermittelt. Bitte versuchen Sie es erneut." },
            NOTFOUND: { title: "Bug Report nicht gefunden", sub: "Der gewählte Bug Report wurde im System nicht gefunden." },
            DEFAULT: { title: "Fehler beim Entfernen", sub: "Beim Entfernen des Bug Reports ist ein Fehler aufgetreten. Bitte versuchen Sie es erneut." }
        },
        DETAILS_FEEDBACK: {
            BADREQUEST: { title: "Ungültige Daten", sub: "Bitte überprüfen Sie Ihre Eingaben. Einige Felder enthalten ungültige Werte." },
            NOTFOUND: { title: "Feedback nicht gefunden", sub: "Das gewhälte Feedback wurde im System nicht gefunden." },
            DEFAULT: { title: "Fehler beim Laden", sub: "Beim Laden des Feedbacks ist ein unerwarteter Fehler aufgetreten." }
        },
        DETAILS_BUG: {
            BADREQUEST: { title: "Ungültige Daten", sub: "Bitte überprüfen Sie Ihre Eingaben. Einige Felder enthalten ungültige Werte." },
            NOTFOUND: { title: "Bug Report nicht gefunden", sub: "Der gewhälte Bug Report wurde im System nicht gefunden." },
            DEFAULT: { title: "Fehler beim Laden", sub: "Beim Laden des Bug Reports ist ein unerwarteter Fehler aufgetreten." }
        },
    };

    const config = errorConfigs[context]?.[errorType] ?? errorConfigs[context]?.DEFAULT;

    if (!config) return;

    addToast({
        title: config.title,
        subTitle: viewport.isMobile ? "" : config.sub,
        type: "error"
    });
}

export function getDropdownItemsFromMap(map) {
    const categories = map || {};
    const displayNames = [];
    const processedKeys = new Set();

    Object.keys(categories).forEach((key) => {
        if (processedKeys.has(key)) return;
        
        const value = categories[key];

        if (!value.startsWith("_") && key.includes("_")) displayNames.push(value);

        processedKeys.add(key);
        processedKeys.add(value);
    });

    return displayNames;
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
        
        Object.assign(feedbackStore, { data: body.feedbacks });
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
        
        Object.assign(bugReportStore, { data: body.reports });
    } finally {
        isFetching.allBugReports = false;
    }
}

export async function submitNewItem(data, type) {
    if (!type) return;

    if (type === "Feedback") {
        const feedback = {
            title: data.title,
            category: data.dropdown,
            message: data.textarea,
            sentiment: data.sentiment,
            route: "",
            appVersion: ""
        };

        const metaData = getMetadata();

        feedback.route = metaData.route;
        feedback.appVersion = metaData.appVersion;

        await addFeedback(feedback);
    } else if (type === "Fehler melden") {
        const bugReport = {
            title: data.title,
            severity: data.dropdown,
            stepsToReproduce: data.textarea,
            route: "",
            appVersion: "",
            os: "",
            browser: "",
            viewport: ""
        };

        const metaData = getMetadata();

        bugReport.route = metaData.route;
        bugReport.appVersion = metaData.appVersion;
        bugReport.os = metaData.os;
        bugReport.browser = metaData.browser;
        bugReport.viewport = metaData.viewport;

        await addBugReport(bugReport);
    }
}

async function addFeedback(feedback) {
    if (isFetching.submitFeedback) return;
    isFetching.submitFeedback = true;

    try {
        const { resp } = await apiAddFeedback(feedback);
        const normalizedResponse = normalizeResponse(resp);

        if (handleGlobalApiError(normalizedResponse)) return;

        if (!normalizedResponse.ok) {
            handleReportHubError(normalizedResponse.errorType, "ADD_FEEDBACK");
            return;
        }

        addToast({
            title: "Feedback abgeschickt",
            subTitle: viewport.isMobile ? "" : "Ihr Feedback wurde erfolgreich abgeschickt.",
            type: "success"
        });
    } finally {
        isFetching.submitFeedback = false;
    }
}

async function addBugReport(bugReport) {
    if (isFetching.submitBugReport) return;
    isFetching.submitBugReport = true;

    try {
        const { resp } = await apiAddBugReport(bugReport);
        const normalizedResponse = normalizeResponse(resp);

        if (handleGlobalApiError(normalizedResponse)) return;

        if (!normalizedResponse.ok) {
            handleReportHubError(normalizedResponse.errorType, "ADD_BUG");
            return;
        }

        addToast({
            title: "Fehler gemeldet",
            subTitle: viewport.isMobile ? "" : "Der Fehler wurde erfolgreich gemeldet.",
            type: "success"
        });
    } finally {
        isFetching.submitBugReport = false;
    }
}

function getMetadata() {
    const metaData = {
        route: "",
        appVersion: "",
        os: "",
        browser: "",
        viewport: ""
    };

    const routeParts = window.location.href.split("/");
    metaData.route = routeParts[routeParts.length - 1];

    metaData.appVersion = appSettings.appVersion;

    if (navigator.userAgentData) {
        const brand = navigator.userAgentData.brands.find(b =>
            b.brand !== 'Chromium' && b.brand !== 'Not(A:Brand)' && b.brand !== 'Not-A.Brand'
        );
        if (brand) {
            metaData.browser = `${brand.brand} ${brand.version}`;
        } else {
            metaData.browser = "N/A";
        }

        metaData.os = navigator.userAgentData.platform;
    } else {
        metaData.browser = "N/A";
        metaData.os = "N/A";
    }

    metaData.viewport = `${window.innerWidth}x${window.innerHeight}`;

    return metaData;
}

export async function deleteFeedback(id) {
    if (!id || currentlyDeleting.FEEDBACK.has(id)) return;
    currentlyDeleting.FEEDBACK.add(id);

    try {
        const { resp } = await apiDeleteFeedback(id);
        const normalizedResponse = normalizeResponse(resp);

        if (handleGlobalApiError(normalizedResponse)) return;

        if (!normalizedResponse.ok) {
            handleReportHubError(normalizedResponse.errorType, "DELETE_FEEDBACK");
            return;
        }

        addToast({
            title: "User Feedback entfernt",
            subTitle: viewport.isMobile ? "" : "Das User Feedback wurde erfolgreich aus dem System entfernt.",
            type: "success"
        });
    } finally {
        currentlyDeleting.FEEDBACK.delete(id);
    }
}

export async function deleteBugReport(id) {
    if (!id || currentlyDeleting.BUG_REPORT.has(id)) return;
    currentlyDeleting.BUG_REPORT.add(id);

    try {
        const { resp } = await apiDeleteBugReport(id);
        const normalizedResponse = normalizeResponse(resp);

        if (handleGlobalApiError(normalizedResponse)) return;

        if (!normalizedResponse.ok) {
            handleReportHubError(normalizedResponse.errorType, "DELETE_BUG");
            return;
        }

        addToast({
            title: "User Feedback entfernt",
            subTitle: viewport.isMobile ? "" : "Das User Feedback wurde erfolgreich aus dem System entfernt.",
            type: "success"
        });
    } finally {
        currentlyDeleting.BUG_REPORT.add(id);
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
        handleReportHubError(normalizedResponse.errorType, "DETAILS_FEEDBACK");
        return;
    }

    return body;
}

async function getBugReportDetails(id) {
    const { resp, body } = await apiGetBugReportDetails(id);
    const normalizedResponse = normalizeResponse(resp);

    if (handleGlobalApiError(normalizedResponse)) return;

    if (!normalizedResponse.ok) {
        handleReportHubError(normalizedResponse.errorType, "DETAILS_BUG");
        return;
    }

    return body;
}