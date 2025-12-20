<script>
    import { onMount } from "svelte";
    import { push } from "svelte-spa-router";
    import Form from "../components/Form.svelte";
    import Logo from "../assets/logo.svg";
    import Input from "../components/Input.svelte";
    import Button from "../components/Button.svelte";
    import ToastStack from "../components/ToastStack.svelte";
    import { changePw } from "../services/auth";
    import { getValue, setValue, clearValue } from "../services/store";

    /** @type {import("../components/ToastStack.svelte").default} */
    let toastStack;

    let message = "";

    let currentPw = "";
    let newPw = "";
    let confirmNewPw = "";

    onMount(() => {
        const hash = window.location.hash;
        const queryString = hash.split("?")[1];
        if (!queryString) return;

        const params = new URLSearchParams(queryString);
        let firstLogin = params.get("firstLogin") === "true";

        if (firstLogin) {
            message = "Erstmaliger Login - Bitte ändern Sie Ihr Passwort";
        } else {
            message = "Passwort vergessen - Bitte ändern Sie Ihr Passwort";
        }
    });

    async function updatePassword() {
        // Validate inputs
        if (!currentPw) {
            toastStack.addToast(
                "error",
                "Ungültige Eingabe",
                "Bitte geben Sie Ihr aktuelles Passwort ein, damit wir Ihre Identität überprüfen und die Passwortänderung durchführen können."
            );
            return;
        } else if (!newPw) {
            toastStack.addToast(
                "error",
                "Ungültige Eingabe",
                "Bitte geben Sie ein neues Passwort ein, das künftig für die Anmeldung verwendet werden soll."
            );
            return;
        } else if (!confirmNewPw) {
            toastStack.addToast(
                "error",
                "Ungültige Eingabe",
                "Bitte bestätigen Sie Ihr neues Passwort, um sicherzustellen, dass keine Tippfehler vorliegen."
            );
            return;
        }

        // Ensure new password is at least 8 characters
        if (newPw.length < 8) {
            toastStack.addToast(
                "error",
                "Passwort zu kurz",
                "Das neue Passwort muss mindestens 8 Zeichen lang sein, um den Sicherheitsanforderungen zu entsprechen."
            );
            return;
        }

        // Ensure new password and confirm password match
        if (newPw !== confirmNewPw) {
            toastStack.addToast(
                "error",
                "Passwörter stimmen nicht überein",
                "Das neue Passwort und die Passwortbestätigung sind nicht identisch. Bitte überprüfen Sie Ihre Eingabe."
            );
            return;
        }

        let email = getValue("email");
        if (!email || email.length === 0) {
            // Invalid Email
            // Route back to log in with error parameter set to true to be displayed as a toast
            await push(`/?cpwErr=true`);
            return;
        }

        let response = await changePw(currentPw, newPw, email);

        if (response.status === 200) {
            // Update auth token entry to use the actual expected key
            let authToken = getValue("authToken_BCPW");
            clearValue("authToken_BCPW");
            setValue("authToken", authToken);

            await push("/dashboard");
        } else if (response.status === 404) {
            // Invalid Email
            // Route back to log in with error parameter set to true to be displayed as a toast
            await push("/login?cpwErr=true");
        } else if (response.status === 409) {
            // New password is the same as the old
            toastStack.addToast(
                "error",
                "Ungültiges Passwort",
                "Das neue Passwort darf nicht mit dem aktuellen Passwort übereinstimmen. Bitte wählen Sie ein anderes Passwort."
            );
        } else if (response.status === 401) {
            // Current password is invalid
            toastStack.addToast(
                "error",
                "Falsches Passwort",
                "Das eingegebene aktuelle Passwort ist nicht korrekt. Bitte überprüfen Sie Ihre Eingabe und versuchen Sie es erneut."
            );
        } else {
            // Internal server error / unknown error
            toastStack.addToast(
                "error",
                "Interner Serverfehler",
                "Beim Ändern Ihres Passworts ist ein unerwarteter Fehler aufgetreten. Bitte versuchen Sie es später erneut."
            );
        }
    }
</script>

<ToastStack bind:this={toastStack}></ToastStack>
<main class="bg-gv-bg-bar w-dvw h-dvh flex items-center justify-center">
    <Form padding="10" height="auto">
        <img
            src={Logo}
            alt="Logo"
            class="w-1/6 rounded-full border-2 border-gv-border"
        />
        <p class="font-semibold text-dt-1 mt-5 text-center">Passwort ändern</p>
        <p class="text-gv-light-text text-dt-5 text-center">
            {message}
        </p>
        <Input
            bind:value={currentPw}
            type="password"
            placeholder=""
            title="Aktuelles Passwort"
            marginTop="5"
        />
        <div class="flex flex-col w-full items-start">
            <Input
                bind:value={newPw}
                type="password"
                placeholder=""
                title="Neues Passwort"
                marginTop="5"
            />
            <p class="text-gv-light-text text-dt-6 mt-1">Mindestens 8 Zeichen</p>
        </div>
        <Input
            bind:value={confirmNewPw}
            type="password"
            placeholder=""
            title="Neues Passwort bestätigen"
            marginTop="5"
        />
        <Button type="primary" marginTop="10" on:click={updatePassword}
        ><span class="material-symbols-rounded">login</span>
            <p class="ml-3">Anmelden</p></Button
        >
    </Form>
</main>
