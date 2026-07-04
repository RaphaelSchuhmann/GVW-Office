<script>
    import ToastStack from "../../components/ToastStack.svelte";
    import MobileSidebar from "../../components/HelpCenter/MobileSidebar.svelte";
    import { appSettings } from "../../stores/appSettings.svelte.js";
    import AddCategoryModal from "../../components/HelpCenter/AddCategoryModal.svelte";

    let {
        category,
        ...restProps
    } = $props();

    let sidebarOpen = $state(false);
</script>

<ToastStack isMobile={true}/>

<MobileSidebar buttons={appSettings.helpCenterCategories} isOpen={sidebarOpen} />

<main class="flex overflow-hidden">
    <button class="rounded-full bg-gv-primary text-white p-3 flex items-center justify-center absolute top-6 right-6">
        <span class="material-symbols-rounded text-icon-dt-4">search</span>
    </button>
    <div class="flex-1 min-h-0 overflow-y-auto">
        <div class="flex flex-col w-full flex-1 overflow-hidden p-7 min-h-0 gap-4">
            <div class="w-full flex items-center justify-start">
                <button class="flex items-center justify-center" onclick={() => sidebarOpen = true}>
                    <span class="material-symbols-rounded text-icon-dt-4 text-gv-dark-text">menu</span>
                </button>
            </div>
        </div>
    </div>
</main>