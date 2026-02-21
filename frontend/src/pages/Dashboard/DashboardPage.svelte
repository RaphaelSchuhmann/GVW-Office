<script>
    import { isMobile } from "../../stores/viewport";
    import DashboardDesktop from "./DashboardDesktop.svelte";
    import DashboardMobile from "./DashboardMobile.svelte";
    import { ensureUserData } from "../../services/userService";

    $effect(() => {
        ensureUserData();
    });
</script>

{#if $isMobile}
    <DashboardMobile />
{:else}
    <DashboardDesktop />
{/if}