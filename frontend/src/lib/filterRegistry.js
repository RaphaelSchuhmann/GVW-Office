import { eventsFilterState, eventsStore } from "../stores/events";
import { membersFilterState, membersStore } from "../stores/members";
import { libraryFilterState, libraryStore } from "../stores/library";
import { statusMap, typeMap } from "../services/events";
import { appSettings } from "../stores/appSettings";
import { get } from "svelte/store";
import { getMembers } from "../api/apiMembers";
import { getEvents } from "../api/apiEvents";
import { getScores } from "../api/apiLibrary";

/**
 * Filter registry containing both filter and search configurations
 * @type {Object<string, Object>}
 */
export const filterRegistry = {
    members: {
        fetch: getMembers,
        store: membersStore,
        filterState: membersFilterState,
        fuse: {
            keys: ["name", "surname", "email", "address"],
            threshold: 0.3
        },
        config: {
            search: {
                placeholder: "Mitglied suchen..."
            }
        }
    },
    events: {
        fetch: getEvents,
        store: eventsStore,
        filterState: eventsFilterState,
        optionMap: typeMap,
        tabMap: statusMap,
        config: {
            dropdown: {
                options: ["Alle Typen", "Proben", "Meeting", "Konzerte", "Sonstiges"]
            },
            tab: {
                contents: ["Bevorstehend", "Abgeschlossen"]
            }
        }
    },
    library: {
        fetch: getScores,
        store: libraryStore,
        filterState: libraryFilterState,
        get optionMap() { return get(appSettings).scoreCategories; },
        fuse: {
            keys: ["title", "artist", "voices"],
            threshold: 0.3
        },
        config: {
            search: {
                placeholder: "Noten durchsuchen..."
            },
            dropdown: {
                customDefault: "Alle Kategorien"
            },
        }
    }
}