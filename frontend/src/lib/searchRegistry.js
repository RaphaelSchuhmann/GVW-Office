import { membersStore } from "../stores/members";

const apiUrl = import.meta.env.DEV_API_URL || "http://localhost:3500";

export const searchRegistry = {
    members: {
        endpoint: `${apiUrl}/members/all`,
        store: membersStore,
        fuse: {
            keys: ["name", "surname", "email", "address"],
            threshold: 0.3
        }
    }
}