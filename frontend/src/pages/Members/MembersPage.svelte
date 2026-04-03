<script>
    import { viewport } from "../../stores/viewport.svelte";
    import MembersDesktop from "./MembersDesktop.svelte";
    import MembersMobile from "./MembersMobile.svelte";
    import { ensureUserData } from "../../services/userService.svelte";
    import { init } from "../../services/filterService.svelte";
    import { user } from "../../stores/user.svelte";
    import { push } from "svelte-spa-router";

    $effect(() => {
        if (!user.loaded) return;

        if (user.role !== "admin" && user.role !== "board_member") {
            push("/dashboard");
        }

        (async () => {
            await ensureUserData();
            await init("members");
        })();
    });
</script>

{#if viewport.isMobile}
    <MembersMobile />
{:else}
    <MembersDesktop />
{/if}