<script>
    import { marginMap } from "../lib/dynamicStyles";
    import { onDestroy, onMount } from "svelte";
    import { daysInMonth, firstWeekdayOfMonth, currentYear, currentMonth, isToday } from "../services/utils";
    import Dropdown from "./Dropdown.svelte";

    export let selected = "";
    export let marginTop = "";
    export let onChange = () => {};

    let open = false;
    let datepickerRef;

    let monthOptions = ["Januar", "Februar", "März", "April", "Mai", "Juni", "July", "August", "September", "Oktober", "November", "Dezember"];
    let yearOptions = generateYears(currentYear, 101);

    function generateYears(center, range = 10) {
        return Array.from(
            { length: range * 2 + 1 },
            (_, i) => String(center - range + i)
        );
    }

    let usedMonth = currentMonth;
    let usedYear = currentYear;
    let selectedDate = new Date().getDate();

    function handleClickOutside(event) {
        if (datepickerRef && !datepickerRef.contains(event.target)) {
            open = false;
        }
    }

    function buildCalendar(year, month) {
        const days = daysInMonth(year, month);
        const startDay = firstWeekdayOfMonth(year, month);

        const calendar = [];
        let week = [];

        for (let i = 0; i < startDay; i++) week.push(null);

        for (let day = 1; day <= days; day++) {
            week.push(day);
            if (week.length === 7) {
                calendar.push(week);
                week = [];
            }
        }

        if (week.length > 0) {
            while (week.length < 7) week.push(null);
            calendar.push(week);
        }

        return calendar;
    }

    onMount(() => {
        document.addEventListener("mousedown", handleClickOutside);
    });

    onDestroy(() => {
        document.removeEventListener("mousedown", handleClickOutside);
    });

    function openDatepicker() {
        open = !open;
        selected = `${selectedDate}.${usedMonth + 1}.${usedYear}`;
    }

    function itemClicked(value) {
        selectedDate = value;
    }

    function next() {
        if (!yearOptions.includes(String(usedYear + 1)) && usedMonth === 11) return;

        if (usedMonth === 11) {
            usedMonth = 0;
            usedYear++;
            return;
        }

        usedMonth++;
    }

    function back() {
        if (!yearOptions.includes(String(usedYear - 1)) && usedMonth === 0) return;

        if (usedMonth === 0) {
            usedMonth = 11;
            usedYear--;
            return;
        }

        usedMonth--;
    }

    $: calendar = buildCalendar(usedYear, usedMonth);

    $: if (selectedDate && selectedDate > daysInMonth(usedYear, usedMonth)) {
        selectedDate = null;
    }

    $: selected = `${selectedDate}.${usedMonth + 1}.${usedYear}`;
    $: onChange(selected);
</script>

<div class={`relative w-full ${marginMap[marginTop]}`} bind:this={datepickerRef}>
    <div
        class={`flex items-center w-full bg-gv-input-bg ${open ? "rounded-b-1 border-l border-r border-b border-gv-primary" : "rounded-1"} gap-1`}>
        <input type="text" class="w-full p-2 pl-3 pr-3 rounded-l-1 text-gv-dark-text outline-gv-primary text-dt-6"
               placeholder="DD.MM.YYYY" bind:value={selected} readonly>
        <button
            class="p-1.5 rounded-2 h-full aspect-square mr-1 flex items-center justify-center cursor-pointer hover:bg-gv-hover-effect"
            on:click={openDatepicker}>
            <span class="material-symbols-rounded text-icon-dt-6 text-gv-light-text">calendar_month</span>
        </button>
    </div>
    {#if open}
        <div
            class="absolute flex flex-col bottom-full rounded-t-1 w-full bg-gv-input-bg border-l border-t border-r border-gv-primary p-2 gap-4">
            <div class="flex items-center justify-between">
                <button class="flex items-center justify-center p-2 rounded-2 cursor-pointer hover:bg-gv-hover-effect"
                        on:click={back}>
                    <span class="material-symbols-rounded text-icon-dt-6 text-gv-dark-text">arrow_left</span>
                </button>
                <div class="flex items-center gap-2">
                    <Dropdown bgWhite={true} padding="2" options={monthOptions} selected={monthOptions[usedMonth]}
                              onChange={(value) => usedMonth = monthOptions.indexOf(value)} />
                    <Dropdown bgWhite={true} padding="2" options={yearOptions} selected={String(usedYear)}
                              onChange={(value) => usedYear = Number(value)} />
                </div>
                <button class="flex items-center justify-center p-2 rounded-2 cursor-pointer hover:bg-gv-hover-effect"
                        on:click={next}>
                    <span class="material-symbols-rounded text-icon-dt-6 text-gv-dark-text">arrow_right</span>
                </button>
            </div>
            <div class="w-full items-center flex flex-col">
                <table class="w-full border-collapse">
                    <thead>
                    <tr>
                        <th>Mo</th>
                        <th>Di</th>
                        <th>Mi</th>
                        <th>Do</th>
                        <th>Fr</th>
                        <th>Sa</th>
                        <th>So</th>
                    </tr>
                    </thead>
                    <tbody>
                    {#each calendar as week}
                        <tr>
                            {#each week as day}
                                <td class="text-center p-1">
                                    {#if day}
                                        <button
                                            class="w-10 h-10 rounded-full text-dt-8 cursor-pointer transition-colors"
                                            class:bg-gv-dark-turquoise={selectedDate === day}
                                            class:text-white={selectedDate === day || isToday(day, usedMonth, usedYear)}
                                            class:bg-gv-primary={isToday(day, usedMonth, usedYear) && selectedDate !== day}
                                            class:text-gv-light-text={selectedDate !== day && !isToday(day, usedMonth, usedYear)}
                                            class:hover:bg-gv-hover-effect={selectedDate !== day}
                                            on:click={() => itemClicked(day)}
                                        >
                                            {day}
                                        </button>
                                    {:else}
                                        <div class="w-10 h-10"></div>
                                    {/if}
                                </td>
                            {/each}
                        </tr>
                    {/each}
                    </tbody>
                </table>
            </div>
        </div>
    {/if}
</div>