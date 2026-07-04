<script>
    import ToastStack from "../../components/ToastStack.svelte";
    import DesktopSidebar from "../../components/HelpCenter/DesktopSidebar.svelte";
    import Header from "../../components/HelpCenter/Header.svelte";
    import LandingPageDesktop from "./LandingPage/LandingPageDesktop.svelte";
    import { buttons } from "../../services/helpCenterService.svelte.js";

    let {
        category,
        ...restProps
    } = $props();
</script>

<ToastStack />

<main class="flex h-screen overflow-hidden">
    <div class="flex flex-col w-dvw h-dvh overflow-hidden">
        <Header />

        <div class="flex w-dvw h-full overflow-hidden">
            <DesktopSidebar buttons={buttons} />

            {#if category === "none" || category === ""}
                <LandingPageDesktop />
            {/if}
        </div>
    </div>
</main>