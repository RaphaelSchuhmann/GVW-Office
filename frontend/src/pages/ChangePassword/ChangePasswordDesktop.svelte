<script>
    import { push } from "svelte-spa-router";
    import Form from "../../components/Form.svelte";
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
                title: "Ungültige Eingabe",
                subTitle: "Bitte geben Sie Ihr aktuelles Passwort ein, damit wir Ihre Identität überprüfen und die Passwortänderung durchführen können.",
                type: "error"
            });
            return true;
        }

        if (!newPw) {
            addToast({
                title: "Ungültige Eingabe",
                subTitle: "Bitte geben Sie ein neues Passwort ein, das künftig für die Anmeldung verwendet werden soll.",
                type: "error"
            });
            return true;
        }

        if (!confirmNewPw) {
            addToast({
                title: "Ungültige Eingabe",
                subTitle: "Bitte bestätigen Sie Ihr neues Passwort, um sicherzustellen, dass keine Tippfehler vorliegen.",
                type: "error"
            });
            return true;
        }

        if (newPw.length < 8) {
            addToast({
                title: "Passwort zu kurz",
                subTitle: "Das neue Passwort muss mindestens 8 Zeichen lang sein, um den Sicherheitsanforderungen zu entsprechen.",
                type: "error"
            });
            return true;
        }
        
        if (newPw !== confirmNewPw) {
            addToast({
                title: "Passwörter stimmen nicht überein",
                subTitle: "Das neue Passwort und die Passwortbestätigung sind nicht identisch. Bitte überprüfen Sie Ihre Eingabe.",
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
                    title: "Sitzung ungültig",
                    subTitle: "Ihre E-Mail-Adresse konnte nicht eindeutig zugeordnet werden. Bitte melden Sie sich erneut an, um den Vorgang fortzusetzen.",
                    type: "error"
                });
                await push("/");
            } 
            
            // Status Code 409 (passwords are not the same)
            if (normalizedResponse.errorType === "ALREADYEXISTS") {
                addToast({
                    title: "Ungültiges Passwort",
                    subTitle: "Das neue Passwort darf nicht mit dem aktuellen Passwort übereinstimmen. Bitte wählen Sie ein anderes Passwort.",
                    type: "error"
                });
            }
            return;
        }

        // Update auth token entry to use the actual expected key
        let authToken = getValue("authToken_BCPW");
        if (!authToken) {
            addToast({
                title: "Sitzungsfehler",
                subTitle: "Ihre Sitzung ist ungültig. Bitte melden Sie sich erneut an.",
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

<ToastStack></ToastStack>
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
        <Button type="primary" marginTop="10" on:click={updatePassword} isSubmit={true}
        ><span class="material-symbols-rounded">login</span>
            <p class="ml-3">Passwort ändern</p></Button
        >
    </Form>
</main>
