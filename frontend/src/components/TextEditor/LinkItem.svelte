<script>
    import SearchBar from "../SearchBar.svelte";
    import { filterRegistry } from "../../lib/filterRegistry.svelte.js";

    let {
        id = "",
        page = "",
        selected = $bindable(),
        onChange = (val) => {},
        disabled = false,
        ...restProps
    } = $props();

    let isOpen = $state(false);
    let menuRef = $state();

    const entry = filterRegistry[page];
    if (!entry) {
        console.warn(`Unknown page key: ${page}`);
    }

    $effect(() => {
        const handleClickOutside = (event) => {
            if (menuRef && !menuRef.contains(event.target)) {
                isOpen = false;
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    });

    function select(itemId) {
        selected = itemId;
        onChange?.(itemId);
    }
</script>

<div class={`flex flex-col items-start justify-start gap-2`} bind:this={menuRef}>
    <div class={`relative inline-block w-full`}>
        <button
            class={`p-2 flex items-center justify-center cursor-pointer rounded-2 hover:bg-gv-hover-effect text-gv-dark-text disabled:text-gv-dark-text/50 disabled:cursor-not-allowed`}
            onclick={() => isOpen = !isOpen}
            disabled={disabled}
        >
            <span class="material-symbols-rounded text-icon-dt-4">link_2</span>
        </button>

        {#if isOpen}
            <div
                class={`rounded-2 mt-1 gap-2 absolute w-max bg-white drop-shadow-md flex flex-col items-start max-h-[20vh] overflow-y-auto overflow-x-hidden justify-start z-999 p-2`}
            >
                <SearchBar page={page} />
                <div class="flex flex-col w-full gap-2 mt-1">
                    {#if entry?.store.display.length > 0}
                        {#each entry?.store.display as item}
                            {#if item.id !== id}
                                <button
                                    class="flex items-start justify-start gap-2 w-full cursor-pointer hover:bg-gv-hover-effect p-1 rounded-2"
                                    onclick={() => select(item.id)}>
                                    <span
                                        class="material-symbols-rounded text-icon-dt-5 text-gv-toast-info">article</span>
                                    <div class="flex flex-col items-start justify-start w-full">
                                        <p class="text-gv-dark-text text-nowrap truncate text-dt-6">{item.title}</p>
                                        {#if item.author}
                                            <p class="text-gv-light-text text-nowrap truncate text-dt-7">{item.author}</p>
                                        {/if}
                                    </div>
                                </button>
                            {/if}
                        {/each}
                    {:else}
                        <p>Keine Einträge gefunden</p>
                    {/if}
                </div>
            </div>
        {/if}
    </div>
</div>