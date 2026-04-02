<script>
    import { push } from "svelte-spa-router";
    import { viewport } from "../../stores/viewport.svelte";
    import { fetchAndSetRaw } from "../../services/filterService.svelte";
    import { user } from "../../stores/user.svelte";

    import ToastStack from "../../components/ToastStack.svelte";
    import PageHeader from "../../components/PageHeader.svelte";
    import SettingsModal from "../../components/SettingsModal.svelte";
    import Button from "../../components/Button.svelte";
    import Input from "../../components/Input.svelte";
    import ConfirmDeleteModal from "../../components/ConfirmDeleteModal.svelte";
    import Dropdown from "../../components/Dropdown.svelte";
    import TabBar from "../../components/TabBar.svelte";
    import Checkbox from "../../components/Checkbox.svelte";
    import { determineChoirType } from "../../services/utils";
    import FileSelector from "../../components/FileSelector.svelte";
    import { appSettings } from "../../stores/appSettings.svelte";
    import { downloadScoreFiles, getLibraryCategories, updateScore } from "../../services/libraryService.svelte";

    let {
        scoreData,
        isEditing = $bindable(),
        ...restProps
    } = $props();

    $effect(() => {
        if (isEditing && (user.role !== "board_member" && user.role !== "admin" && user.role !== "librarian" && user.role !== "conductor")) isEditing = false;
    });

    let draft = $state(null);

    let originalSelectedChoirType =  $derived(determineChoirType(scoreData.voices[0]) ? "Männerchor" : "Gemischterchor");
    let editedSelectedChoirType = $derived(originalSelectedChoirType);
    let editTabBarInitialized = $state(false);

    /**
     * Initializes edit mode for the current score.
     *
     * Creates a deep clone of `scoreData` and assigns it to `draft`
     * to allow non-destructive editing. Enables the editing state.
     */
    function startEditing() {
        draft = JSON.parse(JSON.stringify(scoreData));
        isEditing = true;
        editTabBarInitialized = false;
        editedSelectedChoirType = originalSelectedChoirType;
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
     * Adds or removes a voice from the draft's `voices` array depending on the checkbox state.
     * 
     * If `isChecked` is true, the given voice is added to the array while ensuring
     * no duplicates exist (using a Set). If `isChecked` is false, the voice is removed from the array.
     * 
     * This function updates `draft.voices` immutably by creating a new array
     * instead of modifying the existing one.
     * 
     * @param voice - The voice identifier to add or remove
     * @param isChecked - Indicates whether the voice checkbox is checked.
     */
    function toggleVoice(voice, isChecked) {
        draft.voices = isChecked
            ? [...new Set([...draft.voices, voice])]
            : draft.voices.filter((item) => item !== voice);
    }

    /**
     * Reactive derived state that determines whether
     * the current draft can be saved.
     *
     * Returns `true` only if:
     * - A draft and original score data exist
     * - All required fields are non-null, defined, and non-empty
     * - The draft differs from the original score data
     *
     * Used to enable or disable the save/update action.
     */
    const hasChanges = $derived.by(() => {
        if (!draft || !scoreData) return false;

        const requiredFields = ["title", "artist", "type", "voices"];
        const allFieldsFilled = requiredFields.every(field => {
            const value = draft[field];

            if (Array.isArray(value)) {
                return value.length > 0;
            } else {
                return value !== null && value !== undefined && String(value).trim() !== "";
            }
        });

        const isDifferent = JSON.stringify(normalizeScore(draft)) !== JSON.stringify(normalizeScore(scoreData));

        return isDifferent && allFieldsFilled;
    });

    /**
     * Creates a normalized representation of a score object so it can be
     * reliably compared with another score instance.
     *
     * This function removes insignificant differences that would otherwise
     * break simple equality checks (e.g. via JSON.stringify). In particular:
     * - String fields are trimmed to avoid whitespace-only differences.
     * - Missing values are replaced with consistent defaults.
     * - The `voices` array is sorted so that order differences do not affect
     *   equality checks.
     * - `files` is normalized to an empty array if undefined, but its order
     *   and content are preserved so additions/removals are still detectable.
     *
     * The returned object is intended for comparison purposes only and should
     * not be used as a full replacement for the original score object.
     *
     * @param {Object} score - The score object to normalize.
     * @param {string} [score.title]
     * @param {string} [score.artist]
     * @param {string} [score.type]
     * @param {string[]} [score.voices]
     * @param {Array} [score.files]
     * @returns {Object|undefined|null} A normalized score object, or the
     * original value if `score` is null or undefined.
    */
    function normalizeScore(score) {
        if (!score) return score;

        return {
            title: score.title?.trim() ?? "",
            artists: score.artist?.trim() ?? "",
            type: score.type ?? null,

            voices: [...(score.voices ?? [])].sort(),

            files : score.files ?? []
        };
    }

    /**
     * Pre-effect that ensures a draft exists when entering edit mode.
     *
     * If editing is enabled but no draft is present,
     * a deep clone of the current score data is created.
     *
     * Acts as a safety mechanism against inconsistent state.
     */
    $effect.pre(() => {
        if (isEditing && !draft) {
            draft = JSON.parse(JSON.stringify(scoreData));
        }
    });

    /**
     * Persists the current draft to the backend.
     *
     * - Sends a snapshot of the draft to the update API
     * - Updates local `scoreData` with the saved draft
     * - Exits edit mode and clears the draft
     *
     * Assumes validation has already been handled externally.
     */
    async function updateScoreData() {
        const score = {
            ...draft,
            originalFiles: scoreData.files,
            voiceCount: draft.voices.length
        };

        const successful = await updateScore(score);

        if (successful) scoreData = { ...draft };

        isEditing = false;
        draft = null;
    }

    /**
     * Navigates back to the library overview page.
     *
     * - Refreshes the raw library list
     * - Performs route navigation to `/library`
     *
     * Ensures the overview reflects the latest persisted state.
     */
    async function routeToLibrary() {
        await fetchAndSetRaw();
        await push("/library");
    }

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
     * Reference to the delete confirmation modal.
     * Used to initiate and confirm score deletion flow.
     * @type {import("../../components/ConfirmDeleteModal.svelte").default}
     */
    let confirmDeleteScoreModal = $state();

    function settingsClick() {
        settingsModal.showModal();
    }
</script>

<SettingsModal bind:this={settingsModal} isMobile={true}></SettingsModal>
<ToastStack isMobile={true}></ToastStack>

<ConfirmDeleteModal expectedInput={`${scoreData.title}`} id={scoreData.id}
                    title="Noten löschen" subTitle="Sind Sie sich sicher das Sie diese Noten löschen möchten?"
                    action="deleteLibEntry"
                    onClose={async () => {await fetchAndSetRaw(); await push("/library")}}
                    bind:this={confirmDeleteScoreModal} isMobile={true}
/>

<main class="flex h-screen overflow-hidden">
    <div class="flex flex-col min-h-0 w-full p-7 overflow-hidden">
        <PageHeader title="Veranstaltung" subTitle={`Details der Noten: "${scoreData?.title ?? ""}"`}>
            {#if viewport.width > 900}
                {#if !isEditing}
                    <Button type="secondary" onclick={async () => await routeToLibrary()}>
                        <span class="material-symbols-rounded text-icon-dt-5">arrow_back</span>
                        <p class="ml-2 text-dt-3">Zurück</p>
                    </Button>
                {/if}
            {:else}
                <button
                    type="button"
                    class="cursor-pointer ml-auto hover:bg-gv-hover-effect flex items-center justify-center p-2 rounded-2"
                    onclick={async () => await routeToLibrary()}
                >
                    <span class="material-symbols-rounded text-icon-dt-2">close</span>
                </button>
            {/if}
        </PageHeader>

        <div class="flex-1 min-h-0 overflow-y-auto w-full">
            <div class="flex flex-col items-center gap-5 min-[1500px]:w-1/2 min-[1200px]:w-2/3 w-full mt-5">
                {#if viewport.width < 900 && !isEditing && (user.role === "board_member" || user.role === "admin" || user.role === "librarian" || user.role === "conductor")}
                    <div class="flex items-center gap-2 w-full">
                        <Button type="delete" onclick={() => confirmDeleteScoreModal.startDelete()}>
                            <span class="material-symbols-rounded mr-2">delete</span>
                            Löschen
                        </Button>
                        <Button type="primary" onclick={() => startEditing()}>
                            <span class="material-symbols-rounded mr-2">person_edit</span>
                            Bearbeiten
                        </Button>
                    </div>
                {/if}

                {#if viewport.width < 900 && !isEditing}
                    <Button type="secondary" onclick={async () => await downloadScoreFiles(scoreData.id)}>
                        <span class="material-symbols-rounded mr-2">download</span>
                        Herunterladen
                    </Button>
                {/if}

                {#if !isEditing}
                    <Input title="Noten ID" placeholder="T01" bind:value={scoreData.scoreId} readonly={true} />
                    <Input title="Titel" placeholder="The Final Countdown" bind:value={scoreData.title} readonly={true} />
                    <Input title="Komponist/Band" placeholder="Europe" bind:value={scoreData.artist} readonly={true} />
                    <Input title="Kategorie" bind:value={appSettings.scoreCategories[scoreData.type]} readonly={true}/>
                    <TabBar contents={["Männerchor", "Gemischterchor"]} selected={originalSelectedChoirType} disabled={true} />

                    <p class="text-gv-dark-text text-dt-5 font-semibold w-full text-left">Stimmen</p>
                    <div class="w-full flex items-start justify-start gap-8">
                        {#if originalSelectedChoirType === "Männerchor"}
                            <div class="flex flex-col items-start justify-start gap-4">
                                <Checkbox title="1. Tenor" isChecked={scoreData.voices.includes("t1")} disabled={true} />
                                <Checkbox title="2. Tenor" isChecked={scoreData.voices.includes("t2")} disabled={true} />
                            </div>
                        
                            <div class="flex flex-col items-start justify-start gap-4">
                                <Checkbox title="1. Bass" isChecked={scoreData.voices.includes("b1")} disabled={true} />
                                <Checkbox title="2. Bass" isChecked={scoreData.voices.includes("b2")} disabled={true} />
                            </div>
                        {:else}
                            <div class="flex flex-col items-start justify-start gap-4">
                                <Checkbox title="Tenor" isChecked={scoreData.voices.includes("t")} disabled={true} />
                                <Checkbox title="Bass" isChecked={scoreData.voices.includes("b")} disabled={true} />
                            </div>
                        
                            <div class="flex flex-col items-start justify-start gap-4">
                                <Checkbox title="Sopran" isChecked={scoreData.voices.includes("s")} disabled={true} />
                                <Checkbox title="Alt" isChecked={scoreData.voices.includes("a")} disabled={true} />
                            </div>
                        {/if}
                    </div>
                
                    <FileSelector title="Noten"
                                  validTypes={["pdf", "gp", "gp5", "gp3", "gp4", "gpx", "cap", "capx"]} page="library"
                                  bind:files={scoreData.files} disabled={true} />
                {:else}
                    <Input title="Noten ID" placeholder="T01" bind:value={draft.scoreId} />
                    <Input title="Titel" placeholder="The Final Countdown" bind:value={draft.title} />
                    <Input title="Komponist/Band" placeholder="Europe" bind:value={draft.artist} />
                    <Dropdown title="Kategorie" options={getLibraryCategories(false)} selected={appSettings.scoreCategories[draft.type]}
                              onChange={(value) => draft.type = appSettings.scoreCategories[value]} />
                    <TabBar contents={["Männerchor", "Gemischterchor"]} selected={editedSelectedChoirType}
                            onChange={(value) => {editedSelectedChoirType = value; !editTabBarInitialized ? editTabBarInitialized = true : draft.voices = [];}} />

                    <p class="text-gv-dark-text text-dt-5 font-semibold w-full text-left">Stimmen</p>
                    <div class="w-full flex items-start justify-start gap-8">
                        {#if editedSelectedChoirType === "Männerchor"}
                            <div class="flex flex-col items-start justify-start gap-4">
                                <Checkbox title="1. Tenor" isChecked={draft.voices.includes("t1")} onChange={(isChecked) => {toggleVoice("t1", isChecked);}} />
                                <Checkbox title="2. Tenor" isChecked={draft.voices.includes("t2")} onChange={(isChecked) => {toggleVoice("t2", isChecked);}} />
                            </div>
                        
                            <div class="flex flex-col items-start justify-start gap-4">
                                <Checkbox title="1. Bass" isChecked={draft.voices.includes("b1")} onChange={(isChecked) => {toggleVoice("b1", isChecked);}} />
                                <Checkbox title="2. Bass" isChecked={draft.voices.includes("b2")} onChange={(isChecked) => {toggleVoice("b2", isChecked);}} />
                            </div>
                        {:else}
                            <div class="flex flex-col items-start justify-start gap-4">
                                <Checkbox title="Tenor" isChecked={draft.voices.includes("t")} onChange={(isChecked) => {toggleVoice("t", isChecked);}} />
                                <Checkbox title="Bass" isChecked={draft.voices.includes("b")} onChange={(isChecked) => {toggleVoice("b", isChecked);}} />
                            </div>
                        
                            <div class="flex flex-col items-start justify-start gap-4">
                                <Checkbox title="Sopran" isChecked={draft.voices.includes("s")} onChange={(isChecked) => {toggleVoice("s", isChecked);}} />
                                <Checkbox title="Alt" isChecked={draft.voices.includes("a")} onChange={(isChecked) => {toggleVoice("a", isChecked);}} />
                            </div>
                        {/if}
                    </div>
                
                    <FileSelector title="Noten"
                                  validTypes={["pdf", "gp", "gp5", "gp3", "gp4", "gpx", "cap", "capx"]} page="library"
                                  bind:files={draft.files} />
                {/if}

                {#if viewport.width > 900 && !isEditing && (user.role === "board_member" || user.role === "admin" || user.role === "librarian" || user.role === "conductor")}
                    <div class="flex items-center gap-4 w-full">
                        <Button type="delete" onclick={() => confirmDeleteScoreModal.startDelete()}>
                            <span class="material-symbols-rounded mr-2">delete</span>
                            Löschen
                        </Button>
                        <Button type="primary" onclick={() => startEditing()}>
                            <span class="material-symbols-rounded mr-2">person_edit</span>
                            Bearbeiten
                        </Button>
                    </div>
                {/if}

                {#if viewport.width > 900 && !isEditing}
                    <Button type="secondary" onclick={async () => await downloadScoreFiles(scoreData.id)}>
                        <span class="material-symbols-rounded mr-2">download</span>
                        Herunterladen
                    </Button>
                {/if}

                {#if isEditing}
                    <div class="flex items-center w-full gap-2">
                        <Button type="secondary" onclick={() => cancelEditing()} isCancel={true}>Abbrechen</Button>
                        <Button type="primary" disabled={!hasChanges} onclick={async () => await updateScoreData()}>
                            Speichern
                        </Button>
                    </div>
                {/if}
            </div>
        </div>
    </div>
</main>