<script>
    import Fuse from "fuse.js";
    import { filterRegistry } from "../lib/filterRegistry";
    import { auth } from "../stores/auth";

    import { marginMap } from "../lib/dynamicStyles";
    import { addToast } from "../stores/toasts";
    import { logout } from "../services/userService";
    import { push } from "svelte-spa-router";
    export let marginTop = "";
    export let placeholder = "Suchen...";
    export let disabled = false;
    export let width = "w-full";
    export let doDebounce = true;
    export let isMobile = false;

    export let page = "";

    let searchEl;
    let fuse;
    let debounce;

    const config = filterRegistry[page];
    const { store, endpoint, fuse: fuseConfig, applyFilters } = config;

    /**
     * Fetches data from the API endpoint and initializes Fuse search
     * Handles authentication errors and updates the store with results
     */
    export async function fetchData() {
        store.update(u => ({ ...u, loading: true }));

        const resp = await fetch(endpoint, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${$auth.token}`
            }
        });
        const json = await resp.json();

        const data = json.data || json;

        if (resp.status === 200) {
            fuse = new Fuse(data, fuseConfig);

            store.set({ raw: data, all: data, searchResults: data, display: data, loading: false });
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
    }

    /**
     * Handles search input with debouncing
     * Filters results using Fuse.js or shows all data if input is empty
     * @param {string} value - The search input value
     */
    function onInput(value) {
        if (doDebounce) {
            clearTimeout(debounce);
            debounce = setTimeout(() => performSearch(value), 250);
        } else {
            performSearch(value);
        }
    }

    function performSearch(value) {
        if (!value) {
            store.update(s => ({ ...s, searchResults: s.all }));
        } else {
            const results = fuse.search(value).map(r => r.item);
            store.update(s => ({ ...s, searchResults: results }));
        }
        
        if (applyFilters) {
            applyFilters(store);
        }
    }

    $: if (page && doDebounce) {
        fetchData();
    }

    /**
     * Focuses the search input element
     */
    export function focus() {
        searchEl.focus();
    }
</script>

<div class={`flex items-stretch ${width} ${marginMap[marginTop]}`}>
    <div class="flex items-center justify-center px-3 mt-1 rounded-tl-1 rounded-bl-1 bg-gv-input-bg">
        <span class={`material-symbols-rounded ${!isMobile ? "text-icon-dt-4" : "text-icon-dt-6"} text-gv-input-placeholder`}>search</span>
    </div>
    <input
        bind:this={searchEl}
        on:blur
        placeholder={placeholder}
        disabled={disabled}
        on:input={() => onInput(searchEl.value)}
        class={`rounded-tr-1 rounded-br-1 w-full p-2 pr-3 bg-gv-input-bg text-black outline-gv-primary mt-1 ${!isMobile ? "text-dt-6" : "text-dt-7"}`} />
</div>