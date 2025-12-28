<script>
    import Modal from "./Modal.svelte";
    import Button from "./Button.svelte";
    import Input from "./Input.svelte";
    import { deleteMember } from "../services/members";
    import { addToast } from "../stores/toasts";
    import { logout } from "../services/user";
    import { push } from "svelte-spa-router";

    export let memberName = "";
    export let memberId = "";
    export let onClose = () => {};

    /** @type {import("../components/Modal.svelte").default} */
    let confirmDeleteMemberModal;

    let confirmInput = "";
    let invalidConfirm = true;

    $: (confirmInput === memberName && memberName) ? invalidConfirm = false : invalidConfirm = true;

    export function startDeleteMember() {
        confirmDeleteMemberModal?.showModal();
    }

    async function handleDeleteMember() {
        confirmDeleteMemberModal?.hideModal();
        const resp = await deleteMember(memberId);
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

        onClose();
    }
</script>
<Modal bind:this={confirmDeleteMemberModal} extraFunction={() => {confirmInput = ""}} title="Mitglied löschen"
       subTitle="Sind Sie sich sicher das Sie dieses Mitglied löschen möchten?" width="2/5">
    <Input marginTop="5" bind:value={confirmInput} title={`Geben Sie: "${memberName}" ein um fortzufahren`}
           placeholder="Max Mustermann" />
    <div class="w-full flex items-center justify-end mt-5 gap-4">
        <Button type="secondary" on:click={confirmDeleteMemberModal.hideModal}>Abbrechen</Button>
        <Button type="delete" on:click={handleDeleteMember} disabled={invalidConfirm}>Löschen</Button>
    </div>
</Modal>