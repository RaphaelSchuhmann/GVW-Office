<script>
    import { viewport } from "../../stores/viewport.svelte";
    import { push } from "svelte-spa-router";
    import { libraryStore } from "../../stores/library.svelte";

    import LibraryDetailsDesktop from "./LibraryDetailsDesktop.svelte";
    import LibraryDetailsMobile from "./LibraryDetailsMobile.svelte";
    import { init } from "../../services/filterService.svelte";

    const hash = window.location.hash;
    const queryString = hash.split("?")[1];
    const params = new URLSearchParams(queryString);

    const scoreId = params.get("id");

    let isEditing = $state(params.get("editing") === "true");

    const scoreData = $derived.by(() => {
        if (!scoreId) return null;
        return libraryStore.raw.find(item => item.id === scoreId) || null;
    });

    $effect(() => {
        if (!scoreId || (libraryStore.raw.length > 0 && !scoreData)) {
            push("/library");
        } else {
            init("library");
        }
    });
</script>

{#if scoreData}
    {#if viewport.width < 800}
        <LibraryDetailsMobile {scoreData} bind:isEditing />
    {:else}
        <LibraryDetailsDesktop {scoreData} bind:isEditing />
    {/if}
{:else}
    <p>Lade...</p>
{/if}