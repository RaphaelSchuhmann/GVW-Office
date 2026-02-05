<script>
    import { onMount } from "svelte";
    import { isMobile } from "../../stores/viewport";
    import MembersDesktop from "./MembersDesktop.svelte";
    import MembersMobile from "./MembersMobile.svelte";
    import { ensureUserData } from "../../services/generalService";

    onMount(async () => {
        await ensureUserData();
    });
</script>

{#if $isMobile}
    <MembersMobile />
{:else}
    <MembersDesktop />
{/if}