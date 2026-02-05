import { writable } from "svelte/store";

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