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

let entry = null;

/**
 * Initializes page-specific data handling and filter wiring.
 *
 * Responsibilities:
 * - Prevents re-initialization if the same page is already active
 * - Unsubscribes previous filter and data store subscriptions
 * - Clears any active periodic fetch interval
 * - Registers new subscriptions for filter state and raw data changes
 * - Performs an initial data fetch
 * - Starts periodic background fetching (every 20 seconds)
 *
 * @param pageKey Unique identifier used to resolve the page entry from the filter registry
 */
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

    entry = filterRegistry[pageKey];

    currentFilterStateUnsubscribe = entry.filterState.subscribe(() => {
        processFilters();
    });

    currentDataStoreUnsubscribe = entry.store.subscribe((store) => {
        if (store.raw === lastRaw) return; // Only update data when raw got updated
        lastRaw = store.raw;
        processFilters();
    });

    await fetchAndSetRaw();

    fetchIntervalId = setInterval(() => {
        fetchAndSetRaw();
    }, 20000);
}

/**
 * Applies the active filter state to the current raw dataset.
 *
 * Processing steps:
 * 1. Start with the store's `raw` dataset
 * 2. Apply dropdown filtering (by type)
 * 3. Apply tab filtering (by status)
 * 4. Apply fuzzy search using Fuse.js if:
 *    - A search term exists
 *    - The dataset is non-empty
 *    - All configured Fuse keys exist on the data items
 * 5. Update the store's `display` field with the filtered result
 *
 * Ensures the `display` array is always a shallow copy to maintain reactivity.
 */
function processFilters() {
    let working = get(entry.store).raw ?? [];
    const filterState = get(entry.filterState);

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

    entry.store.update(store => ({ ...store, display: Array.isArray(working) ? [...working] : [] }));
}

/**
 * Fetches fresh data from the API and updates the corresponding store.
 *
 * Handles:
 * - Duplicate request prevention via `isFetching`
 * - API fetch request
 * - Global error delegation
 * - Store update on successful response
 *
 * @async
 * @function fetchAndSetRaw
 * @returns {Promise<void>}
 */
export async function fetchAndSetRaw() {
    if (isFetching) return;
    isFetching = true;

    const { resp, body } = await entry.fetch();
    const normalizedResponse = normalizeResponse(resp);
    if (handleGlobalApiError(normalizedResponse)) {
        isFetching = false;
        return;
    }

    entry.store.update(store => ({ ...store, raw: body.data }));

    isFetching = false;
}