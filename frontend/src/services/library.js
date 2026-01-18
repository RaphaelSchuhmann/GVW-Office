// Default library types - can be extended dynamically
export let libraryTypeMap = {
    "": "all",
    "all": "Alle Kategorien",
    "Alle Kategorien": "all",
    "Rock": "rock",
    "rock": "Rock",
};

export const voiceMap = {
    "t": "Tenor",
    "t1": "1. Tenor",
    "t2": "2. Tenor",
    "b": "Bass",
    "b1": "1. Bass",
    "b2": "2. Bass",
    "s": "Sopran",
    "a": "Alt"
}

/**
 * Adds a new library type to the map
 * @param {string} type - The type key to add
 * @param {string} displayName - The display name for the type
 */
export function addLibraryType(type, displayName) {
    libraryTypeMap[type] = displayName;
    libraryTypeMap[displayName] = type;
}

/**
 * Removes a library type from the map
 * @param {string} type - The type key to remove
 */
export function removeLibraryType(type) {
    const displayName = libraryTypeMap[type];
    if (displayName && displayName !== "all") {
        delete libraryTypeMap[type];
        delete libraryTypeMap[displayName];
    }
}

/**
 * Gets all available library types (excluding "all")
 * @returns {string[]} Array of type keys
 */
export function getLibraryTypes() {
    return Object.keys(libraryTypeMap).filter(key => key !== "" && key !== "all" && libraryTypeMap[key] !== "all");
}