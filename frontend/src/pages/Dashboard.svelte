<script>
    import { onMount } from "svelte";
    import { push } from "svelte-spa-router";
    import { getData, logout } from "../services/user";
    import { delay } from "../services/utils";
    import { user } from "../stores/user";
    import ToastStack from "../components/ToastStack.svelte";
    import Sidebar from "../components/Sidebar.svelte";
    import { auth } from "../stores/auth";

    /** @type {import("../components/ToastStack.svelte").default} */
    let toastStack;

    onMount(async () => {
        await loadUserData();
    });

    async function loadUserData() {
        // Get user data
        const response = await getData($user.email, $auth.token);
        const body = await response.json();

        if (response.status === 200) {
            user.set({name: body.name, email: body.email, role: body.role, loaded: true});
        } else if (response.status === 401) {
            // Auth token invalid / unauthorized
            toastStack.addToast(
                "error",
                "Ungültiges Token",
                "Ihr Authentifizierungstoken ist ungültig oder abgelaufen. Bitte melden Sie sich erneut an, um Zugriff zu erhalten."
            );
            await delay(5000);
            logout();
            await push("/?cpwErr=false");
        } else if (response.status === 404) {
            // user not found route back to log in
            toastStack.addToast(
                "error",
                "Konto nicht gefunden",
                "Ihr Konto konnte nicht gefunden werden. Bitte melden Sie sich erneut an, um fortzufahren."
            );
            await delay(5000);
            logout();
            await push("/?cpwErr=false");
        } else {
            // internal server error / unknown error
            toastStack.addToast("error", "Interner Serverfehler", "Beim Verarbeiten Ihrer Anfrage ist ein Fehler aufgetreten. Bitte versuchen Sie es erneut.");
        }
    }

    function settingsClick() {
        console.log("Hello World");
    }
</script>

<ToastStack bind:this={toastStack}></ToastStack>
<main class="flex overflow-hidden">
    <Sidebar onSettingsClick={settingsClick} currentPage="dashboard"></Sidebar>
</main>