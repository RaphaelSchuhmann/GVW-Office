import { writable } from "svelte/store";

export const membersStore = writable({
    raw: [],
    results: [],
    loading: false
});

export const voiceMap = {
    "tenor1": "1. Tenor",
    "tenor2": "2. Tenor",
    "bass1": "1. Bass",
    "bass2": "2. Bass"
};

export const statusMap = {
    "active": "Aktiv",
    "passive": "Passiv"
}