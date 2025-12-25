<script>
    import Fuse from "fuse.js";
    import { searchRegistry } from "../lib/searchRegistry";
    import { auth } from "../stores/auth";

    import { marginMap } from "../lib/dynamicStyles";
    import { addToast } from "../stores/toasts";
    import { logout } from "../services/user";
    import { push } from "svelte-spa-router";
    export let marginTop = "";
    export let placeholder = "Suchen...";
    export let disabled = false;
    export let width = "w-full";

    export let page = "";

    let searchEl;
    let fuse;
    let debounce;

    const config = searchRegistry[page];
    const { store, endpoint, fuse: fuseConfig } = config;

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
            fuse = new Fuse(data.members, fuseConfig);

            store.set({ raw: data.members, results: data.members, loading: false });
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

    function onInput(value) {
        clearTimeout(debounce);
        debounce = setTimeout(() => {
            if (!value) {
                store.update(s => ({ ...s, results: s.raw}));
                return;
            }

            const results = fuse.search(value).map(r => r.item);
            store.update(s => ({ ...s, results }));
        }, 250);
    }

    $: if (page) {
        fetchData();
    }

    export function focus() {
        searchEl.focus();
    }
</script>

<div class={`flex items-stretch ${width} ${marginMap[marginTop]}`}>
    <div class="flex items-center justify-center px-3 mt-1 rounded-tl-1 rounded-bl-1 bg-gv-input-bg">
        <span class="material-symbols-rounded text-icon-dt-4 text-gv-input-placeholder">search</span>
    </div>
    <input
        bind:this={searchEl}
        on:blur
        placeholder={placeholder}
        disabled={disabled}
        on:input={() => onInput(searchEl.value)}
        class="rounded-tr-1 rounded-br-1 w-full p-2 pr-3 bg-gv-input-bg text-black outline-gv-primary mt-1 text-dt-6" />
</div>