<script>
    import { onMount } from "svelte";
    import { isMobile } from "../../stores/viewport";
    import MembersDesktop from "./MembersDesktop.svelte";
    import MembersMobile from "./MembersMobile.svelte";
    import { ensureUserData } from "../../services/userService";
    import { init } from "../../services/filterService";

    onMount(async () => {
        await ensureUserData();
        await init("members");
    });
</script>

{#if $isMobile}
    <MembersMobile />
{:else}
    <MembersDesktop />
{/if}