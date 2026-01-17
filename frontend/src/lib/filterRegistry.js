import { eventsStore } from "../stores/events";
import { statusMap, typeMap } from "../services/events";

const apiUrl = import.meta.env.DEV_API_URL || "http://localhost:3500";

/**
 * Applies type and status filters to a store's data
 * @param {Object} store - Svelte store to update with filtered data
 */
function applyFilters(store) {
    store.update(state => {
        let filtered = state.all;
        
        // Apply type filter (from dropdown)
        if (state.typeFilter !== "all") {
            filtered = filtered.filter(item => item.type === state.typeFilter);
        }
        
        // Apply status filter (from tabs)
        if (state.statusFilter !== "all") {
            filtered = filtered.filter(item => item.status === state.statusFilter);
        }
        
        return { ...state, display: filtered };
    });
}

/**
 * Registry of filter configurations for different pages
 * Contains endpoint URLs, stores, option mappings, and filter functions
 * @type {Object<string, Object>}
 */
export const filterRegistry = {
    events: {
        endpoint: `${apiUrl}/events/all`,
        store: eventsStore,
        optionMap: typeMap,
        tabMap: statusMap,
        applyFilters
    }
}