import { writable } from "svelte/store";

export const eventsStore = writable({
    raw: [],
    all: [],
    display: [],
    loading: false
});