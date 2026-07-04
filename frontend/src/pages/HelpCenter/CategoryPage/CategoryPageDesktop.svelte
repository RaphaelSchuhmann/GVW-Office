<script>
    import PageHeader from "../../../components/PageHeader.svelte";
    import { user } from "../../../stores/user.svelte.js";
    import Card from "../../../components/Card.svelte";
    import SearchBarButton from "../../../components/HelpCenter/SearchBarButton.svelte";
    import { appSettings } from "../../../stores/appSettings.svelte.js";
    import ManageFeaturedCategoriesModal from "../../../components/HelpCenter/ManageFeaturedCategoriesModal.svelte";
    import { push } from "svelte-spa-router";
    import { helpCenterStore } from "../../../stores/helpCenterStore.svelte.js";
    import Button from "../../../components/Button.svelte";

    // /**
    //  * Reference to the manage category modal.
    //  * Used to programmatically open the manage category dialog.
    //  * @type {import("../../../components/HelpCenter/ManageFeaturedCategoriesModal.svelte").default}
    //  */
    // let manageFeaturedCategoriesModalRef = $state(null);
</script>

<div class="flex flex-col w-full h-full items-start justify-start gap-4 p-10 overflow-y-auto">
    <div class="flex flex-col items-start justify-start gap-2 w-full h-full">
        <div class="flex flex-col items-start justify-start w-full gap-2 ">
            <div class="w-full flex items-center justify-start">
                <button class="group cursor-pointer flex items-center justify-start gap-2 p-2" onclick={() => helpCenterStore.activeCategory = ""}>
                    <span class="material-symbols-rounded text-icon-dt-6 text-gv-dark-text">arrow_back</span>
                    <span class="text-dt-5 text-gv-dark-text group-hover:underline">Alle Kategorien</span>
                </button>
                {#if user.role === "admin"}
                    <div class="flex items-center gap-4 ml-auto">
                        <!--TODO: Add disable if category contains articles-->
                        <Button type="delete">
                            <div class="flex items-center justify-center gap-2">
                                <span class="material-symbols-rounded">delete</span>
                                <span class="text-nowrap">Kategorie löschen</span>
                            </div>
                        </Button>

                        <Button type="primary">
                            <div class="flex items-center justify-center gap-2">
                                <span class="material-symbols-rounded">post_add</span>
                                <span class="text-nowrap">Artikel hinzufügen</span>
                            </div>
                        </Button>
                    </div>
                {/if}
            </div>
        </div>
    </div>


</div>