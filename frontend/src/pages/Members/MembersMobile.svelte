<script>
    import { onMount } from "svelte";
    import { push } from "svelte-spa-router";
    import { get } from "svelte/store";
    import { loadUserData, logout } from "../../services/user";
    import { membersStore } from "../../stores/members";
    import { addMember, updateStatus, roleMap, voiceMap, statusMap } from "../../services/members";
    import { addToast } from "../../stores/toasts";

    import ToastStack from "../../components/ToastStack.svelte";
    import DesktopSidebar from "../../components/DesktopSidebar.svelte";
    import PageHeader from "../../components/PageHeader.svelte";
    import Card from "../../components/Card.svelte";
    import SettingsModal from "../../components/SettingsModal.svelte";
    import Button from "../../components/Button.svelte";
    import SearchBar from "../../components/SearchBar.svelte";
    import Chip from "../../components/Chip.svelte";
    import Modal from "../../components/Modal.svelte";
    import Input from "../../components/Input.svelte";
    import Dropdown from "../../components/Dropdown.svelte";
    import DefaultDatepicker from "../../components/DefaultDatepicker.svelte";
    import YearDatepicker from "../../components/YearDatepicker.svelte";
    import ContextMenu from "../../components/ContextMenu.svelte";
    import ConfirmDeleteModal from "../../components/ConfirmDeleteModal.svelte";
    import MobileSidebar from "../../components/MobileSidebar.svelte";

    /** @type {import("../../components/SettingsModal.svelte").default} */
    let settingsModal;

    let searchBar;

    // ADD MEMBER
    /** @type {import("../../components/Modal.svelte").default} */
    let addMemberModal;

    let voiceInput;
    let statusInput;
    let roleInput;
    let birthdayInput;
    let joinedInput;
    let nameInput = "";
    let surnameInput = "";
    let emailInput = "";
    let phoneInput = "";
    let addressInput = "";

    /**
     * Resets all input fields in the add member modal
     */
    function resetAddInputs() {
        nameInput = "";
        surnameInput = "";
        emailInput = "";
        phoneInput = "";
        addressInput = "";
    }

    /**
     * Submits a new member to the system with all form data
     * Validates inputs and handles API response with appropriate toast messages
     */
    async function submitMember() {
        if (!birthdayInput || !joinedInput || !nameInput || !surnameInput || !emailInput || !phoneInput || !addressInput) return;
        if (voiceInput === "wählen" || statusInput === "wählen" || roleInput === "wählen") return;

        const resp = await addMember(nameInput, surnameInput, emailInput, phoneInput, addressInput, voiceMap[voiceInput], statusMap[statusInput], roleMap[roleInput], birthdayInput, joinedInput);

        if (resp.status === 200) {
            addToast({
                title: "Mitglied hinzugefügt",
                subTitle: "Das neue Mitglied wurde erfolgreich angelegt und ist ab sofort in der Mitgliederübersicht verfügbar.",
                type: "success"
            });
        } else if (resp.status === 401) {
            // Auth token invalid / unauthorized
            addToast({
                title: "Ungültiges Token",
                subTitle: "Ihr Authentifizierungstoken ist ungültig oder abgelaufen. Bitte melden Sie sich erneut an, um Zugriff zu erhalten.",
                type: "error"
            });
            logout();
            await push("/?cpwErr=false");
            return;
        } else if (resp.status === 400) {
            // user not found route back to log in
            addToast({
                title: "Eingaben unvollständig",
                subTitle: "Bitte überprüfen Sie Ihre Angaben. Einige Pflichtfelder sind entweder leer oder enthalten ungültige Werte.",
                type: "error"
            });
        } else if (resp.status === 409) {
            addToast({
                title: "Eingabe ungültig",
                subTitle: `Es gibt bereits einen Benutzer mit der E-Mail ${emailInput}. Bitte verwenden Sie eine andere E-Mail-Adresse.`,
                type: "error"
            });
        } else {
            // internal server error / unknown error
            addToast({
                title: "Interner Serverfehler",
                subTitle: "Beim Verarbeiten Ihrer Anfrage ist ein Fehler aufgetreten. Bitte versuchen Sie es erneut.",
                type: "error"
            });
        }

        addMemberModal.hideModal();
        await searchBar.fetchData();
    }

    onMount(async () => {
        await loadUserData();
    });

    let sidebarOpen = false;

    function settingsClick() {
        settingsModal.showModal();
    }
</script>

<SettingsModal bind:this={settingsModal}></SettingsModal>
<ToastStack></ToastStack>

<!-- Add member modal -->
<Modal bind:this={addMemberModal} extraFunction={resetAddInputs} title="Neues Mitglied hinzufügen"
       subTitle="Erfassen Sie hier die Mitgliedsdaten" isMobile={true}>
    <Input bind:value={nameInput} title="Vorname" placeholder="Max" />
    <Input bind:value={surnameInput} marginTop="5" title="Nachname" placeholder="Mustermann" />
    <Input bind:value={emailInput} marginTop="5" title="E-Mail" placeholder="max.mustermann@email.com" />
    <Input bind:value={phoneInput} marginTop="5" title="Telefon" placeholder="01701234 5678" />
    <Input bind:value={addressInput} marginTop="5" title="Adresse" placeholder="Hauptstraße 1, 12345 Musterstadt" />
    <Dropdown onChange={(value) => voiceInput = value} title="Stimmlage" marginTop="5"
              options={["1. Tenor", "2. Tenor", "1. Bass", "2. Bass"]} />
    <Dropdown onChange={(value) => statusInput = value} title="Status" marginTop="5" options={["Aktiv", "Passiv"]} />
    <Dropdown onChange={(value) => roleInput = value} title="Rolle" marginTop="5"
              options={["Mitglied", "Vorstand", "Schriftführer", "Chorleitung", "Notenwart"]} />
    <div class="flex flex-col items-start w-full mt-5">
        <p class="text-dt-6 font-medium mb-1">Geburtsdatum</p>
        <DefaultDatepicker onChange={(value) => birthdayInput = value} />
    </div>
    <div class="flex flex-col items-start w-full mt-5">
        <p class="text-dt-6 font-medium mb-1">Mitglied seit</p>
        <YearDatepicker onChange={(value) => joinedInput = value} />
    </div>
    <div class="w-full flex items-center justify-end mt-5 gap-4">
        <Button type="secondary" on:click={addMemberModal.hideModal}>Abbrechen</Button>
        <Button type="primary" on:click={submitMember} isSubmit={true}>Hinzufügen</Button>
    </div>
</Modal>

<MobileSidebar currentPage="members" onSettingsClick={settingsClick} bind:isOpen={sidebarOpen}/>

<main class="flex overflow-hidden">
    <div class="flex flex-col w-full h-dvh overflow-hidden p-7 min-h-0">
        <div class="w-full flex items-center justify-start">
            <button class="flex items-center justify-center" on:click={() => sidebarOpen = true}>
                <span class="material-symbols-rounded text-icon-dt-4 text-gv-dark-text">menu</span>
            </button>
        </div>
        <PageHeader title="Mitglieder" subTitle="Verwaltung aller Vereinsmitglieder" showSlot={false}>
        </PageHeader>

        <div class="flex max-[430px]:flex-col w-full items-center justify-start gap-2 mt-4">
            <Button type="primary" on:click={addMemberModal.showModal}>
                <span class="material-symbols-rounded text-icon-dt-5">add</span>
                <p class="text-dt-6 text-nowrap max-[430px]:ml-2">Mitglied hinzufügen</p>
            </Button>
            <Button type="primary" on:click={searchBar.fetchData}>
                <span class="material-symbols-rounded text-icon-dt-5">refresh</span>
                <p class="text-dt-6 text-nowrap max-[430px]:ml-2">Aktualisieren</p>
            </Button>
        </div>

        <SearchBar placeholder="Mitglieder durchsuchen..." page="members" marginTop="5" bind:this={searchBar} />

        <Card padding="0" marginTop="5" rounded="2" borderThickness="1">
            <div class="flex-1 min-h-0 overflow-y-auto w-full max-h-full">
                {#if $membersStore.display.length !== 0}
                    {#each $membersStore.display as member}
                        <button class="flex items-center w-full border-b border-gv-border p-2" on:click={async () =>  await push(`/members/view?id=${member.id}`)}>
                            <div class="flex flex-col items-start justify-between mr-auto max-w-3/4">
                                <p class="text-gv-dark-text text-dt-7">{`${member.name} ${member.surname}`}</p>
                                <div class="flex items-center justify-start gap-2">
                                    <span class="material-symbols-rounded text-icon-dt-7 text-gv-dark-turquoise">mail</span>
                                    <p class="text-dt-8 text-gv-dark-turquoise text-nowrap truncate">{member.email}</p>
                                </div>
                            </div>

                            <Chip text={statusMap[member.status]} fontSize="7"/>
                        </button>
                    {/each}
                {:else}
                    <p class="text-dt-5 text-gv-dark-text text-center w-full h-full p-10 font-semibold">Es wurden keine Mitglieder gefunden!</p>
                {/if}
            </div>
        </Card>
    </div>
</main>