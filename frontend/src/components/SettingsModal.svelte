<script>
    import { user } from "../stores/user";
    import { logout, updateData } from "../services/user";
    import { onMount, tick } from "svelte";
    import Modal from "./Modal.svelte";
    import Input from "./Input.svelte";
    import Button from "./Button.svelte";
    import { addToast } from "../stores/toasts";
    import { push } from "svelte-spa-router";

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
     * Updates user data on the server and handles API response
     * Shows appropriate toast messages and handles authentication errors
     */
    async function updateUserData() {
        let originalEmail = $user.email;

        if (email.length === 0) email = $user.email;
        if (phone.length === 0) phone = $user.phone;
        if (address.length === 0) address = $user.address;

        user.update(u => ({ ...u, email: email, phone: phone, address: address }));
        const response = await updateData(originalEmail);

        if (response.status === 200) {
            addToast({
                title: "Erfolgreich gespeichert",
                subTitle: "Ihre persönlichen Daten wurden erfolgreich aktualisiert und sind nun in Ihrem Benutzerkonto gespeichert.",
                type: "success"
            });
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

        modal.hideModal();
    }

    /**
     * Resets all input fields to readonly state
     * Called when modal is closed or opened
     */
    function resetStates() {
        readonlyMail = true;
        readonlyPhone = true;
        readonlyAddress = true;
    }

    /**
     * Shows the settings modal and initializes form values
     * Resets form data to current user values
     */
    export function showModal() {
        modal.showModal();

        email = $user.email;
        phone = $user.phone;
        address = $user.address;
    }
</script>

<Modal title="Benutzer Einstellungen" subTitle="Ihre persönlichen Daten" bind:this={modal} extraFunction={resetStates}>
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