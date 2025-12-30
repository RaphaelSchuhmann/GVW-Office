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

    const validPages = ["events", "reports"];
    if (!validPages.includes(page)) {
        console.warn(`Type ${page} is not a valid type`);
        page = "none";
    }

    const config = filterRegistry[page];
    const { store, endpoint, optionMap } = config;
    let intervalId;
    let isFetching = false;

    async function fetchData() {
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
        }
    }

    function filter(selected) {
        if (!(selected in optionMap)) {
            addToast({
                title: "Unerwarteter Fehler",
                subTitle: "Es ist ein unerwarteter Fehler aufgetreten. Bitte kontaktieren Sie umgehend den Vorstand!",
                type: "error"
            });
            return;
        }

        const filterFor = optionMap[selected];

        if (filterFor === "all") {
            store.update(u => ({ ...u, display: u.all }));
        } else {
            const results = $store.all.filter(item => item.type === filterFor);
            store.update(u => ({ ...u, display: results }));
        }
    }

    // Do a first filter using selected "Alle Typen"
    onMount(() => {
        fetchData();

        intervalId = setInterval(fetchData, 30000);

        filter("Alle Typen");
    });

    onDestroy(() => {
        clearInterval(intervalId);
    });
</script>

<div class="flex w-full items-center gap-2">
    <span class="material-symbols-rounded text-gv-dark-text text-icon-dt-2">filter_alt</span>
    <Dropdown options={options} onChange={filter} selected="Alle Typen"/>
</div>