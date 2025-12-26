<script>
    import { onMount } from "svelte";
    import { push } from "svelte-spa-router";
    import { get } from "svelte/store";
    import { getData, logout } from "../services/user";
    import { user } from "../stores/user";
    import { auth } from "../stores/auth";
    import { addToast } from "../stores/toasts";
    import { roleMap, voiceMap, statusMap, deleteMember, resetPassword } from "../services/members";
    import { membersStore } from "../stores/members";

    import ToastStack from "../components/ToastStack.svelte";
    import Sidebar from "../components/Sidebar.svelte";
    import PageHeader from "../components/PageHeader.svelte";
    import SettingsModal from "../components/SettingsModal.svelte";
    import Modal from "../components/Modal.svelte";
    import Input from "../components/Input.svelte";
    import Button from "../components/Button.svelte";

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
    /** @type {import("../components/Modal.svelte").default} */
    let confirmDeleteMemberModal;

    let confirmInput = "";
    let memberName = "";
    let invalidConfirm = true;

    $: (confirmInput === memberName && memberName) ? invalidConfirm = false : invalidConfirm = true;

    function startDeleteMember() {
        confirmDeleteMemberModal?.showModal();

        let membersRaw = get(membersStore).raw;
        let name = member.name;
        let surname = member.surname;

        memberName = `${name} ${surname}`;
    }

    async function handleDeleteMember() {
        confirmDeleteMemberModal?.hideModal();
        const resp = await deleteMember(member.id);
        const body = await resp.json();

        if (resp.status === 200) {
            addToast({
                title: "Mitglied gelöscht",
                subTitle: "Das Mitglied und der zugehörige Benutzeraccount wurden erfolgreich aus dem System entfernt.",
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

<Modal bind:this={confirmDeleteMemberModal} extraFunction={() => {confirmInput = ""}} title="Mitglied löschen"
       subTitle="Sind Sie sich sicher das Sie dieses Mitglied löschen möchten?" width="2/5">
    <Input marginTop="5" bind:value={confirmInput} title={`Geben Sie: "${memberName}" ein um fortzufahren`}
           placeholder="Max Mustermann" />
    <div class="w-full flex items-center justify-end mt-5 gap-4">
        <Button type="secondary" on:click={confirmDeleteMemberModal.hideModal}>Abbrechen</Button>
        <Button type="delete" on:click={handleDeleteMember} disabled={invalidConfirm}>Löschen</Button>
    </div>
</Modal>

<main class="flex overflow-hidden">
    <Sidebar onSettingsClick={settingsClick} currentPage="members"></Sidebar>
    <div class="flex flex-col w-full h-dvh overflow-hidden p-10 min-h-0">
        <PageHeader title="Mitglied" subTitle={`Daten von "${member?.name ?? ""} ${member?.surname ?? ""}"`}>
            <Button type="secondary" on:click={async () => await push("/members")}>
                <span class="material-symbols-rounded text-icon-dt-5">arrow_back</span>
                <p class="text-dt-4 ml-3">Zurück</p>
            </Button>
            <Button type="primary">
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