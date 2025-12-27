import { writable } from "svelte/store";

export const membersStore = writable({
    raw: [],
    results: [],
    loading: false
});