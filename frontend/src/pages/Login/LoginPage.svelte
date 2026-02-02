<script>
    import { innerWidth } from "svelte/reactivity/window";
    import LoginDesktop from "./LoginDesktop.svelte";
    import LoginMobile from "./LoginMobile.svelte";
</script>

{#if innerWidth.current < 768}
    <LoginMobile/>
{:else}
    <LoginDesktop/>
{/if}