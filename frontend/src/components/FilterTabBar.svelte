<script>
    import { marginMap } from "../lib/dynamicStyles";
    import { filterRegistry } from "../lib/filterRegistry";
    import { onDestroy, onMount } from "svelte";
    import { addToast } from "../stores/toasts";
    import { logout } from "../services/userService";
    import { push } from "svelte-spa-router";
    import { auth } from "../stores/auth";

    export let contents = [];
    export let selected = "";
    export let marginTop = "";
    export let debounce = true; // Flag to set if it should debounce every 30 seconds
    export let page = "";

    const validPages = ["events", "library"];
    if (!validPages.includes(page)) {
        console.warn(`Type ${page} is not a valid type`);
        page = "none";
    }

    let tabs = [];
    for (const item of contents) {
        tabs.push({ title: item, count: 0 });
    }

    const config = filterRegistry[page];
    const { store, endpoint, tabMap, applyFilters } = config;
    let intervalId;
    let isFetching = false;

    // Animation variables
    let tabElements = [];
    let sliderStyle = "";

    /**
     * Updates the position and width of the sliding background indicator
     * Positions the slider behind the currently selected tab
     */
    function updateSliderPosition() {
        const selectedIndex = tabs.findIndex(tab => tab.title === selected);
        if (selectedIndex >= 0 && tabElements[selectedIndex]) {
            const selectedTab = tabElements[selectedIndex];
            const { offsetLeft, offsetWidth } = selectedTab;
            sliderStyle = `transform: translateX(${offsetLeft - 3}px); width: ${offsetWidth}px;`;
        }
    }

    $: if (selected) {
        setTimeout(updateSliderPosition, 0); // Wait for DOM update
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
                applyFilters(store);
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
            generateCount();
        }
    }

    /**
     * Applies the selected tab filter to the data
     * Updates the store's status filter and triggers filter application
     */
    function filter() {
        if (!(selected in tabMap)) {
            addToast({
                title: "Unerwarteter Fehler",
                subTitle: "Es ist ein unerwarteter Fehler aufgetreten. Bitte kontaktieren Sie umgehend den Vorstand!",
                type: "error"
            });
            return;
        }

        const filterFor = tabMap[selected];

        // Update status filter state and apply combined filters
        store.update(u => ({ ...u, statusFilter: filterFor }));
        applyFilters(store);
    }

    /**
     * Generates count of items for each tab based on current data
     * Updates the tabs array with item counts for display
     */
    function generateCount() {
        tabs = tabs.map(tab => {
            const filterFor = tabMap[tab.title];
            const results = $store.raw.filter(item => item.status === filterFor);
            return { ...tab, count: results.length };
        });
    }

    onMount(() => {
        if (debounce) {
            fetchData();
            intervalId = setInterval(fetchData, 30000);
        }

        filter();
        updateSliderPosition();
    });

    onDestroy(() => {
        clearInterval(intervalId);
    });
</script>
<div
    class={`relative flex w-full items-stretch p-1 rounded-full bg-gv-input-bg ${marginMap[marginTop]} gap-2 overflow-x-auto overflow-y-hidden`}>
    <!-- Sliding background -->
    <div
        class="absolute top-1 bottom-1 bg-white rounded-full transition-all duration-300 ease-out z-0"
        style={sliderStyle}
    ></div>

    {#each tabs as tab, index}
        <button
            bind:this={tabElements[index]}
            class="relative z-10 w-full p-1 rounded-full flex items-center justify-center text-center text-dt-5 text-gv-dark cursor-pointer hover:bg-gv-hover-effect/50 transition-colors duration-150"
            on:click={() => { selected = tab.title; filter() }}
        >
            {tab.title} ({tab.count})
        </button>
    {/each}
</div>