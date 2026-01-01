<script>
    import { onMount } from "svelte";
    import { loadUserData } from "../services/user";
    import { user } from "../stores/user";
    import { eventsStore } from "../stores/events";
    import { typeMap } from "../services/events";

    import ToastStack from "../components/ToastStack.svelte";
    import Sidebar from "../components/Sidebar.svelte";
    import PageHeader from "../components/PageHeader.svelte";
    import SettingsModal from "../components/SettingsModal.svelte";
    import Button from "../components/Button.svelte";
    import Filter from "../components/Filter.svelte";
    import TabBar from "../components/TabBar.svelte";
    import Chip from "../components/Chip.svelte";
    import ContextMenu from "../components/ContextMenu.svelte";
    import Card from "../components/Card.svelte";
    import { push } from "svelte-spa-router";

    /** @type {import("../components/SettingsModal.svelte").default} */
    let settingsModal;

    // CONTEXT MENU
    let menuOpen = false;
    let menuX = 0;
    let menuY = 0;
    let activeEventId = null;

    function openContextMenu(event, eventId) {
        event.preventDefault();
        event.stopPropagation();

        activeEventId = eventId;

        requestAnimationFrame(() => {
            menuX = Math.min(event.clientX, window.innerWidth - 180);
            menuY = Math.min(event.clientY, window.innerHeight - 114);
            menuOpen = true;
        });
    }

    function openContextMenuFromButton(event, eventId) {
        event.preventDefault();
        event.stopPropagation();

        activeEventId = eventId;

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
    <Button type="contextMenu">Bearbeiten
    </Button>
    <Button type="contextMenu">Status ändern</Button>
    <Button type="contextMenu" fontColor="text-gv-delete">Löschen</Button>
</ContextMenu>

<main class="flex overflow-hidden">
    <Sidebar onSettingsClick={settingsClick} currentPage="events"></Sidebar>
    <div class="flex flex-col w-full h-dvh overflow-hidden p-10 min-h-0">
        <PageHeader title="Veranstaltungen" subTitle="Verwaltung von Events, Proben und Konzerten">
            <Button type="primary" disabled={($user.role !== "admin" && $user.role !== "vorstand")}>
                <span class="material-symbols-rounded text-icon-dt-4">add</span>
                <p class="text-dt-4">Veranstaltung hinzufügen</p>
            </Button>
        </PageHeader>
        <div class="flex items-center mt-10 max-w-1/5">
            <Filter options={["Alle Typen", "Proben", "Meeting", "Konzerte", "Sonstiges"]} page="events" debounce={false}/>
        </div>
        <TabBar contents={["Bevorstehend", "Abgeschlossen"]} selected="Bevorstehend" marginTop="5" page="events" debounce={true} />
        <div class="grid grid-cols-2 gap-4 overflow-y-auto overflow-x-hidden mt-5">
            {#each $eventsStore.display as event}
                <Card on:contextmenu={(e) => openContextMenu(e, event.id)}>
                    <div class="flex items-center w-full">
                        <p class="text-gv-dark-text text-dt-3 max-w-3/4 text-nowrap truncate">{event.title}</p>
                        <div class="ml-auto">
                            <Chip text={typeMap[event.type]}/>
                        </div>
                    </div>
                    <div class="flex items-center w-full mt-2 gap-10">
                        <div class="flex items-stretch gap-2">
                            <span class="material-symbols-rounded text-icon-dt-6 text-gv-light-text">calendar_today</span>
                            <p class="text-dt-6 text-gv-light-text">{event.when}</p>
                        </div>
                        <div class="flex items-stretch gap-2">
                            <span class="material-symbols-rounded text-icon-dt-6 text-gv-light-text">schedule</span>
                            <p class="text-dt-6 text-gv-light-text">{event.time}</p>
                        </div>
                        <button class="flex items-center justify-center p-2 cursor-pointer hover:bg-gv-hover-effect rounded-2 ml-auto"
                                on:click={(e) => openContextMenuFromButton(e, event.id)}>
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
</main>