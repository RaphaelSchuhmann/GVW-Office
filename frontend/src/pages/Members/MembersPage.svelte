<script>
    import { isMobile } from "../../stores/viewport";
    import MembersDesktop from "./MembersDesktop.svelte";
    import MembersMobile from "./MembersMobile.svelte";
    import { ensureUserData } from "../../services/userService";
    import { init } from "../../services/filterService";

    $effect(() => {
        ensureUserData();
        init("members");
    });
</script>

{#if $isMobile}
    <MembersMobile />
{:else}
    <MembersDesktop />
{/if}