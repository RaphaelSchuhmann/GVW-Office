// import { usersStore } from "../stores/usersStore";

const apiUrl = import.meta.env.DEV_API_URL || "http://localhost:3500";

// Example store:
// import { writable } from "svelte/store";
//
// export const usersStore = writable({
//     raw: [],
//     results: [],
//     loading: false
// });

export const searchRegistry = {
    // Example:
    // users: {
    //     endpoint: `${apiUrl}/user/all`,
    //     store: usersStore,
    //     fuse: {
    //         keys: ["name", "email"],
    //         threshold: 0.3
    //     }
    // },
    // Add more here
}