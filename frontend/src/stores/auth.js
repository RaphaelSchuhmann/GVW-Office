import { writable } from "svelte/store";
import { getValue } from "../services/store";

/**
 * Svelte store for authentication data
 * @type {import('svelte/store').Writable<{token: string}>}
 */
export const auth = writable({
    token: getValue("authToken"),
});