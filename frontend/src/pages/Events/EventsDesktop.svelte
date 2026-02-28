<script>
    import { user } from "../../stores/user.svelte";
    import { eventsStore } from "../../stores/events.svelte";
    import { modeMap, statusMap, typeMap, updateStatus } from "../../services/eventsService.svelte";
    import {
        getLastDayOfCurrentMonth,
        getOrdinalFromDMY,
        getWeekDayFromDMYMondayFirst,
        makeDateFromMonthAndDay,
        parseDMYToDate
    } from "../../services/utils";
    import { addEvent, ordinalMap, weekDayMap } from "../../services/events";

    import ToastStack from "../../components/ToastStack.svelte";
    import DesktopSidebar from "../../components/DesktopSidebar.svelte";
    import PageHeader from "../../components/PageHeader.svelte";
    import SettingsModal from "../../components/SettingsModal.svelte";
    import Button from "../../components/Button.svelte";
    import Filter from "../../components/Filter.svelte";
    import FilterTabBar from "../../components/FilterTabBar.svelte";
    import Chip from "../../components/Chip.svelte";
    import ContextMenu from "../../components/ContextMenu.svelte";
    import Card from "../../components/Card.svelte";
    import Modal from "../../components/Modal.svelte";
    import Input from "../../components/Input.svelte";
    import Dropdown from "../../components/Dropdown.svelte";
    import DefaultDatepicker from "../../components/DefaultDatepicker.svelte";
    import TabBar from "../../components/TabBar.svelte";
    import Checkbox from "../../components/Checkbox.svelte";
    import ConfirmDeleteModal from "../../components/ConfirmDeleteModal.svelte";
    import { push } from "svelte-spa-router";
    import { fetchAndSetRaw } from "../../services/filterService.svelte";
    import { createContextMenu } from "../../lib/contextMenu.svelte";
    import { addToast } from "../../stores/toasts.svelte";

    // MODAL REFERENCES
    let settingsModal = $state();
    let addEventModal = $state();
    let confirmDeleteEventModal = $state();

    // ADD EVENT STATE
    let selectedType = $state("");
    let selectedStatus = $state("");
    let selectedDate = $state("");
    let selectedRecurrence = $state("Einmalig");
    let inputTitle = $state("");
    let inputTime = $state("");
    let inputLocation = $state("");
    let inputDescription = $state("");

    // Monthly recurrence state
    let isMonthlyDateChecked = $state(true);
    let isMonthlyWeekDayChecked = $state(false);

    // DERIVED STATE (Replaces $:)
    const saveDisabled = $derived(!(selectedType && selectedStatus && selectedDate && selectedRecurrence && inputTitle && inputTime && inputLocation));
    const ordinal = $derived(getOrdinalFromDMY(selectedDate));
    const weekDay = $derived(getWeekDayFromDMYMondayFirst(selectedDate));

    async function submitEvent() {
        let event = {
            title: inputTitle,
            type: typeMap[selectedType],
            status: statusMap[selectedStatus],
            date: selectedDate,
            time: inputTime,
            location: inputLocation,
            description: inputDescription ? inputDescription : "Keine Beschreibung",
            mode: modeMap[selectedRecurrence]
        };

        if (modeMap[selectedRecurrence] === "monthly") {
            if (isMonthlyDateChecked || (!isMonthlyWeekDayChecked && !isMonthlyDateChecked)) {
                const [day] = selectedDate.split(".").map(Number);
                event = { ...event, recurrence: { monthlyKind: "date", dayOfMonth: day } };
            } else if (isMonthlyWeekDayChecked) {
                event = { ...event, recurrence: { monthlyKind: "weekday", weekDay: weekDay, ordinal: ordinal } };
            }
        }

        await addEvent(event);
        await fetchAndSetRaw();
        addEventModal?.hideModal();
    }

    function clearAddModal() {
        inputTitle = "";
        inputTime = "";
        inputLocation = "";
        inputDescription = "";
    }

    // DELETE EVENT STATE
    let eventTitle = $state("");

    function startDeleteEvent() {
        menu.data.open = false;
        // Accessing store value directly via Svelte 5 logic
        const event = eventsStore.raw.find(item => item.id === menu.data.activeId);

        if (!event) {
            addToast({
                title: "Veranstaltung nicht gefunden",
                subTitle: "Die ausgewählte Veranstaltung wurde nicht gefunden. Bitte versuchen Sie es erneut.",
                type: "error"
            });
            return;
        }

        eventTitle = event.title;
        confirmDeleteEventModal.startDelete();
    }

    function getWhenValue(eventId) {
         // Using reactive store reference
        const eventArray = eventsStore.display.filter(item => item.id === eventId);

        if (eventArray.length > 0) {
            const event = eventArray[0];

            if (event.mode === "weekly") {
                const date = parseDMYToDate(event.date);
                return `Jede Woche am ${weekDayMap[date.getDay()]}`;
            }

            if (event.recurrence) {
                if (event.mode === "monthly" && event.recurrence.monthlyKind === "weekday") {
                    const ord = ordinalMap[event.recurrence.ordinal];
                    const wd = weekDayMap[event.recurrence.weekDay];
                    return `Jeden Monat am ${ord} ${wd}`;
                } else if (event.mode === "monthly" && event.recurrence.monthlyKind === "date") {
                    let dateVal = event.recurrence.dayOfMonth;
                    const lastDate = getLastDayOfCurrentMonth();

                    if (dateVal > lastDate) dateVal = lastDate;

                    const today = new Date();
                    if (dateVal < today.getDate()) {
                        const month = (today.getMonth() + 1) > 11 ? 0 : today.getMonth() + 1;
                        return makeDateFromMonthAndDay(dateVal, month);
                    } else {
                        return makeDateFromMonthAndDay(dateVal, today.getMonth());
                    }
                }
            }
            return event.date;
        }
        return "Unbekannt";
    }

    let menu = createContextMenu();

    async function handleSwitchStatus() {
        if (!menu.data.activeId) return;
        await updateStatus(menu.data.activeId);
        menu.data.open = false;
        menu.data.activeId = null;
        await fetchAndSetRaw();
    }

    function settingsClick() {
        settingsModal.showModal();
    }
</script>

<svelte:window oncontextmenu={() => (menu.data.open = false)} />

<SettingsModal bind:this={settingsModal}></SettingsModal>
<ToastStack></ToastStack>

<ContextMenu bind:open={menu.data.open} x={menu.data.x} y={menu.data.y}>
    <Button type="contextMenu" onclick={async () =>  await push(`/events/edit?id=${menu.data.activeId}`)}>
        Bearbeiten
    </Button>
    <Button type="contextMenu" onclick={handleSwitchStatus}>Status ändern</Button>
    <Button type="contextMenu" fontColor="text-gv-delete" onclick={startDeleteEvent}>Löschen</Button>
</ContextMenu>

<Modal bind:this={addEventModal} extraFunction={clearAddModal}
       title="Neue Veranstaltung hinzufügen" subTitle="Erfassen Sie hier die Details der Veranstaltung"
       width="2/5">

    <Input bind:value={inputTitle} title="Titel" placeholder="Veranstaltung XYZ" marginTop="5" />

    <div class="w-full flex items-center gap-4 mt-5">
        <Dropdown title="Typ" options={["Proben", "Meeting", "Konzerte", "Sonstiges"]}
                  onChange={(value) => selectedType = value} />
        <Dropdown title="Status" options={["Bevorstehend", "Abgeschlossen"]}
                  onChange={(value) => selectedStatus = value} />
    </div>

    <Input bind:value={inputLocation} title="Ort" placeholder="Ort XYZ" marginTop="5" />

    <div class="w-full flex items-center gap-4 mt-5">
        <div class="flex flex-col items-start w-full h-full">
            <p class="text-dt-6 font-medium">Datum</p>
            <DefaultDatepicker marginTop="1" onChange={(value) => selectedDate = value} />
        </div>
        <Input bind:value={inputTime} title="Uhrzeit" placeholder="--:--" />
    </div>

    <Input bind:value={inputDescription} title="Beschreibung (Optional)"
           placeholder="Kurze Beschreibung zur Veranstaltung..." marginTop="5" />

    <TabBar marginTop="5" contents={["Einmalig", "Wöchentlich", "Monatlich"]} selected="Einmalig"
            onChange={(value) => selectedRecurrence = value} />

    {#if selectedRecurrence === "Einmalig"}
        <p class="text-gv-dark-text text-dt-4 text-left w-full mt-5">Diese Veranstaltung findet nur einmal statt.</p>
    {:else if selectedRecurrence === "Wöchentlich"}
        <p class="text-gv-dark-text text-dt-4 text-left w-full mt-5">Jede Woche am {weekDayMap[weekDay]}</p>
    {:else if selectedRecurrence === "Monatlich"}
        <div class="w-full flex items-center justify-start gap-4 mt-5">
            <Checkbox title="Am gleichen Datum" bind:isChecked={isMonthlyDateChecked}
                      onChange={() => isMonthlyWeekDayChecked = false} />
            <Checkbox title="Am gleichen Wochentag" bind:isChecked={isMonthlyWeekDayChecked}
                      onChange={() => isMonthlyDateChecked = false} />
        </div>

        {#if isMonthlyDateChecked}
            <p class="text-gv-dark-text text-dt-4 text-left mt-5">Jeden Monat am {selectedDate}.</p>
        {:else if isMonthlyWeekDayChecked}
            <p class="text-gv-dark-text text-dt-4 text-left mt-5">Jeden Monat
                am {`${ordinalMap[ordinal]} ${weekDayMap[weekDay]}`}.</p>
        {:else}
            <p class="text-gv-dark-text text-dt-4 text-left mt-5">Jeden Monat am {selectedDate}.</p>
        {/if}
    {/if}

    <div class="w-full flex items-center gap-4 mt-5">
        <Button type="secondary" onclick={() => addEventModal?.hideModal()}>Abbrechen</Button>
        <Button type="primary" disabled={saveDisabled} onclick={submitEvent}>Speichern</Button>
    </div>
</Modal>

<ConfirmDeleteModal expectedInput={eventTitle} id={menu.data.activeId}
                    title="Veranstaltung löschen"
                    subTitle="Sind Sie sich sicher das Sie diese Veranstaltung löschen möchten?"
                    action="deleteEvent"
                    onClose={async () => {menu.data.open = false; menu.data.activeId = null; await fetchAndSetRaw();}}
                    bind:this={confirmDeleteEventModal}
/>

<main class="flex h-dvh overflow-hidden">
    <DesktopSidebar onSettingsClick={settingsClick} currentPage="events"></DesktopSidebar>
    <div class="flex flex-col w-full overflow-hidden p-10 min-h-0">
        <PageHeader title="Veranstaltungen" subTitle="Verwaltung von Events, Proben und Konzerten">
            <Button type="primary" disabled={(user.role !== "admin" && user.role !== "vorstand")}
                    onclick={() => addEventModal.showModal()}>
                <span class="material-symbols-rounded text-icon-dt-4">add</span>
                <p class="text-dt-4">Veranstaltung hinzufügen</p>
            </Button>
        </PageHeader>
        <div class="flex items-center mt-10 max-w-1/5">
            <Filter options={["Alle Typen", "Proben", "Meeting", "Konzerte", "Sonstiges"]} page="events" />
        </div>
        <FilterTabBar contents={["Bevorstehend", "Abgeschlossen"]} selected="Bevorstehend" marginTop="5" page="events" />
        <div class="flex-1 min-h-0 overflow-y-auto mt-5">
            <div class="grid grid-cols-2 gap-4 overflow-y-auto overflow-x-hidden">
                {#each eventsStore.display as event}
                    <Card oncontextmenu={(e) => menu.openFromEvent(e, event.id)}>
                        <div class="flex items-center w-full">
                            <p class="text-gv-dark-text text-dt-3 max-w-3/4 text-nowrap truncate">{event.title}</p>
                            <div class="ml-auto">
                                <Chip text={typeMap[event.type]} />
                            </div>
                        </div>
                        <div class="flex items-center w-full mt-2 gap-10">
                            <div class="flex items-stretch gap-2">
                                <span
                                    class="material-symbols-rounded text-icon-dt-6 text-gv-light-text">calendar_today</span>
                                <p class="text-dt-6 text-gv-light-text">{getWhenValue(event.id)}</p>
                            </div>
                            <div class="flex items-stretch gap-2">
                                <span class="material-symbols-rounded text-icon-dt-6 text-gv-light-text">schedule</span>
                                <p class="text-dt-6 text-gv-light-text">{event.time}</p>
                            </div>
                            {#if user.role === "vorstand" || user.role === "admin"}
                                <button
                                    class="flex items-center justify-center p-2 cursor-pointer hover:bg-gv-hover-effect rounded-2 ml-auto"
                                    onclick={(e) => menu.openFromButton(e, event.id)}>
                                    <span class="material-symbols-rounded">more_horiz</span>
                                </button>
                            {/if}
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
    </div>
</main>