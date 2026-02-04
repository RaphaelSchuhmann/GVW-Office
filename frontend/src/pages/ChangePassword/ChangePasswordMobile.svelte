<script>
    import { push } from "svelte-spa-router";
    import Logo from "../../assets/logo.svg";
    import Input from "../../components/Input.svelte";
    import Button from "../../components/Button.svelte";
    import ToastStack from "../../components/ToastStack.svelte";
    import { getValue, setValue, clearValue } from "../../services/store";
    import { user } from "../../stores/user";
    import { addToast } from "../../stores/toasts";
    import { changePassword } from "../../services/changePasswordService";
    import { normalizeResponse } from "../../api/http";
    import { handleGlobalApiError } from "../../api/globalErrorHandler";

    export let message = "";

    let currentPw = "";
    let newPw = "";
    let confirmNewPw = "";

    /**
     * Validates password change form inputs and displays user-facing error toasts.
     * 
     * Checks for missing fields, minimum password length, and matching
     * password confirmation. If a validation error occurs, an error toast
     * is shown and the function returns `true`.
     * 
     * @param {Object} params
     * @param {string} params.currentPw - the user's current password
     * @param {string} params.newPw - the new password entered by the user
     * @param {string} params.confirmNewPw - Confirmation of the new password
     * 
     * @returns {boolean} `true` if validation failed and execution should stop.
     *                    `false` if all inputs are valid
     */
    function validateInputs({ currentPw, newPw, confirmNewPw }) {
        if (!currentPw) {
            addToast({
                title: "Aktuelles Passwort fehlt",
                type: "error"
            });
            return true;
        }

        if (!newPw) {
            addToast({
                title: "Neues Passwort fehlt",
                type: "error"
            });
            return true;
        }

        if (!confirmNewPw) {
            addToast({
                title: "Bestätigung fehlt",
                type: "error"
            });
            return true;
        }

        if (newPw.length < 8) {
            addToast({
                title: "Neues Passwort ist zu kurz",
                type: "error"
            });
            return true;
        }
        
        if (newPw !== confirmNewPw) {
            addToast({
                title: "Passwörter stimmen nicht überein",
                type: "error"
            });
            return true;
        }

        return false;
    }

    /**
     * Handles the complete password update flow from the view layer.
     * 
     * Performs client-side input validation, verifies the presence of a valid
     * user session, executes the password change request, and handles all
     * relevant API error states with user-facing toasts and navigation.
     * 
     * On success, updates the stored authentication token and redirects
     * the user to the dashboard.
     * 
     * @returns {Promise<void>}
     */   
    async function updatePassword() {
        const hasValidationError = validateInputs({
            currentPw,
            newPw,
            confirmNewPw
        });

        if (hasValidationError) return;

        let email = $user.email;
        if (!email || email.length === 0) {
            // Invalid Email
            // Route back to log in with error parameter set to true to be displayed as a toast
            await push(`/?cpwErr=true`);
            user.update(u => ({...u, name: "", email: "", role: "", loaded: false }));
            return;
        }

        const { resp } = await changePassword(email, currentPw, newPw);

        const normalizedResponse = normalizeResponse(resp);
        if (handleGlobalApiError(normalizedResponse)) return;

        if (!normalizedResponse.ok) {
            // Status Code 404
            if (normalizedResponse.errorType === "NOTFOUND") {
                addToast({
                    title: "Ungültige E-Mail verwendet",
                    type: "error"
                });
                await push("/");
            } 
            
            // Status Code 409 (passwords are not the same)
            if (normalizedResponse.errorType === "ALREADYEXISTS") {
                addToast({
                    title: "Neues Passwort ist identisch",
                    type: "error"
                });
            }
            return
        }

        // Update auth token entry to use the actual expected key
        let authToken = getValue("authToken_BCPW");
        if (!authToken) {
            addToast({
                title: "Sitzungsfehler",
                type: "error",
            });
            await push("/");
            return;
        }
        clearValue("authToken_BCPW");
        setValue("authToken", authToken);

        await push("/dashboard");
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
