import { filterRegistry } from "../lib/filterRegistry.svelte";
import Fuse from "fuse.js";
import { normalizeResponse } from "../api/http.svelte";
import { handleGlobalApiError } from "../api/globalErrorHandler.svelte";

let isFetching = $state(false);
let currentPageKey = $state("");
let entry = $state(null);

let fetchIntervalId = null;
let cleanupEffect = null;

/**
 * Initializes page-specific data handling and filter wiring.
 *
 * Responsibilities:
 * - Prevents re-initialization if the same page is already active
 * - Clears any active periodic fetch interval
 * - Performs an initial data fetch
 * - Starts periodic background fetching (every 20 seconds)
 *
 * @param pageKey Unique identifier used to resolve the page entry from the filter registry
 */
export async function init(pageKey) {
    if (currentPageKey === pageKey) return;

    // Reset periodic fetching
    if (fetchIntervalId) clearInterval(fetchIntervalId);

    currentPageKey = pageKey;
    entry = filterRegistry[pageKey];

    cleanupEffect = $effect.root(() => {
        $effect(() => {
            const _ = [
                entry?.store.raw,
                entry?.filterState.search,
                entry?.filterState.dropdown,
                entry?.filterState.tab
            ];

            processFilters();
        });
    });

    // Initial fetch
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
export function processFilters() {
    if (!entry) return;

    let working = entry.store.raw ?? [];
    const filterState = entry.filterState;

    if (filterState.dropdown !== "" && filterState.dropdown !== "all") {
        working = working.filter(item => item.type === filterState.dropdown);
    }

    if (filterState.tab !== "" && filterState.tab !== "all") {
        working = working.filter(item => item.status === filterState.tab);
    }

    if (filterState.search !== "" && working.length > 0) {
        const fuse = new Fuse(working, entry.fuse);
        working = fuse.search(filterState.search).map(res => res.item);
    }

    entry.store.display = working;
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
    if (isFetching || !entry) return;
    isFetching = true;

    try {
        const { resp, body } = await entry.fetch();
        const normalizedResponse = normalizeResponse(resp);

        if (handleGlobalApiError(normalizedResponse)) return;

        entry.store.raw = body.data;

        processFilters();
    } finally {
        isFetching = false;
    }
}