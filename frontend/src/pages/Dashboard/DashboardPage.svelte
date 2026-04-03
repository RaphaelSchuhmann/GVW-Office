<script>
    import { viewport } from "../../stores/viewport.svelte";
    import DashboardDesktop from "./DashboardDesktop.svelte";
    import DashboardMobile from "./DashboardMobile.svelte";
    import { ensureUserData } from "../../services/userService.svelte";
    import { getValue } from "../../services/store";

    $effect(() => {
        if (!getValue("authToken")) return;

        (async () => {
            await ensureUserData();
            // Insert dashboard data api call here
        })
    })
</script>

{#if viewport.isMobile}
    <DashboardMobile />
{:else}
    <DashboardDesktop />
{/if}