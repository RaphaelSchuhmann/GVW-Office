import { writable } from "svelte/store";

/**
 * Svelte store for events data with filtering support
 * @type {import('svelte/store').Writable<{raw: Array, all: Array, display: Array, loading: boolean}>}
 */
export const eventsStore = writable({
    raw: [],
    display: [],
    loading: false
});

/**
 * Svelte store for events filter state
 * @type {import('svelte/store').Writable<{dropdown: String, tab: String, search: String}>}
 */
export const eventsFilterState = writable({
    dropdown: "",
    tab: "",
    search: ""
});