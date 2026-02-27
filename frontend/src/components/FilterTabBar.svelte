<script>
    import { marginMap } from "../lib/dynamicStyles";
    import { filterRegistry } from "../lib/filterRegistry";
    import { addToast } from "../stores/toasts";

    let {
        contents = [],
        selected = $bindable(""),
        marginTop = "",
        page = "",
        ...restProps
    } = $props();

    const validPages = ["events", "library"];
    const activePage = $derived(validPages.includes(page) ? page : "none");

    const regEntry = $derived(filterRegistry[activePage] || {
        tabMap: {},
        filterState: {
            update: () => {
            }
        },
        config: { tab: { contents: [] } }
    });

    const tabs = $derived(
        regEntry.config.tab.contents.length > 0
            ? regEntry.config.tab.contents
            : contents
    );

    const selectedIndex = $derived(tabs.findIndex(tab => tab === selected));

    /**
     * Updates the filter state based on the selected tab
     */
    function filter() {
        const { tabMap, filterState } = regEntry;

        if (!(selected in tabMap)) {
            addToast({
                title: "Unerwarteter Fehler",
                subTitle: "Es ist ein unerwarteter Fehler aufgetreten. Bitte kontaktieren Sie umgehend den Vorstand!",
                type: "error"
            });
            return;
        }

        const filterFor = tabMap[selected];
        filterState.update(store => ({ ...store, tab: filterFor }));
    }

    $effect(() => {
        // This runs on mount AND whenever 'selected' or 'regEntry' changes
        if (selected) {
            filter();
        }
    });
</script>

<div
    class={`relative grid w-full p-1 rounded-full bg-gv-input-bg ${marginMap[marginTop]} gap-2`}
    style={`grid-template-columns: repeat(${tabs.length}, 1fr);`}
    {...restProps}
>
    {#if selectedIndex >= 0}
        <div
            class="absolute top-1 bottom-1 left-1 rounded-full bg-white transition-transform duration-300 ease-out shadow-sm"
            style={`width: calc((100% - 0.5rem) / ${tabs.length}); transform: translateX(${selectedIndex * 100}%);`}
        ></div>
    {/if}

    {#each tabs as tab}
        <button
            type="button"
            class="relative z-10 w-full p-1 rounded-full text-dt-5 text-gv-dark cursor-pointer hover:bg-gv-hover-effect/50 transition-colors duration-150"
            onclick={() => selected = tab}
        >
            {tab}
        </button>
    {/each}
</div>