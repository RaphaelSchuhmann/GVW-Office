/**
 * Stores a value in localStorage with error handling
 * @param {string} key - Storage key
 * @param {string} value - Value to store
 */
export function setValue(key, value) {
    try {
        localStorage.setItem(key, value);
    } catch (err) {
        console.error("setValue failed: ", err);
    }
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
    } catch (err) {
        console.error("getValue failed: ", err);
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
    } catch (err) {
        console.error("clearValue failed: ", err);
    }
}