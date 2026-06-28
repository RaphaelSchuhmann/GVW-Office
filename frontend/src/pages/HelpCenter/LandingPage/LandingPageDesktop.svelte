<script>
    import PageHeader from "../../../components/PageHeader.svelte";
    import { user } from "../../../stores/user.svelte.js";
    import Card from "../../../components/Card.svelte";

    const categories = [
        {
            icon: "group",
            title: "Mitlieder",
            subTitle: "Mitglieder einladen, verwalten und Rollen vergeben.",
            articleCount: 8,
            isFeatured: true
        }
    ];
</script>
<div class="flex flex-col w-full h-full items-start justify-start gap-4 p-10 overflow-y-auto">
    <div class="flex flex-col items-start justify-start gap-2">
        <p class="font-bold text-dt-3 text-gv-primary tracking-[8%]">HILFE-CENTER</p>
        <PageHeader title="Wie können wir helfen?"
                    subTitle="Durchsuchen Sie unsere Wissensdatenbank oder wählen Sie eine Kategorie, um direkt zu den passenden Artikeln zu gelangen."
                    showSlot={false} />
    </div>

    <button
        class="flex items-center justify-start gap-2 bg-gv-input-bg border border-gv-separator rounded-1 cursor-text p-2 pr-10"
        onclick={() => {}}>
        <span class="material-symbols-rounded text-icon-dt-6 text-gv-input-placeholder">search</span>
        <span class="text-dt-5 text-gv-input-placeholder">Nach Artikeln, Funktionen oder Stichwörter suchen...</span>
    </button>

    <div
        class="w-full h-full flex flex-col items-start justify-start gap-2 p-5 bg-white rounded-1 drop-shadow-[0_0_5px_rgba(0,0,0,0.2)]">
        <div class="flex items-center justify-start w-full">
            <p class="text-dt-3 font-bold">Kategorien</p>
            {#if user.role === "admin"}
                <button class="flex items-center justify-center ml-auto cursor-pointer">
                    <span class="material-symbols-rounded text-icon-dt-4 text-gv-dark-text">discover_tune</span>
                </button>
            {/if}
        </div>
        <div class="grid grid-cols-3 grid-rows-2 w-full h-full gap-4">
            {#each categories as category}
                {#if category.isFeatured}
                    <button class="h-full w-full cursor-pointer group">
                        <Card fillHeight={true}>
                            <div class="flex flex-col items-start justify-start gap-4 w-full h-full">
                                <span class="rounded-2 bg-gv-bg-bar p-4 text-icon-dt-2 text-gv-primary material-symbols-rounded">
                                    {category.icon}
                                </span>
                                <div class="flex flex-col items-start justify-start w-full">
                                    <p class="text-dt-3 text-gv-dark-text">{category.title}</p>
                                    <p class="text-dt-5 text-left text-gv-light-text text-wrap line-clamp-2 truncate">{category.subTitle}</p>
                                </div>
                                <div class="flex items-center justify-start gap-2">
                                    <p class="text-gv-light-text text-dt-5">{category.articleCount} Artikel</p>
                                    <span class="material-symbols-rounded text-icon-dt-6 text-gv-light-text group-hover:ml-1 duration-200">chevron_right</span>
                                </div>
                            </div>
                        </Card>
                    </button>
                {/if}
            {/each}
        </div>
    </div>
</div>