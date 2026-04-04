<script>
    import { viewport } from "../../stores/viewport.svelte";
    import { ensureUserData } from "../../services/userService.svelte";
    import { fetchAndSetRaw, init } from "../../services/filterService.svelte";

    import EventsDesktop from "./EventsDesktop.svelte";
    import EventsMobile from "./EventsMobile.svelte";
    import { auth } from "../../stores/auth.svelte";
    import { lastRefresh } from "../../stores/sseStore.svelte.js";
    import { untrack } from "svelte";

    let ready = false;

    $effect(() => {
        if (!auth.token) return;

        (async () => {
            await ensureUserData();
            await init("events");
            ready = true;
        })();
    });

    $effect(() => {
        if (!ready) return;

        const trigger = lastRefresh.EVENTS;

        untrack(() => {
            fetchAndSetRaw();
        });
    })
</script>

{#if viewport.width < 870}
    <EventsMobile />
{:else}
    <EventsDesktop />
{/if}