<script>
    import ToastStack from "../../components/ToastStack.svelte";
    import PageHeader from "../../components/PageHeader.svelte";
    import MobileSidebar from "../../components/HelpCenter/MobileSidebar.svelte";
    import { buttons } from "../../services/helpCenterService.svelte.js";

    let {
        category,
        ...restProps
    } = $props();

    let sidebarOpen = $state(false);
</script>

<ToastStack isMobile={true}/>

<MobileSidebar buttons={buttons} isOpen={sidebarOpen} />

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
            <div class="flex flex-col items-start justify-start">
                <p class="font-bold text-dt-5 text-gv-primary">HILFE-CENTER</p>
                <PageHeader title="Wie können wir helfen?" hideSubTitle={true} showSlot={false}/>
            </div>
        </div>
    </div>
</main>