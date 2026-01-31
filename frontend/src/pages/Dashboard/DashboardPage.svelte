<script>
    import { useViewport } from "../../stores/viewport.svelte";
    import DashboardDesktop from "./DashboardDesktop.svelte";
    import DashboardMobile from "./DashboardMobile.svelte";
</script>

{#if useViewport().isMobile}
    <DashboardMobile />
{:else}
    <DashboardDesktop />
{/if}