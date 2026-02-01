<script>
    import { useViewport } from "../../stores/viewport.svelte";
    import MembersDesktop from "./MembersDesktop.svelte";
    import MembersMobile from "./MembersMobile.svelte";
</script>

{#if useViewport().isMobile}
    <MembersMobile />
{:else}
    <MembersDesktop />
{/if}