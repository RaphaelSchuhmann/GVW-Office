<script>
    import { onMount } from "svelte";
    import { loadUserData } from "../services/user";

    import ToastStack from "../components/ToastStack.svelte";
    import DesktopSidebar from "../components/DesktopSidebar.svelte";
    import PageHeader from "../components/PageHeader.svelte";
    import SettingsModal from "../components/SettingsModal.svelte";
    import { push } from "svelte-spa-router";
    import Button from "../components/Button.svelte";
    import { get } from "svelte/store";
    import { eventsStore } from "../stores/events";
    import { modeMap, ordinalMap, statusMap, typeMap, updateEvent, weekDayMap } from "../services/events";
    import Input from "../components/Input.svelte";
    import TabBar from "../components/TabBar.svelte";
    import Dropdown from "../components/Dropdown.svelte";
    import DefaultDatepicker from "../components/DefaultDatepicker.svelte";
    import Checkbox from "../components/Checkbox.svelte";
    import { getOrdinalFromDMY, getWeekDayFromDMYMondayFirst } from "../services/utils";

    /** @type {import("../components/SettingsModal.svelte").default} */
    let settingsModal;

    let event = {
        id: "",
        status: "",
        type: "",
        title: "",
        description: "",
        date: "",
        time: "",
        location: "",
        mode: "",
    };

    let edited = false;

    /**
     * Updates event information in the system
     * Handles monthly recurrence configuration and redirects to events page
     */
    async function handleUpdateEvent() {
        event = {
            ...event,
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

        await updateEvent(event);

        await push("/events");
        return;
    }

    let selectedType;
    let selectedStatus;
    let selectedDate;
    let selectedRecurrence;
    let inputTitle;
    let inputTime;
    let inputLocation;
    let inputDescription;
    let ordinal;
    let weekDay;
    let dayOfMonth;

    // If selectedRecurrence is monthly
    // NOTE: if neither are set to true but the mode is monthly default to monthly date checked
    let isMonthlyDateChecked = true; // by default
    let isMonthlyWeekDayChecked = false;

    $: if (formReady) ordinal = getOrdinalFromDMY(selectedDate);
    $: if (formReady) weekDay = getWeekDayFromDMYMondayFirst(selectedDate);

    let formReady = false;
    let originalForm = null;

    $: edited = formReady && (
        selectedType !== originalForm.type || selectedStatus !== originalForm.status ||
        selectedDate !== originalForm.date || selectedRecurrence !== originalForm.mode || inputTime !== originalForm.time ||
        inputTitle !== originalForm.title || inputLocation !== originalForm.location || inputDescription !== originalForm.description
    ) && (
        selectedType && selectedStatus && selectedDate && selectedRecurrence && inputTitle && inputTime && inputLocation
    );

    onMount(async () => {
        await loadUserData();

        const hash = window.location.hash;
        const queryString = hash.split("?")[1];
        if (!queryString) return;

        const params = new URLSearchParams(queryString);
        let eventId = params.get("id");

        if (eventId) {
            let events = get(eventsStore);
            event = events.raw.find(item => item.id === eventId);
        } else {
            await push("/events");
        }

        selectedType = typeMap[event.type];
        selectedStatus = statusMap[event.status];
        selectedDate = event.date;
        selectedRecurrence = modeMap[event.mode];
        inputTitle = event.title;
        inputTime = event.time;
        inputLocation = event.location;
        inputDescription = event.description;
        ordinal = event.mode === "monthly" && event.recurrence.monthlyKind === "weekday" ? ordinalMap[event.recurrence.ordinal] : 0;
        weekDay = event.mode === "monthly" && event.recurrence.monthlyKind === "weekday" ? ordinalMap[event.recurrence.weekDay] : 0;
        dayOfMonth = event.mode === "monthly" && event.recurrence.monthlyKind === "date" ? event.recurrence.dayOfMonth : 0;
        isMonthlyDateChecked = event.mode === "monthly" && event.recurrence.monthlyKind === "date";
        isMonthlyWeekDayChecked = event.mode === "monthly" && event.recurrence.monthlyKind === "weekday";

        if (modeMap[selectedRecurrence] === "monthly") {
            if (isMonthlyDateChecked || (!isMonthlyWeekDayChecked && !isMonthlyDateChecked)) {
                const [day, month, year] = selectedDate.split(".").map(Number);
                event = { ...event, recurrence: { monthlyKind: "date", dayOfMonth: day }};
                originalForm = { ...event, recurrence: { monthlyKind: "date", dayOfMonth: day }};
            } else if (isMonthlyWeekDayChecked) {
                event = { ...event, recurrence: { monthlyKind: "weekday", weekDay: weekDay, ordinal: ordinal }};
                originalForm = { ...event, recurrence: { monthlyKind: "weekday", weekDay: weekDay, ordinal: ordinal }};
            }
        }

        originalForm = {
            title: inputTitle,
            type: selectedType,
            status: selectedStatus,
            date: selectedDate,
            time: inputTime,
            location: inputLocation,
            description: inputDescription || "",
            mode: selectedRecurrence
        };

        formReady = true;
    });

    function settingsClick() {
        settingsModal.showModal();
    }
</script>

<SettingsModal bind:this={settingsModal}></SettingsModal>
<ToastStack></ToastStack>
<main class="flex overflow-x-hidden overflow-y-auto">
    <DesktopSidebar onSettingsClick={settingsClick} currentPage="events"></DesktopSidebar>
    <div class="flex flex-col w-full h-dvh overflow-x-hidden overflow-y-auto p-10 min-h-0">
        <PageHeader title="Veranstaltung bearbeiten" subTitle={`Bearbeitung der Veranstaltung: "${event?.title ?? ""}"`}>
            <Button type="secondary" isCancel={true} on:click={async () => await push("/events")}>
                <p class="text-dt-4 ml-3">Abbrechen</p>
            </Button>
            <Button type="primary" disabled={!edited} on:click={handleUpdateEvent} isSubmit={true}>
                <span class="material-symbols-rounded text-icon-dt-5">edit_calendar</span>
                <p class="text-dt-4 ml-3">Speichern</p>
            </Button>
        </PageHeader>
        <div class="flex flex-col w-2/3 gap-5 mt-10">
            <Input bind:value={inputTitle} title="Titel" placeholder="Veranstaltung XYZ" marginTop="5"/>

            <div class="w-full flex items-center gap-4 mt-5">
                <Dropdown title="Typ" options={["Proben", "Meeting", "Konzerte", "Sonstiges"]} selected={selectedType} onChange={(value) => selectedType = value}/>
                <Dropdown title="Status" options={["Bevorstehend", "Abgeschlossen"]} selected={selectedStatus} onChange={(value) => selectedStatus = value}/>
            </div>

            <Input bind:value={inputLocation} title="Ort" placeholder="Ort XYZ" marginTop="5"/>

            <div class="w-full flex items-center gap-4 mt-5">
                <div class="flex flex-col items-start w-full h-full">
                    <p class="text-dt-6 font-medium">Datum</p>
                    <DefaultDatepicker marginTop="1" onChange={(value) => selectedDate = value} selected={selectedDate}/>
                </div>
                <Input bind:value={inputTime} title="Uhrzeit" placeholder="--:--"/>
            </div>

            <Input bind:value={inputDescription} title="Beschreibung (Optional)" placeholder="Kurze Beschreibung zur Veranstaltung..." marginTop="5"/>

            <TabBar marginTop="5" contents={["Einmalig", "Wöchentlich", "Monatlich"]} selected={selectedRecurrence} onChange={(value) => selectedRecurrence = value}/>

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
        </div>
    </div>
</main>