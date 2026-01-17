<script>
    import { onMount } from "svelte";
    import { loadUserData } from "../services/user";
    import { reportsTypeMap } from "../services/reports";
    import { get } from "svelte/store";
    import { push } from "svelte-spa-router";
    import { user } from "../stores/user";
    import { reportsStore } from "../stores/reports";

    import ToastStack from "../components/ToastStack.svelte";
    import Sidebar from "../components/Sidebar.svelte";
    import PageHeader from "../components/PageHeader.svelte";
    import SettingsModal from "../components/SettingsModal.svelte";
    import Button from "../components/Button.svelte";
    import SearchBar from "../components/SearchBar.svelte";
    import Filter from "../components/Filter.svelte";
    import Card from "../components/Card.svelte";
    import ContextMenu from "../components/ContextMenu.svelte";
    import Chip from "../components/Chip.svelte";
    import Modal from "../components/Modal.svelte";


    /** @type {import("../components/SettingsModal.svelte").default} */
    let settingsModal;

    // CONTEXT MENU
    let menuOpen = false;
    let menuX = 0;
    let menuY = 0;
    let activeReportId = null;

    /**
     * Opens context menu on right-click at cursor position
     * @param {MouseEvent} event - The right-click event
     * @param {string} eventId - ID of the event being right-clicked
     */
    function openContextMenu(event, eventId) {
        event.preventDefault();
        event.stopPropagation();

        activeReportId = eventId;

        requestAnimationFrame(() => {
            menuX = Math.min(event.clientX, window.innerWidth - 180);
            menuY = Math.min(event.clientY, window.innerHeight - 114);
            menuOpen = true;
        });
    }

    /**
     * Opens context menu from the three-dot button click
     * @param {MouseEvent} event - The button click event
     * @param {string} eventId - ID of the event whose button was clicked
     */
    function openContextMenuFromButton(event, eventId) {
        event.preventDefault();
        event.stopPropagation();

        activeReportId = eventId;

        const rect = event.currentTarget.getBoundingClientRect();

        menuOpen = true;

        requestAnimationFrame(() => {
            const menuWidth = 180;
            const menuHeight = 114;

            menuX = rect.left - menuWidth;
            menuY = Math.min(rect.bottom, window.innerHeight - menuHeight);
        });
    }

    onMount(async () => {
        await loadUserData();
    });

    function settingsClick() {
        settingsModal.showModal();
    }
</script>

<svelte:window on:contextmenu={() => (menuOpen = false)} />

<SettingsModal bind:this={settingsModal}></SettingsModal>
<ToastStack></ToastStack>

<ContextMenu bind:open={menuOpen} x={menuX} y={menuY}>
    <Button type="contextMenu">Bearbeiten</Button>
    <Button type="contextMenu" fontColor="text-gv-delete">Löschen</Button>
</ContextMenu>

<main class="flex overflow-hidden">
    <Sidebar onSettingsClick={settingsClick} currentPage="reports"></Sidebar>
    <div class="flex flex-col w-full h-dvh overflow-hidden p-10 min-h-0">
        <PageHeader title="Berichte" subTitle="Verwaltung von Berichten unterschiedlicher art.">
            <Button type="primary">
                <span class="material-symbols-rounded text-icon-dt-4">add</span>
                <p class="text-dt-4 text-nowrap">Bericht erstellen</p>
            </Button>
        </PageHeader>
        <div class="flex items-center w-full gap-2 mt-5">
            <SearchBar placeholder="Berichte durchsuchen..." page="reports" doDebounce={false} />
            <div class="h-full max-w-1/3">
                <Filter debounce={false} page="reports" options={["Alle Typen", "Anwesenheit", "Finanzen", "Veranstaltung", "Jahresbericht", "Protokoll", "Geburtstag", "Todesfall", "Vereinsjubiläum", "Vereinsveranstaltung", "Hochzeit", "Sonstiges"]} />
            </div>
        </div>
        <div class="flex flex-col items-center w-full h-full overflow-x-hidden overflow-y-auto mt-5 gap-4">
            {#if $reportsStore.display.length > 0}
                {#each $reportsStore.display as report}
                    <Card on:contextmenu={(e) => openContextMenu(e, report.id)}>
                        <div class="flex w-full items-start">
                            <div class="flex flex-col items-start gap-3">
                                <div class="flex items-center justify-start gap-2">
                                    <span class="material-symbols-rounded text-icon-dt-3 text-gv-primary">docs</span>
                                    <p class="text-dt-3 text-gv-dark-text text-nowrap truncate font-medium">{report.title}</p>
                                </div>
                                <div class="flex items-center justify-start gap-4">
                                    <div class="flex items-center justify-start gap-2">
                                        <span class="material-symbols-rounded text-gv-light-text text-icon-dt-5">calendar_today</span>
                                        <p class="text-dt-5 text-gv-light-text text-nowrap truncate">{report.date}</p>
                                    </div>
                                    <div class="flex items-center justify-start gap-2">
                                        <span class="material-symbols-rounded text-gv-light-text">person</span>
                                        <p class="text-dt-5 text-gv-light-text text-nowrap truncate">{report.author}</p>
                                    </div>
                                </div>
                                <p class="text-gv-light-text text-dt-4 line-clamp-2 truncate mt-4">{report.description}</p>
                            </div>
                            <div class="flex items-center gap-4 ml-auto">
                                <Chip fontSize="5" text={reportsTypeMap[report.type]}/>
                                <button class="flex items-center justify-center bg-white border-2 border-gv-border rounded-1 text-dt-4 p-1 pl-2 pr-4 cursor-pointer hover:bg-gv-input-bg duration-200 disabled:opacity-50 disabled:cursor-not-allowed">
                                    <span class="material-symbols-rounded text-gv-dark-text text-icon-dt-5">download</span>
                                    <p class="text-dt-6 text-gv-dark-text ml-2 font-semibold">PDF</p>
                                </button>
                                <button
                                    class="flex items-center justify-center p-2 cursor-pointer hover:bg-gv-hover-effect rounded-2 ml-auto"
                                    on:click={(e) => openContextMenuFromButton(e, report.id)}>
                                    <span class="material-symbols-rounded text-icon-dt-5">more_horiz</span>
                                </button>
                            </div>
                        </div>
                    </Card>
                {/each}
            {:else}
                <Card>
                    <div class="flex items-center justify-center w-full h-full p-5">
                        <p class="text-dt-3 font-bold text-gv-dark-text">Es wurden keine Berichte gefunden!</p>
                    </div>
                </Card>
            {/if}
        </div>
    </div>
</main>