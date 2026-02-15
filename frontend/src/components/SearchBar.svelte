<script>
    import { filterRegistry } from "../lib/filterRegistry";
    import { marginMap } from "../lib/dynamicStyles";
    export let marginTop = "";
    export let placeholder = "Suchen...";
    export let disabled = false;
    export let width = "w-full";
    export let isMobile = false;
    export let page = "";

    let searchEl;
    let debounce;

    const { filterState, config } = filterRegistry[page];

    let usedPlaceholder = config.search.placeholder ? config.search.placeholder : placeholder;

    /**
     * Handles search input with debouncing
     * Filters results using Fuse.js or shows all data if input is empty
     * @param {string} value - The search input value
     */
    function onInput(value) {
        clearTimeout(debounce);
        debounce = setTimeout(() => filterState.update(u => ({ ...u, search: value })), 250);
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
        placeholder={usedPlaceholder}
        disabled={disabled}
        on:input={() => onInput(searchEl.value)}
        class={`rounded-tr-1 rounded-br-1 w-full p-2 pr-3 bg-gv-input-bg text-black outline-gv-primary mt-1 ${!isMobile ? "text-dt-6" : "text-dt-7"}`} />
</div>