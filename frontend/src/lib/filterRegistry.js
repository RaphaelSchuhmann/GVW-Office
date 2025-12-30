import { eventsStore } from "../stores/events";
import { typeMap } from "../services/events";

const apiUrl = import.meta.env.DEV_API_URL || "http://localhost:3500";

export const filterRegistry = {
    events: {
        endpoint: `${apiUrl}/events/all`,
        store: eventsStore,
        optionMap: typeMap
    }
}