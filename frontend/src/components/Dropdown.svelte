<script>
    import { onMount, onDestroy } from "svelte";
    import { marginMap, paddingMap } from "../lib/dynamicStyles";
    import { capitalizeWords } from "../services/utils";

    export let selected = "wählen";
    export let options = [];
    export let marginTop = "";
    export let padding = "3";
    export let title = "";
    export let bgWhite = false;
    export let disableMinWidth = false;
    export let onChange = () => {};

    let open = false;
    let dropdownRef;
    let minWidth = 0;

    $: {
        if (options.length > 0 && !disableMinWidth) {
            const longestOption = options.reduce((a, b) => a.length > b.length ? a : b);
            minWidth = Math.max(longestOption.length * 8 + 80, 120); // 8px per char + padding
        } else {
            minWidth = 0;
        }
    }

    function selectOption(option) {
        selected = option;
        open = false;

        onChange(option);
    }

    function handleClickOutside(event) {
        if (dropdownRef && !dropdownRef.contains(event.target)) {
            open = false;
        }
    }

    onMount(() => {
        document.addEventListener("mousedown", handleClickOutside);
    });

    onDestroy(() => {
        document.removeEventListener("mousedown", handleClickOutside);
    });
</script>

<div class={`flex flex-col items-start w-full ${marginMap[marginTop]} gap-1`} bind:this={dropdownRef}>
    {#if title}
        <p class="text-dt-6">{title}</p>
    {/if}
    <div class="relative inline-block w-full">
        <button
            class={`flex items-center w-full ${bgWhite ? "bg-white" : "bg-gv-input-bg"} ${open && options.length > 0 ? "rounded-t-1" : "rounded-1"} text-dt-6 ${paddingMap[padding]} cursor-pointer text-gv-dark-text hover:bg-gv-hover-effect`}
            style={minWidth > 0 ? `min-width: ${minWidth}px` : ""}
            on:click={() => open = !open}>
            <div class="flex w-full">
                <p class={`${selected === "wählen" ? "text-gv-input-placeholder" : "text-gv-dark-text"}`}>{capitalizeWords(selected)}</p>
                <span class="material-symbols-rounded ml-auto">{open ? "arrow_drop_up" : "arrow_drop_down"}</span>
            </div>
        </button>
        {#if open && options.length > 0}
            <div class={`absolute w-full ${bgWhite ? "bg-white" : "bg-gv-input-bg"} max-h-[20vh] flex flex-col items-center rounded-b-1 z-999 overflow-y-auto`} style={minWidth > 0 ? `min-width: ${minWidth}px` : ""}>
                {#each options as option}
                    <button class="text-left p-2 pl-4 pr-4 cursor-pointer hover:bg-gv-hover-effect w-full rounded-1"
                            on:click={() => selectOption(option)}>{capitalizeWords(option)}</button>
                {/each}
            </div>
        {/if}
    </div>
</div>