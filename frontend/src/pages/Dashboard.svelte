<script>
    import { onMount } from "svelte";
    import { push } from "svelte-spa-router";
    import { getData } from "../services/user";
    import { getValue, setValue } from "../services/store";
    import { delay } from "../services/utils";
    import ToastStack from "../components/ToastStack.svelte";
    import Sidebar from "../components/Sidebar.svelte";

    /** @type {import("../components/ToastStack.svelte").default} */
    let toastStack;

    onMount(async () => {
        // Get user data
        const response = await getData(getValue("email"), getValue("authToken"));
        const body = await response.json();

        if (response.status === 200) {
            setValue("name", body.name);
            setValue("email", body.email);
            setValue("role", body.role);
        } else if (response.status === 401) {
            // Auth token invalid / unauthorized
            toastStack.addToast(
                "error",
                "Ungültiges Token",
                "Ihr Authentifizierungstoken ist ungültig oder abgelaufen. Bitte melden Sie sich erneut an, um Zugriff zu erhalten."
            );
            await delay(5000);
            await push("/cpwErr=false");
        } else if (response.status === 404) {
            // user not found route back to log in
            toastStack.addToast(
                "error",
                "Konto nicht gefunden",
                "Ihr Konto konnte nicht gefunden werden. Bitte melden Sie sich erneut an, um fortzufahren."
            );
            await delay(5000);
            await push("/cpwErr=false");
        } else {
            // internal server error / unknown error
            toastStack.addToast("error", "Interner Serverfehler", "Beim Verarbeiten Ihrer Anfrage ist ein Fehler aufgetreten. Bitte versuchen Sie es erneut.");
        }
    });

    function settingsClick() {
        console.log("Hello World");
    }
</script>

<ToastStack bind:this={toastStack}></ToastStack>
<main class="flex overflow-hidden">
    <Sidebar userName={getValue("name")} email={getValue("email")} onSetingsClick={settingsClick} role={getValue("role")}></Sidebar>
</main>