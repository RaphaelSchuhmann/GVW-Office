import { writable } from "svelte/store";

/**
 * Svelte store for library data with filtering support
 * @type {import('svelte/store').Writable<{raw: Array, all: Array, display: Array, loading: boolean}>}
 */
export const libraryStore = writable({
    raw: [],
    display: [],
    loading: false
});

/**
 * Svelte store for library filter state
 * @type {import('svelte/store').Writable<{dropdown: String, tab: String, search: String}>}
 */
export const libraryFilterState = writable({
    dropdown: "",
    tab: "",
    search: ""
});