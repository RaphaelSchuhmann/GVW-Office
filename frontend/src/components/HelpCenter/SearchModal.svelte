<script>
    import Input from "../Input.svelte";
    import { getArticle } from "../../services/helpCenterService.svelte.js";
    import Chip from "../Chip.svelte";
    import Card from "../Card.svelte";

    let {
        isMobile = false,
        ...restProps
    } = $props();

    let closeBtn = $state(null);
    let isVisible = $state(false);

    let results = $state([]);

    /**
     * Handles keyboard events
     */
    function handleKeyDown(event) {
        if (event.key === "Escape") {
            closeBtn?.click();
        }
    }

    export function openSearch() {
        isVisible = true;
    }

    export function closeSearch() {
        isVisible = false;
        // TODO: Clear input
    }

    $effect(() => {
        window.addEventListener("keydown", handleKeyDown);
        return () => {
            window.removeEventListener("keydown", handleKeyDown);
        };
    });
</script>

{#if isVisible}
    <div
        class="z-999 top-0 left-0 w-dvw h-dvh flex bg-gv-overlay
               {isMobile ? 'fixed items-end' : 'fixed items-center justify-center'}"
    >
        <div
            class="bg-white flex flex-col p-2 overflow-hidden max-h-[90vh]
                   {isMobile ? 'w-full h-8/9 rounded-t-1' : `w-3/5 rounded-1`}"
        >
            <div class="w-full flex-1 min-h-0 flex flex-col overflow-y-scroll overflow-x-hidden gap-2">
                <div class="w-full flex items-center justify-start gap-2 pl-1">
                    <Input placeholder="Artikel suchen..." title="" showTitle={false} />
                    <button
                        type="button"
                        class="cursor-pointer ml-auto hover:bg-gv-hover-effect flex items-center justify-center p-2 rounded-2"
                        bind:this={closeBtn}
                        onclick={closeSearch}
                    >
                        <span class="material-symbols-rounded text-icon-dt-2">close</span>
                    </button>
                </div>

                <div class="flex flex-coll items-center w-full h-full overflow-x-hidden overflow-y-auto">
                    {#if results.length > 0}
                        {#each results as article}
                            <button class="w-full cursor-pointer group"
                                    onclick={async () => {closeSearch(); await getArticle(article.id)}}>
                                {#if isMobile}
                                    <Card>
                                        <div class="flex flex-col items-start justify-start w-full h-full gap-2">
                                            <p class="text-gv-dark-text font-bold text-dt-3">{article.title}</p>
                                            <p class="text-gv-light-text text-dt-5 line-clamp-2 truncate">{article.description}</p>
                                            <div class="w-full flex items-center justify-start gap-2 flex-wrap">
                                                {#each article.tags as tag}
                                                    <Chip text={tag} />
                                                {/each}
                                            </div>
                                        </div>
                                    </Card>
                                {:else}
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
                                {/if}
                            </button>
                        {/each}
                    {:else}
                        <Card>
                            <p class="text-gv-dark-text text-dt-3 font-medium pt-10 pb-10">Keine Artikel gefunden...</p>
                        </Card>
                    {/if}
                </div>
            </div>
        </div>
    </div>
{/if}