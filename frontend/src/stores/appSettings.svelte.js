/**
 * Svelte store for application settings
 */
export const appSettings = $state({
    maxMembers: 1,  // Dashboard
    scoreCategories: {
        "": "all",
        "all": "Alle Kategorien",
        "Alle Kategorien": "all"
    }, // Library Page Categories
});