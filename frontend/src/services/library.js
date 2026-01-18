import { get } from "svelte/store";
import { appSettings } from "../stores/appSettings";
import { auth } from "../stores/auth";
import { addToast } from "../stores/toasts";
import { logout } from "./user";
import { push } from "svelte-spa-router";

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
            subTitle: "Die Kategorie wurde erfolgreich im System hinzugefügt und kann absofort verwendet werden.",
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
}


/**
 * Gets all available library categories display names
 * @returns {string[]} Array of display names including "Alle Kategorien"
 */
export function getLibraryCategories() {
    const categories = get(appSettings).scoreCategories || {};
    const displayNames = Object.keys(categories)
        .filter(key => {
            // Skip default entries
            if (key === "" || key === "all" || categories[key] === "all") return false;
            // Only include keys where the reverse mapping exists (meaning this is a display name)
            return categories[categories[key]] === key;
        });

    return ["Alle Kategorien", ...displayNames];
}