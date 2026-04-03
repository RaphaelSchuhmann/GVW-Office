<script>
    import { marginMap } from "../lib/dynamicStyles";

    let {
        contents = [],
        selected = $bindable(""),
        marginTop = "",
        onChange = undefined,
        disabled = false,
        ...restProps
    } = $props();

    const tabs = $derived(contents.map(item => ({ title: item, count: 0 })));

    let tabElements = $state([]);
    let sliderStyle = $state("");

    let lastEmittedSelection = $state("");

    /**
     * Updates the position and width of the sliding background indicator
     */
    function updateSliderPosition() {
        const selectedIndex = contents.findIndex(item => item === selected);
        if (selectedIndex >= 0 && tabElements[selectedIndex]) {
            const selectedTab = tabElements[selectedIndex];
            const { offsetLeft, offsetWidth } = selectedTab;
            sliderStyle = `transform: translateX(${offsetLeft - 4}px); width: ${offsetWidth}px;`;
        } else {
            sliderStyle = "";
        }
    }

    $effect(() => {
        if (selected) {
            updateSliderPosition();
            if (selected !== lastEmittedSelection) {
                lastEmittedSelection = selected;
                onChange?.(selected);
            }
        }
    });

    // Handle window resize to keep slider in position
    $effect(() => {
        window.addEventListener('resize', updateSliderPosition);
        return () => window.removeEventListener('resize', updateSliderPosition);
    });
</script>

<div
    class={`relative flex w-full items-stretch p-1.5 rounded-full bg-gv-input-bg ${marginMap[marginTop]} gap-2 overflow-x-auto`}
    style="min-height: 2.75rem;"
    {...restProps}
>
    <div
        class="absolute top-1 bottom-1 bg-white rounded-full shadow-sm transition-all duration-300 ease-out z-0"
        style={sliderStyle}
    ></div>

    {#each tabs as tab, index}
        <button
            bind:this={tabElements[index]}
            type="button"
            disabled={disabled}
            class="relative z-10 w-full p-1 rounded-full flex items-center justify-center text-center min-[800px]:text-dt-5 text-dt-6 text-gv-dark cursor-pointer hover:bg-gv-hover-effect/50 transition-colors duration-150"
            onclick={() => selected = tab.title}
        >
            {tab.title}
        </button>
    {/each}
</div>