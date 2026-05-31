<script>
    import { addBlock } from "../../services/textEditorService.svelte";
    import { tick } from "svelte";
    import { editorSelectionStore } from "../../stores/textEditorStore.svelte";
    import TextBlock from "./Blocks/TextBlock.svelte";
    import H1Block from "./Blocks/H1Block.svelte";
    import H2Block from "./Blocks/H2Block.svelte";
    import H3Block from "./Blocks/H3Block.svelte";
    import H4Block from "./Blocks/H4Block.svelte";
    import Image from "./Blocks/Image.svelte";
    import BlockQuote from "./Blocks/BlockQuote.svelte";

    let {
        reportId,
        title = $bindable(""),
        author = "",
        readingTime = "",
        content = $bindable([]),
        isEditing = false,
        activeBlock = $bindable(null),
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

    function setup(node, item) {
        node.innerHTML = item.data;
        const contentEntryIndex = content.findIndex(i => i.id === item.id);
        if (contentEntryIndex !== -1 && contentEntryIndex === 0) {
            node.focus();
        }

        return {
            update(newData) {
            }, destroy() {
            }
        };
    }

    function handleKeyDown(e) {
        const currentBlock = e.currentTarget;

        if (e.key === "Enter") {
            if (e.shiftKey) return;

            e.preventDefault();

            const selection = window.getSelection();
            const range = selection.getRangeAt(0);

            const splitRange = document.createRange();
            splitRange.setStart(range.startContainer, range.startOffset);
            splitRange.setEndAfter(currentBlock.lastChild || currentBlock);

            const docFragment = splitRange.extractContents();

            const id = currentBlock.dataset.id;

            const tempDiv = document.createElement("div");
            tempDiv.appendChild(docFragment);
            const newHTML = tempDiv.innerHTML;

            // Update internal data
            const index = content.findIndex(i => i.id === id);
            content[index].data = currentBlock.innerHTML;

            // Create new block
            const newBlockId = addBlock(content, index, newHTML, "text");
            if (newBlockId) {
                tick().then(() => {
                    const newBlock = document.querySelector(`[data-id="${newBlockId}"]`);
                    if (newBlock) {
                        // @ts-ignore
                        // can be ignored as only contenteditable divs have the data-id attribute
                        newBlock.focus();
                    }
                });
            }

            return;
        }

        if (e.key === "Backspace" && currentBlock.textContent.trim().length === 0) {
            const hasMedia = currentBlock.querySelector("img") !== null;

            if (!hasMedia) {
                if (content.length > 1) {
                    e.preventDefault();

                    const id = currentBlock.dataset.id;
                    const index = content.findIndex(i => i.id === id);

                    const previousIndex = index > 0 ? index - 1 : 0;
                    const previousId = content[previousIndex].id;

                    content.splice(index, 1);

                    tick().then(() => {
                        const prevEl = document.querySelector(`[data-id="${previousId}"]`);
                        if (prevEl) {
                            // @ts-ignore
                            // can be ignored as only contenteditable divs have the data-id attribute
                            prevEl.focus();

                            // Update caret position
                            const range = document.createRange();
                            range.selectNodeContents(prevEl);
                            range.collapse(false);
                            const sel = window.getSelection();
                            sel.removeAllRanges();
                            sel.addRange(range);
                        }
                    });
                    return;
                }
            }
        }

        if (e.key === "ArrowUp") {
            if (isCaretAtBoundary(currentBlock, "top")) {
                e.preventDefault();
                const index = content.findIndex(i => i.id === currentBlock.dataset.id);
                if (index > 0) {
                    const block = document.querySelector(`[data-id="${content[index - 1].id}"]`);
                    if (block) {
                        // @ts-ignore
                        block.focus();

                        const selection = window.getSelection();
                        const range = document.createRange();
                        range.selectNodeContents(block);
                        range.collapse(false); // Move to end

                        selection.removeAllRanges();
                        selection.addRange(range);
                    }
                }
            }
        }

        if (e.key === "ArrowDown") {
            if (isCaretAtBoundary(currentBlock, "bottom")) {
                e.preventDefault();
                const index = content.findIndex(i => i.id === currentBlock.dataset.id);
                if (index > -1) {
                    tick().then(() => {
                        const block = document.querySelector(`[data-id="${content[index + 1].id}"]`);
                        if (block) {
                            // @ts-ignore
                            block.focus();

                            const selection = window.getSelection();
                            const range = document.createRange();
                            range.selectNodeContents(block);
                            range.collapse(true); // Move to start

                            selection.removeAllRanges();
                            selection.addRange(range);
                        }
                    })
                }
            }
        }
    }

    function isCaretAtBoundary(el, side) {
        const selection = window.getSelection();
        if (selection.rangeCount === 0) return false;

        const range = selection.getRangeAt(0);
        const cursorRect = range.getClientRects()[0];
        const blockRect = el.getBoundingClientRect();

        if (!cursorRect) return true;

        if (side === 'top') {
            return cursorRect.top - blockRect.top < 10;
        } else {
            return blockRect.bottom - cursorRect.bottom < 10;
        }
    }

    $effect(() => {
        const handleSelection = () => {
            const sel = window.getSelection();
            if (!sel || sel.rangeCount === 0) return;

            const range = sel.getRangeAt(0);

            const editable = range.commonAncestorContainer?.parentElement?.closest?.("[contenteditable=\"true\"]");
            // @ts-ignore
            const itemId = editable?.dataset?.id;

            const block = content.find(i => i.id === itemId);
            const { isBold, isItalic, isUnderline } = getActiveStylesInRange(range);

            editorSelectionStore.itemId = itemId;
            editorSelectionStore.root = sel.anchorNode?.parentElement ?? null;
            editorSelectionStore.range = range;

            editorSelectionStore.activeStyles = {
                isBold: isBold,
                isItalic: isItalic,
                isUnderline: isUnderline,
                blockType: block ? block.type : "text"
            };
        };

        document.addEventListener('selectionchange', handleSelection);
        return () => document.removeEventListener('selectionchange', handleSelection);
    });

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
            if (tagName === "U") isUnderline = true;

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
                <TextBlock bind:item={content[index]} isEditing={isEditing} handleKeyDown={handleKeyDown} setup={setup}
                           bind:activeBlock={activeBlock} />
            {:else if item.type === "h1"}
                <H1Block bind:item={content[index]} isEditing={isEditing} handleKeyDown={handleKeyDown} setup={setup}
                         bind:activeBlock={activeBlock} />
            {:else if item.type === "h2"}
                <H2Block bind:item={content[index]} isEditing={isEditing} handleKeyDown={handleKeyDown} setup={setup}
                         bind:activeBlock={activeBlock} />
            {:else if item.type === "h3"}
                <H3Block bind:item={content[index]} isEditing={isEditing} handleKeyDown={handleKeyDown} setup={setup}
                         bind:activeBlock={activeBlock} />
            {:else if item.type === "h4"}
                <H4Block bind:item={content[index]} isEditing={isEditing} handleKeyDown={handleKeyDown} setup={setup}
                         bind:activeBlock={activeBlock} />
            {:else if item.type === "blockquote"}
                <BlockQuote bind:item={content[index]} isEditing={isEditing} handleKeyDown={handleKeyDown} setup={setup}
                           bind:activeBlock={activeBlock} />
            {:else if item.type === "image"}
                <!-- Pointer events none prevents the raw image from stealing the drag target focus -->
                <div class="pointer-events-none select-none flex justify-start w-full">
                    <Image reportId={reportId} imageId={item.data} />
                </div>
            {/if}
        </div>
    {/each}
</div>