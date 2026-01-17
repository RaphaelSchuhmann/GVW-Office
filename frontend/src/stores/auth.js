import { writable } from "svelte/store";

/**
 * Svelte store for authentication data
 * @type {import('svelte/store').Writable<{token: string}>}
 */
export const auth = writable({
    token: "",
});