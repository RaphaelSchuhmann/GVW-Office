<script>
    import { push } from "svelte-spa-router";
    import { logout } from "../../services/user";
    import { addToast } from "../../stores/toasts";
    import { roleMap, voiceMap, statusMap, resetPassword } from "../../services/members";
    import { viewportWidth } from "../../stores/viewport";

    import ToastStack from "../../components/ToastStack.svelte";
    import DesktopSidebar from "../../components/DesktopSidebar.svelte";
    import PageHeader from "../../components/PageHeader.svelte";
    import SettingsModal from "../../components/SettingsModal.svelte";
    import Input from "../../components/Input.svelte";
    import Button from "../../components/Button.svelte";
    import ConfirmDeleteModal from "../../components/ConfirmDeleteModal.svelte";

    /** @type {import("../../components/SettingsModal.svelte").default} */
    let settingsModal;

    export let member;

    // DELETE MEMBER
    /** @type {import("../../components/ConfirmDeleteModal.svelte").default} */
    let confirmDeleteMemberModal;

    let memberName = "";
    let deleteMemberToast = {
        success: {
            title: "Mitglied gelöscht",
            subTitle: "Das Mitglied und der zugehörige Benutzeraccount wurden erfolgreich aus dem System entfernt.",
            type: "success"
        },
        notFound: {
            title: "Nicht gefunden",
            subTitle: "Das angegebene Mitglied oder der zugehörige Benutzer konnte nicht gefunden werden. Bitte versuchen Sie es später erneut.",
            type: "error"
        },
    };

    /**
     * Initiates the delete process for a member
     * Sets up the confirmation modal with member details
     */
    function startDeleteMember() {
        memberName = `${member.name} ${member.surname}`;
        confirmDeleteMemberModal.startDelete();
    }

    /**
     * Resets a member's password and sends new password via email
     * Handles API response and shows appropriate toast messages
     */
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

    function settingsClick() {
        settingsModal.showModal();
    }
</script>

<SettingsModal bind:this={settingsModal}></SettingsModal>
<ToastStack></ToastStack>

<!-- Confirm delete member modal -->
<ConfirmDeleteModal expectedInput={memberName} id={member.id}
                    title="Mitglied löschen" subTitle="Sind Sie sich sicher das Sie dieses Mitglied löschen möchten?"
                    toastMap={deleteMemberToast} action="deleteMember"
                    onClose={async () => {await push("/members")}}
                    bind:this={confirmDeleteMemberModal}
/>

<main class="flex overflow-hidden">
    <DesktopSidebar onSettingsClick={settingsClick} currentPage="members"></DesktopSidebar>
    <div class="flex flex-col w-full h-dvh overflow-hidden p-10 min-h-0">
        <PageHeader title="Mitglied" subTitle={`Daten von "${member?.name ?? ""} ${member?.surname ?? ""}"`}>
            {#if $viewportWidth >= 1150}
                <Button type="secondary" on:click={async () => await push("/members")}>
                    <span class="material-symbols-rounded text-icon-dt-5">arrow_back</span>
                    <p class="text-dt-4 ml-3">Zurück</p>
                </Button>
                <Button type="primary" on:click={async () => await push(`/members/edit?id=${member.id}`)}>
                    <span class="material-symbols-rounded text-icon-dt-5">person_edit</span>
                    <p class="text-dt-4 ml-3">Bearbeiten</p>
                </Button>
            {:else}
                <button class="cursor-pointer ml-auto hover:bg-gv-hover-effect flex items-center justify-center p-2 rounded-2" 
                        on:click={async () => await push("/members")}>
                    <span class="material-symbols-rounded text-icon-dt-2">close</span>
                </button>
            {/if}
        </PageHeader>
        <div class="flex flex-col min-[1150px]:w-2/3 w-full gap-5 mt-10">
            {#if $viewportWidth < 1150} 
                <div class="flex-col items-center gap-2 w-full">
                    <div class="flex items-center gap-2 w-full">
                        <Button type="secondary" fontColor="text-gv-delete" on:click={startDeleteMember}>
                            <span class="material-symbols-rounded text-icon-dt-6">delete</span>
                            <p class="min-[1200px]:text-dt-5 text-dt-6 ml-3">Löschen</p>
                        </Button>
                        <Button type="primary" on:click={async () => await push(`/members/edit?id=${member.id}`)}>
                            <span class="material-symbols-rounded min-[1200px]:text-icon-dt-5 text-icon-dt-6">person_edit</span>
                            <p class="min-[1200px]:text-dt-4 text-dt-5 ml-3">Bearbeiten</p>
                        </Button>
                    </div>
                    <div class="flex items-center w-full mt-2">
                        <Button type="primary" on:click={resetMemberPassword}>
                            <p class="text-dt-5">Passwort Zurücksetzen</p>
                        </Button>
                    </div>
                </div>
            {/if}

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
            {#if $viewportWidth >= 1150}
                <div class="flex items-center gap-4 w-full">
                    <Button type="primary" on:click={resetMemberPassword}>
                        <p class="min-[1200px]:text-dt-5 text-dt-6">Passwort Zurücksetzen</p>
                    </Button>
                    <Button type="secondary" fontColor="text-gv-delete" on:click={startDeleteMember}>
                        <span class="material-symbols-rounded text-icon-dt-6">delete</span>
                        <p class="min-[1200px]:text-dt-5 text-dt-6 ml-3">Löschen</p>
                    </Button>
                </div>
            {/if}
        </div>
    </div>
</main>