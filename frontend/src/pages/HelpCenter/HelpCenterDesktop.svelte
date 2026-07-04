<script>
    import ToastStack from "../../components/ToastStack.svelte";
    import DesktopSidebar from "../../components/HelpCenter/DesktopSidebar.svelte";
    import Header from "../../components/HelpCenter/Header.svelte";
    import LandingPageDesktop from "./LandingPage/LandingPageDesktop.svelte";
    import { appSettings } from "../../stores/appSettings.svelte.js";
    import AddCategoryModal from "../../components/HelpCenter/AddCategoryModal.svelte";

    let {
        category,
        ...restProps
    } = $props();

    /**
     * Reference to the add category modal.
     * Used to programmatically open the add category dialog.
     * @type {import("../../components/HelpCenter/AddCategoryModal.svelte").default}
     */
    let addCategoryModalRef = $state(null);
</script>

<ToastStack />

<AddCategoryModal bind:this={addCategoryModalRef} isMobile={false} />

<main class="flex h-screen overflow-hidden">
    <div class="flex flex-col w-dvw h-dvh overflow-hidden">
        <Header onClickAddCategory={addCategoryModalRef?.showModal} />

        <div class="flex w-dvw h-full overflow-hidden">
            <DesktopSidebar buttons={appSettings.helpCenterCategories} />

            {#if category === "none" || category === ""}
                <LandingPageDesktop />
            {/if}
        </div>
    </div>
</main>