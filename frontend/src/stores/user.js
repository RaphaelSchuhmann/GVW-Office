import { writable } from "svelte/store";

/**
 * Svelte store for current user data
 * @type {import('svelte/store').Writable<{name: string, email: string, role: string, phone: string, address: string, loaded: boolean, lastFetched: number}>}
 */
export const user = writable({
    name: "",
    email: "",
    role: "",
    phone: "",
    address: "",
    loaded: false,
    lastFetched: 0,
});