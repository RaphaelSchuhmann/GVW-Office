import { appSettings } from "../stores/appSettings.svelte";
import { libraryStore } from "../stores/library.svelte";
import { apiAddScore, apiDeleteScore, apiDownloadScoreFiles, apiUpdateScore } from "../api/apiLibrary.svelte";
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
    "a": "Alt"
};

let isFetching = {
    newScore: false,
    updateScore: false,
    deleteScore: false,
    downloadScore: false
};

/**
 * Returns a list of display names for all available score categories.
 *
 * The function reads the category mapping from `appSettings.scoreCategories`.
 * Categories are internally stored as bidirectional key-value pairs
 * (e.g., `type -> displayName` and `displayName -> type`). This function
 * detects those pairs and extracts a single user-facing display name.
 *
 * Selection logic:
 * - Entries with empty keys, `"all"`, or already processed pairs are ignored.
 * - If one of the pair contains underscores, the value without underscores
 *   is used as the display name.
 * - Otherwise, the entry containing at least one capital letter is used.
 *
 * Optionally prepends `"Alle Kategorien"` to the list.
 *
 * @param {boolean} includeAll - Whether the result should include the default
 * `"Alle Kategorien"` entry at the beginning of the list.
 * @returns {string[]} An array of category display names.
 */
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

/**
 * Counts how many library entries belong to a specific category.
 *
 * The function resolves the internal category type using
 * `appSettings.scoreCategories` and iterates over all entries
 * in `libraryStore.raw` to determine how many scores match it.
 *
 * @param {string} category - The display name of the category.
 * @returns {number} The number of scores assigned to the category.
 */
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

/**
 * Deletes a score from the library.
 *
 * Sends a delete request to the backend and handles the response.
 * Depending on the returned error type, different user-facing
 * notifications are displayed.
 *
 * Supported error cases:
 * - `NOTFOUND` → The score no longer exists.
 * - `BADREQUEST` → Invalid input data was provided.
 * - Other errors → Generic deletion failure.
 *
 * A success toast is displayed when the score is deleted successfully.
 *
 * @param {number|string} id - The unique identifier of the score to delete.
 * @returns {Promise<void>}
 */
export async function deleteScore(id) {
    if (isFetching.deleteScore) return;
    isFetching.deleteScore = true;

    try {
        const { resp } = await apiDeleteScore(id);

        const normalizedResponse = normalizeResponse(resp);
        if (handleGlobalApiError(normalizedResponse)) return;

        if (!normalizedResponse.ok) {
            handleDeleteError(normalizedResponse.errorType);
            return;
        }

        addToast({
            title: "Eintrag gelöscht",
            subTitle: viewport.isMobile ? "" : "Der Eintrag wurde erfolgreich gelöscht.",
            type: "success"
        });
    } finally {
        isFetching.deleteScore = false;
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
            title: "Noten nicht gefunden",
            subTitle: "Die Noten die Sie löschen möchten wurden nicht gefunden."
        },
        BADREQUEST: {
            title: "Ungültige Daten",
            subTitle: "Die übergebenen Daten sind ungültig. Bitte überprüfen Sie Ihre Eingaben."
        },
        DEFAULT: {
            title: "Fehler beim Löschen",
            subTitle: "Beim Löschen des Eintrags ist ein Fehler aufgetreten. Bitte versuchen Sie es später erneut."
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
 * Downloads all score files for a given library entry as a ZIP archive.
 *
 * Features:
 * - Prevents duplicate requests using `isFetching.downloadScore`
 * - Handles global API errors centrally
 * - Handles domain-specific download errors
 * - Triggers a browser download on success
 * - Displays success/error toasts
 *
 * @param {string} id - ID of the score/library entry to download
 * @returns {Promise<void>}
 */
export async function downloadScoreFiles(id) {
    if (isFetching.downloadScore) return;
    isFetching.downloadScore = true;

    try {
        const { resp, body } = await apiDownloadScoreFiles(id);
        const normalizedResponse = normalizeResponse(resp);

        if (handleGlobalApiError(normalizedResponse)) return;

        if (!normalizedResponse.ok) {
            handleDownloadError(normalizedResponse, body);
            return;
        }

        triggerFileDownload(body, id);

        addToast({
            title: "Download erfolgreich",
            subTitle: viewport.isMobile ? "" : "Die Noten wurden erfolgreich heruntergeladen.",
            type: "success"
        });
    } finally {
        isFetching.downloadScore = false;
    }
}

/**
 * Triggers a browser download for a given Blob by creating a temporary object URL.
 *
 * The downloaded file name is derived from the library entry title.
 * Falls back to "Noten.zip" if no title is found.
 *
 * Automatically revokes the object URL to prevent memory leaks.
 *
 * @param {Blob} blob - File data to download (ZIP archive)
 * @param {string} id - ID used to resolve the score name
 * @returns {void}
 */
function triggerFileDownload(blob, id) {
    const url = URL.createObjectURL(blob);
    const scoreName = libraryStore.raw.find(s => s.id === id)?.title ?? "Noten";

    const a = document.createElement("a");
    a.href = url;
    a.download = `${scoreName}.zip`;
    a.click();

    // Cleanup URL reference in the next event loop tick
    setTimeout(() => URL.revokeObjectURL(url), 0);
}

/**
 * Handles API error responses specific to score file downloads.
 *
 * Distinguishes between:
 * - NOTFOUND errors with detailed backend messages (e.g. missing score or files)
 * - Generic failures for all other error types
 *
 * Error mapping:
 * - ScoreNotFound → score entry does not exist
 * - NoFilesFound → no files attached to the score
 * - DEFAULT_NOT_FOUND → fallback for unknown NOTFOUND cases
 * - GENERIC_FAILURE → fallback for all other errors
 *
 * Displays a toast message adjusted for viewport (mobile vs desktop).
 *
 * @param {Object} response - Normalized API response
 * @param {string} response.errorType - High-level error type (e.g. NOTFOUND)
 * @param {Object} [body] - Optional response body containing detailed error info
 * @param {string} [body.errorMessage] - Specific backend error identifier
 *
 * @returns {void}
 */
function handleDownloadError(response, body) {
    const errorMap = {
        ScoreNotFound: {
            title: "Noten nicht gefunden",
            subTitle: "Die Noten wurden in der Notenbibliothek nicht gefunden.",
            type: "error"
        },
        NoFilesFound: {
            title: "Keine Dateien gefunden",
            subTitle: "Es sind keine Dateien für diese Noten hinterlegt.",
            type: "info"
        },
        DEFAULT_NOT_FOUND: {
            title: "Unerwarteter Fehler",
            subTitle: "Es ist ein unerwarteter Fehler aufgetreten.",
            type: "error"
        },
        GENERIC_FAILURE: {
            title: "Fehler beim Download",
            subTitle: "Beim Download der Noten ist ein Fehler aufgetreten.",
            type: "error"
        }
    };

    let config;
    if (response.errorType === "NOTFOUND") {
        config = errorMap[body?.errorMessage] || errorMap.DEFAULT_NOT_FOUND;
    } else {
        config = errorMap.GENERIC_FAILURE;
    }

    addToast({
        title: config.title,
        subTitle: viewport.isMobile ? "" : config.subTitle,
        type: config.type
    });
}

/**
 * Creates a new score entry in the library, including file uploads.
 *
 * Features:
 * - Prevents duplicate requests using `isFetching.newScore`
 * - Prepares multipart FormData (JSON + files)
 * - Handles global API errors
 * - Handles domain-specific validation errors
 * - Displays success/error toasts
 *
 * @param {Object} score - Score data including metadata and files
 * @param {File[]} score.files - Files to upload
 * @returns {Promise<void>}
 */
export async function addScore(score) {
    if (isFetching.newScore) return;
    isFetching.newScore = true;

    try {
        const formData = prepareScoreFormData(score);
        score.files.forEach(file => formData.append("files", file, file.name));

        const { resp } = await apiAddScore(formData);
        const normalizedResponse = normalizeResponse(resp);

        if (handleGlobalApiError(normalizedResponse)) return;

        if (!normalizedResponse.ok) {
            showScoreErrorToast(normalizedResponse.errorType, "ADD");
            return;
        }

        addToast({
            title: "Eintrag hinzugefügt",
            subTitle: viewport.isMobile ? "" : "Der neue Eintrag wurde erfolgreich zur Notenbibliothek hinzugefügt.",
            type: "success"
        });
    } finally {
        isFetching.newScore = false;
    }
}

/**
 * Updates an existing score entry, including file changes.
 *
 * Handles:
 * - New file uploads
 * - Retaining existing files
 * - Detecting and sending removed files
 *
 * Features:
 * - Prevents duplicate requests using `isFetching.updateScore`
 * - Prepares multipart FormData (JSON + file diffs)
 * - Handles global API errors
 * - Handles domain-specific validation errors
 * - Displays success/error toasts
 *
 * @param {Object} score - Score data including metadata and file state
 * @param {(File|string)[]} score.files - Mixed array of new files (File) and existing file names (string)
 * @param {string[]} score.originalFiles - Original file names before modification
 *
 * @returns {Promise<boolean>} `true` if update succeeded, otherwise `false`
 */
export async function updateScore(score) {
    if (isFetching.updateScore) return false;
    isFetching.updateScore = true;

    try {
        const formData = prepareScoreFormData(score);

        const newFiles = score.files.filter(f => f instanceof File);
        const existingNames = score.files.filter(f => typeof f === "string");
        const removedFiles = score.originalFiles.filter(f => !existingNames.includes(f));

        formData.append("removedFiles", removedFiles);
        newFiles.forEach(f => formData.append("files", f, f.name));

        const { resp } = await apiUpdateScore(formData);
        const normalizedResponse = normalizeResponse(resp);

        if (handleGlobalApiError(normalizedResponse)) return false;

        if (!normalizedResponse.ok) {
            showScoreErrorToast(normalizedResponse.errorType, "UPDATE");
            return false;
        }

        addToast({
            title: "Änderungen gespeichert",
            subTitle: "Ihre Änderungen wurden erfolgreich gespeichert.",
            type: "success"
        });

        return true;
    } finally {
        isFetching.updateScore = false;
    }
}

/**
 * Prepares a FormData object containing the core score metadata as JSON.
 *
 * The metadata is serialized into a Blob and appended under "scoreData",
 * allowing it to be sent alongside file uploads in a multipart request.
 *
 * Note:
 * - `id` may be undefined for new scores (valid for create operations)
 *
 * @param {Object} score - Score metadata
 * @returns {FormData} FormData object containing serialized score data
 */
function prepareScoreFormData(score) {
    const formData = new FormData();
    const scoreData = {
        id: score.id, // Will be undefined for new scores, which is fine
        scoreId: score.scoreId,
        title: score.title,
        artist: score.artist,
        type: score.type,
        voices: score.voices,
        voiceCount: score.voiceCount,
    };

    formData.append("scoreData", new Blob([JSON.stringify(scoreData)], {
        type: "application/json"
    }));

    return formData;
}

/**
 * Displays error toasts for score-related operations (add/update).
 *
 * Error handling:
 * - CONFLICT → duplicate score entry
 * - BADREQUEST → invalid or malformed input
 * - NOTFOUND → score not found (update case)
 * - DEFAULT → fallback for unknown errors
 *
 * The displayed message may vary slightly depending on the context (ADD vs UPDATE).
 * Subtitle visibility is adjusted based on viewport (mobile vs desktop).
 *
 * @param {string} errorType - Error identifier from API
 * @param {"ADD"|"UPDATE"} context - Operation context
 *
 * @returns {void}
 */
function showScoreErrorToast(errorType, context) {
    const configs = {
        CONFLICT: { title: "Eintrag bereits vorhanden", sub: "Ein Eintrag mit diesem Titel und Künstler existiert bereits." },
        BADREQUEST: {
            title: context === "ADD" ? "Ungültige Daten" : "Ungültige Eingabe",
            sub: "Die übergebenen Daten sind ungültig. Bitte prüfen Sie Ihre Eingaben."
        },
        NOTFOUND: { title: "Noten nicht gefunden", sub: "Die Noten wurden in der Notenbibliothek nicht gefunden." },
        DEFAULT: { title: "Fehler beim Speichern", sub: "Beim Speichern ist ein unerwarteter Fehler aufgetreten." }
    };

    const config = configs[errorType] || configs.DEFAULT;

    addToast({
        title: config.title,
        subTitle: viewport.isMobile ? "" : config.sub,
        type: "error"
    });
}