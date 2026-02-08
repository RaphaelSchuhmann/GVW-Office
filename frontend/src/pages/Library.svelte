<script>
    import { onDestroy, onMount } from "svelte";
    import { get } from "svelte/store";
    import { ensureUserData } from "../services/userService";
    import {
        voiceMap,
        getLibraryCategories,
        addCategory,
        getCategoryCount,
        removeCategory,
        addScore,
        downloadScoreFiles
    } from "../services/library";
    import { user } from "../stores/user";
    import { libraryStore } from "../stores/library";
    import { appSettings } from "../stores/appSettings";
    import { push } from "svelte-spa-router";

    import ToastStack from "../components/ToastStack.svelte";
    import DesktopSidebar from "../components/DesktopSidebar.svelte";
    import PageHeader from "../components/PageHeader.svelte";
    import SettingsModal from "../components/SettingsModal.svelte";
    import Button from "../components/Button.svelte";
    import SearchBar from "../components/SearchBar.svelte";
    import Filter from "../components/Filter.svelte";
    import Card from "../components/Card.svelte";
    import ContextMenu from "../components/ContextMenu.svelte";
    import Chip from "../components/Chip.svelte";
    import Modal from "../components/Modal.svelte";
    import { addToast } from "../stores/toasts";
    import Input from "../components/Input.svelte";
    import Dropdown from "../components/Dropdown.svelte";
    import Checkbox from "../components/Checkbox.svelte";
    import FileSelector from "../components/FileSelector.svelte";
    import ConfirmDeleteModal from "../components/ConfirmDeleteModal.svelte";

    // Periodic app settings refresh
    let intervalId;

    /** @type {import("../components/SettingsModal.svelte").default} */
    let settingsModal;

    /** @type {import("../components/SearchBar.svelte").default} */
    let searchBar;

    let filterOptions = getLibraryCategories(true);

    function refreshCategories() {
        filterOptions = getLibraryCategories(true);
        categories = getLibraryCategories(false);
    }

    // MANGE CATEGORIES
    /** @type {import("../components/Modal.svelte").default} */
    let manageCategoriesModal;
    let categories = getLibraryCategories(false);

    let categoryInput = "";

    async function submitCategory() {
        const displayValue = categoryInput;
        const type = categoryInput.toLowerCase().replaceAll(" ", "_");

        if (type === displayValue || displayValue.includes("_")) {
            addToast({
                title: "Ungültige Eingabe",
                subTitle: "Der Name muss mindestens einen Großbuchstaben oder ein Leerzeichen enthalten und darf keine Unterstriche verwenden.",
                type: "warning"
            });
            categoryInput = "";
            return;
        }

        await addCategory(type, displayValue);

        categories = []; // clear categories
        categoryInput = "";
        refreshCategories();
    }

    async function deleteCategory(category) {
        const categoryMap = get(appSettings).scoreCategories || {};
        const type = categoryMap[category];
        const count = getCategoryCount(category);

        if (count > 0) {
            addToast({
               title: "Kategorie kann nicht gelöscht werden",
               subTitle: "Diese Kategorie enthält noch mindestens ein Lied. Bitte entfernen oder verschieben Sie die Lieder zuerst.",
               type: "error"
            });
            return;
        }

        if (type) {
            await removeCategory(type);
        }

        refreshCategories();
    }

    // ADD NEW SCORE
    /** @type {import("../components/Modal.svelte").default} */
    let newScoreModal;

    let newScoreSaveDisabled = true;

    let newScoreTitle = "";
    let newScoreArtist = "";
    let newScoreCategory = "";
    let newScoreVoiceT1 = false;
    let newScoreVoiceT2 = false;
    let newScoreVoiceB1 = false;
    let newScoreVoiceB2 = false;
    let newScoreVoiceSo = false;
    let newScoreVoiceAl = false;
    let newScoreFiles = [];
    
    $: newScoreSaveDisabled = !(newScoreTitle && newScoreArtist && newScoreCategory && (newScoreVoiceT1 || newScoreVoiceT2 || newScoreVoiceB1 || newScoreVoiceB2 || newScoreVoiceSo || newScoreVoiceAl));

    function clearNewScore() {
        newScoreTitle = "";
        newScoreArtist = "";
        newScoreCategory = "";
        newScoreVoiceT1 = false;
        newScoreVoiceT2 = false;
        newScoreVoiceB1 = false;
        newScoreVoiceB2 = false;
        newScoreVoiceSo = false;
        newScoreVoiceAl = false;
        newScoreFiles = [];
    }

    async function addNewScore() {
        let voices = [];
        if (newScoreVoiceT1) voices.push("t1");
        if (newScoreVoiceT2) voices.push("t2");
        if (newScoreVoiceB1) voices.push("b1");
        if (newScoreVoiceB2) voices.push("b2");
        if (newScoreVoiceSo) voices.push("s");
        if (newScoreVoiceAl) voices.push("a");

        const newScore = {
            title: newScoreTitle,
            artist: newScoreArtist,
            type: get(appSettings).scoreCategories[newScoreCategory],
            voices: voices,
            voiceCount: voices.length,
            files: newScoreFiles
        };

        await addScore(newScore);

        newScoreModal?.hideModal();
        await searchBar.fetchData();
    }

    // DELETE SCORE
    /** @type {import("../components/ConfirmDeleteModal.svelte").default} */
    let confirmDeleteScoreModal;

    let scoreTitle = "";
    let deleteScoreToast = {
        success: {
            title: "Noten gelöscht",
            subTitle: "Die Noten wurden erfolgreich aus dem System entfernt.",
            type: "success"
        },
        notFound: {
            title: "Nicht gefunden",
            subTitle: "Die angegebenen Noten konnten nicht gefunden werden. Bitte versuchen Sie es später erneut.",
            type: "error"
        }
    };

    /**
     * Initiates the delete process for a score
     * Sets up the confirmation modal with score details
     */
    function startDeleteScore() {
        menuOpen = false;

        const scores = get(libraryStore).display;
        const score = scores.find(item => item.id === activeScoreId);

        if (!activeScoreId ||!score?.title) {
            addToast(deleteScoreToast.notFound);
            return;
        }

        scoreTitle = score.title;
        confirmDeleteScoreModal.startDelete();
    }

    // DOWNLOAD SCORE FILES
    async function downloadFiles() {
        if (!activeScoreId) {
            addToast(deleteScoreToast.notFound);
            return;
        }

        await downloadScoreFiles(activeScoreId);
        menuOpen = false;
        activeScoreId = null;
    }

    // CONTEXT MENU
    let menuOpen = false;
    let menuX = 0;
    let menuY = 0;
    let activeScoreId = null;

    /**
     * Opens context menu on right-click at cursor position
     * @param {MouseEvent} event - The right-click event
     * @param {string} eventId - ID of the event being right-clicked
     */
    function openContextMenu(event, eventId) {
        if ($user.role === "vorstand" || $user.role === "admin") {
            event.preventDefault();
            event.stopPropagation();

            activeScoreId = eventId;

            requestAnimationFrame(() => {
                menuX = Math.min(event.clientX, window.innerWidth - 180);
                menuY = Math.min(event.clientY, window.innerHeight - 114);
                menuOpen = true;
            });
        }
    }

    /**
     * Opens context menu from the three-dot button click
     * @param {MouseEvent} event - The button click event
     * @param {string} eventId - ID of the event whose button was clicked
     */
    function openContextMenuFromButton(event, eventId) {
        if ($user.role === "vorstand" || $user.role === "admin") {
            event.preventDefault();
            event.stopPropagation();

            activeScoreId = eventId;
            
            const rect = event.currentTarget.getBoundingClientRect();

            menuOpen = true;

            requestAnimationFrame(() => {
                const menuWidth = 180;
                const menuHeight = 114;

                menuX = rect.left - menuWidth;
                menuY = Math.min(rect.bottom, window.innerHeight - menuHeight);
            });
        }
    }

    onMount(async () => {
        await ensureUserData();
    });

    onDestroy(() => {
        if (intervalId) {
            clearInterval(intervalId);
        }
    });

    function settingsClick() {
        settingsModal.showModal();
    }

    function openNewScoreModal() {
        if (categories.length === 0) {
            addToast({
                title: "Keine Kategorien vorhanden",
                subTitle: "Erstellen Sie zuerst mindestens eine Kategorie, um neue Noten hinzuzufügen.",
                type: "warning",
            });
            return;
        }

        newScoreModal.showModal();
    }
</script>

<svelte:window on:contextmenu={() => (menuOpen = false)} />

<ContextMenu bind:open={menuOpen} x={menuX} y={menuY}>
    <Button type="contextMenu" on:click={async () => await push(`/library/edit?id=${activeScoreId}`)}>Bearbeiten</Button>
    <Button type="contextMenu" on:click={downloadFiles}>Download</Button>
    <Button type="contextMenu" fontColor="text-gv-delete" on:click={startDeleteScore}>Löschen</Button>
</ContextMenu>

<!-- Confirm delete score modal -->
<ConfirmDeleteModal expectedInput={scoreTitle} id={activeScoreId}
                    title="Noten löschen"
                    subTitle="Sind Sie sich sicher das Sie diese Noten löschen möchten?"
                    toastMap={deleteScoreToast} action="deleteLibEntry"
                    onClose={async () => {menuOpen = false; activeScoreId = null; await searchBar.fetchData();}}
                    bind:this={confirmDeleteScoreModal}
/>

<!-- Category Modal -->
<Modal bind:this={manageCategoriesModal}
       title="Kategorien verwalten" subTitle="Verwalten Sie hier Kategorien der Notenbibliothek"
       width="2/5">
    <div class="flex flex-col items-center border-2 border-gv-border rounded-2 mt-5">
        <div class="max-h-90 overflow-y-auto w-full">
            {#each categories as category}
                <div class="border-b-2 border-gv-border p-2 w-full flex items-center justify-start gap-1">
                    <p class="text-dt-4 p-2">{category}</p>
                    <p class="text-dt-4 p-2">Lieder: {getCategoryCount(category)}</p>
                    <div class="flex h-full ml-auto items-center justify-end">
                        <button class="cursor-pointer ml-auto hover:bg-gv-hover-effect flex items-center justify-center p-2 rounded-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={getCategoryCount(category) > 0} on:click={() => deleteCategory(category)}>
                            <span class="material-symbols-rounded text-icon-dt-4">delete</span>
                        </button>
                    </div>
                </div>
            {/each}
        </div>
        <div class="w-full p-2 flex items-center justify-start gap-1">
            <button class="cursor-pointer ml-auto hover:bg-gv-hover-effect flex items-center justify-center p-2 rounded-2"
                    on:click={() => {if (categoryInput.length !== 0) submitCategory()}}>
                <span class="material-symbols-rounded text-icon-dt-4">{categoryInput.length === 0 ? "add" : "check"}</span>
            </button>
            <input type="text" placeholder="Neue Kategorie" class="text-dt-4 w-full p-2" bind:value={categoryInput}>
        </div>
    </div>
</Modal>

<!-- New Score Modal -->
<Modal bind:this={newScoreModal} width="auto" extraFunction={clearNewScore}
       title="Neue Noten hinzufügen" subTitle="Erfassen Sie hier die Details der Noten">
    <Input bind:value={newScoreTitle} title="Titel" placeholder="The Final Countdown" marginTop="5"/>
    <Input bind:value={newScoreArtist} title="Komponist / Band" placeholder="Europe" marginTop="5"/>
    <Dropdown title="Kategorie" options={categories} marginTop="5" onChange={(value) => newScoreCategory = value} />
    <p class="text-dt-6 font-medium mt-5">Stimmen</p>
    <div class="w-full flex items-center justify-start gap-4 mt-1 pr-5">
        <Checkbox textWrap={false} bind:isChecked={newScoreVoiceT1} title="1. Tenor"/>
        <Checkbox textWrap={false} bind:isChecked={newScoreVoiceT2} title="2. Tenor"/>
        <Checkbox textWrap={false} bind:isChecked={newScoreVoiceB1} title="1. Bass"/>
        <Checkbox textWrap={false} bind:isChecked={newScoreVoiceB2} title="2. Bass"/>
        <Checkbox textWrap={false} bind:isChecked={newScoreVoiceSo} title="Sopran"/>
        <Checkbox textWrap={false} bind:isChecked={newScoreVoiceAl} title="Alt"/>
    </div>
    <FileSelector title="Noten" page="library" validTypes={["pdf", "gp", "gp5", "gp3", "gp4", "gpx", "cap", "capx"]} bind:files={newScoreFiles} marginTop="5"/>
    <div class="w-full flex items-center gap-4 mt-5">
        <Button type="secondary" on:click={newScoreModal?.hideModal}>Abbrechen</Button>
        <Button type="primary" disabled={newScoreSaveDisabled} on:click={addNewScore}>Speichern</Button>
    </div>
</Modal>

<SettingsModal bind:this={settingsModal}></SettingsModal>
<ToastStack></ToastStack>
<main class="flex overflow-hidden">
    <DesktopSidebar onSettingsClick={settingsClick} currentPage="library"></DesktopSidebar>
    <div class="flex flex-col w-full h-dvh overflow-hidden p-10 min-h-0">
        <PageHeader title="Notenbibliothek" subTitle="Verwaltung des gesamten Notenmaterials">
            <Button type="primary" on:click={manageCategoriesModal.showModal}>
                <span class="material-symbols-rounded text-icon-dt-4">discover_tune</span>
                <p class="text-dt-4 text-nowrap">Kategorien bearbeiten</p>
            </Button>
            <Button type="primary" on:click={openNewScoreModal}>
                <span class="material-symbols-rounded text-icon-dt-4">add</span>
                <p class="text-dt-4 text-nowrap">Noten hinzufügen</p>
            </Button>
        </PageHeader>

        <div class="flex items-center w-full gap-2 mt-5">
            <SearchBar bind:this={searchBar} placeholder="Noten durchsuchen..." page="library" doDebounce={true} />
            <div class="h-full max-w-1/3">
                <Filter debounce={false} page="library" options={filterOptions} textWrap={false}
                        customDefault="Alle Kategorien" />
            </div>
        </div>

        <div class="flex-1 min-h-0 overflow-y-auto mt-5">
            {#if $libraryStore.display.length !== 0}
                <div class="grid grid-cols-3 gap-4 overflow-y-auto overflow-x-hidden">
                    {#each $libraryStore.display as item}
                        <Card on:contextmenu={(e) => openContextMenu(e, item.id)}>
                            <div class="flex items-stretch w-full gap-2">
                                <div class="flex flex-col items-start justify-start">
                                        <span class="material-symbols-rounded text-gv-primary text-icon-dt-6">music_note</span>
                                </div>
                                <div class="flex flex-col items-start m-0 gap-2">
                                    <p class="text-gv-dark-text text-dt-3 leading-none">{item.title}</p>
                                    <p class="text-gv-light-text text-dt-5">{item.artist}</p>
                                </div>
                                {#if $user.role === "vorstand" || $user.role === "admin" || $user.role === "notenwart" || $user.role === "chorleitung"}
                                    <button
                                        class="flex self-center items-center justify-center p-2 cursor-pointer hover:bg-gv-hover-effect rounded-2 ml-auto"
                                        on:click={(e) => openContextMenuFromButton(e, item.id)}>
                                        <span class="material-symbols-rounded">more_horiz</span>
                                    </button>
                                {/if}
                            </div>
                            <div class="flex w-full items-center justify-start mt-2">
                                <Chip text={$appSettings.scoreCategories[item.type] ?? item.type} fontSize="6" />
                            </div>
                            <div class="flex w-full items-start justify-start mt-2 gap-2">
                                <span class="material-symbols-rounded text-icon-dt-6 text-gv-light-text">import_contacts</span>
                                <div class="flex flex-wrap gap-2 w-full gap-y-0">
                                    {#each item.voices as voice}
                                        <p class="text-gv-light-text text-dt-6 text-nowrap">{voiceMap[voice]}</p>
                                    {/each}
                                </div>
                            </div>
                            <div class="w-full flex items-center justify-start mt-2">
                                <p class="text-gv-light-text text-dt-6">{`${item.voiceCount}-stimmig`}</p>
                            </div>
                        </Card>
                    {/each}
                </div>
            {:else}
                <Card>
                    <div class="flex items-center justify-center w-full h-full p-5">
                        <p class="text-dt-3 font-bold text-gv-dark-text">Es wurden keine Noten gefunden!</p>
                    </div>
                </Card>
            {/if}
        </div>
    </div>
</main>