/**
 * Stores a value in localStorage with error handling
 * @param {string} key - Storage key
 * @param {string} value - Value to store
 */
export function setValue(key, value) {
    try {
        localStorage.setItem(key, value);
    } catch (_) {}
}

/**
 * Retrieves a value from localStorage with error handling
 * @param {string} key - Storage key to retrieve
 * @returns {string} Stored value or empty string if not found/error
 */
export function getValue(key) {
    try {
        const value = localStorage.getItem(key);
        return value ?? "";
    } catch (_) {
        return "";
    }
}

/**
 * Removes a value from localStorage with error handling
 * @param {string} key - Storage key to remove
 */
export function clearValue(key) {
    try {
        localStorage.removeItem(key);
    } catch (_) {}
}