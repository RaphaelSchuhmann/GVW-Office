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
            if (normalizedResponse.errorType === "NOTFOUND") {
                addToast({
                    title: "Noten nicht gefunden",
                    subTitle: !viewport.isMobile ? "Die Noten die Sie löschen möchten wurden nicht gefunden." : "",
                    type: "error"
                });
            } else if (normalizedResponse.errorType === "BADREQUEST") {
                addToast({
                    title: "Ungültige Daten",
                    subTitle: !viewport.isMobile ? "Die übergebenen Daten sind ungültig. Bitte überprüfen Sie Ihre Eingaben." : "",
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
            subTitle: !viewport.isMobile ? "Der Eintrag wurde erfolgreich gelöscht." : "",
            type: "success"
        });
    } finally {
        isFetching.deleteScore = false;
    }
}

/**
 * Downloads all files associated with a score from the library.
 *
 * Requests the score files from the backend and, on success,
 * creates a temporary object URL for the returned ZIP blob.
 * The browser download is then triggered programmatically.
 *
 * Error cases handled:
 * - `ScoreNotFound` → The requested score does not exist.
 * - `NoFilesFound` → The score exists but has no files attached.
 * - Other API errors → Generic download failure.
 *
 * After the download is triggered, the object URL is revoked
 * to release browser memory.
 *
 * @param {number|string} id - The unique identifier of the score.
 * @returns {Promise<void>}
 */
export async function downloadScoreFiles(id) {
    if (isFetching.downloadScore) return;
    isFetching.downloadScore = true;

    try {
        // Note: The body can contain the error body or the file blob!
        const { resp, body } = await apiDownloadScoreFiles(id);

        const normalizedResponse = normalizeResponse(resp);
        if (handleGlobalApiError(normalizedResponse)) return;

        if (!normalizedResponse.ok) {
            if (normalizedResponse.errorType === "NOTFOUND") {
                if (body?.errorMessage === "ScoreNotFound") {
                    addToast({
                        title: "Noten nicht gefunden",
                        subTitle: !viewport.isMobile ? "Die Noten wurden in der Notenbibliothek nicht gefunden." : "",
                        type: "error"
                    });
                } else if (body?.errorMessage === "NoFilesFound") {
                    addToast({
                        title: "Keine Dateien gefunden",
                        subTitle: !viewport.isMobile ? "Es sind keine Dateien für diese Noten hinterlegt." : "",
                        type: "info"
                    });
                } else {
                    addToast({
                        title: "Unerwarteter Fehler",
                        subTitle: !viewport.isMobile ? "Es ist ein unerwarteter Fehler aufgetreten. Bitte versuchen Sie es später erneut." : "",
                        type: "error"
                    });
                }
            } else {
                addToast({
                    title: "Fehler beim Download",
                    subTitle: !viewport.isMobile ? "Beim Download der Noten ist ein Fehler aufgetreten. Bitte versuchen Sie es später erneut." : "",
                    type: "error"
                });
            }
            return;
        }

        const url = URL.createObjectURL(body);

        const scoreName = libraryStore.raw.find(s => s.id === id)?.title ?? "Noten";

        const a = document.createElement("a");
        try {
            a.href = url;
            a.download = `${scoreName}.zip`;
            a.click();
        } finally {
            setTimeout(() => URL.revokeObjectURL(url), 0);
        }

        addToast({
            title: "Download erfolgreich",
            subTitle: !viewport.isMobile ? "Die Noten wurden erfolgreich aus der Notenbibliothek heruntergeladen." : "",
            type: "success"
        });
    } finally {
        isFetching.downloadScore = false;
    }
}

/**
 * Adds a new score entry to the library.
 *
 * The function constructs a `FormData` payload containing all
 * metadata fields and uploaded files. Files are appended under
 * the `"files"` field so they can be processed by the backend.
 *
 * Error cases handled:
 * - `CONFLICT` → A score with the same title and artist already exists.
 * - `BADREQUEST` → The provided data failed validation.
 * - Other errors → Generic save failure.
 *
 * Displays a success notification when the score is successfully added.
 *
 * @param {Object} score - The score data to create.
 * @param {string} score.scoreId - External or internal identifier.
 * @param {string} score.title - Title of the score.
 * @param {string} score.artist - Artist or composer.
 * @param {string} score.type - Internal category identifier.
 * @param {string[]} score.voices - Voice parts associated with the score.
 * @param {number} score.voiceCount - Number of voices in the score.
 * @param {File[]} score.files - Files to upload for the score.
 * @returns {Promise<void>}
 */
export async function addScore(score) {
    if (isFetching.newScore) return;
    isFetching.newScore = true;

    try {
        const formData = new FormData();

        formData.append("scoreId", score.scoreId);
        formData.append("title", score.title);
        formData.append("artist", score.artist);
        formData.append("type", score.type);
        formData.append("voices", JSON.stringify(score.voices));
        formData.append("voiceCount", String(score.voiceCount));

        for (const file of score.files) {
            formData.append("files", file, file.name);
        }

        const { resp } = await apiAddScore(formData);

        const normalizedResponse = normalizeResponse(resp);
        if (handleGlobalApiError(normalizedResponse)) return;

        if (!normalizedResponse.ok) {
            if (normalizedResponse.errorType === "CONFLICT") {
                addToast({
                    title: "Eintrag bereits vorhanden",
                    subTitle: !viewport.isMobile ? "Es existiert bereits ein Eintrag mit diesem Titel und Künstler in der Notenbibliothek." : "",
                    type: "error"
                });
            } else if (normalizedResponse.errorType === "BADREQUEST") {
                addToast({
                    title: "Ungültige Daten",
                    subTitle: !viewport.isMobile ? "Die übergebenen Daten sind ungültig. Bitte überprüfen Sie Ihre Eingaben." : "",
                    type: "error"
                });
            } else {
                addToast({
                    title: "Fehler beim Speichern",
                    subTitle: !viewport.isMobile ? "Beim Speichern des neuen Eintrags ist ein Fehler aufgetreten. Bitte versuchen Sie es später erneut." : "",
                    type: "error"
                });
            }
            return;
        }

        addToast({
            title: "Eintrag hinzugefügt",
            subTitle: !viewport.isMobile ? "Der neue Eintrag wurde erfolgreich zur Notenbibliothek hinzugefügt." : "",
            type: "success"
        });
    } finally {
        isFetching.newScore = false;
    }
}

/**
 * Updates an existing score entry in the library.
 *
 * The function prepares a `FormData` payload that may contain:
 * - Updated metadata fields
 * - Newly uploaded files
 * - A list of removed files
 *
 * Files are separated into:
 * - `newFiles` → Files that are newly uploaded (`File` instances)
 * - `existingFileNames` → Files already stored on the server
 *
 * The backend receives:
 * - `removedFiles` → File names that should be deleted
 * - `files` → Newly uploaded files
 *
 * Error cases handled:
 * - `BADREQUEST` → Invalid modification data.
 * - `NOTFOUND` → The score no longer exists.
 * - Other errors → Generic save failure.
 *
 * @param {Object} scoreData - Updated score information.
 * @param {number|string} scoreData.id - Unique identifier of the score.
 * @param {string} scoreData.scoreId - External or internal identifier.
 * @param {string} scoreData.title - Title of the score.
 * @param {string} scoreData.artist - Artist or composer.
 * @param {string} scoreData.type - Internal category identifier.
 * @param {string[]} scoreData.voices - Voice parts associated with the score.
 * @param {number} scoreData.voiceCount - Number of voices in the score.
 * @param {(File|string)[]} scoreData.files - Updated file list (existing names or new files).
 * @param {string[]} scoreData.originalFiles - Original file names used to detect removed files.
 * @returns {Promise<boolean>} `true` if the update succeeded, otherwise `false`.
 */
export async function updateScore(scoreData) {
    if (isFetching.updateScore) return false;
    isFetching.updateScore = true;

    try {
        const formData = new FormData();

        formData.append("id", scoreData.id);
        formData.append("scoreId", scoreData.scoreId);
        formData.append("title", scoreData.title);
        formData.append("artist", scoreData.artist);
        formData.append("type", scoreData.type);
        formData.append("voices", JSON.stringify(scoreData.voices));
        formData.append("voiceCount", String(scoreData.voiceCount));
        
        const newFiles = [];
        const existingFileNames = [];

        for (const f of scoreData.files) {
            if (f instanceof File) {
                newFiles.push(f);
            } else if (typeof f === "string") {
                existingFileNames.push(f);
            } else {
                addToast({
                    title: "Ungültige Datei",
                    subTitle: !viewport.isMobile ? "Beim lesen einer Datei ist ein Fehler aufgetreten." : "",
                    type: "error",
                });
            }
        }

        const removedFiles = scoreData.originalFiles.filter(f => !existingFileNames.includes(f));

        formData.append("removedFiles", removedFiles);

        for (const file of newFiles) {
            formData.append("files", file, file.name);
        }

        const { resp } = await apiUpdateScore(formData);

        const normalizedResponse = normalizeResponse(resp);
        if (handleGlobalApiError(normalizedResponse)) return false;

        if (!normalizedResponse.ok) {
            if (normalizedResponse.errorType === "BADREQUEST") {
                addToast({
                    title: "Ungültige Eingabe",
                    subTitle: !viewport.isMobile ? "Die Änderungen an den Noten ist keine gültige Änderung. Bitte versuchen Sie es erneut." : "",
                    type: "error"
                });
            } else if (normalizedResponse.errorType === "NOTFOUND") {
                addToast({
                    title: "Noten nicht gefunden",
                    subTitle: !viewport.isMobile ? "Die Noten wurden in der Notenbibliothek nicht gefunden." : "",
                    type: "error"
                });
            } else {
                addToast({
                    title: "Fehler beim Speichern",
                    subTitle: !viewport.isMobile ? "Beim speichern Ihrer Änderungen ist ein unerwarteter Fehler aufgetreten." : "",
                    type: "error"
                });
            }

            return false;
        }

        addToast({
            title: "Änderungen gespeichert",
            subTitle: !viewport.isMobile ? "Ihre Änderungen wurden erfolgreich gespeichert." : "" ,
            type: "success"
        });

        return true;
    } finally {
        isFetching.updateScore = false;
    }
}