<script>
    import { onMount } from "svelte";
    import { push } from "svelte-spa-router";
    import { getData, logout } from "../services/user";
    import { user } from "../stores/user";
    import { auth } from "../stores/auth";
    import { membersStore, voiceMap, statusMap } from "../stores/members";
    import { addToast } from "../stores/toasts";

    import ToastStack from "../components/ToastStack.svelte";
    import Sidebar from "../components/Sidebar.svelte";
    import PageHeader from "../components/PageHeader.svelte";
    import Card from "../components/Card.svelte";
    import SettingsModal from "../components/SettingsModal.svelte";
    import Button from "../components/Button.svelte";
    import SearchBar from "../components/SearchBar.svelte";
    import Chip from "../components/Chip.svelte";
    import Modal from "../components/Modal.svelte";
    import Input from "../components/Input.svelte";
    import Dropdown from "../components/Dropdown.svelte";

    /** @type {import("../components/SettingsModal.svelte").default} */
    let settingsModal;

    /** @type {import("../components/Modal.svelte").default} */
    let addMemberModal;

    /** @type {import("../components/Dropdown.svelte").default} */
    let voiceSelect;
    let statusSelect;
    let roleSelect;

    onMount(async () => {
        await loadUserData();
    });

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

    function settingsClick() {
        settingsModal.showModal();
    }
</script>

<SettingsModal bind:this={settingsModal}></SettingsModal>
<ToastStack></ToastStack>
<Modal bind:this={addMemberModal} title="Neues Mitglied hinzufügen" subTitle="Erfassen Sie hier die Mitgliedsdaten" width="2/5" height="3/4">
    <div class="flex items-center gap-4 mt-5">
        <Input title="Vorname" placeholder="Max"/>
        <Input title="Nachname" placeholder="Mustermann"/>
    </div>
    <Input marginTop="5" title="E-Mail" placeholder="max.mustermann@email.com"/>
    <Input marginTop="5" title="Telefon" placeholder="01701234 5678"/>
    <Input marginTop="5" title="Adresse" placeholder="Hauptstraße 1, 12345 Musterstadt"/>
    <div class="w-full flex items-center gap-4">
        <Dropdown bind:this={voiceSelect} marginTop="5" title="Stimmlage" options={["1. Tenor", "2. Tenor", "1. Bass", "2. Bass"]}/>
        <Dropdown bind:this={statusSelect} marginTop="5" title="Status"  options={["Aktiv", "Passiv"]}/>
        <Dropdown bind:this={roleSelect} marginTop="5" title="Rolle"  options={["Mitglied", "Vorstand", "Schriftführer"]}/>
    </div>
</Modal>
<main class="flex overflow-hidden">
    <Sidebar onSettingsClick={settingsClick} currentPage="members"></Sidebar>
    <div class="flex flex-col w-full h-dvh overflow-hidden p-10 min-h-0">
        <PageHeader title="Mitglieder" subTitle="Verwaltung aller Vereinsmitglieder">
            <Button type="secondary">
                <span class="material-symbols-rounded text-icon-dt-4">download</span>
                <p class="text-dt-5">Exportieren</p>
            </Button>
            <Button type="primary" on:click={addMemberModal.showModal}>
                <span class="material-symbols-rounded text-icon-dt-4">add</span>
                <p class="text-dt-5 text-nowrap">Mitglied hinzufügen</p>
            </Button>
        </PageHeader>

        <SearchBar placeholder="Mitglieder durchsuchen..." page="members" marginTop="5" />

        <Card padding="0" marginTop="5">
            {#if $membersStore.results.length !== 0}
                <table class="w-full text-left border-gv-border">
                    <thead class=" text-dt-4 text-gv-dark-text">
                    <tr>
                        <th scope="col" class="px-6 py-3 font-bold">
                            Name
                        </th>
                        <th scope="col" class="px-6 py-3 font-bold">
                            Stimmlage
                        </th>
                        <th scope="col" class="px-6 py-3 font-bold">
                            Kontakt
                        </th>
                        <th scope="col" class="px-6 py-3 font-bold text-nowrap">
                            Mitglied seit
                        </th>
                        <th scope="col" class="px-6 py-3 font-bold">
                            Status
                        </th>
                        <th scope="col" class="px-6 py-3"></th>
                    </tr>
                    </thead>
                    <tbody>
                    {#if $membersStore.loading}
                        <tr class="border-t-2 border-gv-border">
                            <td class="px-6 py-4">
                                <div class="flex flex-col items-start h-full overflow-hidden gap-1">
                                    <div class="animate-pulse h-7 w-50 bg-gray-200 rounded"></div>
                                    <div class="animate-pulse h-5 w-40 bg-gray-200 rounded"></div>
                                </div>
                            </td>
                            <td class="px-6 py-4">
                                <div class="animate-pulse h-7 w-30 bg-gray-200 rounded"></div>
                            </td>
                            <td class="px-6 py-4">
                                <div class="flex flex-col items-start  h-full overflow-hidden gap-2">
                                    <div class="flex items-center justify-start gap-2">
                                    <span
                                        class="material-symbols-rounded text-icon-dt-6 text-gv-dark-turquoise">mail</span>
                                        <div class="animate-pulse h-5 w-40 bg-gray-200 rounded"></div>
                                    </div>
                                    <div class="flex items-center justify-start gap-2">
                                <span
                                    class="material-symbols-rounded text-icon-dt-6 text-gv-light-text">phone</span>
                                        <div class="animate-pulse h-5 w-40 bg-gray-200 rounded"></div>
                                    </div>
                                </div>
                            </td>
                            <td class="px-6 py-4">
                                <div class="animate-pulse h-7 w-30 bg-gray-200 rounded"></div>
                            </td>
                            <td class="px-6 py-4">
                                <div class="animate-pulse h-7 w-20 bg-gray-200 rounded"></div>
                            </td>
                            <td class="px-6 py-4"></td>
                        </tr>
                    {:else}
                        {#each $membersStore.results as member}
                            <tr class="border-t-2 border-gv-border">
                                <td class="px-6 py-4">
                                    <div class="flex flex-col items-start h-full overflow-hidden gap-1">
                                        <p class="text-dt-6 text-gv-dark-text text-nowrap truncate">{`${member.name} ${member.surname}`}</p>
                                        <p class="text-dt-8 text-gv-light-text text-nowrap truncate">{member.address}</p>
                                    </div>
                                </td>
                                <td class="px-6 py-4">
                                    <p class="text-dt-4 text-gv-dark-text text-nowrap truncate">{voiceMap[member.voice]}</p>
                                </td>
                                <td class="px-6 py-4">
                                    <div class="flex flex-col items-start  h-full overflow-hidden gap-2">
                                        <div class="flex items-center justify-start gap-2">
                                    <span
                                        class="material-symbols-rounded text-icon-dt-6 text-gv-dark-turquoise">mail</span>
                                            <p class="text-dt-7 text-gv-dark-turquoise">{member.email}</p>
                                        </div>
                                        <div class="flex items-center justify-start gap-2">
                                <span
                                    class="material-symbols-rounded text-icon-dt-6 text-gv-light-text">phone</span>
                                            <p class="text-dt-7 text-gv-light-text">{member.phone}</p>
                                        </div>
                                    </div>
                                </td>
                                <td class="px-6 py-4">
                                    <p class="text-dt-4 text-gv-dark-text text-nowrap truncate">{member.joined}</p>
                                </td>
                                <td class="px-6 py-4">
                                    <Chip text={statusMap[member.status]} />
                                </td>
                                <td class="px-6 py-4">
                                    <button
                                        class="flex items-center justify-center p-2 rounded-2 cursor-pointer hover:bg-gv-hover-effect">
                                <span
                                    class="material-symbols-rounded text-icon-dt-6 text-gv-dark-text">more_horiz</span>
                                    </button>
                                </td>
                            </tr>
                        {/each}
                    {/if}
                    </tbody>
                </table>
            {:else}
                <p class="text-dt-3 text-gv-dark-text text-center w-full h-full p-10 font-semibold">Es wurden keine
                    Mitglieder gefunden!</p>
            {/if}
        </Card>
    </div>
</main>