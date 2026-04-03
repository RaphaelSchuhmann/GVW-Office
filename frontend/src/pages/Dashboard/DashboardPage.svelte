<script>
    import { viewport } from "../../stores/viewport.svelte";
    import DashboardDesktop from "./DashboardDesktop.svelte";
    import DashboardMobile from "./DashboardMobile.svelte";
    import { ensureUserData } from "../../services/userService.svelte";
    import { auth } from "../../stores/auth.svelte";

    $effect(() => {
        if (!auth.token) return;

        (async () => {
            await ensureUserData();
            // Insert dashboard data api call here
        })();
    })
</script>

{#if viewport.isMobile}
    <DashboardMobile />
{:else}
    <DashboardDesktop />
{/if}