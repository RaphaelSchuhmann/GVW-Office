import { eventsStore } from "../stores/events";
import { membersStore } from "../stores/members";
import { reportsStore } from "../stores/reports";
import { libraryStore } from "../stores/library";
import { statusMap, typeMap } from "../services/events";
import { reportsTypeMap } from "../services/reports";
import { appSettings } from "../stores/appSettings";
import { get } from "svelte/store";

const apiUrl = __API_URL__;

/**
 * Filter registry containing both filter and search configurations
 * 
 * Usage:
 * 1. Import: import { filterRegistry } from "../lib/filterRegistry";
 * 2. Get config: const config = filterRegistry[page];
 * 3. Use config properties in components
 * 
 * Component Usage Examples:
 * 
 * SearchBar:
 * <SearchBar page="events" doDebounce={true} />
 * 
 * Filter (Dropdown):
 * <Filter page="events" options={["Alle Typen", "Meeting", "Event"]} />
 * 
 * FilterTabBar:
 * <FilterTabBar page="events" contents={["Alle", "Aktiv", "Archiviert"]} selected="Alle" />
 * 
 * Combined Usage (all components work together):
 * <SearchBar page="events" />
 * <Filter page="events" options={typeOptions} />
 * <FilterTabBar page="events" contents={statusTabs} selected="Alle" />
 * 
 * @type {Object<string, Object>}
 */
/**
 * Applies type and status filters to a store's data
 * @param {Object} store - Svelte store to update with filtered data
 */
function applyFilters(store) {
    store.update(state => {
        let filtered = state.searchResults || state.all;
        
        // Apply type filter (from dropdown)
        if (state.typeFilter && state.typeFilter !== "all") {
            filtered = filtered.filter(item => item.type === state.typeFilter);
        }
        
        // Apply status filter (from tabs)
        if (state.statusFilter && state.statusFilter !== "all") {
            filtered = filtered.filter(item => item.status === state.statusFilter);
        }
        
        return { ...state, display: filtered };
    });
}

/**
 * Filter registry containing both filter and search configurations
 * @type {Object<string, Object>}
 */
export const filterRegistry = {
    events: {
        endpoint: `${apiUrl}/events/all`,
        store: eventsStore,
        optionMap: typeMap,
        tabMap: statusMap,
        applyFilters,
        fuse: {
            keys: ["title", "description", "type", "status"],
            threshold: 0.3
        }
    },
    members: {
        endpoint: `${apiUrl}/members/all`,
        store: membersStore,
        fuse: {
            keys: ["name", "surname", "email", "address"],
            threshold: 0.3
        }
    },
    reports: {
        endpoint: `${apiUrl}/reports/all`,
        store: reportsStore,
        optionMap: reportsTypeMap,
        applyFilters,
        fuse: {
            keys: ["title", "author", "description", "type"], // Add search for date
            threshold: 0.3
        }
    },
    library: {
        endpoint: `${apiUrl}/library/all`,
        store: libraryStore,
        get optionMap() { return get(appSettings).scoreCategories; },
        applyFilters,
        fuse: {
            keys: ["title", "artist", "voices"],
            threshold: 0.3
        }
    }
}