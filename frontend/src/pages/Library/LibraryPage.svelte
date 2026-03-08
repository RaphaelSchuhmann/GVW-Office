<script>
    import { viewport } from "../../stores/viewport.svelte";
    import { ensureUserData } from "../../services/userService.svelte";
    import { init } from "../../services/filterService.svelte";

    import LibraryDesktop from "./LibraryDesktop.svelte";

    $effect(() => {
        (async () => {
            await ensureUserData();
            await init("library");
        })();
    });
</script>

{#if viewport.isMobile}
    <LibraryDesktop />
{:else}
    <LibraryDesktop />
{/if}