<script>
    import { marginMap, paddingMap } from "../lib/dynamicStyles";
    import { capitalizeWords } from "../services/utils.js";

    let {
        selected = $bindable("wählen"),
        options = [],
        marginTop = "",
        padding = "2",
        title = "",
        bgWhite = false,
        disableMinWidth = false,
        onChange = undefined,
        textWrap = true,
        displayTop = false,
        ...restProps
    } = $props();

    let open = $state(false);
    let dropdownRef = $state();
    let menuRef = $state();

    const minWidth = $derived.by(() => {
        if (disableMinWidth || options.length === 0) return 0;
        const longestOption = options.reduce((a, b) =>
            a.length > b.length ? a : b, ""
        );
        return Math.max(longestOption.length * 8 + 80, 120);
    });

    function selectOption(option) {
        selected = option;
        open = false;

        onChange?.($state.snapshot(option));
    }

    $effect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef && !dropdownRef.contains(event.target)) {
                open = false;
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    });

    async function toggleDropdown() {
        open = !open;
        if (!open || options.length === 0) return;
        if (selected.toLowerCase() === "wählen") return;

        const index = options.indexOf(selected);
        if (index === -1) return;

        requestAnimationFrame(() => {
            const selectedElement = menuRef?.children[index];
            selectedElement?.scrollIntoView({ block: "center", behavior: "smooth" });
        });
    }
</script>

<div
    class={`flex flex-col items-start w-full ${marginMap[marginTop]} gap-1`}
    bind:this={dropdownRef}
    {...restProps}
>
    {#if title}
        <p class="text-dt-6">{title}</p>
    {/if}

    <div class="relative inline-block w-full">
        <button
            type="button"
            class={`flex items-center w-full ${bgWhite ? "bg-white" : "bg-gv-input-bg"} ${open && options.length > 0 ? !displayTop ? "rounded-t-1" : "rounded-b-1" : "rounded-1"} text-dt-6 ${paddingMap[padding]} pl-3 pr-3 cursor-pointer text-gv-dark-text hover:bg-gv-hover-effect`}
            style={minWidth > 0 ? `min-width: ${minWidth}px` : ""}
            onclick={toggleDropdown}
        >
            <div class="flex w-full">
                <p class={`${selected === "wählen" ? "text-gv-input-placeholder" : "text-gv-dark-text"} ${textWrap ? "text-wrap" : "text-nowrap"}`}>
                    {capitalizeWords(selected)}
                </p>
                <span class="material-symbols-rounded ml-auto">
                    {open ? "arrow_drop_up" : "arrow_drop_down"}
                </span>
            </div>
        </button>

        {#if open && options.length > 0}
            <div
                bind:this={menuRef}
                class={`absolute w-full ${bgWhite ? "bg-white" : "bg-gv-input-bg"} ${displayTop ? "bottom-10.5 rounded-t-1" : "rounded-b-1"} max-h-[20vh] flex flex-col items-center z-999 overflow-y-auto`}
                style={minWidth > 0 ? `min-width: ${minWidth}px` : ""}
            >
                {#each options as option}
                    <button
                        type="button"
                        class={`text-left p-2 pl-4 pr-4 cursor-pointer hover:bg-gv-hover-effect w-full rounded-1 ${textWrap ? "text-wrap" : "text-nowrap"}`}
                        onclick={() => selectOption(option)}
                    >
                        {capitalizeWords(option)}
                    </button>
                {/each}
            </div>
        {/if}
    </div>
</div>