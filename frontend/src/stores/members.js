import { writable } from "svelte/store";

/**
 * Svelte store for members data with search support
 * @type {import('svelte/store').Writable<{raw: Array, results: Array, loading: boolean}>}
 */
export const membersStore = writable({
    raw: [],
    results: [],
    loading: false
});