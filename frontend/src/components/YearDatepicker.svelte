<script>
    import { marginMap } from "../lib/dynamicStyles";
    import { onDestroy, onMount } from "svelte";
    import { currentYear } from "../services/utils";

    export let selected = "";
    export let marginTop = "";
    export let onChange = () => {};

    let open = false;
    let datepickerRef;

    // State for navigation
    let usedYear = selected ? Number(selected) : currentYear;

    // This calculates the start of the 12-year grid (e.g., 2024 -> 2016)
    $: gridStart = Math.floor(usedYear / 12) * 12;
    $: yearsGrid = Array.from({ length: 12 }, (_, i) => gridStart + i);

    function handleClickOutside(event) {
        if (datepickerRef && !datepickerRef.contains(event.target)) {
            open = false;
        }
    }

    onMount(() => {
        document.addEventListener("mousedown", handleClickOutside);
    });

    onDestroy(() => {
        document.removeEventListener("mousedown", handleClickOutside);
    });

    function toggleOpen() {
        open = !open;
        if (!selected) selected = String(usedYear);
    }

    function selectYear(year) {
        usedYear = year;
        selected = String(year);
        open = false;
    }

    function nextRange() {
        usedYear += 12;
    }

    function backRange() {
        usedYear -= 12;
    }

    $: selected = String(usedYear);
    $: onChange(selected);
</script>

<div class="relative w-full {marginMap[marginTop]}" bind:this={datepickerRef}>
    <div
        class="flex items-center w-full bg-gv-input-bg border-gv-primary {open ? 'rounded-b-1 border-l border-r border-b' : 'rounded-1'} gap-1">
        <input type="text" class="w-full p-2 pl-3 pr-3 rounded-l-1 text-gv-dark-text outline-gv-primary text-dt-6"
               placeholder="YYYY" bind:value={selected} readonly>
        <button
            class="p-1.5 rounded-2 h-full aspect-square mr-1 flex items-center justify-center cursor-pointer hover:bg-gv-hover-effect"
            on:click={toggleOpen}>
            <span class="material-symbols-rounded text-icon-dt-6 text-gv-light-text">calendar_month</span>
        </button>
    </div>

    {#if open}
        <div class="absolute bottom-full mb-0 flex flex-col rounded-t-1 w-full bg-gv-input-bg border-l border-t border-r border-gv-primary p-4 gap-4">

            <div class="flex items-center justify-between">
                <button class="flex items-center justify-center p-2 rounded-2 cursor-pointer hover:bg-gv-hover-effect" on:click={backRange}>
                    <span class="material-symbols-rounded text-icon-dt-6 text-gv-dark-text">arrow_left</span>
                </button>

                <span class="text-dt-6 font-bold text-gv-dark-text">
                    {yearsGrid[0]} - {yearsGrid[11]}
                </span>

                <button class="flex items-center justify-center p-2 rounded-2 cursor-pointer hover:bg-gv-hover-effect" on:click={nextRange}>
                    <span class="material-symbols-rounded text-icon-dt-6 text-gv-dark-text">arrow_right</span>
                </button>
            </div>

            <div class="grid grid-cols-3 gap-2">
                {#each yearsGrid as year}
                    <button
                        class="py-3 rounded-2 text-dt-6 font-medium transition-all cursor-pointer"
                        class:bg-gv-dark-turquoise={String(selected) === String(year)}
                        class:text-white={String(selected) === String(year)}
                        class:text-gv-light-text={String(selected) !== String(year)}
                        class:hover:bg-gv-hover-effect={String(selected) !== String(year)}
                        on:click={() => selectYear(year)}
                    >
                        {year}
                    </button>
                {/each}
            </div>
        </div>
    {/if}
</div>