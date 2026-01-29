import { get } from "svelte/store";
import { appSettings, loadSettings } from "../stores/appSettings";
import { auth } from "../stores/auth";
import { addToast } from "../stores/toasts";
import { logout } from "./user";
import { push } from "svelte-spa-router";
import { libraryStore } from "../stores/library";
import { getFileExtensionFromPath, getFileNameFromPath } from "./utils";

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

const apiUrl = __API_URL__;

/**
 * Adds a new library type to the map
 * @param {string} type - The type key to add
 * @param {string} displayName - The display name for the type
 */
export async function addCategory(type, displayName) {
    const resp = await fetch(`${apiUrl}/settings/update/categories/add`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${get(auth).token}`,
        },
        body: JSON.stringify({ type, displayName }),
    });

    if (resp.status === 200) {
        addToast({
            title: "Kategorie hinzugefügt",
            subTitle:
                "Die Kategorie wurde erfolgreich im System hinzugefügt und kann ab sofort verwendet werden.",
            type: "success",
        });
    } else if (resp.status === 400) {
        addToast({
            title: "Ungültige Daten",
            subTitle:
                "Die angegebenen Daten sind fehlerhaft oder existieren bereits. Bitte prüfen Sie Ihre Eingabe und versuchen Sie es erneut.",
            type: "error",
        });
    } else if (resp.status === 401) {
        // Auth token invalid / unauthorized
        addToast({
            title: "Ungültiges Token",
            subTitle:
                "Ihr Authentifizierungstoken ist ungültig oder abgelaufen. Bitte melden Sie sich erneut an, um Zugriff zu erhalten.",
            type: "error",
        });
        logout();
        await push("/?cpwErr=false");
        return;
    } else {
        // internal server error / unknown error
        addToast({
            title: "Interner Serverfehler",
            subTitle:
                "Beim Verarbeiten Ihrer Anfrage ist ein Fehler aufgetreten. Bitte versuchen Sie es erneut.",
            type: "error",
        });
    }

    await loadSettings();
}

/**
 * Removes a library type from the map
 * @param {string} type - The type key to remove
 */
export async function removeCategory(type) {
    const resp = await fetch(`${apiUrl}/settings/update/categories/remove`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${get(auth).token}`,
        },
        body: JSON.stringify({ type }),
    });

    if (resp.status === 200) {
        addToast({
            title: "Kategorie entfernt",
            subTitle:
                "Die Kategorie wurde erfolgreich aus dem System entfernt.",
            type: "success",
        });
    } else if (resp.status === 401) {
        // Auth token invalid / unauthorized
        addToast({
            title: "Ungültiges Token",
            subTitle:
                "Ihr Authentifizierungstoken ist ungültig oder abgelaufen. Bitte melden Sie sich erneut an, um Zugriff zu erhalten.",
            type: "error",
        });
        logout();
        await push("/?cpwErr=false");
        return;
    } else {
        // internal server error / unknown error
        addToast({
            title: "Interner Serverfehler",
            subTitle:
                "Beim Verarbeiten Ihrer Anfrage ist ein Fehler aufgetreten. Bitte versuchen Sie es erneut.",
            type: "error",
        });
    }

    await loadSettings();
}

export async function addScore(scoreData) {
    const formData = new FormData();

    formData.append("title", scoreData.title);
    formData.append("artist", scoreData.artist);
    formData.append("type", scoreData.type);
    formData.append("voices", JSON.stringify(scoreData.voices));
    formData.append("voiceCount", String(scoreData.voiceCount));

    for (const path of scoreData.paths) {
        try {
            const buffer = await window.api.readFile(path);
            const fileName = `${getFileNameFromPath(path)}.${getFileExtensionFromPath(path)}`;

            const blob = new Blob([buffer]);
            formData.append("files", blob, fileName);
        } catch (err) {
            addToast({
                title: "Datei konnte nicht gelesen werden",
                subTitle: `Die Datei "${path}" konnte nicht gelesen werden. Bitte überprüfen Sie, ob die Datei existiert.`,
                type: "error",
            });
            return;
        }
    }

    const resp = await fetch(`${apiUrl}/library/new`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${get(auth).token}`,
        },
        body: formData,
    });

    if (resp.status === 200) {
        addToast({
            title: "Noten hinzugefügt",
            subTitle:
                "Die Noten wurden erfolgreich zur Notenbibliothek hinzugefügt.",
            type: "success",
        });
    } else if (resp.status === 400) {
        addToast({
            title: "Ungültige Daten",
            subTitle:
                "Einige der von Ihnen eingegebenen Daten sind fehlerhaft. Bitte prüfen Sie Ihre Eingabe und versuchen Sie es erneut.",
            type: "error",
        });
    } else if (resp.status === 409) {
        addToast({
            title: "Noten bereits vorhanden",
            subTitle:
                "Es existiert bereits ein Eintrag mit diesem Titel und Künstler in der Notenbibliothek.",
            type: "error",
        });
    } else if (resp.status === 401) {
        // Auth token invalid / unauthorized
        addToast({
            title: "Ungültiges Token",
            subTitle:
                "Ihr Authentifizierungstoken ist ungültig oder abgelaufen. Bitte melden Sie sich erneut an, um Zugriff zu erhalten.",
            type: "error",
        });
        logout();
        await push("/?cpwErr=false");
        return;
    } else {
        // internal server error / unknown error
        addToast({
            title: "Interner Serverfehler",
            subTitle:
                "Beim Verarbeiten Ihrer Anfrage ist ein Fehler aufgetreten. Bitte versuchen Sie es erneut.",
            type: "error",
        });
    }
}

export async function updateScore(scoreData) {
    const formData = new FormData();

    formData.append("id", scoreData.id);
    formData.append("title", scoreData.title);
    formData.append("artist", scoreData.artist);
    formData.append("type", scoreData.type);
    formData.append("voices", JSON.stringify(scoreData.voices));
    formData.append("voiceCount", String(scoreData.voiceCount));
    
    const deletedFiles = scoreData.originalFiles.filter(f => !scoreData.paths.includes(f));
    formData.append("removedFiles", JSON.stringify(deletedFiles));

    for (const path of scoreData.paths) {
        try {
            if (!scoreData.originalFiles.includes(path)) {
                const buffer = await window.api.readFile(path);
                const fileName = `${getFileNameFromPath(path)}.${getFileExtensionFromPath(path)}`;
    
                const blob = new Blob([buffer]);
                formData.append("files", blob, fileName);
            }
        } catch (err) {
            addToast({
                title: "Datei konnte nicht gelesen werden",
                subTitle: `Die Datei "${path}" konnte nicht gelesen werden. Bitte überprüfen Sie, ob die Datei existiert.`,
                type: "error",
            });
            return;
        }
    }

    const resp = await fetch(`${apiUrl}/library/update`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${get(auth).token}`,
        },
        body: formData,
    });

    if (resp.status === 200) {
        addToast({
            title: "Änderungen gespeichert",
            subTitle: "Die Änderungen am Notenmaterial erfolgreich in der Notenbibliothek gespeichert.",
            type: "success",
        });
    } else if (resp.status === 400) {
        addToast({
            title: "Ungültige Daten",
            subTitle: "Einige der von Ihnen eingegebenen Daten sind fehlerhaft. Bitte prüfen Sie Ihre Eingabe und versuchen Sie es erneut.",
            type: "error",
        });
    } else if (resp.status === 404) {
        addToast({
            title: "Noten nicht gefunden",
            subTitle: "Das von ihnen bearbeitete Notenmaterial konnte nicht gefunden werden. Bitte versuchen Sie es erneut.",
            type: "error",
        });
    } else if (resp.status === 401) {
        // Auth token invalid / unauthorized
        addToast({
            title: "Ungültiges Token",
            subTitle: "Ihr Authentifizierungstoken ist ungültig oder abgelaufen. Bitte melden Sie sich erneut an, um Zugriff zu erhalten.",
            type: "error",
        });
        logout();
        await push("/?cpwErr=false");
        return;
    } else {
        // internal server error / unknown error
        addToast({
            title: "Interner Serverfehler",
            subTitle: "Beim Verarbeiten Ihrer Anfrage ist ein Fehler aufgetreten. Bitte versuchen Sie es erneut.",
            type: "error",
        });
    }
}

export async function deleteScore(scoreId) {
    return await fetch(`${apiUrl}/library/delete`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${get(auth).token}`,
        },
        body: JSON.stringify({ id: scoreId }),
    });
}

export async function downloadScoreFiles(scoreId) {
    const resp = await fetch(`${apiUrl}/library/${scoreId}/files`, {
        method: "GET",
        headers: {
            Authorization: `Bearer ${get(auth).token}`,
        },
    });

    let body = null;

    if (!resp.ok) {
        try {
            body = await resp.json();
        } catch {
            body = null;
        }
    }

    if (resp.status === 200) {
        const blob = await resp.blob();
        const url = URL.createObjectURL(blob);

        const a = document.createElement("a");
        a.href = url;
        a.download = "Noten.zip";
        a.click();
        
        addToast({
            title: "Download erfolgreich",
            subTitle:
            "Die Noten wurden erfolgreich aus der Notenbibliothek gedownloaded.",
            type: "success",
        });

        URL.revokeObjectURL(url);
    } else if (resp.status === 404) {
        if (body.errorMessage === "ScoreNotFound") {
            addToast({
                title: "Noten nicht gefunden",
                subTitle:
                    "Die Noten wurden in der Notenbibliothek nicht gefunden.",
                type: "error",
            });
        } else if (body.errorMessage === "NoFilesFound") {
            addToast({
                title: "Keine Dateien gefunden",
                subTitle: "Es sind keine Dateien für diese Noten hinterlegt.",
                type: "info",
            });
        } else {
            addToast({
                title: "Unerwarteter Fehler",
                subTitle: "Es ist ein unerwarteter Fehler aufgetreten. Bitte versuchen Sie es später erneut.",
                type: "error"
            });
        }
        return;
    } else if (resp.status === 400) {
        addToast({
            title: "Ungültige Daten",
            subTitle:
                "Es wurden fehlerhafte Daten übermittelt. Bitte versuchen Sie es später erneut.",
            type: "error",
        });
        return;
    } else if (resp.status === 401) {
        // Auth token invalid / unauthorized
        addToast({
            title: "Ungültiges Token",
            subTitle:
                "Ihr Authentifizierungstoken ist ungültig oder abgelaufen. Bitte melden Sie sich erneut an, um Zugriff zu erhalten.",
            type: "error",
        });
        logout();
        await push("/?cpwErr=false");
        return;
    } else {
        // internal server error / unknown error
        addToast({
            title: "Interner Serverfehler",
            subTitle:
                "Beim Verarbeiten Ihrer Anfrage ist ein Fehler aufgetreten. Bitte versuchen Sie es erneut.",
            type: "error",
        });
        return;
    }
}

/**
 * Gets all available library categories display names
 * @returns {string[]} Array of display names including "Alle Kategorien"
 */
export function getLibraryCategories(includeAll) {
    const categories = get(appSettings).scoreCategories || {};
    const displayNames = [];
    const processedKeys = new Set();

    Object.keys(categories).forEach((key) => {
        // Skip default entries and already     processed keys
        if (
            key === "" ||
            key === "all" ||
            categories[key] === "all" ||
            processedKeys.has(key)
        )
            return;

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
                const valueHasCapital = /[A-Z]/.test(value);
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
    const categoriesMap = get(appSettings).scoreCategories || {};
    const categoryType = categoriesMap[category];
    const items = get(libraryStore).raw;

    let count = 0;
    for (const item in items) {
        if (items[item].type === categoryType) count++;
    }

    return count;
}
