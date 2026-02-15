import { filterRegistry } from "../lib/filterRegistry";
import { get } from "svelte/store";
import Fuse from "fuse.js";
import { normalizeResponse } from "../api/http";
import { handleGlobalApiError } from "../api/globalErrorHandler";

let currentPageKey = "";

let currentFilterStateUnsubscribe = null;
let currentDataStoreUnsubscribe = null;

let lastRaw = null;

let isFetching = false;
let fetchIntervalId = null;

export async function init(pageKey) {
    if (currentPageKey === pageKey) return;

    // Unsub previous filter state
    if (currentFilterStateUnsubscribe) {
        currentFilterStateUnsubscribe();
        currentFilterStateUnsubscribe = null;
    }

    // Unsub previous store
    if (currentDataStoreUnsubscribe) {
        currentDataStoreUnsubscribe();
        currentDataStoreUnsubscribe = null;
    }

    // Reset periodic fetching
    if (fetchIntervalId) {
        clearInterval(fetchIntervalId);
        fetchIntervalId = null;
    }

    currentPageKey = pageKey;

    const entry = filterRegistry[pageKey];

    currentFilterStateUnsubscribe = entry.filterState.subscribe(() => {
        processFilters(entry);
    });

    currentDataStoreUnsubscribe = entry.store.subscribe((store) => {
        if (store.raw === lastRaw) return; // Only update data when raw got updated
        lastRaw = store.raw;
        processFilters(entry);
    });

    await fetchAndSetRaw(entry);

    fetchIntervalId = setInterval(() => {
        fetchAndSetRaw(entry);
    }, 20000);
}

function processFilters(entry) {
    let working = get(entry.store).raw;
    const filterState = get(entry.filterState);

    console.log(working);

    if (filterState.dropdown !== "" && filterState.dropdown !== "all") {
        working = working.filter(item => item.type === filterState.dropdown);
    }

    if (filterState.tab !== "" && filterState.tab !== "all") {
        working = working.filter(item => item.status === filterState.tab);
    }

    if (filterState.search !== "" && working.length > 0 && entry.fuse.keys.every(key => key in working[0])) {
        const fuse = new Fuse(working, entry.fuse);
        working = fuse.search(filterState.search).map(res => res.item);
    }

    entry.store.update(store => ({ ...store, display: working }));
}

export async function fetchAndSetRaw(entry) {
    if (isFetching) return;
    isFetching = true;

    entry.store.update(store => ({ ...store, loading: true}));

    const { resp, body } = await entry.fetch();
    const normalizedResponse = normalizeResponse(resp);
    if (handleGlobalApiError(normalizedResponse)) {
        isFetching = false;
        entry.store.update(store => ({ ...store, loading: false}));
        return;
    }

    entry.store.update(store => ({ ...store, raw: body, loading: false}));

    isFetching = false;
}