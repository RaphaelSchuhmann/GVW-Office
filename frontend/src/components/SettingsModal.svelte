<script>
    import { user } from "../stores/user";
    import { logout, updateData } from "../services/user";
    import { onMount, tick } from "svelte";
    import Modal from "./Modal.svelte";
    import Input from "./Input.svelte";
    import Button from "./Button.svelte";
    import { addToast } from "../stores/toasts";
    import { push } from "svelte-spa-router";
    import { tryUpdateUserData } from "../services/generalService";

    export let isMobile = false;

    /** @type {import("../components/Modal.svelte").default} */
    let modal;

    // Get updated if their edit button is clicked
    let readonlyMail = true;
    let readonlyPhone = true;
    let readonlyAddress = true;

    let emailInput;
    let phoneInput;
    let addressInput;

    let email = $user.email;
    let phone = $user.phone;
    let address = $user.address;

    /**
     * Updates the user data with the current input values.
     * 
     * Falls back to existing values from teh `$user` store if any field is empty.
     * Calls `tryUpdateUserData` to perform the update, and hides the modal once complete.
     * 
     * @async
     * @returns {Promise<void>}
     */
    async function updateUserData() {
        if (email.length === 0) email = $user.email;
        if (phone.length === 0) phone = $user.phone;
        if (address.length === 0) address = $user.address;

        await tryUpdateUserData({ email, phone, address });

        modal.hideModal();
    }

    /**
     * Resets the input fields to readonly mode.
     * 
     * Typically used when closing or resetting the modal to prevent editing until explicitly allowed.
     */
    function resetStates() {
        readonlyMail = true;
        readonlyPhone = true;
        readonlyAddress = true;
    }

    /**
     * Opens the user data modal and initializes the input fields
     * with the current values from the `$user` store.
     */
    export function showModal() {
        modal.showModal();

        email = $user.email;
        phone = $user.phone;
        address = $user.address;
    }
</script>

<Modal title="Benutzer Einstellungen" subTitle="Ihre persönlichen Daten" bind:this={modal} extraFunction={resetStates} isMobile={isMobile}>
    <Input title="Name" value={$user.name} readonly={true} marginTop="5" />

    <div class="flex items-end w-full mt-5 gap-2">
        <Input title="E-Mail" bind:value={email} readonly={readonlyMail} width="w-2/3"
               type="email"
               bind:this={emailInput} />
        <Button type="primary" width="w-1/3"
                on:click={() => {readonlyMail = !readonlyMail; tick().then(() => emailInput.focus());}}>{readonlyMail ? "Bearbeiten" : "Fertig"}
        </Button>
    </div>

    <div class="flex items-end w-full mt-5 gap-2">
        <Input title="Telefon" bind:value={phone} readonly={readonlyPhone} width="w-2/3"
               bind:this={phoneInput} />
        <Button type="primary" width="w-1/3"
                on:click={() => {readonlyPhone = !readonlyPhone; tick().then(() => phoneInput.focus());}}>{readonlyPhone ? "Bearbeiten" : "Fertig"}
        </Button>
    </div>

    <div class="flex items-end w-full mt-5 gap-2">
        <Input title="Adresse" bind:value={address} readonly={readonlyAddress} width="w-2/3"
               bind:this={addressInput} />
        <Button type="primary" width="w-1/3"
                on:click={() => {readonlyAddress = !readonlyAddress; tick().then(() => addressInput.focus());}}>{readonlyAddress ? "Bearbeiten" : "Fertig"}
        </Button>
    </div>

    <div class="w-full flex items-center justify-end mt-5 gap-2">
        <Button type="secondary" on:click={modal.hideModal}>Abbrechen</Button>
        <Button type="primary" on:click={updateUserData} isSubmit={true}>Speichern</Button>
    </div>
</Modal>