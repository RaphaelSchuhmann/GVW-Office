import { writable } from "svelte/store";

/**
 * Svelte store for library data with filtering support
 * @type {import('svelte/store').Writable<{raw: Array, all: Array, display: Array, loading: boolean}>}
 */
export const libraryStore = writable({
    raw: [],
    all: [],
    display: [],
    loading: false
});