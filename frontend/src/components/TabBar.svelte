<script>
    import { marginMap } from "../lib/dynamicStyles";
    import { crossfade } from 'svelte/transition';
    import { cubicOut } from 'svelte/easing';

    let {
        contents = [],
        selected = $bindable(""),
        marginTop = "",
        onChange = undefined,
        disabled = false,
        ...restProps
    } = $props();

    let lastEmittedSelection = $state("");

    $effect(() => {
        if (selected) {
            if (selected !== lastEmittedSelection) {
                lastEmittedSelection = selected;
                onChange?.(selected);
            }
        }
    });

    const [send, receive] = crossfade({
        duration: 300,
        easing: cubicOut
    });
</script>

<div class={`flex p-1 rounded-full bg-gv-input-bg gap-2 ${marginMap[marginTop]} overflow-x-auto w-full`} style="min-height: 2.75rem">
    {#each contents as title}
        <button
            type="button"
            class="relative flex-1 p-2 rounded-full text-center z-10 cursor-pointer text-dt-6 text-gv-dark hover:bg-gv-hover-effect/50 transition-colors duration-150"
            onclick={() => selected = title}
        >
            <span class="relative z-20">
                {title}
            </span>

            {#if selected === title}
                <div
                    class="absolute inset-0 bg-white rounded-full shadow-sm z-10"
                    in:receive={{ key: 'active-tab' }}
                    out:send={{ key: 'active-tab' }}
                ></div>
            {/if}
        </button>
    {/each}
</div>

<!--<div-->
<!--    class={`relative flex w-full items-stretch p-1.5 rounded-full bg-gv-input-bg ${marginMap[marginTop]} gap-2 overflow-x-auto`}-->
<!--    style="min-height: 2.75rem;"-->
<!--    {...restProps}-->
<!--&gt;-->
<!--    <div-->
<!--        class="absolute top-1 bottom-1 bg-white rounded-full shadow-sm transition-all duration-300 ease-out z-0"-->
<!--        style={sliderStyle}-->
<!--    ></div>-->

<!--    {#each tabs as tab, index}-->
<!--        <button-->
<!--            bind:this={tabElements[index]}-->
<!--            type="button"-->
<!--            disabled={disabled}-->
<!--            class="relative z-10 w-full p-1 rounded-full flex items-center justify-center text-center min-[800px]:text-dt-5 text-dt-6 text-gv-dark cursor-pointer hover:bg-gv-hover-effect/50 transition-colors duration-150"-->
<!--            onclick={() => selected = tab.title}-->
<!--        >-->
<!--            {tab.title}-->
<!--        </button>-->
<!--    {/each}-->
<!--</div>-->
