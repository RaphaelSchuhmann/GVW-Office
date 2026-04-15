<script>
    import ToastStack from "../../components/ToastStack.svelte";
    import DesktopSidebar from "../../components/DesktopSidebar.svelte";
    import PageHeader from "../../components/PageHeader.svelte";
    import ChangelogsModal from "../../components/ChangelogsModal.svelte";
    import HorizontalNavBar from "../../components/AdminHorizontalNavBar.svelte";
    import TabBar from "../../components/TabBar.svelte";
    import Card from "../../components/Card.svelte";
    import ListItem from "../../components/ListItem.svelte";
    import { getAllBugReports, getAllFeedbacks, getItemDetails } from "../../services/reportHubService.svelte";
    import { feedbackStore } from "../../stores/reportHub.svelte";
    import { appSettings } from "../../stores/appSettings.svelte";
    import Chip from "../../components/Chip.svelte";
    import CollapsableViewer from "../../components/CollapsableViewer.svelte";

    /** @type {import("../../components/ChangelogsModal.svelte").default} */
    let changelogModal = $state();

    let selectedView = $state("Feedback");
    let itemDetails = $state({
        title: "",
        category: "",
        message: "",
        timestamp: "",
        route: "",
        sentiment: 0,
        userEmail: ""
    });

    async function selectItem(id) {
        const type = selectedView.toLowerCase().replaceAll(" ", "");

        itemDetails = await getItemDetails(id, type);
    }
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
            <TabBar contents={["Feedback", "Bug Reports"]} selected={selectedView} marginTop="5" onChange={async (val) => {
                selectedView = val
                if (selectedView === "Feedback") {
                    await getAllFeedbacks();
                } else {
                    await getAllBugReports();
                }
            }}/>

            {#if selectedView === "Feedback"}
                <div class="w-full h-full flex gap-4 mt-5">
                    <div class="h-full w-3/5">
                        <Card fillHeight={true} padding="0">
                            {#each feedbackStore.data as feedback}
                                <ListItem id={feedback.id} title={feedback.title} chipText={appSettings.feedbackCategories[feedback.category] || appSettings.feedbackCategories["other"]} onclick={async (id) => await selectItem(id)} />
                            {/each}
                        </Card>
                    </div>
                    <div class="h-full w-2/5">
                        <Card fillHeight={true}>
                            {#if itemDetails.title}
                                <div class="w-full h-full flex flex-col items-start justify-start gap-4 p-2">
                                    <p class="text-dt-4 font-semibold line-clamp-2 truncate">{itemDetails.title}</p>
                                    <div class="flex items-center justify-start gap-4">
                                        <Chip text={appSettings.feedbackCategories[itemDetails.category] || appSettings.feedbackCategories["other"]}/>
                                        <div class="flex gap-1 items-center">
                                            <p class="text-dt-5 font-semibold">{itemDetails.sentiment}</p>
                                            <span class="material-symbols-rounded-filled text-icon-dt-3 text-gv-sentiment-selected">star</span>
                                        </div>
                                    </div>
                                    <CollapsableViewer title="Nachricht" expanded={true}>
                                        <p>{itemDetails.message}</p>
                                    </CollapsableViewer>
                                    <CollapsableViewer title="Details" expanded={true}>
                                        <div class="w-full flex flex-col items-start justify-start gap-2">
                                            <div class="flex items-center justify-between w-full">
                                                <p class="text-dt-6 text-gv-dark-text">User E-Mail</p>
                                                <p class="text-dt-6 text-gv-dark-text">{itemDetails.userEmail}</p>
                                            </div>

                                            <div class="flex items-center justify-between w-full">
                                                <p class="text-dt-6 text-gv-dark-text">Timestamp</p>
                                                <p class="text-dt-6 text-gv-dark-text">{itemDetails.timestamp}</p>
                                            </div>

                                            <div class="flex items-center justify-between w-full">
                                                <p class="text-dt-6 text-gv-dark-text">App Version</p>
                                                <p class="text-dt-6 text-gv-dark-text">v1 von app settings</p>
                                            </div>

                                            <div class="flex items-center justify-between w-full">
                                                <p class="text-dt-6 text-gv-dark-text">Page</p>
                                                <p class="text-dt-6 text-gv-dark-text">{itemDetails.route}</p>
                                            </div>
                                        </div>
                                    </CollapsableViewer>
                                </div>
                            {/if}
                        </Card>
                    </div>
                </div>
            {/if}
        </div>
    </div>
</main>