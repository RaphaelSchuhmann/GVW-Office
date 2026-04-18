<script>
    import { viewport } from "../../stores/viewport.svelte";
    import { push } from "svelte-spa-router";
    import { eventsStore } from "../../stores/events.svelte";
    import { fetchAndSetRaw, init } from "../../services/filterService.svelte";
    import { user } from "../../stores/user.svelte";

    import EventDetailsDesktop from "./EventDetailsDesktop.svelte";
    import EventDetailsMobile from "./EventDetailsMobile.svelte";
    import { lastRefresh } from "../../stores/sseStore.svelte.js";
    import { eventExists } from "../../services/eventsService.svelte.js";
    import { addToast } from "../../stores/toasts.svelte.js";
    import Spinner from "../../components/Spinner.svelte";

    const hash = window.location.hash;
    const queryString = hash.split("?")[1];
    const params = new URLSearchParams(queryString);

    const eventId = params.get("id");

    let isEditing = $state(params.get("editing") === "true");

    const eventData = $derived.by(() => {
        if (!eventId) return null;
        return eventsStore.raw.find(item => item.id === eventId) || null;
    });

    let ready = false;

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

        ready = true;
    });

    let isDeleting = $state(null);

    $effect(() => {
        const _trigger = lastRefresh.EVENTS;

        if (!ready || isDeleting) return;

        (async () => {
            const exists = await eventExists(eventId);
            if (!exists) {
                addToast({
                    title: "Veranstaltung wurde gelöscht",
                    subTitle: "Diese Veranstaltung wurde gelöscht und ist nicht mehr verfügbar.",
                    type: "error"
                });

                await fetchAndSetRaw();
                await push("/events");
            }
        })();
    });
</script>

{#if eventData}
    {#key eventData.rev}
        {#if viewport.isMobile}
            <EventDetailsMobile {eventData} bind:isEditing bind:isDeleting />
        {:else}
            <EventDetailsDesktop {eventData} bind:isEditing bind:isDeleting />
        {/if}
    {/key}
{:else}
    <div class="w-full h-screen flex justify-center items-center">
        <Spinner title="GVW Office" subTitle="Daten werden geladen..."/>
    </div>
{/if}