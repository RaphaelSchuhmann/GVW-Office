<script>
    import { innerWidth } from "svelte/reactivity/window";
    import DashboardDesktop from "./DashboardDesktop.svelte";
    import DashboardMobile from "./DashboardMobile.svelte";
</script>

{#if innerWidth.current < 768}
    <DashboardMobile />
{:else}
    <DashboardDesktop />
{/if}