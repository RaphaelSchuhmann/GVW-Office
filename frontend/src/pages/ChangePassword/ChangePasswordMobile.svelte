<script>
    import { push } from "svelte-spa-router";
    import Logo from "../../assets/logo.svg";
    import Input from "../../components/Input.svelte";
    import Button from "../../components/Button.svelte";
    import ToastStack from "../../components/ToastStack.svelte";
    import { changePw } from "../../services/auth";
    import { getValue, setValue, clearValue } from "../../services/store";
    import { user } from "../../stores/user";
    import { addToast } from "../../stores/toasts";

    export let message = "";

    let currentPw = "";
    let newPw = "";
    let confirmNewPw = "";

    /**
     * Updates user password after validation
     * Validates current password, new password requirements, and confirmation match
     * Handles API response and manages token storage for successful changes
     */
    async function updatePassword() {
        // Validate inputs
        if (!currentPw) {
            addToast({
                title: "Aktuelles Passwort fehlt",
                type: "error"
            });
            return;
        } else if (!newPw) {
            addToast({
                title: "Neues Passwort fehlt",
                type: "error"
            });
            return;
        } else if (!confirmNewPw) {
            addToast({
                title: "Bestätigung fehlt",
                type: "error"
            });
            return;
        }

        // Ensure new password is at least 8 characters
        if (newPw.length < 8) {
            addToast({
                title: "Neues Passwort ist zu kurz",
                type: "error"
            });
            return;
        }

        // Ensure new password and confirm password match
        if (newPw !== confirmNewPw) {
            addToast({
                title: "Passwörter stimmen nicht überein",
                type: "error"
            });
            return;
        }

        let email = $user.email;
        if (!email || email.length === 0) {
            // Invalid Email
            // Route back to log in with error parameter set to true to be displayed as a toast
            await push(`/?cpwErr=true`);
            user.update(u => ({...u, name: "", email: "", role: "", loaded: false }));
            return;
        }

        let response;

        try {
            response = await changePw(currentPw, newPw, email)
        } catch (error) {
            addToast({
                title: "Interner Serverfehler",
                type: "error"
            });
            return;
        }

        if (!response) {
            addToast({
                title: "Interner Serverfehler",
                type: "error"
            });
            return;
        }

        if (response.status === 200) {
            // Update auth token entry to use the actual expected key
            let authToken = getValue("authToken_BCPW");
            clearValue("authToken_BCPW");
            setValue("authToken", authToken);

            await push("/dashboard");
        } else if (response.status === 404) {
            // Invalid Email
            addToast({
                title: "Ungültige E-Mail verwendet",
                type: "error"
            });
            await push("/");
        } else if (response.status === 409) {
            // New password is the same as the old
            addToast({
                title: "Neues Passwort ist identisch",
                type: "error"
            });
        } else if (response.status === 401) {
            // Current password is invalid
            addToast({
                title: "Aktuelles Passwort ist falsch",
                type: "error"
            });
        } else {
            // Internal server error / unknown error
            addToast({
                title: "Interner Serverfehler",
                type: "error"
            });
        }
    }
</script>

<ToastStack isMobile={true}/>
<main class="bg-gv-bg-bar w-dvw h-dvh flex items-center justify-center">
    <div class="p-10 h-full w-full bg-white flex flex-col items-center">
        <img
            src={Logo}
            alt="Logo"
            class="min-[530px]:w-1/5 max-[530px]:w-2/5 rounded-full border-2 border-gv-border"
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
        <Button type="primary" marginTop="10" on:click={updatePassword} isSubmit={true}
        ><span class="material-symbols-rounded">login</span>
            <p class="ml-3">Passwort ändern</p></Button
        >
    </div>
</main>
