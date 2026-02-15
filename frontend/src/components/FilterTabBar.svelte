<script>
    import { marginMap } from "../lib/dynamicStyles";
    import { filterRegistry } from "../lib/filterRegistry";
    import { onMount } from "svelte";
    import { addToast } from "../stores/toasts";

    export let contents = [];
    export let selected = "";
    export let marginTop = "";
    export let page = "";

    const validPages = ["events", "library"];
    if (!validPages.includes(page)) {
        console.warn(`Type ${page} is not a valid type`);
        page = "none";
    }

    const regEntry = filterRegistry[page];
    const { tabMap, filterState, config } = regEntry;

    const usedContents =
        config.tab.contents.length > 0
            ? config.tab.contents
            : contents;

    let tabs = [...usedContents];

    // Calculate selected index reactively
    $: selectedIndex = tabs.findIndex(tab => tab === selected);

    function filter() {
        if (!(selected in tabMap)) {
            addToast({
                title: "Unerwarteter Fehler",
                subTitle:
                    "Es ist ein unerwarteter Fehler aufgetreten. Bitte kontaktieren Sie umgehend den Vorstand!",
                type: "error"
            });
            return;
        }

        const filterFor = tabMap[selected];
        filterState.update(store => ({ ...store, tab: filterFor }));
    }

    onMount(() => {
        filter();
    });
</script>
<div
    class={`relative grid w-full p-1 rounded-full bg-gv-input-bg ${marginMap[marginTop]} gap-2`}
    style={`grid-template-columns: repeat(${tabs.length}, 1fr);`}
>
    <!-- Sliding background -->
    {#if selectedIndex >= 0}
        <div
            class="absolute top-1 bottom-1 left-1 rounded-full bg-white transition-transform duration-300 ease-out"
            style={`width: calc((100% - 0.5rem) / ${tabs.length}); transform: translateX(${selectedIndex * 100}%);`}
        ></div>
    {/if}

    {#each tabs as tab}
        <button
            class="relative z-10 w-full p-1 rounded-full text-dt-5 text-gv-dark cursor-pointer hover:bg-gv-hover-effect/50 transition-colors duration-150"
            on:click={() => {
                selected = tab;
                filter();
            }}
        >
            {tab}
        </button>
    {/each}
</div>