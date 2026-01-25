import { writable } from "svelte/store";
import { getSettings } from "../services/appSettings";
import { addToast } from "./toasts";

/**
 * Svelte store for application settings
 * @type {import('svelte/store').Writable<{maxMembers: number, scoreCategories: Record<string, string>}>}
 */
export const appSettings = writable({
    maxMembers: 1,  // Dashboard
    scoreCategories: {
        "": "all",
        "all": "Alle Kategorien",
        "Alle Kategorien": "all"
    }, // Library Page Categories
});

/**
 * Loads application settings from the server and updates the store
 * Shows error toast if loading fails
 */
export async function loadSettings() {
    try {
        const settings = await getSettings();
        if (settings.ok) {
            const data = await settings.json();
            appSettings.set(data);
        } else {
            addToast({
                title: "Fehler",
                subTitle: "Beim Laden der globalen App Einstellungen ist ein unerwarteter Fehler aufgetreten.",
                type: "error",
            });
            console.error("Unable to load app settings");
        }
    } catch (err) {
        addToast({
            title: "Fehler",
            subTitle: "Beim Laden der globalen App Einstellungen ist ein unerwarteter Fehler aufgetreten.",
            type: "error",
        });

        console.error("Unable to load app settings: ", err);
    }
}

await loadSettings();