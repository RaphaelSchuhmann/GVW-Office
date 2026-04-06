<script>
    import { viewport } from "../../stores/viewport.svelte";
    import DashboardDesktop from "./DashboardDesktop.svelte";
    import DashboardMobile from "./DashboardMobile.svelte";
    import { ensureUserData } from "../../services/userService.svelte";
    import { auth } from "../../stores/auth.svelte";
    import { user } from "../../stores/user.svelte";
    import Spinner from "../../components/Spinner.svelte";

    let isGlobalLoading = $derived(user.name.length === 0);

    $effect(() => {
        if (!auth.token) return;

        (async () => {
            await ensureUserData();
            // Insert dashboard data api call here
        })();
    })
</script>

{#if isGlobalLoading}
    <div class="w-full h-screen flex justify-center items-center">
        <Spinner title="GVW Office" subTitle="Daten werden geladen..."/>
    </div>
{:else}
    {#if viewport.isMobile}
        <DashboardMobile />
    {:else}
        <DashboardDesktop />
    {/if}
{/if}