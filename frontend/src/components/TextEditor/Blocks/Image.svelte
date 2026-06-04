<script>
    import { deleteBlock, getDocumentImage, previewUrls } from "../../../services/textEditorService.svelte.js";
    import Spinner from "../../Spinner.svelte";

    let {
        imageId,
        reportId,
        blockId,
        content,
        alt = "Bericht bild",
        ...restProps
    } = $props();

    let srcUrl = $state(null);
    let isLoading = $state(true);

    $effect(() => {
        let active = true;
        isLoading = true;

        async function loadImage() {
            if (imageId.startsWith("temp_")) {
                const url = previewUrls.get(imageId);
                if (active) {
                    srcUrl = url;
                    isLoading = false;
                }
            } else {
                const url = await getDocumentImage(reportId, imageId);
                if (active) {
                    srcUrl = url;
                    isLoading = false;
                }
            }
        }

        loadImage();

        return () => {
            active = false;
            if (srcUrl) URL.revokeObjectURL(srcUrl);
        };
    });
</script>

{#if isLoading}
    <div class="flex items-center justify-center rounded-2 w-full border-2 border-gv-border p-10">
        <Spinner />
    </div>
{:else}
    <div class="relative group rounded-2 border-2 border-gv-border hover:border-gv-border-bar">
        <button
            class="absolute top-2 right-2 hidden group-hover:flex items-center justify-center cursor-pointer bg-gv-primary/20 rounded-2 border border-gv-primary p-2 text-gv-dark-text hover:text-gv-delete-hover"
            onclick={() => deleteBlock(content, blockId, true)}
        >
            <span class="material-symbols-rounded">delete</span>
        </button>
        <img src={srcUrl} alt={alt} class="rounded-2" />
    </div>
{/if}