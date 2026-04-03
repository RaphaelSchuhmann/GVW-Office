<script>
    import { viewport } from "../../stores/viewport.svelte";
    import { membersStore } from "../../stores/members.svelte";
    import { push } from "svelte-spa-router";
    import { init } from "../../services/filterService.svelte";
    import { user } from "../../stores/user.svelte";

    import MemberDetailsDesktop from "./MemberDetailsDesktop.svelte";
    import MemberDetailsMobile from "./MemberDetailsMobile.svelte";

    const hash = window.location.hash;
    const queryString = hash.split("?")[1];
    const params = new URLSearchParams(queryString);

    const memberId = params.get("id");

    let isEditing = $state(params.get("editing") === "true");

    const memberData = $derived.by(() => {
        if (!memberId) return null;
        return membersStore.raw.find(item => item.id === memberId) || null;
    });

    $effect(() => {
        if (!user.loaded) return;

        if (user.role !== "admin" && user.role !== "board_member") {
            push("/dashboard");
        }

        if (!memberId) {
            push("/members");
        } else if (membersStore.raw.length === 0) {
            init("members");
        } else if (!memberData) {
            push("/members")
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