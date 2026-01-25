<script>
    import Dropdown from "./Dropdown.svelte";
    import { auth } from "../stores/auth";
    import { filterRegistry } from "../lib/filterRegistry";
    import { addToast } from "../stores/toasts";
    import { logout } from "../services/user";
    import { push } from "svelte-spa-router";
    import { onDestroy, onMount } from "svelte";
    export let options = [];
    export let page = "";
    export let debounce = false;
    export let textWrap = true;
    export let customDefault = "";

    const validPages = ["events", "reports", "library"];
    if (!validPages.includes(page)) {
        console.warn(`Type ${page} is not a valid type`);
        page = "none";
    }

    let config = filterRegistry[page];
    let { store, endpoint, optionMap } = config;
    let intervalId;
    let configIntervalId;
    let isFetching = false;

    /**
     * Updates the config from the registry to get latest optionMap
     */
    function updateConfig() {
        config = filterRegistry[page];
        const newConfig = config;
        store = newConfig.store;
        endpoint = newConfig.endpoint;
        optionMap = newConfig.optionMap;
    }

    /**
     * Fetches data from the API endpoint and updates the store
     * Handles authentication errors and prevents concurrent requests
     */
    export async function fetchData() {
        if (isFetching) return;
        isFetching = true;

        store.update(u => ({ ...u, loading: true }));

        try {
            const resp = await fetch(endpoint, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${$auth.token}`
                }
            });
            const json = await resp.json();
            const data = json.data || json;

            if (resp.status === 200) {
                store.update(u => ({ ...u, loading: false, raw: data, all: data }));
                config.applyFilters(store); // Apply filters after data is loaded
            } else if (resp.status === 401) {
                // Auth token invalid / unauthorized
                addToast({
                    title: "Ungültiges Token",
                    subTitle: "Ihr Authentifizierungstoken ist ungültig oder abgelaufen. Bitte melden Sie sich erneut an, um Zugriff zu erhalten.",
                    type: "error"
                });
                logout();
                await push("/?cpwErr=false");
            } else {
                // internal server error / unknown error
                addToast({
                    title: "Interner Serverfehler",
                    subTitle: "Beim Verarbeiten Ihrer Anfrage ist ein Fehler aufgetreten. Bitte versuchen Sie es erneut.",
                    type: "error"
                });
            }
        } finally {
            isFetching = false;
        }
    }

    /**
     * Applies the selected filter option to the data
     * Updates the store's type filter and triggers filter application
     * @param {string} selected - The selected filter option
     */
    function filter(selected) {
        if (!(selected in optionMap)) {
            addToast({
                title: "Unerwarteter Fehler",
                subTitle: "Es ist ein unerwarteter Fehler aufgetreten.",
                type: "error"
            });
            return;
        }

        const filterFor = optionMap[selected];
        
        // Update type filter state and apply combined filters
        store.update(u => ({ ...u, typeFilter: filterFor }));
        config.applyFilters(store);
    }

    // Do a first filter using selected "Alle Typen"
    onMount(() => {
        if (debounce) {
            fetchData();
            intervalId = setInterval(fetchData, 30000);
        }

        // Update config every 5 seconds for dynamic optionMap changes
        configIntervalId = setInterval(updateConfig, 5000);

        filter(customDefault ? customDefault : "Alle Typen");
    });

    onDestroy(() => {
        clearInterval(intervalId);
        clearInterval(configIntervalId);
    });
</script>

<div class="flex w-full items-center gap-2">
    <span class="material-symbols-rounded text-gv-dark-text text-icon-dt-2">tune</span>
    <Dropdown options={options} onChange={filter} selected={customDefault ? customDefault : "Alle Typen"} textWrap={textWrap}/>
</div>