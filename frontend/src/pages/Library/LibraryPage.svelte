<script>
    import { viewport } from "../../stores/viewport.svelte";
    import { ensureUserData } from "../../services/userService.svelte";
    import { init } from "../../services/filterService.svelte";

    import LibraryDesktop from "./LibraryDesktop.svelte";
    import LibraryMobile from "./LibraryMobile.svelte";
    import { getValue } from "../../services/store";

    $effect(() => {
        if (!getValue("authToken")) return;

        (async () => {
            await ensureUserData();
            await init("library");
        })();
    });
</script>

{#if viewport.width < 800}
    <LibraryMobile />
{:else}
    <LibraryDesktop />
{/if}