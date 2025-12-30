<script>
    import { onMount } from "svelte";
    import { loadUserData } from "../services/user";
    import { user } from "../stores/user";
    import { eventsStore } from "../stores/events";

    import ToastStack from "../components/ToastStack.svelte";
    import Sidebar from "../components/Sidebar.svelte";
    import PageHeader from "../components/PageHeader.svelte";
    import SettingsModal from "../components/SettingsModal.svelte";
    import Button from "../components/Button.svelte";
    import Filter from "../components/Filter.svelte";
    import TabBar from "../components/TabBar.svelte";

    /** @type {import("../components/SettingsModal.svelte").default} */
    let settingsModal;

    $: console.log($eventsStore.display);

    onMount(async () => {
        await loadUserData();
    });

    function settingsClick() {
        settingsModal.showModal();
    }
</script>

<SettingsModal bind:this={settingsModal}></SettingsModal>
<ToastStack></ToastStack>
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
    </div>
</main>