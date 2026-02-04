import { writable } from "svelte/store";

/**
 * Svelte store for current user data
 * @type {import('svelte/store').Writable<{name: string, email: string, role: string, phone: string, address: string, loaded: boolean, lastFetched: Date | null}>}
 */
export const user = writable({
    name: "",
    email: "",
    role: "",
    phone: "",
    address: "",
    loaded: false,
    lastFetched: null,
});