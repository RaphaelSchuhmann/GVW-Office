<script>
    import Dropdown from "./Dropdown.svelte";
    import { filterRegistry } from "../lib/filterRegistry";
    import { addToast } from "../stores/toasts";
    import { onDestroy, onMount } from "svelte";

    export let options = [];
    export let page = "";
    export let textWrap = true;
    export let customDefault = "";

    const validPages = ["events", "reports", "library"];
    if (!validPages.includes(page)) {
        console.warn(`Type ${page} is not a valid type`);
        page = "none";
    }

    let regEntry = filterRegistry[page];
    let { optionMap, config, filterState } = regEntry;
    let configIntervalId;

    let usedOptions = config.dropdown.options ? config.dropdown.options : options;

    function updateConfig() {
        regEntry = filterRegistry[page];
        const newConfig = regEntry;
        optionMap = newConfig.optionMap;
    }

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

        filterState.update(store => ({ ...store, dropdown: filterFor }));
    }

    onMount(() => {
        // Update config every 5 seconds for dynamic optionMap changes
        configIntervalId = setInterval(updateConfig, 5000);

        const usedCustomDefault = config.dropdown.customDefault ? config.dropdown.customDefault : customDefault ? customDefault : "Alle Typen";

        filter(usedCustomDefault);
    });

    onDestroy(() => {
        clearInterval(configIntervalId);
    });
</script>

<div class="flex w-full items-center gap-2">
    <span class="material-symbols-rounded text-gv-dark-text text-icon-dt-2">tune</span>
    <Dropdown options={usedOptions} onChange={filter} selected={customDefault ? customDefault : "Alle Typen"} textWrap={textWrap}/>
</div>