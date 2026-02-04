<script>
    import { onMount } from "svelte";
    import { push } from "svelte-spa-router";
    import Form from "../../components/Form.svelte";
    import Logo from "../../assets/logo.svg";
    import Input from "../../components/Input.svelte";
    import Button from "../../components/Button.svelte";
    import ToastStack from "../../components/ToastStack.svelte";
    import { clearValue, getValue, setValue } from "../../services/store";
    import { auth } from "../../stores/auth";
    import { user } from "../../stores/user";
    import { addToast } from "../../stores/toasts";
    import { loginUser, authenticateUser } from "../../services/loginService";
    import { handleGlobalApiError } from "../../api/globalErrorHandler";
    import { normalizeResponse } from "../../api/http";

    let email = "";
    let password = "";

    onMount(async () => {
        const authToken = getValue("authToken");

        if (authToken) {
            const { resp, body } = await authenticateUser(authToken);

            const normalizedResponse = normalizeResponse(resp);
            if (handleGlobalApiError(normalizedResponse)) return;

            if (!body || !normalizedResponse.ok) return;

            auth.set({ token: authToken });
            user.update(u => ({ ...u, email: body.email }));

            if (body.changePassword) {
                clearValue("authToken");
                setValue("authToken_BCPW", authToken);
                await push(`/changePassword?firstLogin=${body.firstLogin}`);
                return;
            }

            await push("/dashboard");
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

        const { resp, body } = await loginUser(email, password);

        const normalizedResponse = normalizeResponse(resp);
        if (handleGlobalApiError(normalizedResponse)) return;

        if (!normalizedResponse.ok) {

            if (normalizedResponse.errorType === "REQUESTTIMEOUT" && body?.retryAfter) {
                const lockUntil = new Date(body.retryAfter).getTime();
                const now = Date.now();
                const remainingMs = lockUntil - now;
                const remainingMinutes = Math.ceil(remainingMs / 60000);

                addToast({
                    title: "Zu viele Anmeldeversuche",
                    subTitle: `Ihr Konto wurde vorübergehend gesperrt. Bitte versuchen Sie es in ${remainingMinutes} Minute${remainingMinutes !== 1 ? "n" : ""} erneut.`,
                    type: "warning",
                });
            } else if (normalizedResponse.errorType === "REQUESTTIMEOUT") {
                addToast({
                    title: "Zu viele Anmeldeversuche",
                    subTitle: "Ihr Konto wurde vorübergehend gesperrt. Bitte versuchen Sie es später erneut.",
                    type: "warning"
                });
            } else if (normalizedResponse.errorType === "NOTFOUND") {
                addToast({
                    title: "Benutzer nicht gefunden",
                    subTitle: "Es wurde kein Konto mit der angegebenen E-Mail-Adresse gefunden. Bitte prüfen Sie die Eingabe oder registrieren Sie sich.",
                    type: "error"
                });
            }

            return;
        }

        if (!body?.authToken) {
            addToast({
                title: "Anmeldung fehlgeschlagen",
                subTitle: "Vom Server wurde keine gültige Sitzung zurückgegeben. Bitte versuchen Sie es erneut.",
                type: "error",
            });
            return;
        }

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
    }
</script>

<ToastStack></ToastStack>
<main class="bg-gv-bg-bar w-dvw h-dvh flex items-center justify-center">
    <div class="h-auto min-[1400px]:w-1/3 w-2/3">
        <Form padding="10" height="auto" width="full">
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
    </div>
</main>
