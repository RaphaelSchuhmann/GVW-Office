<script>
    import { onMount } from "svelte";
    import { push } from "svelte-spa-router";
    import { getData, logout } from "../services/user";
    import { user } from "../stores/user";
    import { auth } from "../stores/auth";
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

    async function loadUserData() {
        // Get user data
        const response = await getData($user.email, $auth.token);
        const body = await response.json();

        if (response.status === 200) {
            user.update(u => ({ ...u, name: body.name, email: body.email, role: body.role, loaded: true }));
        } else if (response.status === 401) {
            // Auth token invalid / unauthorized
            addToast({
                title: "Ungültiges Token",
                subTitle: "Ihr Authentifizierungstoken ist ungültig oder abgelaufen. Bitte melden Sie sich erneut an, um Zugriff zu erhalten.",
                type: "error"
            });
            logout();
            await push("/?cpwErr=false");
        } else if (response.status === 404) {
            // user not found route back to log in
            addToast({
                title: "Konto nicht gefunden",
                subTitle: "Ihr Konto konnte nicht gefunden werden. Bitte melden Sie sich erneut an, um fortzufahren.",
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

<SettingsModal bind:this={settingsModal}></SettingsModal>
<ToastStack></ToastStack>
<main class="flex overflow-hidden">
    <Sidebar onSettingsClick={settingsClick} currentPage="members"></Sidebar>
    <div class="flex flex-col w-full h-dvh overflow-hidden p-10 min-h-0">
        <PageHeader title="Dashboard" subTitle="Willkommen in GVW Office - Übersicht Gesangverein Weppersdorf">

        </PageHeader>
    </div>
</main>