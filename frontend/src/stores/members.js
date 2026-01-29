import { writable } from "svelte/store";

/**
 * Svelte store for members data with search support
 * @type {import('svelte/store').Writable<{raw: Array, all: Array, display: Array, loading: boolean}>}
 */
export const membersStore = writable({
    raw: [],
    all: [],
    display: [],
    loading: false
});