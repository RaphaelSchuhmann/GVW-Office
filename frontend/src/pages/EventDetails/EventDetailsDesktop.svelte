<script>
    import { push } from "svelte-spa-router";
    import { viewport } from "../../stores/viewport.svelte";
    import {
        modeMap,
        ordinalMap,
        statusMap,
        typeMap,
        updateEvent,
        weekDayMap
    } from "../../services/eventsService.svelte";
    import { fetchAndSetRaw } from "../../services/filterService.svelte";
    import { user } from "../../stores/user.svelte";

    import ToastStack from "../../components/ToastStack.svelte";
    import PageHeader from "../../components/PageHeader.svelte";
    import DesktopSidebar from "../../components/DesktopSidebar.svelte";
    import Button from "../../components/Button.svelte";
    import Input from "../../components/Input.svelte";
    import ConfirmDeleteModal from "../../components/ConfirmDeleteModal.svelte";
    import Dropdown from "../../components/Dropdown.svelte";
    import DefaultDatepicker from "../../components/DefaultDatepicker.svelte";
    import TabBar from "../../components/TabBar.svelte";
    import Checkbox from "../../components/Checkbox.svelte";
    import { getOrdinalFromDMY, getWeekDayFromDMYMondayFirst } from "../../services/utils";
    import Textarea from "../../components/Textarea.svelte";
    import Spinner from "../../components/Spinner.svelte";
    import ChangelogsModal from "../../components/ChangelogsModal.svelte";

    let {
        eventData,
        isEditing = $bindable(),
        ...restProps
    } = $props();

    /** @type {import("../../components/ChangelogsModal.svelte").default} */
    let changelogModal = $state();

    let draft = $state(null);
    let isSubmitting = $state(false);

    const currentDate = $derived(isEditing ? draft?.date : eventData?.date);
    const ordinal = $derived(getOrdinalFromDMY(currentDate));
    const weekDay = $derived(getWeekDayFromDMYMondayFirst(currentDate));

    /**
     * Initializes edit mode for the current event.
     *
     * Creates a deep clone of `eventData` and assigns it to `draft`
     * to allow non-destructive editing. Enables the editing state.
     */
    function startEditing() {
        draft = JSON.parse(JSON.stringify(eventData));
        isEditing = true;
    }

    /**
     * Cancels the current editing session.
     *
     * Discards the draft object and exits edit mode
     * without persisting any changes.
     */
    function cancelEditing() {
        draft = null;
        isEditing = false;
    }

    /**
     * Reactive derived state that determines whether
     * the current draft can be saved.
     *
     * Returns `true` only if:
     * - A draft and original event data exist
     * - All required fields are non-null, defined, and non-empty
     * - The draft differs from the original event data
     *
     * Used to enable or disable the save/update action.
     */
    const hasChanges = $derived.by(() => {
        if (!draft || !eventData) return false;

        // 1. Validation: Ensure required fields aren't empty
        const requiredFields = ["title", "type", "status", "location", "date", "time", "mode"];
        const isFilled = requiredFields.every(field => draft[field]?.toString().trim());
        if (!isFilled) return false;

        // 2. Comparison: Check top-level fields
        const baseChanged =
            draft.title !== eventData.title ||
            draft.type !== eventData.type ||
            draft.status !== eventData.status ||
            draft.location !== eventData.location ||
            draft.date !== eventData.date ||
            draft.time !== eventData.time ||
            draft.mode !== eventData.mode;

        // Handle null vs empty string for description
        const descChanged = (draft.description || "") !== (eventData.description || "");

        let recurrenceChanged = false;
        if (draft.mode === "monthly") {
            const dRec = draft.recurrence || {};
            const eRec = eventData.recurrence || {};

            recurrenceChanged =
                dRec.monthlyKind !== eRec.monthlyKind ||
                dRec.dayOfMonth  !== eRec.dayOfMonth  ||
                dRec.weekDay     !== eRec.weekDay     ||
                dRec.ordinal     !== eRec.ordinal;
        }

        // Return TRUE if any part changed
        return !isSubmitting || baseChanged || descChanged || recurrenceChanged;
    });

    /**
     * Pre-effect that ensures a draft exists when entering edit mode.
     *
     * If editing is enabled but no draft is present,
     * a deep clone of the current event data is created.
     *
     * Acts as a safety mechanism against inconsistent state.
     */
    $effect.pre(() => {
        if (isEditing && !draft) {
            draft = JSON.parse(JSON.stringify(eventData));
        }
    });

    /**
     * Persists the current draft to the backend.
     *
     * - Sends a snapshot of the draft to the update API
     * - Exits edit mode and clears the draft
     *
     * Assumes validation has already been handled externally.
     */
    async function updateEventData() {
        isSubmitting = true;
        await updateEvent($state.snapshot(draft));

        isSubmitting = false;
        isEditing = false;
        draft = null;
    }

    /**
     * Navigates back to the events overview page.
     *
     * - Refreshes the raw event list
     * - Performs route navigation to `/events`
     *
     * Ensures the overview reflects the latest persisted state.
     */
    async function routeToEvents() {
        await fetchAndSetRaw();
        await push("/events");
    }

    // ==================
    // MODAL REFERENCES
    // ==================
    /**
     * Reference to the delete confirmation modal.
     * Used to initiate and confirm event deletion flow.
     * @type {import("../../components/ConfirmDeleteModal.svelte").default}
     */
    let confirmDeleteEventModal = $state();
</script>

<ToastStack/>
<ChangelogsModal bind:this={changelogModal}/>

<ConfirmDeleteModal expectedInput={`${eventData.title}`} id={eventData.id}
                    title="Veranstaltung löschen" subTitle="Sind Sie sich sicher das Sie diese Veranstaltung löschen möchten?"
                    action="deleteEvent"
                    onClose={async () => {await push("/events")}}
                    bind:this={confirmDeleteEventModal}
/>

<main class="flex h-screen overflow-hidden">
    <DesktopSidebar currentPage="events" handleChangelogs={changelogModal.showModal} />
    <div class="flex flex-col min-h-0 w-full p-10 overflow-hidden">
        <PageHeader title="Veranstaltung" subTitle={`Details der Veranstaltung "${eventData?.title ?? ""}"`}>
            {#if viewport.width > 900}
                {#if !isEditing}
                    <Button type="secondary" onclick={async () => await routeToEvents()}>
                        <span class="material-symbols-rounded text-icon-dt-5">arrow_back</span>
                        <p class="ml-2 text-dt-3">Zurück</p>
                    </Button>
                {/if}
            {:else}
                <button
                    type="button"
                    class="cursor-pointer ml-auto hover:bg-gv-hover-effect flex items-center justify-center p-2 rounded-2"
                    onclick={async () => await routeToEvents()}
                >
                    <span class="material-symbols-rounded text-icon-dt-2">close</span>
                </button>
            {/if}
        </PageHeader>

        <div class="flex-1 min-h-0 overflow-y-auto w-full">
            <div class="flex flex-col items-center gap-5 min-[1500px]:w-1/2 min-[1200px]:w-2/3 w-full mt-5">
                {#if viewport.width < 900 && !isEditing && (user.role === "board_member" || user.role === "admin")}
                    <div class="flex items-center gap-2 w-full">
                        <Button type="delete" onclick={() => confirmDeleteEventModal.startDelete()}>
                            <span class="material-symbols-rounded mr-2">delete</span>
                            Löschen
                        </Button>
                        <Button type="primary" onclick={() => startEditing()}>
                            <span class="material-symbols-rounded mr-2">person_edit</span>
                            Bearbeiten
                        </Button>
                    </div>
                {/if}

                {#if !isEditing}
                    <Input bind:value={eventData.title} title="Titel" placeholder="Veranstaltung XYZ" readonly={true} />

                    <div class="w-full flex items-center gap-4">
                        <Input title="Typ" bind:value={typeMap[eventData.type]} readonly={true} />
                        <Input title="Status" bind:value={statusMap[eventData.status]} readonly={true} />
                    </div>

                    <Input bind:value={eventData.location} title="Ort" placeholder="Ort XYZ" readonly={true} />

                    <Textarea bind:value={eventData.description} title="Beschreibung"
                           placeholder="Kurze Beschreibung zur Veranstaltung..." readonly={true} />

                    <div class="w-full flex items-center gap-4">
                        <Input bind:value={eventData.date} title="Datum" placeholder="XX.XX.XXXX" readonly={true} />
                        <Input bind:value={eventData.time} title="Uhrzeit" placeholder="--:--" readonly={true} />
                    </div>

                    <TabBar contents={["Einmalig", "Wöchentlich", "Monatlich"]} selected={modeMap[eventData.mode]} disabled={true} />

                    {#if eventData.mode === "single"}
                        <p class="text-gv-dark-text text-dt-4 text-left w-full">Diese Veranstaltung findet nur einmal statt.</p>
                    {:else if eventData.mode === "weekly"}
                        <p class="text-gv-dark-text text-dt-4 text-left w-full">Jede Woche am {weekDayMap[weekDay]}</p>
                    {:else if eventData.mode === "monthly"}
                        <div class="w-full flex items-center justify-start gap-4">
                            <Checkbox
                                title="Am gleichen Datum"
                                isChecked={eventData.recurrence.monthlyKind === "date"}
                                disabled={true}
                            />

                            <Checkbox
                                title="Am gleichen Wochentag"
                                isChecked={eventData.recurrence.monthlyKind === "weekday"}
                                disabled={true}
                            />
                        </div>

                        {#if eventData.recurrence.monthlyKind === "date"}
                            <p class="text-gv-dark-text text-dt-4 text-left mt-2 w-full">Jeden Monat am {eventData.date}.</p>
                        {:else if eventData.recurrence.monthlyKind === "weekday"}
                            <p class="text-gv-dark-text text-dt-4 text-left mt-2 w-full">Jeden Monat am {`${ordinalMap[ordinal]} ${weekDayMap[weekDay]}`}.</p>
                        {:else}
                            <p class="text-gv-dark-text text-dt-4 text-left mt-2 w-full">Jeden Monat am {eventData.date}.</p>
                        {/if}
                    {/if}
                {:else}
                    <Input bind:value={draft.title} title="Titel" placeholder="Veranstaltung XYZ" />

                    <div class="w-full flex items-center gap-4">
                        <Dropdown title="Typ" options={["Proben", "Meeting", "Konzerte", "Sonstiges"]}
                                  onChange={(value) => draft.type = typeMap[value]} selected={typeMap[draft.type]} />
                        <Dropdown title="Status" options={["Bevorstehend", "Abgeschlossen"]}
                                  onChange={(value) => draft.status = statusMap[value]} selected={statusMap[draft.status]} />
                    </div>

                    <Input bind:value={draft.location} title="Ort" placeholder="Ort XYZ" />

                    <Textarea bind:value={draft.description} title="Beschreibung (Optional)"
                              placeholder="Kurze Beschreibung zur Veranstaltung..." />

                    <div class="w-full flex items-center gap-4">
                        <div class="flex flex-col items-start w-full h-full">
                            <p class="text-dt-6 font-medium">Datum</p>
                            <DefaultDatepicker marginTop="1" onChange={(value) => draft.date = value} selected={draft.date} />
                        </div>
                        <Input bind:value={draft.time} title="Uhrzeit" placeholder="--:--" />
                    </div>

                    <TabBar
                        contents={["Einmalig", "Wöchentlich", "Monatlich"]}
                        selected={modeMap[draft.mode]}
                        onChange={(val) => {
                            draft.mode = modeMap[val];

                            if (draft.mode === 'monthly') {
                                draft.recurrence.monthlyKind = "date";
                            }
                        }}
                    />

                    {#if draft.mode === "single"}
                        <p class="text-gv-dark-text text-dt-4 text-left w-full">Diese Veranstaltung findet nur einmal statt.</p>
                    {:else if draft.mode === "weekly"}
                        <p class="text-gv-dark-text text-dt-4 text-left w-full">Jede Woche am {weekDayMap[weekDay]}</p>
                    {:else if draft.mode === "monthly"}
                        <div class="w-full flex items-center justify-start gap-4">
                            <Checkbox
                                title="Am gleichen Datum"
                                isChecked={draft.recurrence.monthlyKind === "date"}
                                onChange={() => {
                                    draft.recurrence.monthlyKind = "date";
                                    const [day] = draft.date.split(".").map(Number);
                                    draft.recurrence.dayOfMonth = day;
                                }}
                            />

                            <Checkbox
                                title="Am gleichen Wochentag"
                                isChecked={draft.recurrence.monthlyKind === "weekday"}
                                onChange={() => {
                                    draft.recurrence.monthlyKind = "weekday";
                                    draft.recurrence.weekDay = weekDay;
                                    draft.recurrence.ordinal = ordinal;
                                }}
                            />
                        </div>

                        {#if draft.recurrence.monthlyKind === "date"}
                            <p class="text-gv-dark-text text-dt-4 text-left mt-2 w-full">Jeden Monat am {draft.date}.</p>
                        {:else if draft.recurrence.monthlyKind === "weekday"}
                            <p class="text-gv-dark-text text-dt-4 text-left mt-2 w-full">Jeden Monat
                                am {`${ordinalMap[ordinal]} ${weekDayMap[weekDay]}`}.</p>
                        {:else}
                            <p class="text-gv-dark-text text-dt-4 text-left mt-2 w-full">Jeden Monat am {draft.date}.</p>
                        {/if}
                    {/if}    
                {/if}

                {#if viewport.width > 900 && !isEditing && (user.role === "board_member" || user.role === "admin")}
                    <div class="flex items-center gap-4 w-full">
                        <Button type="delete" onclick={() => confirmDeleteEventModal.startDelete()}>
                            <span class="material-symbols-rounded mr-2">delete</span>
                            Löschen
                        </Button>
                        <Button type="primary" onclick={() => startEditing()}>
                            <span class="material-symbols-rounded mr-2">person_edit</span>
                            Bearbeiten
                        </Button>
                    </div>
                {/if}

                {#if isEditing}
                    <div class="flex items-center w-full gap-2">
                        <Button type="secondary" onclick={() => cancelEditing()} isCancel={true}>Abbrechen</Button>
                        <Button type="primary" disabled={!hasChanges} onclick={async () => await updateEventData()}>
                            {#if isSubmitting}
                                <Spinner light={true} />
                                <p>Speichern...</p>
                            {:else}
                                Speichern
                            {/if}
                        </Button>
                    </div>
                {/if}
            </div>
        </div>
    </div>
</main>