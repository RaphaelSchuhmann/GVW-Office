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

    let toastStack;

    let email = "";
    let password = "";

    onMount(async () => {
        let authToken = getValue("authToken");
        if (authToken) {
            let response = await authenticate(authToken);

            if (response) {
                setValue("email", response.email);
                setValue("role", response.role);
                if (response.changePassword) {
                    push(`/changePassword?firstLogin=${response.firstLogin}`);
                }

                push("/dashboard");
            }
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

        // try to login
        let response = await login(email, password);
        
        if (!response) {
            toastStack.addToast("error", "Interner Serverfehler", "Beim Verarbeiten Ihrer Anfrage ist ein Fehler aufgetreten. Bitte versuchen Sie es erneut.");
            return;
        }

        if (response.status === 200) {
            toastStack.addToast(
                "success", "Erfolgreich angemeldet", "Sie wurden erfolgreich angemeldet und werden nun zum Dashboard weitergeleitet.");
        } else if (response.status === 404) {
            toastStack.addToast("error", "Benutzer nicht gefunden", "Es wurde kein Konto mit der angegebenen E-Mail-Adresse gefunden. Bitte prüfen Sie die Eingabe oder registrieren Sie sich.");
        } else if (response.status === 401) {
            toastStack.addToast("error", "Ungültiges Passwort", "Das eingegebene Passwort ist falsch. Bitte überprüfen Sie Ihre Eingabe und versuchen Sie es erneut.");
        } else {
            toastStack.addToast("error", "Interner Serverfehler", "Beim Verarbeiten Ihrer Anfrage ist ein Fehler aufgetreten. Bitte versuchen Sie es erneut.");
        }

        setValue("authToken", response.authToken);
        if (response.changePassword) {
            push(`/changePassword?firstLogin=${response.firstLogin}`);
        }

        push("/dashboard");
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
