<script>
    import ToastStack from "../../components/ToastStack.svelte";
    import PageHeader from "../../components/PageHeader.svelte";
    import MobileSidebar from "../../components/MobileSidebar.svelte";
    import ChangelogsModal from "../../components/ChangelogsModal.svelte";
    import HorizontalNavBar from "../../components/AdminHorizontalNavBar.svelte";

    let sidebarOpen = $state(false);

    /** @type {import("../../components/ChangelogsModal.svelte").default} */
    let changelogModal = $state();
</script>

<ToastStack isMobile={true} />
<ChangelogsModal bind:this={changelogModal} isMobile={true}/>

<MobileSidebar currentPage="adminDashboard" bind:isOpen={sidebarOpen} handleChangelogs={() => changelogModal?.showModal()} />

<main class="flex overflow-hidden">
    <div class="flex-1 min-h-0 overflow-y-auto">
        <div class="flex flex-col w-full flex-1 overflow-hidden p-7 min-h-0">
            <div class="w-full flex items-center justify-start">
                <button class="flex items-center justify-center" onclick={() => sidebarOpen = true}>
                    <span class="material-symbols-rounded text-icon-dt-4 text-gv-dark-text">menu</span>
                </button>
            </div>
            <div class="mt-5">
                <HorizontalNavBar currentPage="reportHub"/>
            </div>
            <PageHeader title="Berichte Hub" subTitle=""
                        showSlot={false} hideSubTitle={true} marginTop="5" />
        </div>
    </div>
</main>