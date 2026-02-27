<script>
    import { marginMap } from "../lib/dynamicStyles";
    import { daysInMonth, firstWeekdayOfMonth, currentYear, currentMonth, isToday } from "../services/utils";
    import Dropdown from "./Dropdown.svelte";

    let {
        selected = $bindable(""),
        marginTop = "",
        onChange = () => {}
    } = $props();

    let open = $state(false);
    let datepickerRef = $state(null);

    // Parse initial value or fallback to current date
    const initialDate = selected && selected.includes('.') ? selected.split('.').map(Number) : null;

    let usedMonth = $state(initialDate ? initialDate[1] - 1 : currentMonth);
    let usedYear = $state(initialDate ? initialDate[2] : currentYear);
    let selectedDate = $state(initialDate ? initialDate[0] : new Date().getDate());

    const monthOptions = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"];

    function generateYears(center, range = 10) {
        return Array.from({ length: range * 2 + 1 }, (_, i) => String(center - range + i));
    }
    const yearOptions = generateYears(currentYear, 101);

    let calendar = $derived(buildCalendar(usedYear, usedMonth));

    let formattedDate = $derived(`${selectedDate}.${usedMonth + 1}.${usedYear}`);

    $effect(() => {
        if (selected !== formattedDate) {
            selected = formattedDate;
            onChange(formattedDate);
        }
    });

    $effect(() => {
        const maxDays = daysInMonth(usedYear, usedMonth);
        if (selectedDate > maxDays) {
            selectedDate = maxDays;
        }
    });

    $effect(() => {
        const handleClickOutside = (event) => {
            if (datepickerRef && !datepickerRef.contains(event.target)) {
                open = false;
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    });

    function buildCalendar(year, month) {
        const days = daysInMonth(year, month);
        const startDay = firstWeekdayOfMonth(year, month);
        const calendarGrid = [];
        let week = [];

        for (let i = 0; i < startDay; i++) week.push(null);
        for (let day = 1; day <= days; day++) {
            week.push(day);
            if (week.length === 7) {
                calendarGrid.push(week);
                week = [];
            }
        }
        if (week.length > 0) {
            while (week.length < 7) week.push(null);
            calendarGrid.push(week);
        }
        return calendarGrid;
    }

    function toggleDatepicker() {
        open = !open;
    }

    function itemClicked(day) {
        selectedDate = day;
        open = false;
    }

    function next() {
        if (!yearOptions.includes(String(usedYear + 1)) && usedMonth === 11) return;
        if (usedMonth === 11) {
            usedMonth = 0;
            usedYear++;
        } else {
            usedMonth++;
        }
    }

    function back() {
        if (!yearOptions.includes(String(usedYear - 1)) && usedMonth === 0) return;
        if (usedMonth === 0) {
            usedMonth = 11;
            usedYear--;
        } else {
            usedMonth--;
        }
    }
</script>

<div class="relative w-full {marginMap[marginTop]}" bind:this={datepickerRef}>
    <div class="flex items-center w-full bg-gv-input-bg {open ? 'border border-gv-primary' : ''} rounded-1 gap-1">
        <input
            type="text"
            class="w-full p-2 pl-3 pr-3 rounded-l-1 text-gv-dark-text outline-gv-primary text-dt-6"
            placeholder="DD.MM.YYYY"
            value={selected}
            readonly
        >
        <button
            type="button"
            aria-label={open ? "Close date picker" : "Open date picker"}
            class="p-1.5 rounded-2 h-full aspect-square mr-1 flex items-center justify-center cursor-pointer hover:bg-gv-hover-effect"
            onclick={toggleDatepicker}>
            <span class="material-symbols-rounded text-icon-dt-6 text-gv-light-text">calendar_month</span>
        </button>
    </div>

    {#if open}
        <div class="absolute flex flex-col bottom-full rounded-1 w-max min-w-full bg-gv-input-bg border border-gv-primary p-2 pt-4 gap-2 mb-1">
            <div class="w-full items-center flex flex-col">
                <table class="w-full border-collapse">
                    <thead>
                    <tr class="text-gv-light-text text-dt-8">
                        <th>Mo</th><th>Di</th><th>Mi</th><th>Do</th><th>Fr</th><th>Sa</th><th>So</th>
                    </tr>
                    </thead>
                    <tbody>
                    {#each calendar as week}
                        <tr>
                            {#each week as day}
                                <td class="text-center p-1">
                                    {#if day}
                                        <button
                                            type="button"
                                            class="w-10 h-10 rounded-full text-dt-8 cursor-pointer transition-colors"
                                            class:bg-gv-dark-turquoise={selectedDate === day}
                                            class:text-white={selectedDate === day || isToday(day, usedMonth, usedYear)}
                                            class:bg-gv-primary={isToday(day, usedMonth, usedYear) && selectedDate !== day}
                                            class:text-gv-light-text={selectedDate !== day && !isToday(day, usedMonth, usedYear)}
                                            class:hover:bg-gv-hover-effect={selectedDate !== day}
                                            onclick={() => itemClicked(day)}
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

            <div class="flex items-center w-full justify-between gap-1">
                <button
                    type="button"
                    aria-label="Previous month"
                    class="flex items-center justify-center p-2 rounded-2 cursor-pointer hover:bg-gv-hover-effect"
                    onclick={back}>
                    <span class="material-symbols-rounded text-icon-dt-6 text-gv-dark-text">arrow_left</span>
                </button>

                <div class="flex items-center w-full gap-2">
                    <Dropdown
                        bgWhite={true}
                        padding="2"
                        options={monthOptions}
                        selected={monthOptions[usedMonth]}
                        onChange={(val) => usedMonth = monthOptions.indexOf(val)}
                        disableMinWidth={true}
                        displayTop={true}
                    />
                    <Dropdown
                        bgWhite={true}
                        padding="2"
                        options={yearOptions}
                        selected={String(usedYear)}
                        onChange={(val) => usedYear = Number(val)}
                        disableMinWidth={true}
                        displayTop={true}
                    />
                </div>

                <button
                    type="button"
                    aria-label="Next month"
                    class="flex items-center justify-center p-2 rounded-2 cursor-pointer hover:bg-gv-hover-effect"
                    onclick={next}>
                    <span class="material-symbols-rounded text-icon-dt-6 text-gv-dark-text">arrow_right</span>
                </button>
            </div>
        </div>
    {/if}
</div>