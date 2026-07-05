<script>
    import { viewport } from "../../stores/viewport.svelte.js";
    import HelpCenterDesktop from "./HelpCenterDesktop.svelte";
    import HelpCenterMobile from "./HelpCenterMobile.svelte";
    import { ensureUserData } from "../../services/userService.svelte.js";
    import { auth } from "../../stores/auth.svelte.js";
    import { user } from "../../stores/user.svelte.js";
    import Spinner from "../../components/Spinner.svelte";
    import { lastRefresh } from "../../stores/sseStore.svelte.js";
    import { getArticles } from "../../services/helpCenterService.svelte.js";
    import { helpCenterStore } from "../../stores/helpCenterStore.svelte.js";

    let isGlobalLoading = $derived(user.name.length === 0);
    let ready = false;

    $effect(() => {
        if (!auth.token) return;

        (async () => {
            await ensureUserData();
            if (!auth.token) return;
            ready = true;
        })();
    });

    $effect(() => {
        const _triggerSSE = lastRefresh.HELP_CENTER;
        const _triggerActiveCat = helpCenterStore.activeCategory;

        if (!ready) return;

        (async () => {
           await getArticles();
           // Check articles
        })();
    })
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