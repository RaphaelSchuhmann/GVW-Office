/**
 * Global reactive state for the current user data.
 */
export const user = $state({
    name: "",
    email: "",
    role: "",
    phone: "",
    address: "",
    loaded: false,
    lastFetched: 0,
});