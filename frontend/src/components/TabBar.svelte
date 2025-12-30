<script>
    import Tab from "./Tab.svelte";
    import { marginMap } from "../lib/dynamicStyles";
    import { filterRegistry } from "../lib/filterRegistry";
    import { onDestroy, onMount } from "svelte";
    import { addToast } from "../stores/toasts";
    import { logout } from "../services/user";
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
    const { store, endpoint, tabMap } = config;
    let intervalId;
    let isFetching = false;

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

        const results = $store.raw.filter(item => item.status === filterFor);
        store.update(u => ({ ...u, all: results }));
    }

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
    });

    onDestroy(() => {
        clearInterval(intervalId);
    });
</script>
<div class={`flex w-full items-stretch p-1 rounded-full bg-gv-input-bg ${marginMap[marginTop]} gap-2 overflow-x-auto overflow-y-hidden`}>
    {#each tabs as tab}
        <Tab selected={selected === tab.title} on:click={() => { selected = tab.title; filter() }}>{tab.title} ({tab.count})</Tab>
    {/each}
</div>