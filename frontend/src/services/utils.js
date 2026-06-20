/**
 * Capitalizes the first letter of each word in a string
 * @param {string} str - String to capitalize
 * @returns {string} String with each word capitalized
 */
export function capitalizeWords(str) {
    return str
        .toLowerCase()
        .replaceAll(/(^|[\s-_])\w/g, match => match.toUpperCase());
}

/**
 * Determines if a string contains a number
 * @param {string} str - String to check
 * @returns {boolean} True if string contains a number
 */
export function determineChoirType(str) {
    return /\d/.test(str);
}

/**
 * Escapes special HTML characters in a string to help prevent HTML injection/XSS.
 *
 * Replaces the following characters with their HTML entity equivalents:
 * - `&` → `&amp;`
 * - `<` → `&lt;`
 * - `>` → `&gt;`
 * - `"` → `&quot;`
 * - `'` → `&#039;`
 *
 * If the input is null, undefined, or otherwise falsy, an empty string is returned.
 *
 * @param {string} text - The text to sanitize.
 * @returns {string} The sanitized string with escaped HTML characters.
 */
export function sanitize(text) {
    if (!text) return "";
    return text
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll("\"", "&quot;")
        .replaceAll("'", "&#039;");
}

/**
 * Triggers a browser download for the provided Blob.
 *
 * A temporary object URL is created and assigned to a dynamically
 * generated anchor element to initiate the download. The resulting
 * file is saved as a ZIP archive using the supplied name.
 *
 * The created object URL is automatically revoked after the download
 * has been triggered to prevent memory leaks.
 *
 * @param {Blob} blob - ZIP archive data to download.
 * @param {string} zipName - Base filename used for the downloaded ZIP file.
 *
 * @returns {void}
 */
export function triggerFileDownload(blob, zipName) {
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `${zipName}.zip`;
    a.click();

    // Cleanup URL reference in the next event loop tick
    setTimeout(() => URL.revokeObjectURL(url), 0);
}

export function renameFile(originalFile, newName) {
    const fileOptions = { type: originalFile.type };
    return new File([originalFile], newName, fileOptions);
}