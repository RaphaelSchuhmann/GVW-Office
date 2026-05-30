<script>
    import ButtonSelect from "./ButtonSelect.svelte";
    import StyleButton from "./StyleButton.svelte";
    import ImageUpload from "./ImageUpload.svelte";
    import LinkItem from "./LinkItem.svelte";
    import { textEditorConfigs } from "../../lib/textEditorConfig.svelte.js";
    import ContentDisplay from "./ContentDisplay.svelte";
    import { editorSelectionStore } from "../../stores/textEditorStore.svelte.js";

    let {
        itemData = $bindable({}),
        draft = $bindable({}),
        page = "",
        isEditing = $bindable(false),
        ...restProps
    } = $props();

    const config = $derived(textEditorConfigs[page]);
    let data = $state({
        title: "",
        author: "",
        readingTime: "",
        content: []
    });

    let boldEnabled = $derived(editorSelectionStore.activeStyles.isBold);
    let italicEnabled = $derived(editorSelectionStore.activeStyles.isItalic);
    let underlineEnabled = $derived(editorSelectionStore.activeStyles.isUnderline);

    $effect(() => {
        if (!config) {
            console.warn(`Unknown editor config page key: ${page}`);
        }
    });

    $effect(() => {
        if (isEditing) {
            data.title = draft?.title;
            data.author = draft?.author;
            data.readingTime = draft?.readingTimeInMinutes;
            data.content = draft?.content;
        } else {
            data.title = itemData?.title;
            data.author = itemData?.author;
            data.readingTime = itemData?.readingTimeInMinutes;
            data.content = itemData?.content;
        }
    });

    function updateStyle(action) {

    }
</script>

<div class="w-full h-full flex flex-col items-start justify-start rounded-1 bg-white drop-shadow-md">
    {#if isEditing}
        <div class="w-full flex items-center justify-start gap-2 border-b-2 border-gv-border p-2">
            <ButtonSelect selected={config?.optionMap["text"]} options={config?.options} fillHeight={true}
                          disabled={true} />

            <div class="w-0.75 bg-gv-separator h-full rounded-1"></div>

            <div class="flex items-center gap-1">
                <StyleButton icon="format_bold" disabled={!isEditing}
                             bind:isToggled={editorSelectionStore.activeStyles.isBold}
                             onmousedown={(e) => {updateStyle(`bold:${!editorSelectionStore.activeStyles.isBold}`)}} />
                <StyleButton icon="format_underlined" disabled={!isEditing}
                             bind:isToggled={editorSelectionStore.activeStyles.isUnderline}
                             onmousedown={(e) => {updateStyle(`underline:${!editorSelectionStore.activeStyles.isUnderline}`)}} />
                <StyleButton icon="format_italic" disabled={!isEditing}
                             bind:isToggled={editorSelectionStore.activeStyles.isItalic}
                             onmousedown={(e) => {updateStyle(`bold:${!editorSelectionStore.activeStyles.isItalic}`)}} />
            </div>

            <div class="w-0.75 bg-gv-separator h-full rounded-1"></div>

            <div class="flex items-center gap-1">
                <!--<StyleButton icon="format_list_bulleted" disabled={true} /> TODO: Coming 1.1-->
                <ImageUpload disabled={true} />
                <!--<LinkItem id={itemData.id} page={page} disabled={true}/> TODO: Coming 1.2-->
                <StyleButton icon="format_quote" disabled={true} onmousedown={(e) => {}} />
            </div>
        </div>
    {/if}
    <div class="flex flex-col w-full h-full items-start justify-start">
        <div class="flex flex-col items-start justify-start p-5 pl-8 pr-8 gap-4 max-w-3/5 w-3/5 h-full">
            <ContentDisplay reportId={itemData.id} bind:title={data.title} author={data.author}
                            readingTime={data.readingTime} bind:content={data.content} isEditing={isEditing} />
        </div>
    </div>
</div>