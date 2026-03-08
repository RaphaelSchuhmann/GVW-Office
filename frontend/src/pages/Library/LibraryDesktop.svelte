<script>
    import { voiceMap, getLibraryCategories } from "../../services/libraryService.svelte";
    import { user } from "../../stores/user.svelte.js";
    import { libraryStore } from "../../stores/library.svelte.js";
    import { appSettings } from "../../stores/appSettings.svelte.js";
    import { fetchAndSetRaw } from "../../services/filterService.svelte";
    import { addToast } from "../../stores/toasts.svelte";
    import { createContextMenu } from "../../lib/contextMenu.svelte";
    import { push } from "svelte-spa-router";

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

    // ==========
    // CATEGORIES
    // ==========
    let categories = $derived(getLibraryCategories(true));

    // ============
    // DELETE SCORE
    // ============
    let scoreTitle = $state("");

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

<CategoryModal bind:this={categoryModal}/>

<ContextMenu bind:open={menu.data.open} x={menu.data.x} y={menu.data.y}>
    <Button type="contextMenu" onclick={async () =>  await push(`/library/details?id=${menu.data.activeId}&editing=false`)}>
        Details
    </Button>
    {#if user.role === "vorstand" || user.role === "admin"}
        <Button type="contextMenu" onclick={async () =>  await push(`/library/details?id=${menu.data.activeId}&editing=true`)}>
            Bearbeiten
        </Button>
        <Button type="contextMenu" fontColor="text-gv-delete" onclick={() => startDeleteScore()}>Löschen</Button>
    {/if}
</ContextMenu>

<ConfirmDeleteModal expectedInput={scoreTitle} id={menu.data.activeId}
                    title="Noten löschen" subTitle="Sind Sie sich sicher das Sie diese Noten löschen möchten?"
                    action="deleteLibEntry"
                    onClose={async () => {menu.data.open = false; menu.data.activeId = null; await fetchAndSetRaw();}}
                    bind:this={confirmDeleteScoreModal}/>

<!--TODO: Score Download, New Score-->

<main class="flex overflow-hidden">
    <DesktopSidebar onSettingsClick={settingsClick} currentPage="library"></DesktopSidebar>
    <div class="flex flex-col w-full h-dvh overflow-hidden p-10 min-h-0">
        <PageHeader title="Notenbibliothek" subTitle="Verwaltung des gesamten Notenmaterials" showSlot={true}>
            {#if user.role === "vorstand" || user.role === "admin" || user.role === "Notenwart" || user.role === "chorleitung"}
                <Button type="primary" onclick={() => categoryModal.openModal()}>
                    <span class="material-symbols-rounded text-icon-dt-4 mr-2">discover_tune</span>
                    <p class="text-dt-4">Kategorien</p>
                </Button>
                <Button type="primary">
                    <span class="material-symbols-rounded text-icon-dt-4 mr-2">add</span>
                    <p class="text-dt-4 text-nowrap">Noten hinzufügen</p>
                </Button>
            {/if}
        </PageHeader>

        <div class="flex items-center w-full gap-2 mt-5">
            <SearchBar placeholder="Noten durchsuchen..." page="library" />
            <div class="h-full max-w-1/3">
                <Filter page="library" options={categories} textWrap={false} customDefault="Alle Kategorien" />
            </div>
        </div>

        <div class="flex-1 min-h-0 overflow-y-auto mt-5">
            <div class="min-[1470px]:grid min-[1470px]:grid-cols-2 flex flex-col gap-4 overflow-y-auto overflow-x-hidden">
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
                                    class="flex items-center justify-center p-2 cursor-pointer hover:bg-gv-hover-effect rounded-2">
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
                            <Chip text={appSettings.scoreCategories[score.type]}/>
                        </div>

                        <div class="flex w-full items-center justify-start mt-4 gap-2">
                            <span class="material-symbols-rounded text-gv-light-text text-icon-dt-5">import_contacts</span>
                            {#each score.voices as voice}
                                <p class="text-gv-light-text text-dt-7">{voiceMap[voice]}</p>
                            {/each}
                        </div>

                        <div class="flex w-full items-center justify-start mt-2">
                            <p class="text-gv-light-text text-dt-7">{score.voiceCount}-stimmig</p>
                        </div>

                        <div class="flex w-full items-center justify-start mt-2">
                            <p class="text-gv-light-text text-dt-6">Noten-ID: {score.scoreId || "Keine ID vorhanden"}</p>
                        </div>
                    </Card>
                {/each}
            </div>
        </div>
    </div>
</main>