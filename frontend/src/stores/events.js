import { writable } from "svelte/store";

/**
 * Svelte store for events data with filtering support
 * @type {import('svelte/store').Writable<{raw: Array, all: Array, display: Array, loading: boolean}>}
 */
export const eventsStore = writable({
    raw: [],
    all: [],
    display: [],
    loading: false
});