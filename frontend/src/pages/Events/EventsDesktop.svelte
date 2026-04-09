<script>
    import { user } from "../../stores/user.svelte";
    import { eventsStore } from "../../stores/events.svelte";
    import {
        ordinalMap,
        weekDayMap,
        modeMap,
        statusMap,
        typeMap,
        updateStatus,
        getEventOccurrence,
        addEvent,
        getOrdinalFromDateString,
        getWeekDayFromDateStringMondayFirst
    } from "../../services/eventsService.svelte";
    import { viewport } from "../../stores/viewport.svelte";

    import ToastStack from "../../components/ToastStack.svelte";
    import DesktopSidebar from "../../components/DesktopSidebar.svelte";
    import PageHeader from "../../components/PageHeader.svelte";
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
    import Textarea from "../../components/Textarea.svelte";
    import Spinner from "../../components/Spinner.svelte";
    import ChangelogsModal from "../../components/ChangelogsModal.svelte";
    import { formatISODateString } from "../../services/dateTimeUtils.js";

    // ================
    // MODAL REFERENCES
    // ================
    /** @type {import("../../components/ChangelogsModal.svelte").default} */
    let changelogModal = $state();

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

    let isSubmitting = $state(false);

    const saveDisabled = $derived(!(
        eventInput.type &&
        eventInput.status &&
        eventInput.date &&
        eventInput.mode &&
        eventInput.title &&
        eventInput.time &&
        eventInput.location
    ) || isSubmitting);

    const ordinal = $derived(getOrdinalFromDateString(eventInput.date));
    const weekDay = $derived(getWeekDayFromDateStringMondayFirst(eventInput.date));

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
        isSubmitting = true;

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

        try {
            await addEvent(event);
        } finally {
            isSubmitting = false;
        }

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

    // ============
    // DELETE EVENT
    // ============
    let eventTitle = $state("");

    /**
     * Initializes the event deletion process.
     *
     * Workflow:
     * 1. Close context menu.
     * 2. Resolve selected event from store.
     * 3. If not found, show error toast.
     * 4. Otherwise, open confirmation modal.
     *
     * @async
     * @returns {Promise<void>}
     */
    async function startDeleteEvent() {
        menu.data.open = false;
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
        if (eventTitle) confirmDeleteEventModal.startDelete();
    }

    // ==================
    // CONTEXT MENU STATE
    // ==================
    /**
     * Reactive context menu instance for member actions.
     * Stores open state, position, and currently active member ID.
     */
    let menu = createContextMenu();

    /**
     * Toggles the status of the currently selected member.
     *
     * If no active member is selected, the function exits early.
     * After updating, the member list is refreshed.
     *
     * @async
     * @returns {Promise<void>}
     */
    async function handleSwitchStatus() {
        if (!menu.data.activeId) return;

        menu.data.open = false;
        await updateStatus(menu.data.activeId);

        menu.data.activeId = null;
        await fetchAndSetRaw();
    }
</script>

<svelte:window oncontextmenu={() => (menu.data.open = false)} />

<ToastStack/>
<ChangelogsModal bind:this={changelogModal}/>

<ContextMenu bind:open={menu.data.open} x={menu.data.x} y={menu.data.y}>
    <Button type="contextMenu" onclick={async () =>  await push(`/events/details?id=${menu.data.activeId}&editing=false`)}>
        Details
    </Button>
    {#if user.role === "board_member" || user.role === "admin"}
        <Button type="contextMenu" onclick={async () =>  await push(`/events/details?id=${menu.data.activeId}&editing=true`)}>
            Bearbeiten
        </Button>
        <Button type="contextMenu" onclick={handleSwitchStatus}>Status ändern</Button>
        <Button type="contextMenu" fontColor="text-gv-delete" onclick={startDeleteEvent}>Löschen</Button>
    {/if}
</ContextMenu>

<Modal bind:this={addEventModal} extraFunction={resetAddInputs}
       title="Neue Veranstaltung hinzufügen" subTitle="Erfassen Sie hier die Details der Veranstaltung"
       width="2/5">

    <Input bind:value={eventInput.title} title="Titel" placeholder="Veranstaltung XYZ" marginTop="5" />

    <div class="w-full flex items-center gap-4 mt-5">
        <Dropdown title="Typ" options={["Proben", "Meeting", "Konzerte", "Sonstiges"]}
                  onChange={(value) => eventInput.type = typeMap[value]} />
        <Dropdown title="Status" options={["Bevorstehend", "Abgeschlossen"]}
                  onChange={(value) => eventInput.status = statusMap[value]} />
    </div>

    <Input bind:value={eventInput.location} title="Ort" placeholder="Ort XYZ" marginTop="5" />

    <Textarea bind:value={eventInput.description} title="Beschreibung (Optional)"
           placeholder="Kurze Beschreibung zur Veranstaltung..." marginTop="5" />

    <div class="w-full flex items-center gap-4 mt-5">
        <div class="flex flex-col items-start w-full h-full">
            <p class="text-dt-6 font-medium">Datum</p>
            <DefaultDatepicker marginTop="1" onChange={(value) => eventInput.date = value} />
        </div>
        <Input bind:value={eventInput.time} title="Uhrzeit" placeholder="--:--" />
    </div>

    <TabBar
        marginTop="5"
        contents={["Einmalig", "Wöchentlich", "Monatlich"]}
        selected={modeMap[eventInput.mode]}
        onChange={(val) => eventInput.mode = modeMap[val]}
    />

    {#if eventInput.mode === "single"}
        <p class="text-gv-dark-text text-dt-4 text-left w-full mt-5">Diese Veranstaltung findet nur einmal statt.</p>
    {:else if eventInput.mode === "weekly"}
        <p class="text-gv-dark-text text-dt-4 text-left w-full mt-5">Jede Woche am {weekDayMap[weekDay]}</p>
    {:else if eventInput.mode === "monthly"}
        <div class="w-full flex items-center justify-start gap-4 mt-5">
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

        {#if eventInput.recurrence.monthlyKind === "weekday"}
            <p class="text-gv-dark-text text-dt-4 text-left mt-5">Jeden Monat
                am {`${ordinalMap[ordinal]} ${weekDayMap[weekDay]}`}.</p>
        {:else}
            <p class="text-gv-dark-text text-dt-4 text-left mt-5">Jeden Monat am {formatISODateString(eventInput.date)}.</p>
        {/if}
    {/if}

    <div class="w-full flex items-center gap-4 mt-5">
        <Button type="secondary" onclick={() => addEventModal?.hideModal()}>Abbrechen</Button>
        <Button type="primary" disabled={saveDisabled} onclick={submitEvent}>
            {#if isSubmitting}
                <Spinner light={true} />
                <p>Speichern...</p>
            {:else}
                Hinzufügen
            {/if}
        </Button>
    </div>
</Modal>

<ConfirmDeleteModal expectedInput={eventTitle} id={menu.data.activeId}
                    title="Veranstaltung löschen"
                    subTitle="Sind Sie sich sicher das Sie diese Veranstaltung löschen möchten?"
                    action="deleteEvent"
                    onClose={async () => {menu.data.open = false; menu.data.activeId = null; await fetchAndSetRaw();}}
                    bind:this={confirmDeleteEventModal}
/>

<!--Switches to mobile page if width is less than 870px!-->
<main class="flex h-screen overflow-hidden">
    <DesktopSidebar currentPage="events" handleChangelogs={() => changelogModal?.showModal()}/>

    <div class="flex flex-col w-full overflow-hidden p-10 min-h-0">
        <PageHeader title="Veranstaltungen" subTitle="Verwaltung von Events, Proben und Konzerten"
                    showSlot={viewport.width > 1200}>
            {#if viewport.width > 1200}
                <Button type="primary" disabled={(user.role !== "admin" && user.role !== "board_member")}
                        onclick={() => addEventModal.showModal()}>
                    <span class="material-symbols-rounded min-[1900px]:text-icon-dt-4 text-icon-dt-5 mr-2">add</span>
                    <p class="min-[1900px]:text-dt-4 text-dt-5">Veranstaltung hinzufügen</p>
                </Button>
            {/if}
        </PageHeader>

        {#if viewport.width < 1200}
            <Button type="primary" disabled={(user.role !== "admin" && user.role !== "board_member")} marginTop="5"
                    onclick={() => addEventModal.showModal()}>
                <span class="material-symbols-rounded min-[1900px]:text-icon-dt-4 text-icon-dt-5 mr-2">add</span>
                <p class="min-[1900px]:text-dt-4 text-dt-5">Veranstaltung hinzufügen</p>
            </Button>
        {/if}

        <div class="flex items-center mt-10 max-w-1/5">
            <Filter options={["Alle Typen", "Proben", "Meeting", "Konzerte", "Sonstiges"]} page="events" />
        </div>

        <FilterTabBar contents={["Bevorstehend", "Abgeschlossen"]} selected="Bevorstehend" marginTop="5"
                      page="events" />

        <div class="flex-1 min-h-0 overflow-y-auto mt-5">
            <div
                class="min-[1470px]:grid min-[1470px]:grid-cols-2 flex flex-col gap-4 overflow-y-auto overflow-x-hidden">
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
                                <p class="text-dt-6 text-gv-light-text">{getEventOccurrence(event.id)}</p>
                            </div>
                            <div class="flex items-stretch gap-2">
                                <span class="material-symbols-rounded text-icon-dt-6 text-gv-light-text">schedule</span>
                                <p class="text-dt-6 text-gv-light-text">{event.time}</p>
                            </div>
                            <button
                                class="flex items-center justify-center p-2 cursor-pointer hover:bg-gv-hover-effect rounded-2 ml-auto"
                                onclick={(e) => menu.openFromButton(e, event.id)}>
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
    </div>
</main>