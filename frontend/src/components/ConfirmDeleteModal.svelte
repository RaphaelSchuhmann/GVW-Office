<script>
    import Modal from "./Modal.svelte";
    import Button from "./Button.svelte";
    import Input from "./Input.svelte";
    import { deleteMember } from "../services/members";
    import { deleteEvent } from "../services/events";
    import { deleteReport } from "../services/reports";
    import { deleteScore } from "../services/library";
    import { addToast } from "../stores/toasts";
    import { logout } from "../services/user";
    import { push } from "svelte-spa-router";

    const actionMap = {
        "deleteMember": deleteMember,
        "deleteEvent": deleteEvent,
        "deleteReport": deleteReport,
        "deleteLibEntry": deleteScore,
    }

    export let action = "none";
    export let title = "";
    export let subTitle = "";
    export let placeholder = "";
    export let expectedInput = "";
    export let id = "";
    export let toastMap = {};
    export let onClose = () => {};

    const validActions = ["deleteMember", "deleteEvent", "deleteReport", "deleteLibEntry"];
    if (!validActions.includes(action)) {
        console.warn(`Action ${action} is not a valid action`);
        action = "none";
    }

    /** @type {import("../components/Modal.svelte").default} */
    let confirmDeleteModal;

    let confirmInput = "";
    let invalidConfirm = true;

    $: (confirmInput === expectedInput && expectedInput) ? invalidConfirm = false : invalidConfirm = true;

    /**
     * Shows the confirmation delete modal
     */
    export function startDelete() {
        confirmDeleteModal?.showModal();
    }

    /**
     * Handles the delete operation after confirmation
     * Calls the appropriate API function and handles responses with toast messages
     */
    async function handleDelete() {
        confirmDeleteModal?.hideModal();
        if (action !== "none") {
            const apiFunction = actionMap[action];
            const resp = await apiFunction(id);

            if (resp.status === 200) {
                addToast(toastMap.success);
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
                addToast(toastMap.notFound);
            } else {
                // internal server error / unknown error
                addToast({
                    title: "Interner Serverfehler",
                    subTitle: "Beim Verarbeiten Ihrer Anfrage ist ein Fehler aufgetreten. Bitte versuchen Sie es erneut.",
                    type: "error"
                });
            }
        } else {
            addToast({
                title: "Unerwarteter Fehler",
                subTitle: "Es ist ein unerwarteter Fehler aufgetreten. Bitte kontaktieren Sie umgehend den Vorstand!",
               type: "error"
            });
        }

        onClose();
    }
</script>
<Modal bind:this={confirmDeleteModal} extraFunction={() => {confirmInput = ""}} title={title}
       subTitle={subTitle} width="2/5">
    <Input marginTop="5" bind:value={confirmInput} title={`Geben Sie: "${expectedInput}" ein um fortzufahren`}
           placeholder={placeholder} />
    <div class="w-full flex items-center justify-end mt-5 gap-4">
        <Button type="secondary" on:click={confirmDeleteModal.hideModal}>Abbrechen</Button>
        <Button type="delete" on:click={handleDelete} disabled={invalidConfirm}>Löschen</Button>
    </div>
</Modal>