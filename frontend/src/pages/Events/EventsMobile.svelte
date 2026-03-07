<script>
    import { user } from "../../stores/user.svelte";
    import { eventsStore } from "../../stores/events.svelte";
    import {
        ordinalMap,
        weekDayMap,
        modeMap,
        statusMap,
        typeMap,
        getEventOccurrence,
        addEvent
    } from "../../services/eventsService.svelte";
    import { getOrdinalFromDMY, getWeekDayFromDMYMondayFirst } from "../../services/utils";
    import { viewport } from "../../stores/viewport.svelte";

    import ToastStack from "../../components/ToastStack.svelte";
    import PageHeader from "../../components/PageHeader.svelte";
    import Button from "../../components/Button.svelte";
    import Filter from "../../components/Filter.svelte";
    import FilterTabBar from "../../components/FilterTabBar.svelte";
    import Chip from "../../components/Chip.svelte";
    import Card from "../../components/Card.svelte";
    import Modal from "../../components/Modal.svelte";
    import Input from "../../components/Input.svelte";
    import Dropdown from "../../components/Dropdown.svelte";
    import DefaultDatepicker from "../../components/DefaultDatepicker.svelte";
    import TabBar from "../../components/TabBar.svelte";
    import Checkbox from "../../components/Checkbox.svelte";
    import { push } from "svelte-spa-router";
    import { fetchAndSetRaw } from "../../services/filterService.svelte";
    import MobileSidebar from "../../components/MobileSidebar.svelte";

    // ================
    // MODAL REFERENCES
    // ================
    /**
     * Reference to the global settings modal.
     * Used to programmatically open the application settings dialog.
     * @type {import("../../components/SettingsModal.svelte").default}
     */
    let settingsModal = $state();

    /**
     * Reference to the "Add Event" modal.
     * Controls visibility and lifecycle of the member creation dialog.
     * @type {import("../../components/Modal.svelte").default}
     */
    let addEventModal = $state();

    /**
     * Reference to the delete confirmation modal.
     * Used to initiate and confirm member deletion flow.
     * @type {import("../../components/ConfirmDeleteModal.svelte").default}
     */
    let confirmDeleteEventModal = $state();

    // =========
    // ADD EVENT
    // =========
    let eventInput = $state({
        title: "",
        type: "",
        status: "",
        date: "",
        time: "",
        location: "",
        description: "",
        mode: "single",
        recurrence: {
            monthlyKind: "date",
            dayOfMonth: null,
            weekDay: null,
            ordinal: null
        }
    });

    const saveDisabled = $derived(!(
        eventInput.type &&
        eventInput.status &&
        eventInput.date &&
        eventInput.mode &&
        eventInput.title &&
        eventInput.time &&
        eventInput.location
    ));

    const ordinal = $derived(getOrdinalFromDMY(eventInput.date));
    const weekDay = $derived(getWeekDayFromDMYMondayFirst(eventInput.date));

    /**
     * Submits the new event to the backend.
     *
     * Workflow:
     * 1. Map dropdown and recurrence display values to backend enum values.
     * 2. Send member payload to API.
     * 3. Close the modal.
     * 4. Refresh member list from backend.
     *
     * @async
     * @returns {Promise<void>}
     */
    async function submitEvent() {
        if (eventInput.mode === "monthly") {
            if (eventInput.recurrence.monthlyKind === "date") {
                eventInput.recurrence.dayOfMonth = Number(eventInput.date.split(".")[0]);
                delete eventInput.recurrence.weekDay;
                delete eventInput.recurrence.ordinal;
            } else {
                eventInput.recurrence.weekDay = weekDay;
                eventInput.recurrence.ordinal = ordinal;
                delete eventInput.recurrence.dayOfMonth;
            }
        } else {
            eventInput.recurrence = {
                monthlyKind: null,
                dayOfMonth: null,
                weekDay: null,
                ordinal: null,
            };
        }

        const event = {
            ...eventInput,
            description: eventInput.description || "Keine Beschreibung"
        };

        await addEvent(event);
        await fetchAndSetRaw();
        addEventModal?.hideModal();
    }

    /**
     * Resets all input fields of the "Add Event" form
     * to their initial default values.
     *
     * Called after successful submission or when closing the modal.
     */
    function resetAddInputs() {
        eventInput = {
            title: "",
            type: "",
            status: "",
            date: "",
            time: "",
            location: "",
            description: "",
            mode: "single",
            recurrence: {
                monthlyKind: "date",
                dayOfMonth: null,
                weekDay: null,
                ordinal: null
            }
        };
    }

    let sidebarOpen = $state(false);

    /**
     * Opens the global settings modal.
     */
    function settingsClick() {
        settingsModal.showModal();
    }
</script>

<ToastStack isMobile={true}></ToastStack>

<Modal bind:this={addEventModal} extraFunction={resetAddInputs} isMobile={true}
       title="Neue Veranstaltung hinzufügen" subTitle="Erfassen Sie hier die Details der Veranstaltung"
       width="2/5">

    <Input bind:value={eventInput.title} title="Titel" placeholder="Veranstaltung XYZ" marginTop="5" />

    <Dropdown title="Typ" options={["Proben", "Meeting", "Konzerte", "Sonstiges"]}
              onChange={(value) => eventInput.type = typeMap[value]} marginTop="5" />
    <Dropdown title="Status" options={["Bevorstehend", "Abgeschlossen"]}
              onChange={(value) => eventInput.status = statusMap[value]} marginTop="5" />

    <Input bind:value={eventInput.location} title="Ort" placeholder="Ort XYZ" marginTop="5" />

    <Input bind:value={eventInput.description} title="Beschreibung (Optional)"
           placeholder="Kurze Beschreibung zur Veranstaltung..." marginTop="5" />

    <div class="flex flex-col items-start w-full h-full mt-5">
        <p class="text-dt-6 font-medium">Datum</p>
        <DefaultDatepicker marginTop="1" onChange={(value) => eventInput.date = value} />
    </div>
    <Input bind:value={eventInput.time} title="Uhrzeit" placeholder="--:--" marginTop="5" />

    <div class="h-min mt-5">
        <TabBar contents={["Einmalig", "Wöchentlich", "Monatlich"]} selected={modeMap[eventInput.mode]}
                onChange={(val) => eventInput.mode = modeMap[val]}
        />
    </div>

    {#if eventInput.mode === "single"}
        <p class="text-gv-dark-text text-dt-6 text-left w-full mt-5">Diese Veranstaltung findet nur einmal statt.</p>
    {:else if eventInput.mode === "weekly"}
        <p class="text-gv-dark-text text-dt-6 text-left w-full mt-5">Jede Woche am {weekDayMap[weekDay]}</p>
    {:else if eventInput.mode === "monthly"}
        <div class="w-full flex flex-col items-start justify-start gap-4 mt-5">
            <Checkbox
                title="Am gleichen Datum"
                isChecked={eventInput.recurrence.monthlyKind === "date"}
                onChange={() => {
                    eventInput.recurrence.monthlyKind = "date";
                    const [day] = eventInput.date.split(".").map(Number);
                    eventInput.recurrence.dayOfMonth = day;
                }}
            />

            <Checkbox
                title="Am gleichen Wochentag"
                isChecked={eventInput.recurrence.monthlyKind === "weekday"}
                onChange={() => {
                    eventInput.recurrence.monthlyKind = "weekday";
                    eventInput.recurrence.weekDay = weekDay;
                    eventInput.recurrence.ordinal = ordinal;
                }}
            />
        </div>

        {#if eventInput.recurrence.monthlyKind === "date"}
            <p class="text-gv-dark-text text-dt-6 text-left mt-5">Jeden Monat am {eventInput.date}.</p>
        {:else if eventInput.recurrence.monthlyKind === "weekday"}
            <p class="text-gv-dark-text text-dt-6 text-left mt-5">Jeden Monat
                am {`${ordinalMap[ordinal]} ${weekDayMap[weekDay]}`}.</p>
        {:else}
            <p class="text-gv-dark-text text-dt-6 text-left mt-5">Jeden Monat am {eventInput.date}.</p>
        {/if}
    {/if}

    <div class="w-full flex items-center justify-end mt-5 gap-4">
        <Button type="secondary" onclick={() => addEventModal.hideModal()}>Abbrechen</Button>
        <Button type="primary" disabled={saveDisabled} onclick={submitEvent} isSubmit={true}>Hinzufügen</Button>
    </div>
</Modal>

<MobileSidebar onSettingsClick={settingsClick} currentPage="events" bind:isOpen={sidebarOpen} />

<main class="flex h-screen overflow-hidden">
    <div class="flex flex-col w-full overflow-hidden p-7 min-h-0">
        <div class="w-full flex items-center justify-start">
            <button class="flex items-center justify-center" onclick={() => sidebarOpen = true}>
                <span class="material-symbols-rounded text-icon-dt-4 text-gv-dark-text">menu</span>
            </button>
        </div>
        <PageHeader title="Veranstaltungen" subTitle="Verwaltung von Events, Proben und Konzerten"
                    showSlot={viewport.width > 1200}>
            {#if viewport.width > 1200}
                <Button type="primary" disabled={(user.role !== "admin" && user.role !== "vorstand")}
                        onclick={() => addEventModal.showModal()}>
                    <span class="material-symbols-rounded min-[1900px]:text-icon-dt-4 text-icon-dt-5 mr-2">add</span>
                    <p class="min-[1900px]:text-dt-4 text-dt-5">Veranstaltung hinzufügen</p>
                </Button>
            {/if}
        </PageHeader>

        {#if viewport.width < 1200}
            <Button type="primary" disabled={(user.role !== "admin" && user.role !== "vorstand")} marginTop="5"
                    onclick={() => addEventModal.showModal()}>
                <span class="material-symbols-rounded min-[1900px]:text-icon-dt-4 text-icon-dt-5 mr-2">add</span>
                <p class="min-[1900px]:text-dt-4 text-dt-5">Veranstaltung hinzufügen</p>
            </Button>
        {/if}

        <div class="flex items-center mt-5 w-full">
            <Filter options={["Alle Typen", "Proben", "Meeting", "Konzerte", "Sonstiges"]} page="events" />
        </div>

        <FilterTabBar contents={["Bevorstehend", "Abgeschlossen"]} selected="Bevorstehend" marginTop="5"
                      page="events" />

        <div class="flex-1 min-h-0 overflow-y-auto mt-5">
            <div
                class="min-[1470px]:grid min-[1470px]:grid-cols-2 flex flex-col gap-4 overflow-y-auto overflow-x-hidden">
                {#each eventsStore.display as event}
                    <button onclick={async () => { await push(`/events/details?id=${event.id}&editing=false`) }}>
                        <Card>
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
                                    <p class="text-dt-6 text-gv-light-text text-left">{getEventOccurrence(event.id)}</p>
                                </div>
                                <div class="flex items-stretch gap-2">
                                    <span
                                        class="material-symbols-rounded text-icon-dt-6 text-gv-light-text">schedule</span>
                                    <p class="text-dt-6 text-gv-light-text">{event.time}</p>
                                </div>
                            </div>
                            <div class="flex items-center w-full mt-2 gap-2">
                                <span
                                    class="material-symbols-rounded text-icon-dt-5 text-gv-light-text">location_on</span>
                                <p class="text-dt-5 text-gv-dark-text text-nowrap truncate">{event.location}</p>
                            </div>
                        </Card>
                    </button>
                {/each}
            </div>
        </div>
    </div>
</main>