<script>
    import { onMount } from "svelte";
    import { get } from "svelte/store";
    import { user } from "../stores/user";
    import { eventsStore } from "../stores/events";
    import { modeMap, statusMap, typeMap } from "../services/events";
    import { loadUserData } from "../services/user";
    import {
        parseDMYToDate,
        getLastDayOfCurrentMonth,
        makeDateForCurrentMonth,
        getWeekDayFromDMYMondayFirst,
        getOrdinalFromDMY
    } from "../services/utils";
    import { ordinalMap, weekDayMap, addEvent } from "../services/events";

    import ToastStack from "../components/ToastStack.svelte";
    import Sidebar from "../components/Sidebar.svelte";
    import PageHeader from "../components/PageHeader.svelte";
    import SettingsModal from "../components/SettingsModal.svelte";
    import Button from "../components/Button.svelte";
    import Filter from "../components/Filter.svelte";
    import FilterTabBar from "../components/FilterTabBar.svelte";
    import Chip from "../components/Chip.svelte";
    import ContextMenu from "../components/ContextMenu.svelte";
    import Card from "../components/Card.svelte";
    import Modal from "../components/Modal.svelte";
    import Input from "../components/Input.svelte";
    import Dropdown from "../components/Dropdown.svelte";
    import DefaultDatepicker from "../components/DefaultDatepicker.svelte";
    import TabBar from "../components/TabBar.svelte";
    import Checkbox from "../components/Checkbox.svelte";

    /** @type {import("../components/SettingsModal.svelte").default} */
    let settingsModal;

    /** @type {import("../components/FilterTabBar.svelte").default} */
    let filterBar;

    // ADD EVENT MODAL
    /** @type {import("../components/Modal.svelte").default} */
    let addEventModal;

    let saveDisabled = true; // Button is only enabled when all inputs are filled

    let selectedType = "";
    let selectedStatus = "";
    let selectedDate = "";
    let selectedRecurrence = "Einmalig";
    let inputTitle = "";
    let inputTime = "";
    let inputLocation = "";
    let inputDescription = "";
    let ordinal = 0;
    let weekDay = 0;

    // If selectedRecurrence is monthly
    // NOTE: if neither are set to true but the mode is monthly default to monthly date checked
    let isMonthlyDateChecked = true; // by default
    let isMonthlyWeekDayChecked = false;

    $: if (selectedType && selectedStatus && selectedDate && selectedRecurrence && inputTitle && inputTime && inputLocation) saveDisabled = false;
    $: ordinal = getOrdinalFromDMY(selectedDate);
    $: weekDay = getWeekDayFromDMYMondayFirst(selectedDate);

    async function submitEvent() {
        let event = {
            title: inputTitle,
            type: typeMap[selectedType],
            status: statusMap[selectedStatus],
            date: selectedDate,
            time: inputTime,
            location: inputLocation,
            description: inputDescription ? inputDescription : "Keine Beschreibung",
            mode: modeMap[selectedRecurrence],
        }

        if (modeMap[selectedRecurrence] === "monthly") {
            if (isMonthlyDateChecked || (!isMonthlyWeekDayChecked && !isMonthlyDateChecked)) {
                const [day, month, year] = selectedDate.split(".").map(Number);
                event = { ...event, recurrence: { monthlyKind: "date", dayOfMonth: day }};
            } else if (isMonthlyWeekDayChecked) {
                event = { ...event, recurrence: { monthlyKind: "weekday", weekDay: weekDay, ordinal: ordinal }};
            }
        }

        await addEvent(event);

        await filterBar.fetchData();
        addEventModal?.hideModal();
    }

    function clearAddModal() {
        inputTitle = "";
        inputTime = "";
        inputLocation = "";
        inputDescription = "";
    }

    // EVENT
    function getWhenValue(eventId) {
        const events = get(eventsStore);
        const eventArray = events.display.filter(item => item.id === eventId);

        if (eventArray.length > 0) {
            const event = eventArray[0];

            if (event.mode === "weekly") {
                const date = parseDMYToDate(event.date);
                return `Jede Woche am ${weekDayMap[date.getDay()]}`;
            }

            if (event.recurrence) {
                if (event.mode === "monthly" && event.recurrence.monthlyKind === "weekday") {
                    const ordinal = ordinalMap[event.recurrence.ordinal];
                    const weekDay = weekDayMap[event.recurrence.weekDay];
                    return `Jeden Monat am ${ordinal} ${weekDay}`;
                } else if (event.mode === "monthly" && event.recurrence.monthlyKind === "date") {
                    let date = event.recurrence.dayOfMonth;
                    const lastDate = getLastDayOfCurrentMonth();

                    if (date > lastDate) {
                        date = lastDate;
                    }

                    return makeDateForCurrentMonth(date);
                } else {
                    return event.date;
                }
            } else {
                return event.date;
            }
        }
        
        return "Unbekannt";
    }

    // CONTEXT MENU
    let menuOpen = false;
    let menuX = 0;
    let menuY = 0;
    let activeEventId = null;

    function openContextMenu(event, eventId) {
        event.preventDefault();
        event.stopPropagation();

        activeEventId = eventId;

        requestAnimationFrame(() => {
            menuX = Math.min(event.clientX, window.innerWidth - 180);
            menuY = Math.min(event.clientY, window.innerHeight - 114);
            menuOpen = true;
        });
    }

    function openContextMenuFromButton(event, eventId) {
        event.preventDefault();
        event.stopPropagation();

        activeEventId = eventId;

        const rect = event.currentTarget.getBoundingClientRect();

        menuOpen = true;

        requestAnimationFrame(() => {
            const menuWidth = 180;
            const menuHeight = 114;

            menuX = rect.left - menuWidth;
            menuY = Math.min(rect.bottom, window.innerHeight - menuHeight);
        });
    }

    onMount(async () => {
        await loadUserData();
    });

    function settingsClick() {
        settingsModal.showModal();
    }
</script>

<svelte:window on:contextmenu={() => (menuOpen = false)} />

<SettingsModal bind:this={settingsModal}></SettingsModal>
<ToastStack></ToastStack>

<ContextMenu bind:open={menuOpen} x={menuX} y={menuY}>
    <Button type="contextMenu">Bearbeiten
    </Button>
    <Button type="contextMenu">Status ändern</Button>
    <Button type="contextMenu" fontColor="text-gv-delete">Löschen</Button>
</ContextMenu>

<!-- Add event modal -->
<Modal bind:this={addEventModal} extraFunction={clearAddModal}
       title="Neue Veranstaltung hinzufügen" subTitle="Erfassen Sie hier die Details der Veranstaltung"
       width="2/5">

    <Input bind:value={inputTitle} title="Titel" placeholder="Veranstaltung XYZ" marginTop="5"/>

    <div class="w-full flex items-center gap-4 mt-5">
        <Dropdown title="Typ" options={["Proben", "Meeting", "Konzerte", "Sonstiges"]} onChange={(value) => selectedType = value}/>
        <Dropdown title="Status" options={["Bevorstehend", "Abgeschlossen"]} onChange={(value) => selectedStatus = value}/>
    </div>

    <Input bind:value={inputLocation} title="Ort" placeholder="Ort XYZ" marginTop="5"/>

    <div class="w-full flex items-center gap-4 mt-5">
        <div class="flex flex-col items-start w-full h-full">
            <p class="text-dt-6 font-medium">Datum</p>
            <DefaultDatepicker marginTop="1" onChange={(value) => selectedDate = value}/>
        </div>
        <Input bind:value={inputTime} title="Uhrzeit" placeholder="--:--"/>
    </div>

    <Input bind:value={inputDescription} title="Beschreibung (Optional)" placeholder="Kurze Beschreibung zur Veranstaltung..." marginTop="5"/>

    <TabBar marginTop="5" contents={["Einmalig", "Wöchentlich", "Monatlich"]} selected="Einmalig" onChange={(value) => selectedRecurrence = value}/>

    {#if selectedRecurrence === "Einmalig"}
        <p class="text-gv-dark-text text-dt-4 text-left w-full mt-5">Diese Veranstaltung findet nur einmal statt.</p>
    {:else if selectedRecurrence === "Wöchentlich"}
        <p class="text-gv-dark-text text-dt-4 text-left w-full mt-5">Jede Woche am {weekDayMap[weekDay]}</p>
    {:else if selectedRecurrence === "Monatlich"}
        <div class="w-full flex items-center justify-start gap-4 mt-5">
            <Checkbox title="Am gleichen Datum" bind:isChecked={isMonthlyDateChecked} onChange={() => isMonthlyWeekDayChecked = false}/>
            <Checkbox title="Am gleichen Wochentag" bind:isChecked={isMonthlyWeekDayChecked} onChange={() => isMonthlyDateChecked = false}/>
        </div>

        {#if isMonthlyDateChecked}
            <p class="text-gv-dark-text text-dt-4 text-left mt-5">Jeden Monat am {selectedDate}.</p>
        {:else if isMonthlyWeekDayChecked}
            <p class="text-gv-dark-text text-dt-4 text-left mt-5">Jeden Monat am {`${ordinalMap[ordinal]} ${weekDayMap[weekDay]}`}.</p>
        {:else}
            <p class="text-gv-dark-text text-dt-4 text-left mt-5">Jeden Monat am {selectedDate}.</p>
        {/if}
    {/if}

    <div class="w-full flex items-center gap-4 mt-5">
        <Button type="secondary" on:click={addEventModal?.hideModal}>Abbrechen</Button>
        <Button type="primary" disabled={saveDisabled} on:click={submitEvent}>Speichern</Button>
    </div>
</Modal>

<main class="flex overflow-hidden">
    <Sidebar onSettingsClick={settingsClick} currentPage="events"></Sidebar>
    <div class="flex flex-col w-full h-dvh overflow-hidden p-10 min-h-0">
        <PageHeader title="Veranstaltungen" subTitle="Verwaltung von Events, Proben und Konzerten">
            <Button type="primary" disabled={($user.role !== "admin" && $user.role !== "vorstand")}
                    on:click={addEventModal.showModal}>
                <span class="material-symbols-rounded text-icon-dt-4">add</span>
                <p class="text-dt-4">Veranstaltung hinzufügen</p>
            </Button>
        </PageHeader>
        <div class="flex items-center mt-10 max-w-1/5">
            <Filter options={["Alle Typen", "Proben", "Meeting", "Konzerte", "Sonstiges"]} page="events" debounce={false}/>
        </div>
        <FilterTabBar contents={["Bevorstehend", "Abgeschlossen"]} selected="Bevorstehend" marginTop="5" page="events" debounce={true} bind:this={filterBar}/>
        <div class="grid grid-cols-2 gap-4 overflow-y-auto overflow-x-hidden mt-5">
            {#each $eventsStore.display as event}
                <Card on:contextmenu={(e) => openContextMenu(e, event.id)}>
                    <div class="flex items-center w-full">
                        <p class="text-gv-dark-text text-dt-3 max-w-3/4 text-nowrap truncate">{event.title}</p>
                        <div class="ml-auto">
                            <Chip text={typeMap[event.type]}/>
                        </div>
                    </div>
                    <div class="flex items-center w-full mt-2 gap-10">
                        <div class="flex items-stretch gap-2">
                            <span class="material-symbols-rounded text-icon-dt-6 text-gv-light-text">calendar_today</span>
                            <p class="text-dt-6 text-gv-light-text">{getWhenValue(event.id)}</p>
                        </div>
                        <div class="flex items-stretch gap-2">
                            <span class="material-symbols-rounded text-icon-dt-6 text-gv-light-text">schedule</span>
                            <p class="text-dt-6 text-gv-light-text">{event.time}</p>
                        </div>
                        <button class="flex items-center justify-center p-2 cursor-pointer hover:bg-gv-hover-effect rounded-2 ml-auto"
                                on:click={(e) => openContextMenuFromButton(e, event.id)}>
                            <span class="material-symbols-rounded">more_horiz</span>
                        </button>
                    </div>
                    <div class="flex items-center w-full mt-2 gap-2">
                        <span class="material-symbols-rounded text-icon-dt-5 text-gv-light-text">location_on</span>
                        <p class="text-dt-5 text-gv-dark-text text-nowrap truncate">{event.location}</p>
                    </div>
                    <div class="flex items-center w-full mt-2">
                        <p class="text-dt-5 text-gv-light-text text-start text-nowrap truncate">{event.description}</p>
                    </div>
                </Card>
            {/each}
        </div>
    </div>
</main>