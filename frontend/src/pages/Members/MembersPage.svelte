<script>
    import { viewport } from "../../stores/viewport.svelte";
    import MembersDesktop from "./MembersDesktop.svelte";
    import MembersMobile from "./MembersMobile.svelte";
    import { ensureUserData } from "../../services/userService";
    import { init } from "../../services/filterService";

    $effect(() => {
        ensureUserData();
        init("members");
    });
</script>

{#if viewport.isMobile}
    <MembersMobile />
{:else}
    <MembersDesktop />
{/if}