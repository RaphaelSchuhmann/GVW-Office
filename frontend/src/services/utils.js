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

const ALLOWED_TAGS = new Set([
    "b",
    "i",
    "u",
    "strong",
    "em",
    "a",
    "span",
    "img",
]);

/**
 * Sanitizes HTML input by normalizing whitespace and removing disallowed tags.
 *
 * This function is designed for contenteditable/editor use cases where the
 * input originates from `innerHTML` and may contain browser-inserted artifacts
 * such as `&nbsp;`, excessive whitespace, or unwanted HTML elements.
 *
 * Processing steps:
 * - Converts `&nbsp;` and non-breaking spaces to normal spaces
 * - Normalizes newline-related whitespace artifacts
 * - Parses the HTML string into a DOM structure
 * - Removes all HTML tags except those explicitly allowed in `ALLOWED_TAGS`
 * - Preserves text content inside disallowed tags
 * - Returns cleaned HTML as a string
 *
 * Allowed tags (via `ALLOWED_TAGS`):
 * - b, i, u, strong, em
 *
 * Note:
 * This is not a full security sanitizer against malicious HTML injection.
 * It is intended for controlled editor content where the input source is trusted
 * (e.g. contenteditable blocks), not arbitrary user-generated HTML from external sources.
 *
 * @param {string} html - Raw HTML string (typically from `innerHTML`)
 * @returns {string} Cleaned and normalized HTML string
 */
export function sanitize(html) {
    if (!html) return "";

    html = html
        .replaceAll(/&nbsp;/g, " ")
        .replaceAll(/\u00A0/g, " ")
        .replaceAll(/[ \t]+(\r?\n)/g, "$1")
        .replaceAll(/\n\s+/g, "\n");

    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");

    function clean(node) {
        [...node.childNodes].forEach(child => {
            if (child.nodeType === Node.ELEMENT_NODE) {
                const tag = child.tagName.toLowerCase();

                if (!ALLOWED_TAGS.has(tag)) {
                    // replace disallowed tag with its text content
                    child.replaceWith(...child.childNodes);
                } else {
                    clean(child);
                }
            }
        });
    }

    clean(doc.body);

    return doc.body.innerHTML.trim();
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