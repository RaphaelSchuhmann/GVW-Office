<script>
    import { useViewport } from "../../stores/viewport.svelte";
    import LoginDesktop from "./LoginDesktop.svelte";
    import LoginMobile from "./LoginMobile.svelte";
</script>

{#if useViewport().isMobile}
    <LoginMobile/>
{:else}
    <LoginDesktop/>
{/if}