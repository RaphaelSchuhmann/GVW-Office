/**
 * Svelte store for help center data with filtering support
 */
export const helpCenterStore = $state({
    raw: [],
    display: [],
    loading: false,
    activeCategory: "",
});

/**
 * Svelte store for help center filter state
 */
export const helpCenterFilterState = $state({
    dropdown: "",
    tab: "",
    search: ""
});