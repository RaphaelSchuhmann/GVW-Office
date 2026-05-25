<script>
    import Image from "./Image.svelte";
    import { editorSelectionStore } from "../../stores/textEditorSelection.svelte.js";
    import { convertHTMLToRaw, renderToHTML } from "../../services/textEditorService.svelte.js";
    import { untrack } from "svelte";

    let {
        reportId,
        title = $bindable(""),
        author = "",
        readingTime = "",
        content = $bindable([]),
        isEditing = false,
        ...restProps
    } = $props();

    let draggedIndex = $state(null);

    function handleDragStart(event, index) {
        if (!isEditing) return;
        draggedIndex = index;
        event.dataTransfer.effectAllowed = "move";
    }

    function handleDragEnter(event, index) {
        if (!isEditing || draggedIndex === null || draggedIndex === index) return;

        const updatedItems = [...content];
        const [draggedItem] = updatedItems.splice(draggedIndex, 1);
        updatedItems.splice(index, 0, draggedItem);

        draggedIndex = index;
        content = updatedItems;
    }

    function handleDragEnd() {
        draggedIndex = null;
    }

    $effect(() => {
        const handleSelection = () => {
            const sel = window.getSelection();
            if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return;

            const range = sel.getRangeAt(0);

            const startNode = sel.anchorNode;
            const endNode = sel.focusNode;

            const getSpan = (node) => {
                if (!node) return null;
                const el = node.nodeType === 3 ? node.parentElement : node;
                return el.closest('span[data-index]');
            };

            const startSpan = getSpan(startNode);
            const endSpan = getSpan(endNode);

            if (startSpan && endSpan) {
                const sIdx = parseInt(startSpan.dataset.index);
                const eIdx = parseInt(endSpan.dataset.index);

                editorSelectionStore.isMultitoken = sIdx !== eIdx;
                editorSelectionStore.startOffset = range.startOffset + sIdx;
                editorSelectionStore.endOffset = range.endOffset + eIdx;
            } else {
                editorSelectionStore.startOffset = range.startOffset;
                editorSelectionStore.endOffset = range.endOffset;
            }
        };

        document.addEventListener('selectionchange', handleSelection);
        return () => document.removeEventListener('selectionchange', handleSelection);
    });

    function trackSelection(event) {
        if (!isEditing) return;

        const selection = window.getSelection();
        if (!selection) {
            editorSelectionStore.itemId = null;
            return;
        }

        const range = selection.getRangeAt(0);

        const ancestor = range.commonAncestorContainer;

        const elementToCheck = ancestor.nodeType === Node.TEXT_NODE
            ? ancestor.parentElement
            : ancestor;

        let editableDiv = null;

        const isEditable = elementToCheck.getAttribute('contenteditable') === 'true';

        if (isEditable) {
            editableDiv = elementToCheck;
        } else {
            editableDiv = elementToCheck.closest('[contenteditable="true"]');
        }
        if (!editableDiv) return;

        const { isBold, isItalic, isUnderline } = getActiveStylesInRange(range);
        editorSelectionStore.itemId = editableDiv.dataset.id;
        editorSelectionStore.isBold = isBold;
        editorSelectionStore.isItalic = isItalic;
        editorSelectionStore.isUnderline = isUnderline;
    }

    function getActiveStylesInRange(range) {
        if (!range) return { isBold: false, isItalic: false, isUnderline: false };

        let container = range.commonAncestorContainer;
        if (container.nodeType === Node.TEXT_NODE) {
            container = container.parentNode;
        }

        let isBold = false;
        let isItalic = false;
        let isUnderline = false;
        let current = container;

        while (current) {
            const tagName = current.tagName;

            if (tagName === "STRONG" || tagName === "B") isBold = true;
            if (tagName === "EM" || tagName === "I") isItalic = true;
            if (tagName === "U") isItalic = true;

            if (current.getAttribute("contenteditable") === "true") break;

            current = current.parentElement;
        }

        return { isBold, isItalic, isUnderline };
    }
</script>

<div class="h-full flex flex-col items-start justify-start gap-1 w-full overflow-y-auto overflow-x-hidden">
    {#if isEditing}
        <input type="text" class="text-dt-3 text-gv-dark-text ml-9.5" bind:value={title} placeholder="Berichttitel" />
    {:else}
        <p class={`text-dt-3 text-gv-dark-text`}>{title}</p>
    {/if}

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

    {#each content as item, index (item.id)}
        <div
            class="group flex items-start justify-start gap-2 p-2 rounded transition-all duration-75 w-full"
            class:opacity-40={draggedIndex === index}
            ondragenter={(e) => handleDragEnter(e, index)}
            ondragover={(e) => e.preventDefault()}
            aria-label="Draggable item"
            role="group"
        >
            {#if isEditing}
                <span
                    draggable={isEditing}
                    class="material-symbols-rounded text-gv-light-text cursor-grab active:cursor-grabbing select-none group-hover:opacity-100 opacity-0"
                    ondragstart={(e) => handleDragStart(e, index)}
                    ondragend={handleDragEnd}
                    aria-label="Drag to reorder"
                    role="presentation"
                >
                    drag_indicator
                </span>
            {/if}

            {#if item.type === "text"}
                {#if isEditing}
                    <div
                        contenteditable="true"
                        role="textbox"
                        tabindex="0"
                        aria-multiline="true"
                        aria-label="Edit text content"
                        class="w-full text-base text-gv-dark-text outline-none whitespace-normal break-all overflow-wrap-anywhere"
                        class:select-none={!isEditing}
                        data-id={item.id}
                        onmouseup={trackSelection}
                        onkeyup={trackSelection}
                        oninput={(e) => {item.data = convertHTMLToRaw(e.currentTarget.innerHTML)}}
                    >
                        {#key item.version}
                            {@html untrack(() => renderToHTML(item.data))}
                        {/key}
                    </div>
                {:else}
                    <div class="select-none">
                        {@html renderToHTML(item.data)}
                    </div>
                {/if}
            {:else if item.type === "image"}
                <!-- Pointer events none prevents the raw image from stealing the drag target focus -->
                <div class="pointer-events-none select-none flex justify-start w-full">
                    <Image reportId={reportId} imageId={item.data} />
                </div>
            {/if}
        </div>
    {/each}
</div>