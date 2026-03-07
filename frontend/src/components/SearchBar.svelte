<script>
    import { filterRegistry } from "../lib/filterRegistry.svelte";
    import { marginMap } from "../lib/dynamicStyles";

    let {
        marginTop = "",
        placeholder = "Suchen...",
        disabled = false,
        width = "w-full",
        isMobile = false,
        page = "",
        onblur = undefined,
        ...restProps
    } = $props();

    let searchEl = $state(null);
    let debounce;
    $effect(() => () => clearTimeout(debounce));

    // Get filter logic from registry based on the "page" key
    const entry = filterRegistry[page];
    if (!entry) {
        console.warn(`Unknown SearchBar page key: ${page}`);
    }
    const filterState = entry?.filterState;
    const config = entry?.config ?? {};

    // Use $derived so the placeholder updates automatically if config changes
    let usedPlaceholder = $derived(config?.search?.placeholder ?? placeholder);

    /**
     * Handles search input with debouncing
     */
    function handleInput(event) {
        const value = event.target.value;
        clearTimeout(debounce);
        debounce = setTimeout(() => {
            Object.assign(filterState, { search: value });
        }, 250);
    }

    /**
     * Focuses the search input element (Exposed to parent via bind:this)
     */
    export function focus() {
        searchEl?.focus();
    }
</script>

<div class="flex items-stretch {width} {marginMap[marginTop]}">
    <div class="flex items-center justify-center px-3 mt-1 rounded-tl-1 rounded-bl-1 bg-gv-input-bg">
        <span class="material-symbols-rounded {!isMobile ? 'text-icon-dt-4' : 'text-icon-dt-6'} text-gv-input-placeholder">
            search
        </span>
    </div>

    <input
        bind:this={searchEl}
        {onblur}
        {disabled}
        placeholder={usedPlaceholder}
        oninput={handleInput}
        class="rounded-tr-1 rounded-br-1 w-full p-2 pr-3 bg-gv-input-bg text-black outline-gv-primary mt-1 {!isMobile ? 'text-dt-6' : 'text-dt-7'}"
        {...restProps}
    />
</div>