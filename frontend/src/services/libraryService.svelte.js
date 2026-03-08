import { appSettings } from "../stores/appSettings.svelte";
import { libraryStore } from "../stores/library.svelte";
import { apiDeleteScore } from "../api/apiLibrary.svelte";
import { normalizeResponse } from "../api/http.svelte";
import { handleGlobalApiError } from "../api/globalErrorHandler.svelte";
import { addToast } from "../stores/toasts.svelte";
import { viewport } from "../stores/viewport.svelte";

export const voiceMap = {
    "t": "Tenor",
    "t1": "1. Tenor",
    "t2": "2. Tenor",
    "b": "Bass",
    "b1": "1. Bass",
    "b2": "2. Bass",
    "s": "Sopran",
    "a": "Alt",
};

let isFetching = {
    newScore: false,
    updateScore: false,
    deleteScore: false
};

export function getLibraryCategories(includeAll) {
    const categories = appSettings.scoreCategories || {};
    const displayNames = [];
    const processedKeys = new Set();

    Object.keys(categories).forEach((key) => {
        // Skip default entries and already processed keys
        if (key === "" || key === "all" || categories[key] === "all" || processedKeys.has(key)) return;

        const value = categories[key];
        // If this key maps to a value that maps back to this key, we have a bidirectional pair
        if (categories[value] === key) {
            let displayName;

            // Check if either key or value has underscores
            if (key.includes("_") || value.includes("_")) {
                // Take the one without underscores as the display name
                displayName = key.includes("_") ? value : key;
            } else {
                // Neither has underscores, take the one with at least one capital letter
                const keyHasCapital = /[A-Z]/.test(key);
                displayName = keyHasCapital ? key : value;
            }

            displayNames.push(displayName);
            processedKeys.add(key);
            processedKeys.add(value);
        }
    });

    return includeAll ? ["Alle Kategorien", ...displayNames] : displayNames;
}

export function getCategoryCount(category) {
    const categoriesMap = appSettings.scoreCategories || {};
    const categoryType = categoriesMap[category];
    const items = libraryStore.raw;

    let count = 0;
    for (const item in items) {
        if (items[item].type === categoryType) count++;
    }

    return count;
}

export async function deleteScore(id) {
    if (isFetching.deleteScore) return;
    isFetching.deleteScore = true;

    try {
        const { resp } = await apiDeleteScore(id);

        const normalizedResponse = normalizeResponse(resp);
        if (handleGlobalApiError(normalizedResponse)) return;

        if (!normalizedResponse.ok) {
            if (normalizedResponse.errorType === "NOTFOUND") {
                addToast({
                    title: "Noten nicht gefunden",
                    subTitle: !viewport.isMobile ?  "Die Noten die Sie löschen möchten wurden nicht gefunden." : "",
                    type: "error"
                });
            } else if (normalizedResponse.errorType === "BADREQUEST") {
                addToast({
                    title: "Ungültige Daten",
                    subTitle: !viewport.isMobile ?  "Die übergebenen Daten sind ungültig. Bitte überprüfen Sie Ihre Eingaben." : "",
                    type: "error"
                });
            } else {
                addToast({
                    title: "Fehler beim Löschen",
                    subTitle: !viewport.isMobile ? "Beim Löschen des Eintrags ist ein Fehler aufgetreten. Bitte versuchen Sie es später erneut." : "",
                    type: "error"
                });
            }
            return;
        }

        addToast({
            title: "Eintrag gelöscht",
            subTitle: !viewport.isMobile ?  "Der Eintrag wurde erfolgreich gelöscht." : "",
            type: "success"
        });
    } finally {
        isFetching.deleteScore = false;
    }
}