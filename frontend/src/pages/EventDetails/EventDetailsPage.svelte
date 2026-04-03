<script>
    import { viewport } from "../../stores/viewport.svelte";
    import { push } from "svelte-spa-router";
    import { eventsStore } from "../../stores/events.svelte";
    import { init } from "../../services/filterService.svelte";
    import { user } from "../../stores/user.svelte";

    import EventDetailsDesktop from "./EventDetailsDesktop.svelte";
    import EventDetailsMobile from "./EventDetailsMobile.svelte";

    const hash = window.location.hash;
    const queryString = hash.split("?")[1];
    const params = new URLSearchParams(queryString);

    const eventId = params.get("id");

    let isEditing = $state(params.get("editing") === "true");

    const eventData = $derived.by(() => {
        if (!eventId) return null;
        return eventsStore.raw.find(item => item.id === eventId) || null;
    });

    $effect(() => {
        if (!user.loaded) return;

        if (isEditing && (user.role !== "board_member" && user.role !== "admin")) isEditing = false;

        if (!eventId) {
            push("/events");
        } else if (eventsStore.raw.length === 0) {
            init("events");
        } else if (!eventData) {
            push("/events");
        }
    });
</script>

{#if eventData}
    {#if viewport.isMobile}
        <EventDetailsMobile {eventData} bind:isEditing />
    {:else}
        <EventDetailsDesktop {eventData} bind:isEditing />
    {/if}
{:else}
    <p>Lade...</p>
{/if}