import { get } from "svelte/store";
import { appSettings, loadSettings } from "../stores/appSettings";
import { auth } from "../stores/auth";
import { addToast } from "../stores/toasts";
import { logout } from "./user";
import { push } from "svelte-spa-router";
import { libraryStore } from "../stores/library";

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
            Authorization: `Bearer ${get(auth).token}`
        },
        body: JSON.stringify({ type, displayName })
    });

    if (resp.status === 200) {
        addToast({
            title: "Kategorie hinzugefügt",
            subTitle: "Die Kategorie wurde erfolgreich im System hinzugefügt und kann ab sofort verwendet werden.",
            type: "success"
        });
    } else if (resp.status === 400) {
        addToast({
            title: "Ungültige Daten",
            subTitle: "Die angegebenen Daten sind fehlerhaft oder existieren bereits. Bitte prüfen Sie Ihre Eingabe und versuchen Sie es erneut.",
            type: "error"
        });
    } else if (resp.status === 401) {
        // Auth token invalid / unauthorized
        addToast({
            title: "Ungültiges Token",
            subTitle: "Ihr Authentifizierungstoken ist ungültig oder abgelaufen. Bitte melden Sie sich erneut an, um Zugriff zu erhalten.",
            type: "error"
        });
        logout();
        await push("/?cpwErr=false");
        return;
    } else {
        // internal server error / unknown error
        addToast({
            title: "Interner Serverfehler",
            subTitle: "Beim Verarbeiten Ihrer Anfrage ist ein Fehler aufgetreten. Bitte versuchen Sie es erneut.",
            type: "error"
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
            Authorization: `Bearer ${get(auth).token}`
        },
        body: JSON.stringify({ type })
    });

    if (resp.status === 200) {
        addToast({
            title: "Kategorie entfernt",
            subTitle: "Die Kategorie wurde erfolgreich aus dem System entfernt.",
            type: "success"
        });
    } else if (resp.status === 401) {
        // Auth token invalid / unauthorized
        addToast({
            title: "Ungültiges Token",
            subTitle: "Ihr Authentifizierungstoken ist ungültig oder abgelaufen. Bitte melden Sie sich erneut an, um Zugriff zu erhalten.",
            type: "error"
        });
        logout();
        await push("/?cpwErr=false");
        return;
    } else {
        // internal server error / unknown error
        addToast({
            title: "Interner Serverfehler",
            subTitle: "Beim Verarbeiten Ihrer Anfrage ist ein Fehler aufgetreten. Bitte versuchen Sie es erneut.",
            type: "error"
        });
    }

    await loadSettings();
}


/**
 * Gets all available library categories display names
 * @returns {string[]} Array of display names including "Alle Kategorien"
 */
export function getLibraryCategories(includeAll) {
    const categories = get(appSettings).scoreCategories || {};
    const displayNames = [];
    const processedKeys = new Set();
    
    Object.keys(categories).forEach(key => {
        // Skip default entries and already processed keys
        if (key === "" || key === "all" || categories[key] === "all" || processedKeys.has(key)) return;
        
        const value = categories[key];
        // If this key maps to a value that maps back to this key, we have a bidirectional pair
        if (categories[value] === key) {
            // Take the one without underscores as the display name
            const displayName = key.includes('_') ? value : key;
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
    const items = get(libraryStore).raw

    let count = 0;
    for (const item in items) {
        if (item.type === categoryType) count++;
    }

    return count;
}