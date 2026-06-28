<script>
    import ToastStack from "../../components/ToastStack.svelte";
    import PageHeader from "../../components/PageHeader.svelte";
    import DesktopSidebar from "../../components/HelpCenter/DesktopSidebar.svelte";
    import Header from "../../components/HelpCenter/Header.svelte";
    import { user } from "../../stores/user.svelte.js";
    import LandingPageDesktop from "./LandingPage/LandingPageDesktop.svelte";

    let {
        category,
        ...restProps
    } = $props();

    const buttons = [
        {
            icon: "group",
            text: "Mitglieder",
            count: 8
        },
        {
            icon: "calendar_today",
            text: "Veranstaltungen",
            count: 7
        },
        {
            icon: "docs",
            text: "Berichte",
            count: 5
        },
        {
            icon: "music_note_2",
            text: "Notenbibliothek",
            count: 6
        },
    ];
</script>

<ToastStack />

<main class="flex h-screen overflow-hidden">
    <div class="flex flex-col w-dvw h-dvh overflow-hidden">
        <!-- Header -->
        <Header />
        <!-- Sidebar + Content -->
        <div class="flex w-dvw h-full overflow-hidden">
            <!-- Sidebar -->
            <DesktopSidebar buttons={buttons} />
            <!-- Content -->
            {#if category === "none" || category === ""}
                <LandingPageDesktop />
            {/if}
        </div>
    </div>
</main>