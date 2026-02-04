<script>
    import { isMobile } from "../../stores/viewport";
    import DashboardDesktop from "./DashboardDesktop.svelte";
    import DashboardMobile from "./DashboardMobile.svelte";
</script>

{#if $isMobile}
    <DashboardMobile />
{:else}
    <DashboardDesktop />
{/if}