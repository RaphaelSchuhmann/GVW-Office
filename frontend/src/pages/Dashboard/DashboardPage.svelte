<script>
    import { viewport } from "../../stores/viewport.svelte";
    import DashboardDesktop from "./DashboardDesktop.svelte";
    import DashboardMobile from "./DashboardMobile.svelte";
    import { ensureUserData } from "../../services/userService.svelte";

    ensureUserData();
</script>

{#if viewport.isMobile}
    <DashboardMobile />
{:else}
    <DashboardDesktop />
{/if}