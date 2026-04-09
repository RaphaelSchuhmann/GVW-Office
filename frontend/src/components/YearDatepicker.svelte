<script>
    import { marginMap } from "../lib/dynamicStyles";
    import { currentYear } from "../services/dateTimeUtils.js";

    let {
        selected = $bindable(""),
        marginTop = "",
        onChange = () => {}
    } = $props();

    let open = $state(false);
    let datepickerRef = $state(null);

    let usedYear = $state(selected ? Number(selected) : currentYear);

    $effect(() => {
        if (selected) usedYear = Number(selected);
    });

    let gridStart = $derived(Math.floor(usedYear / 12) * 12);
    let yearsGrid = $derived(Array.from({ length: 12 }, (_, i) => gridStart + i));

    $effect(() => {
        const handleClickOutside = (event) => {
            if (datepickerRef && !datepickerRef.contains(event.target)) {
                open = false;
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    });

    function updateSelection(year) {
        usedYear = year;
        selected = String(year);
        onChange(selected);
    }

    function toggleOpen() {
        open = !open;
        if (!selected) {
            updateSelection(usedYear);
        }
    }

    function selectYear(year) {
        updateSelection(year);
        open = false;
    }

    function nextRange() {
        usedYear += 12;
    }

    function backRange() {
        if (usedYear - 12 < 0) return;
        usedYear -= 12;
    }
</script>

<div class="relative w-full {marginMap[marginTop]}" bind:this={datepickerRef}>
    <div
        class="flex items-center w-full bg-gv-input-bg border-gv-primary rounded-1 {open ? 'border' : ''} gap-1">
        <input type="text" class="w-full p-2 pl-3 pr-3 rounded-l-1 text-gv-dark-text outline-gv-primary text-dt-6"
               placeholder="YYYY" bind:value={selected} readonly>
        <button
            class="p-1.5 rounded-2 h-full aspect-square mr-1 flex items-center justify-center cursor-pointer hover:bg-gv-hover-effect"
            onclick={toggleOpen}>
            <span class="material-symbols-rounded text-icon-dt-6 text-gv-light-text">calendar_month</span>
        </button>
    </div>

    {#if open}
        <div class="absolute bottom-full flex flex-col rounded-1 w-full bg-gv-input-bg border border-gv-primary p-4 gap-4 mb-1">

            <div class="grid grid-cols-3 gap-2">
                {#each yearsGrid as year}
                    <button
                        class="py-3 rounded-2 text-dt-6 font-medium transition-all cursor-pointer"
                        class:bg-gv-dark-turquoise={String(selected) === String(year)}
                        class:text-white={String(selected) === String(year)}
                        class:text-gv-light-text={String(selected) !== String(year)}
                        class:hover:bg-gv-hover-effect={String(selected) !== String(year)}
                        onclick={() => selectYear(year)}
                    >
                        {year}
                    </button>
                {/each}
            </div>

            <div class="flex items-center justify-between">
                <button class="flex items-center justify-center p-2 rounded-2 cursor-pointer hover:bg-gv-hover-effect" onclick={backRange}>
                    <span class="material-symbols-rounded text-icon-dt-6 text-gv-dark-text">arrow_left</span>
                </button>

                <span class="text-dt-6 font-bold text-gv-dark-text">
                    {yearsGrid[0]} - {yearsGrid[11]}
                </span>

                <button class="flex items-center justify-center p-2 rounded-2 cursor-pointer hover:bg-gv-hover-effect" onclick={nextRange}>
                    <span class="material-symbols-rounded text-icon-dt-6 text-gv-dark-text">arrow_right</span>
                </button>
            </div>
        </div>
    {/if}
</div>