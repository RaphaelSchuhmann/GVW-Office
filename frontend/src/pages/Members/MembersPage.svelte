<script>
    import { innerWidth } from "svelte/reactivity/window";
    import MembersDesktop from "./MembersDesktop.svelte";
    import MembersMobile from "./MembersMobile.svelte";
</script>

{#if innerWidth.current < 768}
    <MembersMobile />
{:else}
    <MembersDesktop />
{/if}