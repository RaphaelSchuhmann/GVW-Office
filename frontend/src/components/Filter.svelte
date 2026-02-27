<script>
    import Dropdown from "./Dropdown.svelte";
    import { filterRegistry } from "../lib/filterRegistry";
    import { addToast } from "../stores/toasts";

    let {
        options = [],
        page = "",
        textWrap = true,
        customDefault = "",
        ...restProps
    } = $props();

    const validPages = ["events", "reports", "library"];
    const activePage = $derived(validPages.includes(page) ? page : "none");

    let regEntry = $state(filterRegistry[activePage] || {
        optionMap: {},
        config: { dropdown: { options: null, customDefault: null } },
        filterState: { update: () => {} }
    });

    const usedOptions = $derived(regEntry.config.dropdown.options ?? options);
    const usedDefault = $derived.by(() => {
        if (regEntry.config.dropdown.customDefault) {
            return regEntry.config.dropdown.customDefault;
        }

        if (customDefault) {
            return customDefault;
        }

        return "Alle Typen";
    });

    /**
     * Updates the local regEntry from the global registry
     */
    function updateConfig() {
        if (filterRegistry[activePage]) {
            regEntry = filterRegistry[activePage];
        }
    }

    /**
     * Updates the filter state
     */
    function filter(selected) {
        const rawSelected = $state.snapshot(selected);

        const { optionMap, filterState } = $state.snapshot(regEntry);

        if (!(rawSelected in optionMap)) {
            console.warn(`Mapping failed for: ${rawSelected}`);
            addToast({
                title: "Unerwarteter Fehler",
                subTitle: `Der Filter "${rawSelected}" konnte nicht zugeordnet werden.`,
                type: "error"
            });
            return;
        }

        const filterFor = optionMap[rawSelected];
        filterState.update(store => ({ ...store, dropdown: filterFor }));
    }

    $effect(() => {
        filter(usedDefault);

        const intervalId = setInterval(updateConfig, 5000);

        return () => clearInterval(intervalId);
    });
</script>

<div class="flex w-full items-center gap-2" {...restProps}>
    <span class="material-symbols-rounded text-gv-dark-text text-icon-dt-2">
        tune
    </span>
    <Dropdown
        options={usedOptions}
        onChange={filter}
        selected={usedDefault}
        {textWrap}
    />
</div>