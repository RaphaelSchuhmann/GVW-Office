<script>
    import { onMount } from "svelte";
    import { push } from "svelte-spa-router";
    import { getData, logout } from "../services/user";
    import { delay } from "../services/utils";
    import { user } from "../stores/user";
    import { auth } from "../stores/auth";
    import ToastStack from "../components/ToastStack.svelte";
    import Sidebar from "../components/Sidebar.svelte";
    import PageHeader from "../components/PageHeader.svelte";
    import Card from "../components/Card.svelte";
    import ComingEvent from "../components/ComingEvent.svelte";
    import VoiceDistribution from "../components/VoiceDistribution.svelte";

    /** @type {import("../components/ToastStack.svelte").default} */
    let toastStack;

    let events = [];

    onMount(async () => {
        await loadUserData();
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

    async function loadUserData() {
        // Get user data
        const response = await getData($user.email, $auth.token);
        const body = await response.json();

        if (response.status === 200) {
            user.set({ name: body.name, email: body.email, role: body.role, loaded: true });
        } else if (response.status === 401) {
            // Auth token invalid / unauthorized
            toastStack.addToast(
                "error",
                "Ungültiges Token",
                "Ihr Authentifizierungstoken ist ungültig oder abgelaufen. Bitte melden Sie sich erneut an, um Zugriff zu erhalten."
            );
            await delay(5000);
            logout();
            await push("/?cpwErr=false");
        } else if (response.status === 404) {
            // user not found route back to log in
            toastStack.addToast(
                "error",
                "Konto nicht gefunden",
                "Ihr Konto konnte nicht gefunden werden. Bitte melden Sie sich erneut an, um fortzufahren."
            );
            await delay(5000);
            logout();
            await push("/?cpwErr=false");
        } else {
            // internal server error / unknown error
            toastStack.addToast("error", "Interner Serverfehler", "Beim Verarbeiten Ihrer Anfrage ist ein Fehler aufgetreten. Bitte versuchen Sie es erneut.");
        }
    }

    function settingsClick() {
        console.log("Hello World");
    }
</script>

<ToastStack bind:this={toastStack}></ToastStack>
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
                    <span class="text-gv-light-text text-dt-4">Nächste Events und Proben</span>
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
                <p class="text-dt-3 text-gv-dark-text w-full text-start flex flex-col">
                    <span>Stimmenverteilung</span>
                    <span class="text-gv-light-text text-dt-4">Übersicht der Mitglieder nach Stimmlage</span>
                </p>
                <div class="w-full flex-1 min-h-0 overflow-x-hidden overflow-y-auto flex flex-col items-center pr-2">
                    <VoiceDistribution voice="1. Tenor" voiceMembers={4} totalMembers={19}/>
                    <VoiceDistribution voice="2. Tenor" voiceMembers={5} totalMembers={19}/>
                    <VoiceDistribution voice="1. Bass" voiceMembers={5} totalMembers={19}/>
                    <VoiceDistribution voice="2. Bass" voiceMembers={4} totalMembers={19}/>
                </div>
            </Card>
        </div>
    </div>
</main>