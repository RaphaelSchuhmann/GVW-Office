<script>
    import { marginMap } from "../lib/dynamicStyles";
    import { onMount } from "svelte";

    export let contents = [];
    export let selected = "";
    export let marginTop = "";
    export let onChange = () => {};

    let tabs = [];
    for (const item of contents) {
        tabs.push({ title: item, count: 0 });
    }

    // Animation variables
    let tabElements = [];
    let sliderStyle = "";

    function updateSliderPosition() {
        const selectedIndex = tabs.findIndex(tab => tab.title === selected);
        if (selectedIndex >= 0 && tabElements[selectedIndex]) {
            const selectedTab = tabElements[selectedIndex];
            const { offsetLeft, offsetWidth } = selectedTab;
            sliderStyle = `transform: translateX(${offsetLeft - 3}px); width: ${offsetWidth}px;`;
        }
    }

    $: if (selected) {
        onChange(selected);
        setTimeout(updateSliderPosition, 0); // Wait for DOM update
    }

    onMount(() => {
        updateSliderPosition();
        selected = selected;
    });
</script>
<div
    class={`relative flex w-full items-stretch p-1 rounded-full bg-gv-input-bg ${marginMap[marginTop]} gap-2 overflow-x-auto overflow-y-hidden`}>
    <!-- Sliding background -->
    <div
        class="absolute top-1 bottom-1 bg-white rounded-full transition-all duration-300 ease-out z-0"
        style={sliderStyle}
    ></div>

    {#each tabs as tab, index}
        <button
            bind:this={tabElements[index]}
            class="relative z-10 w-full p-1 rounded-full flex items-center justify-center text-center text-dt-5 text-gv-dark cursor-pointer hover:bg-gv-hover-effect/50 transition-colors duration-150"
            on:click={() => selected = tab.title}
        >
            {tab.title}
        </button>
    {/each}
</div>