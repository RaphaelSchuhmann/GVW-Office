<script>
    import { viewportWidth } from "../../stores/viewport";
    import MembersDesktop from "./MembersDesktop.svelte";
    import MembersMobile from "./MembersMobile.svelte";
</script>

{#if $viewportWidth < 768}
    <MembersMobile />
{:else}
    <MembersDesktop />
{/if}