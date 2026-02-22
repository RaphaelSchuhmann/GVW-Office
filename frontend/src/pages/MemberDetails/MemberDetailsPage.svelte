<script>
    import { viewport } from "../../stores/viewport.svelte";
    import MemberDetailsDesktop from "./MemberDetailsDesktop.svelte";
    import { get } from "svelte/store";
    import { membersStore } from "../../stores/members";
    import { push } from "svelte-spa-router";

    const hash = window.location.hash;
    const queryString = hash.split("?")[1];
    const params = new URLSearchParams(queryString);

    const memberId = params.get("id");

    let isEditing = $state(params.get("editing") === "true");

    const memberData = $derived.by(() => {
        if (!memberId) return null;
        const members = get(membersStore);
        return members.raw.find(item => item.id === memberId) || null;
    });

    $effect(() => {
        if (!memberId || !memberData) {
            push("/members");
        }
    });
</script>

{#if memberData}
    {#if viewport.isMobile}
        <MemberDetailsDesktop {memberData} bind:isEditing />
    {:else}
        <MemberDetailsDesktop {memberData} bind:isEditing />
    {/if}
{:else}
    <p>Lade...</p>
{/if}