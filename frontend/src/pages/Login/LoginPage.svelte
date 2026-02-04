<script>
    import { isMobile } from "../../stores/viewport";
    import LoginDesktop from "./LoginDesktop.svelte";
    import LoginMobile from "./LoginMobile.svelte";
</script>

{#if $isMobile}
    <LoginMobile/>
{:else}
    <LoginDesktop/>
{/if}