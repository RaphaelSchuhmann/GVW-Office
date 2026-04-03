<script>
    import { viewport } from "../../stores/viewport.svelte";
    import { ensureUserData } from "../../services/userService.svelte";
    import { init } from "../../services/filterService.svelte";

    import LibraryDesktop from "./LibraryDesktop.svelte";
    import LibraryMobile from "./LibraryMobile.svelte";
    import { auth } from "../../stores/auth.svelte";

    $effect(() => {
        if (!auth.token) return;

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