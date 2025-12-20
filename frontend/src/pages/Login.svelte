<script>
    import { onMount } from "svelte";
    import { push } from "svelte-spa-router";
    import Form from "../components/Form.svelte";
    import Logo from "../assets/logo.svg";
    import Input from "../components/Input.svelte";
    import Button from "../components/Button.svelte";
    import ToastStack from "../components/ToastStack.svelte";
    import { login, authenticate } from "../services/auth.js";
    import { getValue, setValue } from "../services/store";

    /** @type {import("../components/ToastStack.svelte").default} */
    let toastStack;

    let email = "";
    let password = "";

    onMount(async () => {
        let authToken = getValue("authToken");
        if (authToken) {
            let response = await authenticate(authToken);
            let body = await response.json();

            if (response && body) {
                setValue("email", body.email);
                setValue("role", body.role);
                if (body.changePassword) {
                    await push(`/changePassword?firstLogin=${body.firstLogin}`);
                }

                await push("/dashboard");
            }
        }

        const hash = window.location.hash;
        const queryString = hash.split("?")[1];
        if (!queryString) return;

        const params = new URLSearchParams(queryString);
        let cpwError = params.get("cpwErr") === "true";

        if (cpwError) {
            toastStack.addToast(
                "error",
                "Sitzung ungültig",
                "Ihre E-Mail-Adresse konnte nicht eindeutig zugeordnet werden. Bitte melden Sie sich erneut an, um den Vorgang fortzusetzen."
            );
        }
    });

    async function btnLogin() {
        // Ensure neither email nor password is empty
        if (!email) {
            toastStack.addToast("error", "Ungültige Eingabe!", "Die E-Mail darf nicht leer sein! Bitte geben Sie eine gültige E-Mail-Adresse ein, um fortzufahren.");
            return;
        }

        if (!password) {
            toastStack.addToast("error", "Ungültige Eingabe!", "Das Passwort darf nicht leer sein! Bitte geben Sie ihr Passwort ein, um fortzufahren.");
            return;
        }

        // Try to log in
        let response = await login(email, password);
        let body = await response.json();

        if (!response) {
            toastStack.addToast("error", "Interner Serverfehler", "Beim Verarbeiten Ihrer Anfrage ist ein Fehler aufgetreten. Bitte versuchen Sie es erneut.");
            return;
        }

        if (response.status === 200) {
            if (body.changePassword) {
                // Note that the auth token cannot be stored under the key "authToken",
                // cause this would allow the user to move back one page and automatically login
                // and bypass the changePassword page
                setValue("authToken_BCPW", body.authToken);
                setValue("email", email);
                await push(`/changePassword?firstLogin=${body.firstLogin}`);
            } else {
                setValue("authToken", body.authToken);
                await push("/dashboard");
            }
        } else if (response.status === 404) {
            toastStack.addToast("error", "Benutzer nicht gefunden", "Es wurde kein Konto mit der angegebenen E-Mail-Adresse gefunden. Bitte prüfen Sie die Eingabe oder registrieren Sie sich.");
        } else if (response.status === 401) {
            toastStack.addToast("error", "Ungültiges Passwort", "Das eingegebene Passwort ist falsch. Bitte überprüfen Sie Ihre Eingabe und versuchen Sie es erneut.");
        } else {
            toastStack.addToast("error", "Interner Serverfehler", "Beim Verarbeiten Ihrer Anfrage ist ein Fehler aufgetreten. Bitte versuchen Sie es erneut.");
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
        <p class="font-semibold text-dt-1 mt-5 text-center">GVW Office</p>
        <p class="text-gv-light-text text-dt-3 text-center">
            Gesangverein Weppersdorf
        </p>
        <Input
            bind:value={email}
            type="email"
            placeholder="ihre.email@email.com"
            title="E-Mail"
            marginTop="5"
        />
        <Input
            bind:value={password}
            type="password"
            placeholder=""
            title="Passwort"
            marginTop="10"
        />
        <Button type="primary" marginTop="10" on:click={btnLogin}
        ><span class="material-symbols-rounded">login</span>
            <p class="ml-3">Anmelden</p></Button
        >
    </Form>
</main>
