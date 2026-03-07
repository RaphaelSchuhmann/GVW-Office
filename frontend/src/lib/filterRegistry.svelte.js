import { eventsFilterState, eventsStore } from "../stores/events.svelte";
import { membersFilterState, membersStore } from "../stores/members.svelte";
import { libraryFilterState, libraryStore } from "../stores/library.svelte";
import { statusMap, typeMap } from "../services/eventsService.svelte";
import { apiGetMembers } from "../api/apiMembers.svelte";
import { apiGetEvents } from "../api/apiEvents.svelte";
import { getScores } from "../api/apiLibrary.svelte";
import { appSettings } from "../stores/appSettings.svelte";

/**
 * Filter registry containing both filter and search configurations
 * @type {Object<string, Object>}
 */
export const filterRegistry = {
    members: {
        fetch: apiGetMembers,
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
        fetch: apiGetEvents,
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
        get optionMap() { return appSettings.scoreCategories; },
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