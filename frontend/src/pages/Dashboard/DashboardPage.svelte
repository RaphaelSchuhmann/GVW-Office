<script>
    import { isMobile } from "../../stores/viewport";
    import DashboardDesktop from "./DashboardDesktop.svelte";
    import DashboardMobile from "./DashboardMobile.svelte";
    import { onMount } from "svelte";
    import { ensureUserData } from "../../services/userService";

    onMount(async () => {
        await ensureUserData();
    });
</script>

{#if $isMobile}
    <DashboardMobile />
{:else}
    <DashboardDesktop />
{/if}