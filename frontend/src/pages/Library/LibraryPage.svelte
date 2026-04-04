<script>
    import { viewport } from "../../stores/viewport.svelte";
    import { ensureUserData } from "../../services/userService.svelte";
    import { fetchAndSetRaw, init } from "../../services/filterService.svelte";

    import LibraryDesktop from "./LibraryDesktop.svelte";
    import LibraryMobile from "./LibraryMobile.svelte";
    import { auth } from "../../stores/auth.svelte";
    import { lastRefresh } from "../../stores/sseStore.svelte.js";
    import { untrack } from "svelte";

    let ready = false;

    $effect(() => {
        if (!auth.token) return;

        (async () => {
            await ensureUserData();
            await init("library");
            ready = true;
        })();
    });

    $effect(() => {
        if (!ready) return;

        const trigger = lastRefresh.SCORES;

        untrack(() => {
            fetchAndSetRaw();
        });
    })
</script>

{#if viewport.width < 800}
    <LibraryMobile />
{:else}
    <LibraryDesktop />
{/if}