<script>
    import ButtonSelect from "./ButtonSelect.svelte";
    import StyleButton from "./StyleButton.svelte";
    import ImageUpload from "./ImageUpload.svelte";
    import LinkItem from "./LinkItem.svelte";
    import { textEditorConfigs } from "../../lib/textEditorConfig.svelte.js";

    let {
        id = "",
        title = "",
        author = "",
        readingTime = "",
        page = "",
        content = $bindable([]),
        isEditing = $bindable(false),
        ...restProps
    } = $props();

    const config = $derived(textEditorConfigs[page]);

    $effect(() => {
        if (!config) {
            console.warn(`Unknown editor config page key: ${page}`);
        }
    });


</script>

<div class="w-full h-full flex flex-col items-start justify-start rounded-1 bg-white drop-shadow-md">
    {#if isEditing}
        <div class="w-full flex items-center justify-start gap-2 border-b-2 border-gv-border p-2">
            <ButtonSelect selected={config?.optionMap["text"]} options={config?.options} fillHeight={true} />

            <div class="w-0.75 bg-gv-separator h-full rounded-1"></div>

            <div class="flex items-center gap-1">
                <StyleButton icon="format_bold" disabled={true} />
                <StyleButton icon="format_underlined" disabled={true} />
                <StyleButton icon="format_italic" disabled={true} />
            </div>

            <div class="w-0.75 bg-gv-separator h-full rounded-1"></div>

            <div class="flex items-center gap-1">
                <StyleButton icon="format_list_bulleted" disabled={true} />
                <ImageUpload disabled={true} />
                <LinkItem id={id} page={page} disabled={true}/>
                <StyleButton icon="format_quote" disabled={true} />
            </div>
        </div>
    {/if}
    <div class="flex flex-col items-start justify-start p-5 pl-8 pr-8 gap-4">
        <p class="text-dt-3 text-gv-dark-text">Document Title</p>
        {#if !isEditing}
            <div class="flex w-full items-center justify-start gap-4">
                <div class="flex items-center justify-start gap-2">
                    <span class="material-symbols-rounded text-icon-dt-5 text-gv-dark-text">person</span>
                    <p class="text-dt-6 text-gv-dark-text">{author}</p>
                </div>
                <div class="flex items-center justify-start gap-2">
                    <span class="material-symbols-rounded text-icon-dt-5 text-gv-dark-text">overview</span>
                    <p class="text-dt-6 text-gv-dark-text">{readingTime} Minuten</p>
                </div>
            </div>
        {/if}
    </div>
</div>