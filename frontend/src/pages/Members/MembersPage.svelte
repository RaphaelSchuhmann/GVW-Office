<script>
    import { isMobile } from "../../stores/viewport";
    import MembersDesktop from "./MembersDesktop.svelte";
    import MembersMobile from "./MembersMobile.svelte";
</script>

{#if $isMobile}
    <MembersMobile />
{:else}
    <MembersDesktop />
{/if}