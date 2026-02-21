<script>
    import Modal from "./Modal.svelte";
    import Button from "./Button.svelte";
    import Input from "./Input.svelte";
    import { removeMember } from "../services/membersService";
    import { deleteEvent } from "../services/events";
    import { deleteScore } from "../services/library";
    import { addToast } from "../stores/toasts";
    import { logout } from "../services/userService";
    import { push } from "svelte-spa-router";

    const actionMap = {
        "deleteMember": removeMember,
        "deleteEvent": deleteEvent,
        "deleteLibEntry": deleteScore,
    };

    let {
        action = "none",
        title = "",
        subTitle = "",
        placeholder = "",
        expectedInput = "",
        id = "",
        toastMap = {},
        onClose = () => {},
        isMobile = false,
        ...restProps
    } = $props();

    let confirmInput = $state("");
    /** @type {import("./Modal.svelte").default} */
    let confirmDeleteModal = $state();

    const invalidConfirm = $derived(!(confirmInput === expectedInput && expectedInput));

    const validActions = ["deleteMember", "deleteEvent", "deleteReport", "deleteLibEntry"];
    let activeAction = $state(action);
    if (!validActions.includes(action)) {
        console.warn(`Action ${action} is not a valid action`);
        activeAction = "none";
    }

    /**
     * Shows the confirmation delete modal
     */
    export function startDelete() {
        confirmDeleteModal?.showModal();
    }

    /**
     * Handles the delete operation after confirmation
     */
    async function handleDelete() {
        confirmDeleteModal?.hideModal();

        const DEV_refactoredRemoveServices = ["deleteMember"];

        if (activeAction !== "none" && DEV_refactoredRemoveServices.includes(activeAction)) {
            const apiFunction = actionMap[activeAction];
            await apiFunction(id);

            onClose();
            return;
        }

        if (activeAction !== "none") {
            const apiFunction = actionMap[activeAction];
            const resp = await apiFunction(id);

            if (resp.status === 200) {
                addToast(toastMap.success);
            } else if (resp.status === 401) {
                addToast({
                    title: "Ungültiges Token",
                    subTitle: "Ihr Authentifizierungstoken ist ungültig oder abgelaufen...",
                    type: "error"
                });
                logout();
                await push("/?cpwErr=false");
                return;
            } else if (resp.status === 400) {
                addToast({
                    title: "Unvollständige Daten",
                    subTitle: "Es wurden unvollständige Daten übermittelt.",
                    type: "error"
                });
            } else if (resp.status === 404) {
                addToast(toastMap.notFound);
            } else {
                addToast({
                    title: "Interner Serverfehler",
                    subTitle: "Beim Verarbeiten Ihrer Anfrage ist ein Fehler aufgetreten.",
                    type: "error"
                });
            }
        } else {
            addToast({
                title: "Unerwarteter Fehler",
                subTitle: "Es ist ein unerwarteter Fehler aufgetreten.",
                type: "error"
            });
        }

        onClose();
    }
</script>

<Modal
    bind:this={confirmDeleteModal}
    extraFunction={() => { confirmInput = "" }}
    {title}
    {subTitle}
    {isMobile}
    width="2/5"
>
    <Input
        marginTop="5"
        bind:value={confirmInput}
        title={`Geben Sie: "${expectedInput}" ein um fortzufahren`}
        {placeholder}
    />

    <div class="w-full flex items-center justify-end mt-5 gap-4">
        <Button
            type="secondary"
            onclick={() => confirmDeleteModal.hideModal()}
        >
            Abbrechen
        </Button>
        <Button
            type="delete"
            onclick={handleDelete}
            disabled={invalidConfirm}
        >
            Löschen
        </Button>
    </div>
</Modal>