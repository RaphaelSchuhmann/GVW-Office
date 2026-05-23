<script>
    import ButtonSelect from "./ButtonSelect.svelte";
    import StyleButton from "./StyleButton.svelte";
    import ImageUpload from "./ImageUpload.svelte";
    import LinkItem from "./LinkItem.svelte";
    import { textEditorConfigs } from "../../lib/textEditorConfig.svelte.js";
    import ContentDisplay from "./ContentDisplay.svelte";


    let {
        reportData = $bindable({}),
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
            data.title = reportData?.title;
            data.author = reportData?.author;
            data.readingTime = reportData?.readingTimeInMinutes;
            data.content = reportData?.content;
        }
    })
</script>

<div class="w-full h-full flex flex-col items-start justify-start rounded-1 bg-white drop-shadow-md">
    {#if isEditing}
        <div class="w-full flex items-center justify-start gap-2 border-b-2 border-gv-border p-2">
            <ButtonSelect selected={config?.optionMap["text"]} options={config?.options} fillHeight={true} disabled={true} />

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
                <LinkItem id={reportData.id} page={page} disabled={true}/>
                <StyleButton icon="format_quote" disabled={true} />
            </div>
        </div>
    {/if}
    <div class="flex flex-col w-full h-full items-center justify-start">
        <div class="flex flex-col items-start justify-start p-5 pl-8 pr-8 gap-4 max-w-3/5 w-3/5 h-full">
            <ContentDisplay reportId={reportData.id} bind:title={data.title} author={data.author} readingTime={data.readingTime} bind:content={data.content} isEditing={isEditing} />
        </div>
    </div>
</div>