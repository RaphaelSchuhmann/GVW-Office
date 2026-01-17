<script>
    import { onMount } from "svelte";
    import { push } from "svelte-spa-router";
    import { loadUserData, logout } from "../services/user";
    import { user } from "../stores/user";
    import { appSettings } from "../stores/appSettings";
    import { addToast } from "../stores/toasts";

    import ToastStack from "../components/ToastStack.svelte";
    import Sidebar from "../components/Sidebar.svelte";
    import PageHeader from "../components/PageHeader.svelte";
    import Card from "../components/Card.svelte";
    import ComingEvent from "../components/ComingEvent.svelte";
    import VoiceDistribution from "../components/VoiceDistribution.svelte";
    import SettingsModal from "../components/SettingsModal.svelte";
    import Modal from "../components/Modal.svelte";
    import Input from "../components/Input.svelte";
    import Button from "../components/Button.svelte";
    import { updateMaxMembers } from "../services/appSettings";

    /** @type {import("../components/SettingsModal.svelte").default} */
    let settingsModal;

    /** @type {import("../components/Modal.svelte").default} */
    let voiceDistributionSettingsModal;
    let maxMembers;

    let block = false;
    let events = [];

    onMount(async () => {
        await loadUserData();
        DEVPopulateEvents();
        maxMembers = $appSettings.maxMembers.toString();
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

    /**
     * Updates the maximum members per voice setting
     * Validates input and handles API response with appropriate toast messages
     */
    async function updateMaxMembersVoiceDistribution() {
        let updatedMaxMembers = Number(maxMembers);

        if (isNaN(updatedMaxMembers)) updatedMaxMembers = $appSettings.maxMembers;
        if (maxMembers.length === 0) updatedMaxMembers = $appSettings.maxMembers;
        if (Number(maxMembers) < 1) updatedMaxMembers = $appSettings.maxMembers;

        appSettings.update(u => ({...u, maxMembers: updatedMaxMembers}));

        voiceDistributionSettingsModal.hideModal();
        const response = await updateMaxMembers();

        if (response.status === 200) {
            addToast({
                title: "Erfolgreich gespeichert",
                subTitle: "Die maximale Anzahl and Mitgliedern pro Stimme wurde erfolgreich aktualisiert und gespeichert.",
                type: "success"
            });
        } else if (response.status === 401) {
            // Auth token invalid / unauthorized
            addToast({
                title: "Ungültiges Token",
                subTitle: "Ihr Authentifizierungstoken ist ungültig oder abgelaufen. Bitte melden Sie sich erneut an, um Zugriff zu erhalten.",
                type: "error"
            });
            logout();
            await push("/?cpwErr=false");
        } else {
            // internal server error / unknown error
            addToast({
                title: "Interner Serverfehler",
                subTitle: "Beim Verarbeiten Ihrer Anfrage ist ein Fehler aufgetreten. Bitte versuchen Sie es erneut.",
                type: "error"
            });
        }
    }

    function settingsClick() {
        settingsModal.showModal();
    }
</script>

{#if block}
    <div class="absolute top-0 left-0 w-dvw h-dvh bg-gv-overlay-blocker z-100"></div>
{/if}

<SettingsModal bind:this={settingsModal}></SettingsModal>
<Modal bind:this={voiceDistributionSettingsModal} title="Stimmenvereteilung Einstellungen" subTitle="Einstellungen für die Stimmverteilungs Anzeige">
    <Input title="Maximale anzahl an Mitgliedern pro Stimme" type="number" marginTop="5" bind:value={maxMembers}/>
    <div class="w-full flex items-center justify-end mt-5 gap-2">
        <Button type="secondary" on:click={voiceDistributionSettingsModal.hideModal}>Abbrechen</Button>
        <Button type="primary" on:click={updateMaxMembersVoiceDistribution} isSubmit={true}>Speichern</Button>
    </div>
</Modal>
<ToastStack></ToastStack>
<main class="flex overflow-hidden">
    <Sidebar onSettingsClick={settingsClick} currentPage="dashboard"></Sidebar>
    <div class="flex flex-col w-full h-dvh overflow-hidden p-10 min-h-0">
        <PageHeader title="Dashboard" subTitle="Willkommen in GVW Office - Übersicht Gesangverein Weppersdorf" />

        <!-- Small cards -->
        <div class="flex items-center overflow-hidden mt-8 gap-5 h-full max-h-1/7">
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
        <div class="w-full flex-1 mt-8 gap-5 flex min-h-0">
            <!-- Upcoming Events -->
            <Card padding="5">
                <p class="text-dt-3 text-gv-dark-text w-full text-start flex flex-col mb-3">
                    <span>Kommende Veranstaltungen</span>
                    <span class="text-gv-light-text text-dt-4">Nächste Veranstaltungen und Proben</span>
                </p>
                <div class="w-full flex-1 min-h-0 overflow-x-hidden overflow-y-auto flex flex-col items-center pr-2">
                    {#each events as event}
                        <ComingEvent margin="5" title={event.title}, time={event.time}, location={event.location},
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
</main>