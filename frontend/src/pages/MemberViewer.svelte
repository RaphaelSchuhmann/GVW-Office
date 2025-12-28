<script>
    import { onMount } from "svelte";
    import { push } from "svelte-spa-router";
    import { get } from "svelte/store";
    import { loadUserData, logout } from "../services/user";
    import { addToast } from "../stores/toasts";
    import { roleMap, voiceMap, statusMap, resetPassword } from "../services/members";
    import { membersStore } from "../stores/members";

    import ToastStack from "../components/ToastStack.svelte";
    import Sidebar from "../components/Sidebar.svelte";
    import PageHeader from "../components/PageHeader.svelte";
    import SettingsModal from "../components/SettingsModal.svelte";
    import Input from "../components/Input.svelte";
    import Button from "../components/Button.svelte";
    import DeleteMemberModal from "../components/DeleteMemberModal.svelte";

    /** @type {import("../components/SettingsModal.svelte").default} */
    let settingsModal;

    let member = {
        name: "",
        surname: "",
        email: "",
        phone: "",
        address: "",
        voice: "",
        status: "",
        role: "",
        birthdate: "",
        joined: "",
        id: "",
    };

    // DELETE MEMBER
    /** @type {import("../components/DeleteMemberModal.svelte").default} */
    let confirmDeleteMemberModal;

    let memberName = "";

    function startDeleteMember() {
        memberName = `${member.name} ${member.surname}`;
        confirmDeleteMemberModal.startDeleteMember();
    }

    async function resetMemberPassword() {
        const resp = await resetPassword(member.id);

        if (resp.status === 200) {
            addToast({
                title: "Passwort zurück gesetzt",
                subTitle: "Das Passwort des Mitglieds wurde erfolgreich zurück gesetzt und ein neues per email an das Mitglied gesendet.",
                type: "success"
            })
        } else if (resp.status === 401) {
            // Auth token invalid / unauthorized
            addToast({
                title: "Ungültiges Token",
                subTitle: "Ihr Authentifizierungstoken ist ungültig oder abgelaufen. Bitte melden Sie sich erneut an, um Zugriff zu erhalten.",
                type: "error"
            });
            logout();
            await push("/?cpwErr=false");
        } else if (resp.status === 404) {
            // user not found route back to log in
            addToast({
                title: "Konto nicht gefunden",
                subTitle: "Das Konto des Mitglieds konnte wurde nicht im System gefunden.",
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
    }

    onMount(async () => {
        await loadUserData();

        const hash = window.location.hash;
        const queryString = hash.split("?")[1];
        if (!queryString) return;

        const params = new URLSearchParams(queryString);
        let memberId = params.get("id");

        if (memberId) {
            let members = get(membersStore);
            member = members.raw.find(item => item.id === memberId);
        } else {
            await push("/members");
        }
    });

    function settingsClick() {
        settingsModal.showModal();
    }
</script>

<SettingsModal bind:this={settingsModal}></SettingsModal>
<ToastStack></ToastStack>

<!-- Confirm delete member modal -->
<DeleteMemberModal memberName={memberName} memberId={member.id}
                   onClose={async () => {await push("/members")}}
                   bind:this={confirmDeleteMemberModal}
/>

<main class="flex overflow-hidden">
    <Sidebar onSettingsClick={settingsClick} currentPage="members"></Sidebar>
    <div class="flex flex-col w-full h-dvh overflow-hidden p-10 min-h-0">
        <PageHeader title="Mitglied" subTitle={`Daten von "${member?.name ?? ""} ${member?.surname ?? ""}"`}>
            <Button type="secondary" on:click={async () => await push("/members")}>
                <span class="material-symbols-rounded text-icon-dt-5">arrow_back</span>
                <p class="text-dt-4 ml-3">Zurück</p>
            </Button>
            <Button type="primary" on:click={async () => await push(`/members/edit?id=${member.id}`)}>
                <span class="material-symbols-rounded text-icon-dt-5">person_edit</span>
                <p class="text-dt-4 ml-3">Bearbeiten</p>
            </Button>
        </PageHeader>
        <div class="flex flex-col w-2/3 gap-5 mt-10">
            <div class="flex items-center gap-4 w-full">
                <Input title="Vorname" bind:value={member.name} readonly={true}/>
                <Input title="Vorname" bind:value={member.surname} readonly={true}/>
            </div>
            <Input title="E-Mail" bind:value={member.email} readonly={true}/>
            <Input title="Telefon" bind:value={member.phone} readonly={true}/>
            <Input title="Adresse" bind:value={member.address} readonly={true}/>
            <div class="flex items-center gap-4 w-full">
                <Input title="Stimmlage" bind:value={voiceMap[member.voice]} readonly={true}/>
                <Input title="Status" bind:value={statusMap[member.status]} readonly={true}/>
                <Input title="Rolle" bind:value={roleMap[member.role]} readonly={true}/>
            </div>
            <div class="flex items-center gap-4 w-full">
                <Input title="Geburtsdatum" bind:value={member.birthdate} readonly={true}/>
                <Input title="Mitglied seit" bind:value={member.joined} readonly={true}/>
            </div>
            <div class="flex items-center gap-4 w-full">
                <Button type="primary" on:click={resetMemberPassword}>Passwort zurücksetzen</Button>
                <Button type="secondary" fontColor="text-gv-delete" on:click={startDeleteMember}>
                    <span class="material-symbols-rounded text-icon-dt-6">delete</span>
                    <p class="text-dt-5 ml-3">Löschen</p>
                </Button>
            </div>
        </div>
    </div>
</main>