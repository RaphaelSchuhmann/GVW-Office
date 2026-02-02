<script>
    import { onMount } from "svelte";
    import { push } from "svelte-spa-router";
    import { get } from "svelte/store";
    import { loadUserData, logout } from "../../services/user";
    import { addToast } from "../../stores/toasts";
    import { roleMap, voiceMap, statusMap, updateMember } from "../../services/members";
    import { membersStore } from "../../stores/members";
    import { viewportWidth } from "../../stores/viewport";

    import ToastStack from "../../components/ToastStack.svelte";
    import DesktopSidebar from "../../components/DesktopSidebar.svelte";
    import PageHeader from "../../components/PageHeader.svelte";
    import SettingsModal from "../../components/SettingsModal.svelte";
    import Input from "../../components/Input.svelte";
    import Button from "../../components/Button.svelte";
    import DefaultDatepicker from "../../components/DefaultDatepicker.svelte";
    import YearDatepicker from "../../components/YearDatepicker.svelte";
    import Dropdown from "../../components/Dropdown.svelte";

    /** @type {import("../../components/SettingsModal.svelte").default} */
    let settingsModal;

    export let member;

    let edited = false;

    // Inputs
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

    let formReady = false;
    let originalForm = null;

    $: edited = formReady && (
        nameInput !== originalForm.name || surnameInput !== originalForm.surname || emailInput !== originalForm.email || phoneInput !== originalForm.phone ||
        addressInput !== originalForm.address || voiceInput !== originalForm.voice || statusInput !== originalForm.status || roleInput !== originalForm.role ||
        birthdayInput !== originalForm.birthdate || joinedInput !== originalForm.joined
    ) && (
        nameInput && surnameInput && emailInput && phoneInput && addressInput && voiceInput && statusInput && roleInput && birthdayInput && joinedInput
    );

    /**
     * Updates member information in the system
     * Handles API response and shows appropriate toast messages
     * Redirects to members page after completion
     */
    async function handleUpdateMember() {
        const resp = await updateMember(member.id, nameInput, surnameInput, emailInput, phoneInput, addressInput, voiceMap[voiceInput], statusMap[statusInput], roleMap[roleInput], birthdayInput, joinedInput);
        const body = await resp.json();

        if (resp.status === 200) {
            addToast({
                title: "Erfolgreich gespeichert",
                subTitle: "Ihre Änderungen wurden erfolgreich übernommen und im System abgespeichert.",
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
        } else if (resp.status === 404) {
            // member not found
            if (body.errorMessage === "UserNotFound") {
                addToast({
                    title: "Benutzer nicht gefunden",
                    subTitle: "Der Benutzer des angegebenen Mitglieds konnte nicht gefunden werden. Bitte versuchen Sie es später erneut.",
                    type: "error"
                });
            } else {
                addToast({
                    title: "Mitglied nicht gefunden",
                    subTitle: "Das angegebene Mitglied konnte nicht gefunden werden. Bitte versuchen Sie es später erneut.",
                    type: "error"
                });
            }
        } else {
            // internal server error / unknown error
            addToast({
                title: "Interner Serverfehler",
                subTitle: "Beim Verarbeiten Ihrer Anfrage ist ein Fehler aufgetreten. Bitte versuchen Sie es erneut.",
                type: "error"
            });
        }
        await push("/members");
    }

    onMount(async () => {
        // text inputs
        nameInput = member.name;
        surnameInput = member.surname;
        emailInput = member.email;
        phoneInput = member.phone;
        addressInput = member.address;

        // dropdowns → LABELS
        voiceInput = voiceMap[member.voice];
        statusInput = statusMap[member.status];
        roleInput = roleMap[member.role];

        // datepickers
        birthdayInput = member.birthdate;
        joinedInput = member.joined;

        originalForm = {
            name: nameInput,
            surname: surnameInput,
            email: emailInput,
            phone: phoneInput,
            address: addressInput,
            voice: voiceInput,
            status: statusInput,
            role: roleInput,
            birthdate: birthdayInput,
            joined: joinedInput
        };

        formReady = true;
    });

    function settingsClick() {
        settingsModal.showModal();
    }
</script>

<SettingsModal bind:this={settingsModal}></SettingsModal>
<ToastStack></ToastStack>
<main class="flex h-screen overflow-hidden">
    <DesktopSidebar onSettingsClick={settingsClick} currentPage="members"></DesktopSidebar>
    <div class="flex flex-col w-full flex-1 overflow-hidden p-10 min-h-0">
        <PageHeader title="Mitglied bearbeiten" subTitle={`Bearbeitung von Mitglied: "${member?.name ?? ""} ${member?.surname ?? ""}"`} showSlot={$viewportWidth >= 1150}>
            {#if $viewportWidth >= 1150}
                <Button type="secondary" isCancel={true} on:click={async () => await push("/members")}>
                    <p class="text-dt-4 ml-3">Abbrechen</p>
                </Button>
                <Button type="primary" disabled={!edited} on:click={handleUpdateMember} isSubmit={true}>
                    <span class="material-symbols-rounded text-icon-dt-5">person_edit</span>
                    <p class="text-dt-4 ml-3">Speichern</p>
                </Button>
            {/if}
        </PageHeader>
        <div class="flex flex-col min-[1150px]:w-2/3 w-full gap-5 min-[1150px]:mt-10">
            <div class="flex items-center gap-4 mt-5">
                <Input bind:value={nameInput} title="Vorname" placeholder="Max" />
                <Input bind:value={surnameInput} title="Nachname" placeholder="Mustermann" />
            </div>
            <Input bind:value={emailInput} marginTop="5" title="E-Mail" placeholder="max.mustermann@email.com" />
            <Input bind:value={phoneInput} marginTop="5" title="Telefon" placeholder="01701234 5678" />
            <Input bind:value={addressInput} marginTop="5" title="Adresse" placeholder="Hauptstraße 1, 12345 Musterstadt" />
            <div class="w-full flex items-center gap-4 mt-5">
                <Dropdown selected={voiceMap[member.voice]} onChange={(value) => {voiceInput = value}} title="Stimmlage"
                          options={["1. Tenor", "2. Tenor", "1. Bass", "2. Bass"]} />
                <Dropdown selected={statusMap[member.status]} onChange={(value) => {statusInput = value}} title="Status" options={["Aktiv", "Passiv"]} />
                <Dropdown selected={roleMap[member.role]} onChange={(value) => {roleInput = value}} title="Rolle"
                          options={["Mitglied", "Vorstand", "Schriftführer"]} />
            </div>
            <div class="w-full flex items-center gap-4 mt-5 max-[1700px]:flex-col">
                <div class="flex flex-col items-start w-full">
                    <p class="text-dt-6 font-medium mb-1">Geburtsdatum</p>
                    <DefaultDatepicker selected={member.birthdate} onChange={(value) => {birthdayInput = value}} />
                </div>
                <div class="flex flex-col items-start w-full">
                    <p class="text-dt-6 font-medium mb-1">Mitglied seit</p>
                    <YearDatepicker selected={member.joined} onChange={(value) => {joinedInput = value}} />
                </div>
            </div>
            {#if $viewportWidth < 1150} 
                <div class="flex w-full items-center gap-2">
                    <Button type="secondary" isCancel={true} on:click={async () => await push("/members")}>
                        <p class="text-dt-4 ml-3">Abbrechen</p>
                    </Button>
                    <Button type="primary" disabled={!edited} on:click={handleUpdateMember} isSubmit={true}>
                        <span class="material-symbols-rounded text-icon-dt-5">person_edit</span>
                        <p class="text-dt-4 ml-3">Speichern</p>
                    </Button>
                </div>
            {/if}
        </div>
    </div>
</main>