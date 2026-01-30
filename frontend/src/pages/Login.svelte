<script>
    import { onMount } from "svelte";
    import { push } from "svelte-spa-router";
    import Form from "../components/Form.svelte";
    import Logo from "../assets/logo.svg";
    import Input from "../components/Input.svelte";
    import Button from "../components/Button.svelte";
    import ToastStack from "../components/ToastStack.svelte";
    import { login, authenticate } from "../services/auth.js";
    import { clearValue, getValue, setValue } from "../services/store";
    import { auth } from "../stores/auth";
    import { user } from "../stores/user";
    import { addToast } from "../stores/toasts";

    let email = "";
    let password = "";

    onMount(async () => {
        const authToken = getValue("authToken");

        if (authToken) {
            const response = await authenticate(authToken);
            const body = await response.json();

            if (response && body && response.status === 200) {
                auth.set({ token: authToken });
                user.update(u => ({ ...u, email: body.email }));

                if (body.changePassword) {
                    clearValue("authToken");
                    setValue("authToken_BCPW", authToken);
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
            addToast({
                title: "Sitzung ungültig",
                subTitle: "Ihre E-Mail-Adresse konnte nicht eindeutig zugeordnet werden. Bitte melden Sie sich erneut an, um den Vorgang fortzusetzen.",
                type: "error"
            });
        }
    });

    /**
     * Handles user login process
     * Validates inputs, authenticates with server, and handles various response scenarios
     * Manages token storage and navigation based on authentication result
     */
    async function btnLogin() {
        // Ensure neither email nor password is empty
        if (!email) {
            addToast({
                title: "Ungültige Eingabe!",
                subTitle: "Die E-Mail darf nicht leer sein! Bitte geben Sie eine gültige E-Mail-Adresse ein, um fortzufahren.",
                type: "error"
            });
            return;
        }

        if (!password) {
            addToast({
                title: "Ungültige Eingabe!",
                subTitle: "Das Passwort darf nicht leer sein! Bitte geben Sie ihr Passwort ein, um fortzufahren.",
                type: "error"
            });
            return;
        }

        // Try to log in
        let response = await login(email, password);
        let body = await response.json();

        if (!response) {
            addToast({
                title: "Interner Serverfehler",
                subTitle: "Beim Verarbeiten Ihrer Anfrage ist ein Fehler aufgetreten. Bitte versuchen Sie es erneut.",
                type: "error"
            });
            return;
        }

        if (response.status === 200) {
            if (body.changePassword) {
                // Note that the auth token cannot be stored under the key "authToken",
                // cause this would allow the user to move back one page and automatically login
                // and bypass the changePassword page
                setValue("authToken_BCPW", body.authToken);
                user.update(u => ({ ...u, email: email }));
                auth.set({ token: body.authToken });
                await push(`/changePassword?firstLogin=${body.firstLogin}`);
            } else {
                setValue("authToken", body.authToken);
                auth.set({ token: body.authToken });
                user.update(u => ({ ...u, email: email }));
                await push("/dashboard");
            }
        } else if (response.status === 429) {
            const lockUntil = new Date(body.retryAfter).getTime();
            const now = Date.now();

            const remainingMs = lockUntil - now;
            const remainingMinutes = Math.ceil(remainingMs / 60000);

            addToast({
                title: "Zu viele Anmeldeversuche",
                subTitle: `Ihr Konto wurde vorübergehend gesperrt. Bitte versuchen Sie es in ${remainingMinutes} Minute${remainingMinutes !== 1 ? "n" : ""} erneut.`,
                type: "warning",
            });
        } else if (response.status === 404) {
            addToast({
                title: "Benutzer nicht gefunden",
                subTitle: "Es wurde kein Konto mit der angegebenen E-Mail-Adresse gefunden. Bitte prüfen Sie die Eingabe oder registrieren Sie sich.",
                type: "error"
            });
        } else if (response.status === 401) {
            addToast({
                title: "Ungültiges Passwort",
                subTitle: "Das eingegebene Passwort ist falsch. Bitte überprüfen Sie Ihre Eingabe und versuchen Sie es erneut.",
                type: "error"
            });
        } else {
            addToast({
                title: "Interner Serverfehler",
                subTitle: "Beim Verarbeiten Ihrer Anfrage ist ein Fehler aufgetreten. Bitte versuchen Sie es erneut.",
                type: "error"
            });
        }
    }
</script>

<ToastStack></ToastStack>
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
        <Button type="primary" marginTop="10" on:click={btnLogin} isSubmit={true}>
            <span class="material-symbols-rounded">login</span>
            <p class="ml-3">Anmelden</p>
        </Button>
    </Form>
</main>
