<script>
    import ToastStack from "../../components/ToastStack.svelte";
    import DesktopSidebar from "../../components/DesktopSidebar.svelte";
    import PageHeader from "../../components/PageHeader.svelte";
    import ChangelogsModal from "../../components/ChangelogsModal.svelte";
    import HorizontalNavBar from "../../components/AdminHorizontalNavBar.svelte";
    import TabBar from "../../components/TabBar.svelte";
    import Card from "../../components/Card.svelte";
    import ListItem from "../../components/ListItem.svelte";

    /** @type {import("../../components/ChangelogsModal.svelte").default} */
    let changelogModal = $state();

    // TODO: Add feedback and bug stores, Implement api layer functions as well as service, Finish both views

    let selectedView = $state("Feedback");
</script>

<ToastStack/>
<ChangelogsModal bind:this={changelogModal}/>

<main class="flex h-screen overflow-hidden">
    <DesktopSidebar currentPage="adminDashboard" handleChangelogs={() => changelogModal?.showModal()}/>
    <div class="flex-1 min-h-0 overflow-y-auto">
        <div class="flex flex-col w-full h-full flex-1 overflow-hidden p-10 min-h-0">
            <HorizontalNavBar currentPage="reportHub"/>
            <PageHeader title="Berichte Hub" subTitle=""
                        showSlot={false} hideSubTitle={true} marginTop="5" />
            <TabBar contents={["Feedback", "Bug Reports"]} selected={selectedView} marginTop="5" onChange={(val) => selectedView = val}/>

            {#if selectedView === "Feedback"}
                <div class="w-full h-full flex gap-4 mt-5">
                    <div class="h-full w-3/5">
                        <Card fillHeight={true} padding="0">
                            <ListItem title="Schnelltaste für Anwesenheit" chipText="Funktionalität" />
                        </Card>
                    </div>
                    <div class="h-full w-2/5">
                        <Card fillHeight={true}>
                            <p>Details</p>
                        </Card>
                    </div>
                </div>
            {/if}
        </div>
    </div>
</main>