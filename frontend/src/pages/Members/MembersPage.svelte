<script>
    import { viewport } from "../../stores/viewport.svelte";
    import { ensureUserData } from "../../services/userService.svelte";
    import { init } from "../../services/filterService.svelte";
    import { user } from "../../stores/user.svelte";
    import { push } from "svelte-spa-router";

    import MembersDesktop from "./MembersDesktop.svelte";
    import MembersMobile from "./MembersMobile.svelte";
    import { auth } from "../../stores/auth.svelte";

    $effect(() => {
        if (!user.loaded) return;

        if (user.role !== "admin" && user.role !== "board_member") {
            push("/dashboard");
            return;
        }

        if (!auth.token) return;

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