import { writable } from "svelte/store";

/**
 * Svelte store for members data
 * @type {import('svelte/store').Writable<{raw: Array, display: Array, loading: boolean}>}
 */
export const membersStore = writable({
    raw: [],
    display: [],
    loading: false
});

/**
 * Svelte store for members filter state
 * @type {import('svelte/store').Writable<{dropdown: String, tab: String, search: String}>}
 */
export const membersFilterState = writable({
    dropdown: "",
    tab: "",
    search: ""
});