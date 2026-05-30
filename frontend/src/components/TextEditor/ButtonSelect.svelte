<script>
    import { addToast } from "../../stores/toasts.svelte.js";
    import { viewport } from "../../stores/viewport.svelte.js";

    let {
        options = [],
        optionMap = {},
        selected = $bindable(""),
        onChange = (val) => {
        },
        width = "1/5",
        fillHeight = false,
        disabled = false,
        ...respProps
    } = $props();

    let dropdownRef = $state(null);
    let open = $state(false);

    const minWidth = $derived.by(() => {
        if (options.length === 0) return 0;

        const getVisualLength = (html) => {
            const textOnly = html.replace(/<[^>]*>/g, "");
            const hasIcon = html.includes("material-symbols-rounded");

            return textOnly.length + (hasIcon ? 4 : 0);
        };

        const maxVisualLength = options.reduce((max, html) => {
            const length = getVisualLength(html);
            return length > max ? length : max;
        }, 0);

        return Math.max(maxVisualLength * 8, 30);
    });

    $effect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef && !dropdownRef.contains(event.target)) {
                open = false;
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    });

    function selectOption(option) {
        if (!optionMap || !optionMap[option]) {
            addToast({
                title: "Ein unerwarteter Fehler ist aufgetreten",
                subTitle: viewport.isMobile ? "" : "Beim verarbeiten ihrer Auswahl ist ein Fehler aufgetreten",
                type: "error"
            });
            return;
        }

        selected = option;
        open = false;

        onChange?.($state.snapshot(optionMap[option]));
    }
</script>

<div class={`flex flex-col items-start justify-start gap-2 ${fillHeight ? "h-full" : ""}`}
     style={minWidth > 0 ? `min-width: ${minWidth}px` : ""} bind:this={dropdownRef}>
    <div class={`relative inline-block w-full ${fillHeight ? "h-full" : ""}`}>
        <button
            class={`flex items-center justify-start cursor-pointer bg-gv-input-bg rounded-2 p-2 pl-2 pr-4 hover:opacity-85 transition-50 h-full ${fillHeight ? "h-full" : ""} disabled:cursor-not-allowed disabled:opacity-50`}
            style={minWidth > 0 ? `min-width: ${minWidth}px` : ""}
            disabled={disabled}
            onmousedown={(e) => {
                e.preventDefault();
                open = !open;
            }}
        >
            {@html selected}
        </button>

        {#if open && options.length > 0}
            <div
                class={`rounded-2 mt-1 absolute w-full bg-gv-input-bg max-h-[20vh] flex flex-col items-center z-999 overflow-y-auto`}
                style={minWidth > 0 ? `min-width: ${minWidth}px` : ""}
            >
                {#each options as option}
                    <button
                        type="button"
                        class={`flex items-center text-left p-2 pl-4 pr-4 cursor-pointer hover:bg-gv-hover-effect w-full rounded-1 text-nowrap`}
                        onmousedown={(e) => {
                            e.preventDefault();
                            selectOption(option);
                        }}
                    >
                        {@html option}
                    </button>
                {/each}
            </div>
        {/if}
    </div>
</div>
