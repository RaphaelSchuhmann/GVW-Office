import { writable } from "svelte/store";

/**
 * Svelte store for toast notifications
 * @type {import('svelte/store').Writable<Array<{id: string, title: string, subTitle: string, type: string}>>}
 */
export const toasts = writable([]);

/**
 * Adds a new toast notification to the store
 * @param {Object} options - Toast configuration
 * @param {string} options.title - Toast title
 * @param {string} options.subTitle - Toast subtitle/message
 * @param {string} [options.type="info"] - Toast type (info, success, error, warning)
 * @param {number} [options.timeout=5000] - Auto-dismiss timeout in milliseconds
 */
export function addToast({ title, subTitle, type = "info", timeout = 5000 }) {
    const id = crypto.randomUUID();

    toasts.update(t => [...t, { id: id, title: title, subTitle: subTitle, type: type }]);

    setTimeout(() => {
        toasts.update(t => t.filter(t => t.id !== id));
    }, timeout);
}

/**
 * Removes a toast notification by ID
 * @param {string} id - Toast ID to remove
 */
export function removeToast(id) {
    toasts.update(t => t.filter(toast => toast.id !== id));
}