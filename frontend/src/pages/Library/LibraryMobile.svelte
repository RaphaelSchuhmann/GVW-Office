<script>
    import { voiceMap, getLibraryCategories, addScore } from "../../services/libraryService.svelte";
    import { user } from "../../stores/user.svelte.js";
    import { libraryStore } from "../../stores/library.svelte.js";
    import { appSettings } from "../../stores/appSettings.svelte.js";
    import { fetchAndSetRaw } from "../../services/filterService.svelte";
    import { push } from "svelte-spa-router";

    import ToastStack from "../../components/ToastStack.svelte";
    import PageHeader from "../../components/PageHeader.svelte";
    import SettingsModal from "../../components/SettingsModal.svelte";
    import SearchBar from "../../components/SearchBar.svelte";
    import Filter from "../../components/Filter.svelte";
    import Button from "../../components/Button.svelte";
    import Card from "../../components/Card.svelte";
    import Chip from "../../components/Chip.svelte";
    import CategoryModal from "../../components/CategoryModal.svelte";
    import Modal from "../../components/Modal.svelte";
    import Input from "../../components/Input.svelte";
    import Dropdown from "../../components/Dropdown.svelte";
    import TabBar from "../../components/TabBar.svelte";
    import Checkbox from "../../components/Checkbox.svelte";
    import FileSelector from "../../components/FileSelector.svelte";
    import MobileSidebar from "../../components/MobileSidebar.svelte";

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
     * Reference to the add score modal.
     * Used to programmatically open the add score dialog.
     * @type {import("../../components/Modal.svelte").default}
     */
    let addScoreModal = $state();

    // ==========
    // CATEGORIES
    // ==========
    let categories = $derived(getLibraryCategories(true));

    // =========
    // ADD SCORE
    // =========
    let scoreInput = $state({
        scoreId: "",
        title: "",
        artist: "",
        type: "",
        voices: [],
        voiceCount: 0, // Not a direct input, is bound to voices array
        files: []
    });

    let selectedChoirType = $state("Männerchor");

    const saveDisabled = $derived(!(
        scoreInput.scoreId &&
        scoreInput.title &&
        scoreInput.artist &&
        scoreInput.type &&
        scoreInput.voices.length > 0
    ));

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

    async function submitScore() {
        const score = {
            ...scoreInput,
            voiceCount: scoreInput.voices.length
        };

        await addScore($state.snapshot(score));
        await fetchAndSetRaw();
        addScoreModal.hideModal();
    }

    let sidebarOpen = $state(false);

    /**
     * Opens the global settings modal.
     */
    function settingsClick() {
        settingsModal.showModal();
    }
</script>

<SettingsModal bind:this={settingsModal}></SettingsModal>
<ToastStack isMobile={true}></ToastStack>

<CategoryModal bind:this={categoryModal} isMobile={true} />

<Modal title="Neue Noten hinzufügen" subTitle="Erfassen Sie hier die Details der Noten"
       width="2/5" bind:this={addScoreModal} extraFunction={resetAddInputs} isMobile={true}>
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
                <Checkbox title="1. Tenor"
                          onChange={(isChecked) => {
                              isChecked ? scoreInput.voices.push("t1") : scoreInput.voices.filter(item => item !== "t1");
                          }} />
                <Checkbox title="2. Tenor"
                          onChange={(isChecked) => {
                              isChecked ? scoreInput.voices.push("t2") : scoreInput.voices.filter(item => item !== "t2");
                          }} />
            </div>

            <div class="flex flex-col items-start justify-start gap-4">
                <Checkbox title="1. Bass"
                          onChange={(isChecked) => {
                              isChecked ? scoreInput.voices.push("b1") : scoreInput.voices.filter(item => item !== "b1");
                          }} />
                <Checkbox title="2. Bass"
                          onChange={(isChecked) => {
                              isChecked ? scoreInput.voices.push("b2") : scoreInput.voices.filter(item => item !== "b2");
                          }} />
            </div>
        {:else}
            <div class="flex flex-col items-start justify-start gap-4">
                <Checkbox title="Tenor"
                          onChange={(isChecked) => {
                              isChecked ? scoreInput.voices.push("t") : scoreInput.voices.filter(item => item !== "t");
                          }} />
                <Checkbox title="Bass"
                          onChange={(isChecked) => {
                              isChecked ? scoreInput.voices.push("b") : scoreInput.voices.filter(item => item !== "b");
                          }} />
            </div>

            <div class="flex flex-col items-start justify-start gap-4">
                <Checkbox title="Sopran"
                          onChange={(isChecked) => {
                              isChecked ? scoreInput.voices.push("s") : scoreInput.voices.filter(item => item !== "s");
                          }} />
                <Checkbox title="Alt"
                          onChange={(isChecked) => {
                              isChecked ? scoreInput.voices.push("a") : scoreInput.voices.filter(item => item !== "a");
                          }} />
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

<MobileSidebar onSettingsClick={settingsClick} currentPage="library" bind:isOpen={sidebarOpen} />

<main class="flex overflow-hidden">
<!--    <DesktopSidebar onSettingsClick={settingsClick} currentPage="library"></DesktopSidebar>-->
    <div class="flex flex-col w-full h-dvh overflow-hidden p-7 min-h-0">
        <div class="w-full flex items-center justify-start">
            <button class="flex items-center justify-center" onclick={() => sidebarOpen = true}>
                <span class="material-symbols-rounded text-icon-dt-4 text-gv-dark-text">menu</span>
            </button>
        </div>
        <PageHeader title="Notenbibliothek" subTitle="Verwaltung des gesamten Notenmaterials" showSlot={false}></PageHeader>

        {#if user.role === "vorstand" || user.role === "admin" || user.role === "Notenwart" || user.role === "chorleitung"}
            <div class="flex flex-col items-center w-full gap-2 mt-5">
                <Button type="primary" onclick={() => categoryModal.openModal()}>
                    <span class="material-symbols-rounded min-[1000px]:text-icon-dt-4 text-icon-dt-5 mr-2">discover_tune</span>
                    <p class="min-[1000px]:text-dt-4 text-dt-5">Kategorien</p>
                </Button>
                <Button type="primary" onclick={() => addScoreModal.showModal()}>
                    <span class="material-symbols-rounded min-[1000px]:text-icon-dt-4 text-icon-dt-5 mr-2">add</span>
                    <p class="min-[1000px]:text-dt-4 text-dt-5 text-nowrap">Noten hinzufügen</p>
                </Button>
            </div>
        {/if}

        <div class="flex flex-col w-full gap-4 mt-5">
            <SearchBar placeholder="Noten durchsuchen..." page="library" />
            <div class="h-full w-full">
                <Filter page="library" options={categories} textWrap={false} customDefault="Alle Kategorien" />
            </div>
        </div>

        <div class="flex-1 min-h-0 overflow-y-auto mt-5">
            <div
                class="min-[1470px]:grid min-[1470px]:grid-cols-2 flex flex-col gap-4 overflow-y-auto overflow-x-hidden">
                {#each libraryStore.display as score}
                    <button onclick={async () => await push(`/library/details?id=${score.id}&editing=false`)}>
                        <Card>
                            <div class="flex items-start justify-start gap-2 w-full">
                                <span class="material-symbols-rounded text-icon-dt-6 text-gv-primary">music_note</span>
                                <div class="flex flex-col items-start gap-1 max-w-2/3">
                                    <p class="text-gv-dark-text text-dt-5 text-left line-clamp-2 truncate">{score.title}</p>
                                    <p class="text-gv-light-text text-dt-7">{score.artist}</p>
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
                    </button>
                {/each}
            </div>
        </div>
    </div>
</main>