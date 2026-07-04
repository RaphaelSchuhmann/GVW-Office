<script>
    import { viewport } from "../../stores/viewport.svelte.js";
    import HelpCenterDesktop from "./HelpCenterDesktop.svelte";
    import HelpCenterMobile from "./HelpCenterMobile.svelte";
    import { ensureUserData } from "../../services/userService.svelte.js";
    import { auth } from "../../stores/auth.svelte.js";
    import { user } from "../../stores/user.svelte.js";
    import Spinner from "../../components/Spinner.svelte";

    let isGlobalLoading = $derived(user.name.length === 0);

    $effect(() => {
        if (!auth.token) return;

        (async () => {
            await ensureUserData();
        })();
    });
</script>

{#if isGlobalLoading}
    <div class="w-full h-screen flex justify-center items-center">
        <Spinner title="GVW Office" subTitle="Daten werden geladen..." />
    </div>
{:else}
    {#if viewport.isMobile}
        <HelpCenterMobile />
    {:else}
        <HelpCenterDesktop />
    {/if}
{/if}