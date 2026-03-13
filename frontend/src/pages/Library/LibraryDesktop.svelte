<script>
    import { voiceMap, getLibraryCategories, downloadScoreFiles, addScore } from "../../services/libraryService.svelte";
    import { user } from "../../stores/user.svelte.js";
    import { libraryStore } from "../../stores/library.svelte.js";
    import { appSettings } from "../../stores/appSettings.svelte.js";
    import { fetchAndSetRaw } from "../../services/filterService.svelte";
    import { addToast } from "../../stores/toasts.svelte";
    import { createContextMenu } from "../../lib/contextMenu.svelte";
    import { push } from "svelte-spa-router";
    import { viewport } from "../../stores/viewport.svelte";

    import ToastStack from "../../components/ToastStack.svelte";
    import DesktopSidebar from "../../components/DesktopSidebar.svelte";
    import PageHeader from "../../components/PageHeader.svelte";
    import SettingsModal from "../../components/SettingsModal.svelte";
    import SearchBar from "../../components/SearchBar.svelte";
    import Filter from "../../components/Filter.svelte";
    import Button from "../../components/Button.svelte";
    import Card from "../../components/Card.svelte";
    import Chip from "../../components/Chip.svelte";
    import CategoryModal from "../../components/CategoryModal.svelte";
    import ContextMenu from "../../components/ContextMenu.svelte";
    import ConfirmDeleteModal from "../../components/ConfirmDeleteModal.svelte";
    import Modal from "../../components/Modal.svelte";
    import Input from "../../components/Input.svelte";
    import Dropdown from "../../components/Dropdown.svelte";
    import TabBar from "../../components/TabBar.svelte";
    import Checkbox from "../../components/Checkbox.svelte";
    import FileSelector from "../../components/FileSelector.svelte";

    // ==================
    // MODAL REFERENCES
    // ==================
    /**
     * Reference to the global settings modal.
     * Used to programmatically open the application settings dialog.
     * @type {import("../../components/SettingsModal.svelte").default}
     */
    let settingsModal = $state();

    /**
     * Reference to the category modal.
     * Used to programmatically open the category dialog.
     * @type {import("../../components/CategoryModal.svelte").default}
     */
    let categoryModal = $state();

    /**
     * Reference to the confirm delete modal.
     * Used to programmatically open the confirm deletion dialog.
     * @type {import("../../components/ConfirmDeleteModal.svelte").default}
     */
    let confirmDeleteScoreModal = $state();

    /**
     * Reference to the add score modal.
     * Used to programmatically open the add score dialog.
     * @type {import("../../components/Modal.svelte").default}
     */
    let addScoreModal = $state();

    // ==========
    // CATEGORIES
    // ==========
    /**
     * Derived list of library categories including the default
     * `"Alle Kategorien"` entry.
     *
     * The categories are generated from `appSettings.scoreCategories`
     * via `getLibraryCategories(true)` and automatically update
     * whenever the underlying settings change.
     *
     * @type {string[]}
     */
    let categories = $derived(getLibraryCategories(true));

    // =========
    // ADD SCORE
    // =========
    /**
     * Reactive state object containing all form inputs used when
     * creating a new score entry.
     *
     * `voiceCount` is not directly edited by the user and is derived
     * from the number of selected voices when submitting the form.
     *
     * @type {{
     *   scoreId: string,
     *   title: string,
     *   artist: string,
     *   type: string,
     *   voices: string[],
     *   voiceCount: number,
     *   files: File[]
     * }}
     */
    let scoreInput = $state({
        scoreId: "",
        title: "",
        artist: "",
        type: "",
        voices: [],
        voiceCount: 0, // Not a direct input, is bound to voices array
        files: []
    });

    /**
     * Reactive state representing the currently selected choir type.
     * Used to control which voice options are available in the UI.
     *
     * @type {string}
     */
    let selectedChoirType = $state("Männerchor");

    /**
     * Derived boolean indicating whether the save action should be disabled.
     *
     * The save button is disabled unless all required fields are filled:
     * - scoreId
     * - title
     * - artist
     * - type
     * - at least one selected voice
     *
     * @type {boolean}
     */
    const saveDisabled = $derived(!(
        scoreInput.scoreId &&
        scoreInput.title &&
        scoreInput.artist &&
        scoreInput.type &&
        scoreInput.voices.length > 0
    ));

    /**
     * Resets all input fields in the "Add Score" form to their default values.
     *
     * This is typically called after successfully submitting a new score
     * or when the form should be cleared before creating another entry.
     *
     * @returns {void}
     */
    function resetAddInputs() {
        scoreInput = {
            scoreId: "",
            title: "",
            artist: "",
            type: "",
            voices: [],
            voiceCount: 0,
            files: []
        };
    }

    /**
     * Adds or removes a voice from the current score input depending
     * on the checkbox state.
     *
     * When enabled, the voice is added to the `voices` array while
     * ensuring that duplicates cannot occur. When disabled, the voice
     * is removed from the array.
     *
     * @param {string} voice - The voice identifier to toggle.
     * @param {boolean} isChecked - Whether the voice should be added (`true`)
     * or removed (`false`).
     * @returns {void}
     */
    function toggleVoice(voice, isChecked) {
        scoreInput.voices = isChecked
            ? [...new Set([...scoreInput.voices, voice])]
            : scoreInput.voices.filter((item) => item !== voice);
    }

    /**
     * Submits the current score input to the backend to create a new score.
     *
     * The function:
     * 1. Constructs a new score object including the calculated `voiceCount`.
     * 2. Sends the data to the API via `addScore`.
     * 3. Refreshes the library data (`fetchAndSetRaw`).
     * 4. Closes the "Add Score" modal.
     *
     * `$state.snapshot()` is used to pass a plain object to the API
     * instead of the reactive proxy.
     *
     * @returns {Promise<void>}
     */
    async function submitScore() {
        const score = {
            ...scoreInput,
            voiceCount: scoreInput.voices.length
        };

        await addScore($state.snapshot(score));
        await fetchAndSetRaw();
        addScoreModal.hideModal();
    }

    // ============
    // DELETE SCORE
    // ============
    /**
     * Reactive state storing the title of the score currently selected
     * for deletion. This is typically displayed in the confirmation modal.
     *
     * @type {string}
     */
    let scoreTitle = $state("");

    /**
     * Initiates the score deletion workflow.
     *
     * The function closes the context menu, resolves the selected score
     * from `libraryStore.raw` using the active menu entry ID, and stores
     * the score title for display in the confirmation dialog.
     *
     * If the score cannot be found, an error toast is displayed.
     * Otherwise, the delete confirmation modal is opened.
     *
     * @returns {Promise<void>}
     */
    async function startDeleteScore() {
        menu.data.open = false;
        const score = libraryStore.raw.find(item => item.id === menu.data.activeId);

        if (!score) {
            addToast({
                title: "Noten nicht gefunden",
                subTitle: "Die ausgewählten Noten wurden nicht gefunden. Bitte versuchen Sie es erneut.",
                type: "error"
            });
            return;
        }

        scoreTitle = score.title;
        if (scoreTitle) confirmDeleteScoreModal.startDelete();
    }

    // ============
    // CONTEXT MENU
    // ============
    /**
     * Reactive context menu instance for member actions.
     * Stores open state, position, and currently active member ID.
     */
    let menu = createContextMenu();

    /**
     * Opens the global settings modal.
     */
    function settingsClick() {
        settingsModal.showModal();
    }
</script>

<svelte:window oncontextmenu={() => (menu.data.open = false)} />

<SettingsModal bind:this={settingsModal}></SettingsModal>
<ToastStack></ToastStack>

<CategoryModal bind:this={categoryModal} />

<ContextMenu bind:open={menu.data.open} x={menu.data.x} y={menu.data.y}>
    <Button type="contextMenu"
            onclick={async () =>  await push(`/library/details?id=${menu.data.activeId}&editing=false`)}>
        Details
    </Button>
    {#if user.role === "vorstand" || user.role === "admin"}
        <Button type="contextMenu"
                onclick={async () =>  await push(`/library/details?id=${menu.data.activeId}&editing=true`)}>
            Bearbeiten
        </Button>
        <Button type="contextMenu" fontColor="text-gv-delete" onclick={() => startDeleteScore()}>Löschen</Button>
    {/if}
</ContextMenu>

<ConfirmDeleteModal expectedInput={scoreTitle} id={menu.data.activeId}
                    title="Noten löschen" subTitle="Sind Sie sich sicher das Sie diese Noten löschen möchten?"
                    action="deleteLibEntry"
                    onClose={async () => {menu.data.open = false; menu.data.activeId = null; await fetchAndSetRaw();}}
                    bind:this={confirmDeleteScoreModal} />

<Modal title="Neue Noten hinzufügen" subTitle="Erfassen Sie hier die Details der Noten"
       width="2/5" bind:this={addScoreModal} extraFunction={resetAddInputs}>
    <Input title="Noten ID" placeholder="T01" bind:value={scoreInput.scoreId} />
    <Input title="Titel" placeholder="The Final Countdown" bind:value={scoreInput.title} marginTop="5" />
    <Input title="Komponist/Band" placeholder="Europe" bind:value={scoreInput.artist} marginTop="5" />
    <Dropdown title="Kategorie" options={getLibraryCategories(false)}
              onChange={(value) => scoreInput.type = appSettings.scoreCategories[value]} marginTop="5" />
    <TabBar contents={["Männerchor", "Gemischterchor"]} selected={selectedChoirType}
            onChange={(value) => {selectedChoirType = value; scoreInput.voices = [];}} marginTop="5" />

    <p class="text-gv-dark-text text-dt-5 font-semibold w-full text-left mt-3">Stimmen</p>
    <div class="w-full flex items-start justify-start mt-2 gap-8">
        {#if selectedChoirType === "Männerchor"}
            <div class="flex flex-col items-start justify-start gap-4">
                <Checkbox title="1. Tenor" onChange={(isChecked) => {toggleVoice("t1", isChecked);}} />
                <Checkbox title="2. Tenor" onChange={(isChecked) => {toggleVoice("t2", isChecked);}} />
            </div>

            <div class="flex flex-col items-start justify-start gap-4">
                <Checkbox title="1. Bass" onChange={(isChecked) => {toggleVoice("b1", isChecked);}} />
                <Checkbox title="2. Bass" onChange={(isChecked) => {toggleVoice("b2", isChecked);}} />
            </div>
        {:else}
            <div class="flex flex-col items-start justify-start gap-4">
                <Checkbox title="Tenor" onChange={(isChecked) => {toggleVoice("t", isChecked);}} />
                <Checkbox title="Bass" onChange={(isChecked) => {toggleVoice("b", isChecked);}} />
            </div>

            <div class="flex flex-col items-start justify-start gap-4">
                <Checkbox title="Sopran" onChange={(isChecked) => {toggleVoice("s", isChecked);}} />
                <Checkbox title="Alt" onChange={(isChecked) => {toggleVoice("a", isChecked);}} />
            </div>
        {/if}
    </div>

    <FileSelector title="Noten" marginTop="5"
                  validTypes={["pdf", "gp", "gp5", "gp3", "gp4", "gpx", "cap", "capx"]} page="library"
                  bind:files={scoreInput.files} />

    <div class="w-full flex items-center gap-4 mt-5">
        <Button type="secondary" onclick={() => addScoreModal.hideModal()}>Abbrechen</Button>
        <Button type="primary" disabled={saveDisabled} onclick={async () => await submitScore()}>Speichern</Button>
    </div>
</Modal>

<main class="flex overflow-hidden">
    <DesktopSidebar onSettingsClick={settingsClick} currentPage="library"></DesktopSidebar>
    <div class="flex flex-col w-full h-dvh overflow-hidden p-10 min-h-0">
        <PageHeader title="Notenbibliothek" subTitle="Verwaltung des gesamten Notenmaterials"
                    showSlot={viewport.width > 1300}>
            {#if (user.role === "vorstand" || user.role === "admin" || user.role === "Notenwart" || user.role === "chorleitung") && viewport.width > 1300}
                <Button type="primary" onclick={() => categoryModal.openModal()}>
                    <span class="material-symbols-rounded text-icon-dt-4 mr-2">discover_tune</span>
                    <p class="text-dt-4">Kategorien</p>
                </Button>
                <Button type="primary" onclick={() => addScoreModal.showModal()}>
                    <span class="material-symbols-rounded text-icon-dt-4 mr-2">add</span>
                    <p class="text-dt-4 text-nowrap">Noten hinzufügen</p>
                </Button>
            {/if}
        </PageHeader>

        {#if (user.role === "vorstand" || user.role === "admin" || user.role === "Notenwart" || user.role === "chorleitung") && viewport.width < 1300}
            <div class="flex items-center w-full min-[1000px]:gap-4 gap-2 mt-5">
                <Button type="primary" onclick={() => categoryModal.openModal()}>
                    <span
                        class="material-symbols-rounded min-[1000px]:text-icon-dt-4 text-icon-dt-5 mr-2">discover_tune</span>
                    <p class="min-[1000px]:text-dt-4 text-dt-5">Kategorien</p>
                </Button>
                <Button type="primary" onclick={() => addScoreModal.showModal()}>
                    <span class="material-symbols-rounded min-[1000px]:text-icon-dt-4 text-icon-dt-5 mr-2">add</span>
                    <p class="min-[1000px]:text-dt-4 text-dt-5 text-nowrap">Noten hinzufügen</p>
                </Button>
            </div>
        {/if}

        <div class="flex min-[1300px]:items-center max-[1300px]:flex-col w-full gap-2 mt-5">
            <SearchBar placeholder="Noten durchsuchen..." page="library" />
            <div class="h-full min-[1300px]:max-w-1/3 max-[1300px]:w-full">
                <Filter page="library" options={categories} textWrap={false} customDefault="Alle Kategorien" />
            </div>
        </div>

        <div class="flex-1 min-h-0 overflow-y-auto mt-5">
            <div
                class="min-[1470px]:grid min-[1470px]:grid-cols-2 flex flex-col gap-4 overflow-y-auto overflow-x-hidden">
                {#each libraryStore.display as score}
                    <Card oncontextmenu={(e) => menu.openFromEvent(e, score.id)}>
                        <div class="flex items-start justify-start gap-2 w-full">
                            <span class="material-symbols-rounded text-icon-dt-6 text-gv-primary">music_note</span>
                            <div class="flex flex-col items-start gap-1 max-w-2/3">
                                <p class="text-gv-dark-text text-dt-5">{score.title}</p>
                                <p class="text-gv-light-text text-dt-7">{score.artist}</p>
                            </div>
                            <div class="flex items-center justify-center ml-auto">
                                <button
                                    class="flex items-center justify-center p-2 cursor-pointer hover:bg-gv-hover-effect rounded-2"
                                    onclick={async () => await downloadScoreFiles(score.id)}>
                                    <span class="material-symbols-rounded text-icon-dt-5">download</span>
                                </button>
                                <button
                                    class="flex items-center justify-center p-2 cursor-pointer hover:bg-gv-hover-effect rounded-2"
                                    onclick={(e) => menu.openFromButton(e, score.id)}>
                                    <span class="material-symbols-rounded text-icon-dt-5">more_horiz</span>
                                </button>
                            </div>
                        </div>

                        <div class="flex w-full items-center justify-start mt-2">
                            <Chip text={appSettings.scoreCategories[score.type]} />
                        </div>

                        <div class="flex w-full items-center justify-start mt-4 gap-2">
                            <span
                                class="material-symbols-rounded text-gv-light-text text-icon-dt-5">import_contacts</span>
                            {#each score.voices as voice}
                                <p class="text-gv-light-text text-dt-7">{voiceMap[voice]}</p>
                            {/each}
                        </div>

                        <div class="flex w-full items-center justify-start mt-2">
                            <p class="text-gv-light-text text-dt-7">{score.voiceCount}-stimmig</p>
                        </div>

                        <div class="flex w-full items-center justify-start mt-2">
                            <p class="text-gv-light-text text-dt-6">
                                Noten-ID: {score.scoreId || "Keine ID vorhanden"}</p>
                        </div>
                    </Card>
                {/each}
            </div>
        </div>
    </div>
</main>