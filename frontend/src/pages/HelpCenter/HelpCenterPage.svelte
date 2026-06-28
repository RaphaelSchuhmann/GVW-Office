<script>
    import { viewport } from "../../stores/viewport.svelte.js";
    import HelpCenterDesktop from "./HelpCenterDesktop.svelte";
    import HelpCenterMobile from "./HelpCenterMobile.svelte";
    import { ensureUserData } from "../../services/userService.svelte.js";
    import { auth } from "../../stores/auth.svelte.js";
    import { user } from "../../stores/user.svelte.js";
    import Spinner from "../../components/Spinner.svelte";
    // import { lastRefresh } from "../../../stores/sseStore.svelte.js";
    // import { untrack } from "svelte";

    let isGlobalLoading = $derived(user.name.length === 0);
    let ready = false;

    const hash = window.location.hash;
    const queryString = hash.split("?")[1];
    const params = new URLSearchParams(queryString);

    const category = params.get("cat") || "none";

    $effect(() => {
        if (!auth.token) return;

        (async () => {
            await ensureUserData();
            if (!auth.token) return;
            // load data
            ready = true;
        })();
    });

    // $effect(() => {
    //     const _memberTrigger = lastRefresh.MEMBERS;
    //     const _eventTrigger = lastRefresh.EVENTS;
    //     const _scoreTrigger = lastRefresh.SCORES;
    //     const _settingsTrigger = lastRefresh.SETTINGS;
    //
    //     if (!ready) return;
    //
    //     untrack(() => {
    //         loadDashboardData();
    //     });
    // });
</script>

{#if isGlobalLoading}
    <div class="w-full h-screen flex justify-center items-center">
        <Spinner title="GVW Office" subTitle="Daten werden geladen..." />
    </div>
{:else}
    {#if viewport.isMobile}
        <HelpCenterMobile category={category} />
    {:else}
        <HelpCenterDesktop category={category} />
    {/if}
{/if}