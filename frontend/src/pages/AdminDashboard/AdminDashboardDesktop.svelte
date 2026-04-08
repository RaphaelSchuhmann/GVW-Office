<script>
    import { changelogsStore } from "../../stores/changelogs.svelte.js";
    import { viewport } from "../../stores/viewport.svelte.js";

    import ToastStack from "../../components/ToastStack.svelte";
    import DesktopSidebar from "../../components/DesktopSidebar.svelte";
    import PageHeader from "../../components/PageHeader.svelte";
    import Card from "../../components/Card.svelte";
    import AccordionList from "../../components/AccordionList.svelte";
    import ChangelogListItem from "../../components/ChangelogListItem.svelte";
    import Modal from "../../components/Modal.svelte";
    import Input from "../../components/Input.svelte";
    import Textarea from "../../components/Textarea.svelte";
    import Button from "../../components/Button.svelte";
    import Spinner from "../../components/Spinner.svelte";
    import { addChangelog } from "../../services/changelogService.svelte.js";
    import ChangelogsModal from "../../components/ChangelogsModal.svelte";

    /** @type {import("../../components/Modal.svelte").default} */
    let addChangelogModal = $state();

    /** @type {import("../../components/ChangelogsModal.svelte").default} */
    let changelogModal = $state();

    // Add changelog

    let isSubmitting = $state(false);

    let addChangelogInputs = $state({
        title: "",
        version: "",
        content: "",
    });

    let addChangelogBtnDisabled = $derived(!(addChangelogInputs.title || addChangelogInputs.version || addChangelogInputs.content) || isSubmitting);

    async function submitNewChangelog() {
        isSubmitting = true;

        await addChangelog(addChangelogInputs);

        isSubmitting = false;
        addChangelogModal.hideModal();
    }

    function resetChangelogInputs() {
        addChangelogInputs.title = "";
        addChangelogInputs.version = "";
        addChangelogInputs.content = "";
    }
</script>

<ToastStack/>
<ChangelogsModal bind:this={changelogModal}/>

<Modal bind:this={addChangelogModal} title="Neuen Changelog hinzufügen" subTitle="Erfassen Sie hier die Changelogdaten"
       extraFunction={resetChangelogInputs}>
    <div class="flex items-center w-full gap-4 mt-5">
        <Input bind:value={addChangelogInputs.title} title="Titel" placeholder="Changelog v1.0"/>
        <Input bind:value={addChangelogInputs.version} title="Version" placeholder="v1.0"/>
    </div>
    <Textarea bind:value={addChangelogInputs.content} title="Inhalt" placeholder="Informationen über Änderungen..." height="h-[20vh]" marginTop="5"/>
    <div class="w-full flex items-center justify-end mt-5 gap-2">
        <Button type="secondary" onclick={addChangelogModal.hideModal}>Abbrechen</Button>
        <Button type="primary" disabled={addChangelogBtnDisabled} onclick={submitNewChangelog} isSubmit={true}>
            {#if isSubmitting}
                <Spinner light={true} />
                <p>Speichern...</p>
            {:else}
                Hinzufügen
            {/if}
        </Button>
    </div>
</Modal>

<main class="flex h-screen overflow-hidden">
    <DesktopSidebar currentPage="adminDashboard" handleChangelogs={changelogModal.showModal}></DesktopSidebar>
    <div class="flex-1 min-h-0 overflow-y-auto">
        <div class="flex flex-col w-full h-full flex-1 overflow-hidden p-10 min-h-0">
            <PageHeader title="Admin Dashboard" subTitle="Willkommen im Admin Dashboard für GVW Office"
                        showSlot={false} />
            <div class="flex max-[1300px]:flex-col min-[1300px]:h-full w-full gap-4 mt-10 overflow-y-auto">
                <div class="w-full h-full flex flex-col items-center">
                    <Card fillHeight={viewport.width > 1300}>
                        <div class="w-full flex items-center justify-start p-2">
                            <p class="text-gv-dark-text text-dt-3">Changelogs</p>
                            <button
                                class="flex items-center justify-center p-2 cursor-pointer hover:bg-gv-hover-effect rounded-2 ml-auto"
                                onclick={addChangelogModal.showModal}
                            >
                                <span class="material-symbols-rounded text-icon-dt-4">add</span>
                            </button>
                        </div>
                        <div class="w-full h-full flex flex-col items-center max-[1300px]:max-h-[50vh]">
                            <AccordionList itemComponent={ChangelogListItem} list={changelogsStore}/>
                        </div>
                    </Card>
                </div>
                <div class="w-full h-full gap-4 flex flex-col items-center">
                    <Card fillHeight={viewport.width > 1300}>
                        <p>Card2</p>
                    </Card>
                    <Card fillHeight={viewport.width > 1300}>
                        <p>Card3</p>
                    </Card>
                </div>
            </div>
        </div>
    </div>
</main>