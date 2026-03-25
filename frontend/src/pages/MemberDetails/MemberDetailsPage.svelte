<script>
    import { viewport } from "../../stores/viewport.svelte";
    import { membersStore } from "../../stores/members.svelte";
    import { push } from "svelte-spa-router";

    import MemberDetailsDesktop from "./MemberDetailsDesktop.svelte";
    import MemberDetailsMobile from "./MemberDetailsMobile.svelte";
    import { user } from "../../stores/user.svelte";

    const hash = window.location.hash;
    const queryString = hash.split("?")[1];
    const params = new URLSearchParams(queryString);

    const memberId = params.get("id");

    let isEditing = $state(params.get("editing") === "true");

    if (user.role !== "admin" && user.role !== "board_member") {
        push("/dashboard");
    }

    const memberData = $derived.by(() => {
        if (!memberId) return null;
        return membersStore.raw.find(item => item.id === memberId) || null;
    });

    $effect(() => {
        if (!memberId || !memberData) {
            push("/members");
        }
    });
</script>

{#if memberData}
    {#if viewport.isMobile}
        <MemberDetailsMobile {memberData} bind:isEditing />
    {:else}
        <MemberDetailsDesktop {memberData} bind:isEditing />
    {/if}
{:else}
    <p>Lade...</p>
{/if}