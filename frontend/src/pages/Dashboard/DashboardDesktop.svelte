<script>
    import { onMount } from "svelte";
    import { user } from "../../stores/user";
    import { appSettings } from "../../stores/appSettings";
    import { tryUpdateMaxMembers } from "../../services/appSettingsService";

    import ToastStack from "../../components/ToastStack.svelte";
    import DesktopSidebar from "../../components/DesktopSidebar.svelte";
    import PageHeader from "../../components/PageHeader.svelte";
    import Card from "../../components/Card.svelte";
    import ComingEvent from "../../components/ComingEvent.svelte";
    import VoiceDistribution from "../../components/VoiceDistribution.svelte";
    import SettingsModal from "../../components/SettingsModal.svelte";
    import Modal from "../../components/Modal.svelte";
    import Input from "../../components/Input.svelte";
    import Button from "../../components/Button.svelte";

    /** @type {import("../../components/SettingsModal.svelte").default} */
    let settingsModal;

    /** @type {import("../../components/Modal.svelte").default} */
    let voiceDistributionSettingsModal;
    let maxMembers = "";

    let events = [];

    onMount(() => {
        DEVPopulateEvents();
    });

    function DEVPopulateEvents() {
        events[0] = {
            title: "Wöchentliche Chorprobe",
            time: "07.11.2025 - 19:30",
            location: "Eustachius-Kugler-Straße 1, 91350 Gremsdorf",
            type: "Probe"
        };
        events[1] = {
            title: "Wöchentliche Chorprobe",
            time: "07.11.2025 - 19:30",
            location: "Eustachius-Kugler-Straße 1, 91350 Gremsdorf",
            type: "Konzert"
        };
        events[2] = {
            title: "Wöchentliche Chorprobe",
            time: "07.11.2025 - 19:30",
            location: "Eustachius-Kugler-Straße 1, 91350 Gremsdorf",
            type: "Meeting"
        };

        events[3] = {
            title: "Wöchentliche Chorprobe",
            time: "07.11.2025 - 19:30",
            location: "Eustachius-Kugler-Straße 1, 91350 Gremsdorf",
            type: "Probe"
        };
        events[4] = {
            title: "Wöchentliche Chorprobe",
            time: "07.11.2025 - 19:30",
            location: "Eustachius-Kugler-Straße 1, 91350 Gremsdorf",
            type: "Konzert"
        };
        events[5] = {
            title: "Wöchentliche Chorprobe",
            time: "07.11.2025 - 19:30",
            location: "Eustachius-Kugler-Straße 1, 91350 Gremsdorf",
            type: "Meeting"
        };

        events[6] = {
            title: "Wöchentliche Chorprobe",
            time: "07.11.2025 - 19:30",
            location: "Eustachius-Kugler-Straße 1, 91350 Gremsdorf",
            type: "Probe"
        };
        events[7] = {
            title: "Wöchentliche Chorprobe",
            time: "07.11.2025 - 19:30",
            location: "Eustachius-Kugler-Straße 1, 91350 Gremsdorf",
            type: "Konzert"
        };
        events[8] = {
            title: "Wöchentliche Chorprobe",
            time: "07.11.2025 - 19:30",
            location: "Eustachius-Kugler-Straße 1, 91350 Gremsdorf",
            type: "Meeting"
        };
    }

    async function updateMaxMembersVoiceDistribution() {
        let updatedMaxMembers = Number(maxMembers);

        if (isNaN(updatedMaxMembers) || maxMembers.length === 0 || updatedMaxMembers < 1) {
            updatedMaxMembers = $appSettings.maxMembers;
        }

        await tryUpdateMaxMembers(updatedMaxMembers);

        voiceDistributionSettingsModal.hideModal();
    }

    function settingsClick() {
        settingsModal.showModal();
    }
</script>

<SettingsModal bind:this={settingsModal}></SettingsModal>
<Modal bind:this={voiceDistributionSettingsModal} title="Stimmenverteilung Einstellungen" subTitle="Einstellungen für die Stimmverteilung"
       extraFunctionOnClose={false} extraFunction={() => maxMembers = String($appSettings.maxMembers)}>
    <Input title="Maximale Anzahl an Mitgliedern pro Stimme" type="number" marginTop="5" bind:value={maxMembers}/>
    <div class="w-full flex items-center justify-end mt-5 gap-2">
        <Button type="secondary" on:click={voiceDistributionSettingsModal.hideModal}>Abbrechen</Button>
        <Button type="primary" on:click={updateMaxMembersVoiceDistribution} isSubmit={true}>Speichern</Button>
    </div>
</Modal>
<ToastStack></ToastStack>
<main class="flex h-screen overflow-hidden">
    <DesktopSidebar onSettingsClick={settingsClick} currentPage="dashboard"></DesktopSidebar>
    <div class="flex-1 min-h-0 overflow-y-auto">
        <div class="flex flex-col w-full flex-1 overflow-hidden p-10 min-h-0">
            <PageHeader title="Dashboard" subTitle="Willkommen in GVW Office - Übersicht Gesangverein Weppersdorf" showSlot={false}/>

            <!-- Small cards -->
            <div class="flex max-[1300px]:flex-col items-center overflow-hidden mt-5 gap-5 min-[1300px]:max-h-1/7">
                <Card padding="5" justify="justify-around">
                    <div class="flex w-full items-center">
                        <p class="text-dt-5 text-gv-dark-text">Aktive Mitglieder</p>
                        <span class="material-symbols-rounded text-icon-dt-4 text-gv-secondary-text ml-auto">group</span>
                    </div>
                    <p class="text-dt-3 text-black w-full text-start">
                        <span>7</span>
                        <span class="text-dt-4 text-gv-light-text"> / 19</span>
                    </p>
                </Card>
                <Card padding="5" justify="justify-around">
                    <div class="flex w-full items-center">
                        <p class="text-dt-5 text-gv-dark-text">Bevorstehende Events</p>
                        <span
                            class="material-symbols-rounded text-icon-dt-4 text-gv-secondary-text ml-auto">calendar_today</span>
                    </div>
                    <p class="text-dt-3 text-black w-full text-start">
                        <span>4</span>
                        <span class="text-dt-4 text-gv-light-text"> / 6</span>
                    </p>
                </Card>
                <Card padding="5" justify="justify-around">
                    <div class="flex w-full items-center">
                        <p class="text-dt-5 text-gv-dark-text">Notenmaterial</p>
                        <span
                            class="material-symbols-rounded text-icon-dt-4 text-gv-secondary-text ml-auto">music_note</span>
                    </div>
                    <p class="text-dt-3 text-black w-full text-start">8</p>
                </Card>
            </div>

            <!-- Big cards -->
            <div class="w-full flex-1 mt-5 gap-5 flex max-[1300px]:flex-col max-[1300px]:h-[calc(100vh-100px)] h-full min-h-0 max-[1300px]:overflow-y-auto">
                <!-- Upcoming Events -->
                <Card padding="5">
                    <p class="min-[1200px]:text-dt-3 text-dt-5 text-gv-dark-text w-full text-start flex flex-col mb-3">
                        <span>Kommende Veranstaltungen</span>
                        <span class="text-gv-light-text min-[1200px]:text-dt-4 text-dt-6">Nächste Veranstaltungen und Proben</span>
                    </p>
                    <div class="w-full flex-1 min-h-0 overflow-x-hidden overflow-y-auto max-h-[45dvh] flex flex-col items-center pr-2">
                        {#each events as event}
                            <ComingEvent margin="5" title={event.title} time={event.time} location={event.location}
                                         type={event.type} />
                        {/each}
                    </div>
                </Card>

                <!-- Voice distribution -->
                <Card padding="5">
                    <div class="flex items-center w-full">
                        <p class="text-dt-3 text-gv-dark-text w-full text-start flex flex-col">
                            <span>Stimmenverteilung</span>
                            <span class="text-gv-light-text text-dt-4">Übersicht der Mitglieder nach Stimmlage</span>
                        </p>
                    </div>
                    <div class="w-full min-h-0 overflow-x-hidden overflow-y-auto flex flex-col items-center pr-2">
                        <VoiceDistribution voice="1. Tenor" voiceMembers={4} totalMembers={$appSettings.maxMembers} />
                        <VoiceDistribution voice="2. Tenor" voiceMembers={5} totalMembers={$appSettings.maxMembers} />
                        <VoiceDistribution voice="1. Bass" voiceMembers={5} totalMembers={$appSettings.maxMembers} />
                        <VoiceDistribution voice="2. Bass" voiceMembers={4} totalMembers={$appSettings.maxMembers} />
                    </div>
                    {#if $user.role === "vorstand" || $user.role === "admin"}
                        <div class="w-full flex items-center justify-end pr-2 mt-5">
                            <button
                                class="cursor-pointer flex items-center justify-center rounded-2 p-2 hover:bg-gv-hover-effect"
                                on:click={voiceDistributionSettingsModal.showModal}>
                                <span class="material-symbols-rounded text-icon-dt-2 text-gv-dark-text">settings</span>
                            </button>
                        </div>
                    {/if}
                </Card>
            </div>
        </div>
    </div>
</main>