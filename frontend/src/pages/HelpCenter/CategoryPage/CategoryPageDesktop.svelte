<script>
    import { user } from "../../../stores/user.svelte.js";
    import Card from "../../../components/Card.svelte";
    import { appSettings } from "../../../stores/appSettings.svelte.js";
    import { helpCenterStore } from "../../../stores/helpCenterStore.svelte.js";
    import Button from "../../../components/Button.svelte";
    import AddArticleModal from "../../../components/HelpCenter/AddArticleModal.svelte";
    import Chip from "../../../components/Chip.svelte";
    import ConfirmDeleteModal from "../../../components/ConfirmDeleteModal.svelte";
    import { getArticles } from "../../../services/helpCenterService.svelte.js";
    import { addToast } from "../../../stores/toasts.svelte.js";

    /**
     * Reference to the add article modal.
     * Used to programmatically open the add article dialog.
     * @type {import("../../../components/HelpCenter/AddArticleModal.svelte").default}
     */
    let addArticleModalRef = $state(null);

    /**
     * Reference to the confirm delete modal.
     * Used to programmatically open the confirm deletion dialog.
     * @type {import("../../../components/ConfirmDeleteModal.svelte").default}
     */
    let confirmDeleteCategoryModal = $state(null);

    const category = appSettings.helpCenterCategories.find(cat => cat.id === helpCenterStore.activeCategory);

    function startDelete() {
        if (!confirmDeleteCategoryModal) return;

        if (!helpCenterStore.activeCategory || !category) {
            addToast({
                title: "Noten nicht gefunden",
                subTitle: "Die ausgewählten Noten wurden nicht gefunden. Bitte versuchen Sie es erneut.",
                type: "error"
            });
            return;
        }

        if (category.id === helpCenterStore.activeCategory) confirmDeleteCategoryModal.startDelete();
    }
</script>

<AddArticleModal bind:this={addArticleModalRef} isMobile={false} />
<ConfirmDeleteModal action="deleteHelpCategory" title="Kategorie löschen"
                    subTitle="Sind Sie sich sicher das sie diese Kategorie löschen möchten?" placeholder="Kategorie1"
                    expectedInput={category?.title} id={helpCenterStore.activeCategory}
                    onClose={async () => { await getArticles(); }} bind:this={confirmDeleteCategoryModal} />

<div class="flex flex-col w-full h-full items-start justify-start gap-4 p-10 overflow-y-auto">
    <div class="flex flex-col items-start justify-start gap-8 w-full h-full">
        <div class="flex flex-col items-start justify-start w-full gap-2 ">
            <div class="w-full flex items-center justify-start">
                <button class="group cursor-pointer flex items-center justify-start gap-2 p-2"
                        onclick={() => helpCenterStore.activeCategory = ""}>
                    <span class="material-symbols-rounded text-icon-dt-6 text-gv-dark-text">arrow_back</span>
                    <span class="text-dt-5 text-gv-dark-text group-hover:underline">Alle Kategorien</span>
                </button>
                {#if user.role === "admin"}
                    <div class="flex items-center gap-4 ml-auto">
                        <Button type="delete" disabled={helpCenterStore.articles.length > 0} onclick={startDelete}>
                            <div class="flex items-center justify-center gap-2">
                                <span class="material-symbols-rounded">delete</span>
                                <span class="text-nowrap">Kategorie löschen</span>
                            </div>
                        </Button>

                        <Button type="primary" onclick={addArticleModalRef?.showModal}>
                            <div class="flex items-center justify-center gap-2">
                                <span class="material-symbols-rounded">post_add</span>
                                <span class="text-nowrap">Artikel hinzufügen</span>
                            </div>
                        </Button>
                    </div>
                {/if}
            </div>
            <div class="w-full flex items-start justify-start gap-4">
                <span class="rounded-2 bg-gv-bg-bar p-4 text-icon-dt-2 text-gv-primary material-symbols-rounded">
                    {category?.icon}
                </span>
                <div class="flex flex-col items-start justify-start">
                    <p class="text-gv-dark-text text-dt-3">{category?.title}</p>
                    <p class="text-gv-light-text text-dt-5 text-nowrap truncate">{category?.description}</p>
                </div>
            </div>
        </div>
        <div
            class="w-full h-full flex flex-col items-start justify-start gap-2 p-5 bg-white rounded-1 overflow-y-auto drop-shadow-[0_0_5px_rgba(0,0,0,0.2)]">
            {#each helpCenterStore.articles as article}
                <button class="w-full cursor-pointer group"
                        onclick={() => helpCenterStore.activeCategory = category.id}>
                    <Card>
                        <div class="flex items-center justify-start gap-4 w-full h-full">
                            <div class="flex flex-col items-start justify-start gap-2 max-w-1/3">
                                <p class="text-gv-dark-text font-bold text-dt-3">{article.title}</p>
                                <p class="text-gv-light-text text-dt-5 line-clamp-2 truncate">{article.description}</p>
                                <div class="w-full flex items-center justify-start gap-2">
                                    {#each article.tags as tag}
                                        <Chip text={tag} />
                                    {/each}
                                </div>
                            </div>
                            <div class="ml-auto h-full flex flex-col items-center justify-center">
                                <span
                                    class="material-symbols-rounded text-icon-dt-4 text-gv-light-text duration-200">chevron_right</span>
                            </div>
                        </div>
                    </Card>
                </button>
            {/each}
        </div>
    </div>


</div>