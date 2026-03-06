<script>
    import { viewport } from "../../stores/viewport.svelte";
    import { ensureUserData } from "../../services/userService.svelte";
    import { init } from "../../services/filterService.svelte";

    import EventsDesktop from "./EventsDesktop.svelte";
    import EventsMobile from "./EventsMobile.svelte";

    $effect(() => {
        (async () => {
            await ensureUserData();
            await init("events");
        })();
    });
</script>

{#if viewport.width < 870}
    <EventsMobile />
{:else}
    <EventsDesktop />
{/if}