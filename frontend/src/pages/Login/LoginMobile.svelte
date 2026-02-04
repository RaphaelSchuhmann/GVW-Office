<script>
    import { onMount } from "svelte";
    import { push } from "svelte-spa-router";
    import Logo from "../../assets/logo.svg";
    import Input from "../../components/Input.svelte";
    import Button from "../../components/Button.svelte";
    import ToastStack from "../../components/ToastStack.svelte";
    import { authenticateUser } from "../../services/loginService";
    import { clearValue, getValue, setValue } from "../../services/store";
    import { auth } from "../../stores/auth";
    import { user } from "../../stores/user";
    import { addToast } from "../../stores/toasts";
    import { loginUser } from "../../services/loginService";
    import { normalizeResponse } from "../../api/http";
    import { handleGlobalApiError } from "../../api/globalErrorHandler";

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
                title: "Email darf nicht leer sein",
                type: "error"
            });
            return;
        }

        if (!password) {
            addToast({
                title: "Password darf nicht leer sein!",
                type: "error"
            });
            return;
        }

        const { resp, body } = await loginUser(email, password);

        const normalizedResponse = normalizeResponse(resp);
        if (handleGlobalApiError(normalizedResponse)) return;

        if (!normalizedResponse.ok) {
            if (normalizedResponse.errorType === "REQUESTTIMEOUT") {
                addToast({
                    title: "Zu viele Anmeldeversuche",
                    type: "warning",
                });
            } else if (normalizedResponse.errorType === "NOTFOUND") {
                addToast({
                    title: "Benutzer nicht gefunden",
                    type: "error"
                });
            }

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

<ToastStack isMobile={true} />
<main class="bg-gv-bg-bar w-dvw h-dvh flex items-center justify-center">
    <div class="p-10 h-full w-full bg-white flex flex-col items-center">
        <img
            src={Logo}
            alt="Logo"
            class="min-[530px]:w-1/5 max-[530px]:w-2/5 rounded-full border-2 border-gv-border"
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
    </div>
</main>
