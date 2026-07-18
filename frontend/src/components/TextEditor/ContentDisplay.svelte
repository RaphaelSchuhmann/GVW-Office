<script>
    import { addBlock, bulkInsertImageBlocks, handleAutoLink } from "../../services/textEditorService.svelte";
    import { tick } from "svelte";
    import { editorSelectionStore } from "../../stores/textEditorStore.svelte";
    import TextBlock from "./Blocks/TextBlock.svelte";
    import H1Block from "./Blocks/H1Block.svelte";
    import H2Block from "./Blocks/H2Block.svelte";
    import H3Block from "./Blocks/H3Block.svelte";
    import H4Block from "./Blocks/H4Block.svelte";
    import Image from "./Blocks/Image.svelte";
    import BlockQuote from "./Blocks/BlockQuote.svelte";
    import { sanitize } from "../../services/utils.js";
    import { textEditorConfigs } from "../../lib/textEditorConfig.svelte.js";

    let {
        reportId,
        title = $bindable(""),
        author = "",
        readingTime = "",
        content = $bindable([]),
        isEditing = false,
        activeBlock = $bindable(null),
        configKey,
        isMobile = false,
        ...restProps
    } = $props();

    const showAuthor = $derived(textEditorConfigs[configKey].showAuthor || false);

    let draggedIndex = $state(null);

    /**
     * Sets the drag source index when starting a drag operation.
     *
     * Only works in editing mode. Stores the index of the dragged block
     * and configures the DataTransfer object for a move operation.
     *
     * @param {DragEvent} event - The drag start event
     * @param {number} index - Index of the dragged item in the content array
     */
    function handleDragStart(event, index) {
        if (!isEditing) return;
        draggedIndex = index;
        event.dataTransfer.effectAllowed = "move";
    }

    /**
     * Sets the drag source index when starting a drag operation.
     *
     * Only works in editing mode. Stores the index of the dragged block
     * and configures the DataTransfer object for a move operation.
     *
     * @param {DragEvent} event - The drag start event
     * @param {number} index - Index of the dragged item in the content array
     */
    function handleDragEnter(event, index) {
        if (!isEditing || draggedIndex === null || draggedIndex === index) return;

        const updatedItems = [...content];
        const [draggedItem] = updatedItems.splice(draggedIndex, 1);
        updatedItems.splice(index, 0, draggedItem);

        draggedIndex = index;
        content = updatedItems;
    }

    /**
     * Resets drag state after a drag operation completes.
     *
     * Clears the internal dragged index reference.
     *
     * @returns {void}
     */
    function handleDragEnd() {
        draggedIndex = null;
    }

    /**
     * Initializes a contenteditable block with its HTML content.
     *
     * Sets the initial DOM content and optionally focuses the first block
     * in the editor for improved UX.
     *
     * @param {HTMLElement} node - The DOM node representing the block
     * @param {Object} item - The block data object
     * @param {string} item.id - Unique block identifier
     * @param {string} item.data - HTML content of the block
     *
     * @returns {{ update: Function, destroy: Function }}
     */
    function setup(node, item) {
        node.innerHTML = sanitize(item.data);
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

    /**
     * Handles keyboard interactions inside an editor block.
     *
     * Supports:
     * - Auto-link detection on space/enter
     * - Enter key block splitting
     * - Backspace rich-link deletion handling
     * - Arrow key navigation between blocks
     *
     * Updates the internal `content` array to stay in sync with DOM changes.
     *
     * @param {KeyboardEvent} e - The keyboard event
     * @returns {void}
     */
    function handleKeyDown(e) {
        const currentBlock = e.currentTarget;
        // @ts-ignore
        const index = content.findIndex(i => i.id === currentBlock.dataset.id);

        handleAutoLink(e, currentBlock, (updatedHtml) => {
            content[index].data = updatedHtml;
        });

        if (e.key === "Enter") {
            if (e.shiftKey) return;

            e.preventDefault();

            const selection = window.getSelection();
            const range = selection.getRangeAt(0);

            const splitRange = document.createRange();
            splitRange.setStart(range.startContainer, range.startOffset);
            splitRange.selectNodeContents(currentBlock);
            splitRange.setStart(range.startContainer, range.startOffset);

            const docFragment = splitRange.extractContents();

            // @ts-ignore
            const id = currentBlock.dataset.id;

            const tempDiv = document.createElement("div");
            tempDiv.appendChild(docFragment);
            const newHTML = tempDiv.innerHTML;

            // Update internal data
            const index = content.findIndex(i => i.id === id);
            content[index].data = sanitize(currentBlock.innerHTML);

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

        if (e.key === "Backspace") {
            const selection = window.getSelection();

            if (selection && selection.rangeCount > 0) {
                const range = selection.getRangeAt(0);
                let targetNode = range.startContainer;

                if (targetNode.nodeType === Node.TEXT_NODE && range.startOffset === 0) {
                    targetNode = targetNode.previousSibling;
                } else if (targetNode.nodeType === Node.ELEMENT_NODE) {
                    targetNode = targetNode.childNodes[range.startOffset - 1];
                }

                // If the element right behind the cursor is a rich link, blow it up entirely
                // @ts-ignore
                if (targetNode && targetNode.nodeType === Node.ELEMENT_NODE && targetNode.getAttribute?.("data-rich-link") === "true") {
                    e.preventDefault();
                    targetNode.parentNode.removeChild(targetNode);

                    // Sync current state to the Svelte array index item
                    // @ts-ignore
                    const id = currentBlock.dataset.id;
                    const index = content.findIndex(i => i.id === id);
                    if (index !== -1) {
                        content[index].data = sanitize(currentBlock.innerHTML);
                    }
                    return;
                }
            }

            if (currentBlock.textContent.trim().length === 0) {
                const hasMedia = currentBlock.querySelector("img") !== null;

                if (!hasMedia) {
                    if (content.length > 1) {
                        e.preventDefault();

                        // @ts-ignore
                        const id = currentBlock.dataset.id;
                        const index = content.findIndex(i => i.id === id);

                        const previousIndex = index > 0 ? index - 1 : 0;
                        const previousId = content[previousIndex].id;

                        content.splice(index, 1);

                        tick().then(() => {
                            const prevEl = document.querySelector(`[data-id="${previousId}"]`);
                            if (prevEl) {
                                // @ts-ignore
                                prevEl.focus();

                                // Update caret position smoothly to end of the previous block
                                const range = document.createRange();
                                range.selectNodeContents(prevEl);
                                range.collapse(false);
                                const sel = window.getSelection();
                                if (sel) {
                                    sel.removeAllRanges();
                                    sel.addRange(range);
                                }
                            }
                        });
                        return;
                    }
                }
            }
        }

        if (e.key === "ArrowUp") {
            if (isCaretAtBoundary(currentBlock, "top")) {
                e.preventDefault();
                // @ts-ignore
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
                // @ts-ignore
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
                    });
                }
            }
        }
    }

    /**
     * Handles image paste events inside the editor.
     *
     * Extracts image files from clipboard data and inserts them as
     * new image blocks at the current cursor position.
     *
     * Prevents default paste behavior when images are detected.
     *
     * @param {ClipboardEvent} e - The paste event
     * @returns {void}
     */
    function handlePaste(e) {
        const items = Array.from(e.clipboardData.items);
        const files = items.filter(item => item.type.startsWith("image/")).map(item => item.getAsFile());

        if (files.length === 0) return;

        e.preventDefault();

        const currentIndex = content.findIndex(item => item.id === activeBlock);
        if (currentIndex === -1) return;

        bulkInsertImageBlocks(files, content, currentIndex);
    }

    /**
     * Handles drag-and-drop image uploads into the editor.
     *
     * Extracts image files from the drop event and inserts them
     * into the document at the active block position.
     *
     * Prevents default browser drop behavior.
     *
     * @param {DragEvent} e - The drop event
     * @returns {void}
     */
    function handleDrop(e) {
        e.preventDefault();

        if (e.dataTransfer.items) {
            const currentIndex = content.findIndex(item => item.id === activeBlock);
            if (currentIndex === -1) return;

            const files = [];

            for (let i = 0; i < e.dataTransfer.items.length; i++) {
                if (e.dataTransfer.items[i].kind === "file") {
                    const file = e.dataTransfer.items[i].getAsFile();
                    if (file && file.type.startsWith("image/")) {
                        files.push(file);
                    }
                }
            }

            if (files.length > 0) {
                bulkInsertImageBlocks(files, content, currentIndex);
            }
        }
    }

    /**
     * Determines whether the caret is near the top or bottom boundary of a block.
     *
     * Used for handling arrow key navigation between blocks.
     *
     * @param {HTMLElement} el - The block element
     * @param {"top"|"bottom"} side - Boundary to check
     * @returns {boolean}
     */
    function isCaretAtBoundary(el, side) {
        const selection = window.getSelection();
        if (selection.rangeCount === 0) return false;

        const range = selection.getRangeAt(0);
        const cursorRect = range.getClientRects()[0];
        const blockRect = el.getBoundingClientRect();

        if (!cursorRect) return true;

        if (side === "top") {
            return cursorRect.top - blockRect.top < 10;
        } else {
            return blockRect.bottom - cursorRect.bottom < 10;
        }
    }

    /**
     * Tracks the current text selection and updates the editor selection store.
     *
     * Runs on every `selectionchange` event and determines:
     * - Active block ID
     * - Current selection range
     * - Active formatting styles (bold, italic, underline)
     * - Block type context
     *
     * Keeps toolbar state in sync with the user's selection.
     */
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

        document.addEventListener("selectionchange", handleSelection);
        return () => document.removeEventListener("selectionchange", handleSelection);
    });

    /**
     * Determines active text formatting styles within a selection range.
     *
     * Combines caret-based and range-based detection to infer whether
     * bold, italic, or underline formatting is active.
     *
     * @param {Range} range - The current selection range
     * @returns {{ isBold: boolean, isItalic: boolean, isUnderline: boolean }}
     */
    function getActiveStylesInRange(range) {
        if (range.collapsed) {
            return getStylesAtCaret(range);
        }

        const start = getStylesAtNode(range.startContainer);
        const end = getStylesAtNode(range.endContainer);

        let isBold = start.isBold || end.isBold;
        let isItalic = start.isItalic || end.isItalic;
        let isUnderline = start.isUnderline || end.isUnderline;

        let ancestor = range.commonAncestorContainer;
        let checkEl = ancestor.nodeType === Node.TEXT_NODE ? ancestor.parentElement : ancestor;

        while (checkEl) {
            if (checkEl.matches?.("strong, b")) isBold = true;
            if (checkEl.matches?.("em, i")) isItalic = true;
            if (checkEl.matches?.("u")) isUnderline = true;
            if (checkEl.getAttribute?.("contenteditable") === "true") break;
            checkEl = checkEl.parentElement;
        }

        if (ancestor instanceof HTMLElement || ancestor.nodeType === Node.TEXT_NODE) {
            const parentNode = ancestor.nodeType === Node.TEXT_NODE ? ancestor.parentElement : ancestor;

            // Grab only formatting elements inside the parent container
            const subNodes = parentNode.querySelectorAll("strong, b, em, i, u");
            subNodes.forEach(node => {
                // Check if this specific formatting node intersects the user's selection range
                if (range.intersectsNode(node)) {
                    if (node.matches("strong, b")) isBold = true;
                    if (node.matches("em, i")) isItalic = true;
                    if (node.matches("u")) isUnderline = true;
                }
            });
        }

        return { isBold, isItalic, isUnderline };
    }

    /**
     * Retrieves formatting styles at the caret position.
     *
     * @param {Range} range - Selection range collapsed at caret
     * @returns {{ isBold: boolean, isItalic: boolean, isUnderline: boolean }}
     */
    function getStylesAtCaret(range) {
        return getStylesAtNode(range.startContainer);
    }

    /**
     * Traverses DOM ancestors to detect active text formatting styles.
     *
     * Checks for <b>, <strong>, <i>, <em>, and <u> tags up the DOM tree
     * until reaching a contenteditable boundary.
     *
     * @param {Node} node - DOM node inside selection
     * @returns {{ isBold: boolean, isItalic: boolean, isUnderline: boolean }}
     */
    function getStylesAtNode(node) {
        let el = node.nodeType === Node.TEXT_NODE ? node.parentElement : node;

        let isBold = false;
        let isItalic = false;
        let isUnderline = false;

        while (el) {
            if (el.matches?.("strong, b")) isBold = true;
            if (el.matches?.("em, i")) isItalic = true;
            if (el.matches?.("u")) isUnderline = true;

            if (el.getAttribute?.("contenteditable") === "true") break;

            el = el.parentElement;
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
            {#if showAuthor}
                <div class="flex items-center justify-start gap-2">
                    <span class="material-symbols-rounded text-icon-dt-5 text-gv-dark-text">person</span>
                    <p class="text-dt-6 text-gv-dark-text">{author}</p>
                </div>
            {/if}
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
                           bind:activeBlock={activeBlock} handlePaste={handlePaste} handleDrop={handleDrop} />
            {:else if item.type === "h1"}
                <H1Block bind:item={content[index]} isEditing={isEditing} handleKeyDown={handleKeyDown} setup={setup}
                         bind:activeBlock={activeBlock} handlePaste={handlePaste} handleDrop={handleDrop} />
            {:else if item.type === "h2"}
                <H2Block bind:item={content[index]} isEditing={isEditing} handleKeyDown={handleKeyDown} setup={setup}
                         bind:activeBlock={activeBlock} handlePaste={handlePaste} handleDrop={handleDrop} />
            {:else if item.type === "h3"}
                <H3Block bind:item={content[index]} isEditing={isEditing} handleKeyDown={handleKeyDown} setup={setup}
                         bind:activeBlock={activeBlock} handlePaste={handlePaste} handleDrop={handleDrop} />
            {:else if item.type === "h4"}
                <H4Block bind:item={content[index]} isEditing={isEditing} handleKeyDown={handleKeyDown} setup={setup}
                         bind:activeBlock={activeBlock} handlePaste={handlePaste} handleDrop={handleDrop} />
            {:else if item.type === "blockquote"}
                <BlockQuote bind:item={content[index]} isEditing={isEditing} handleKeyDown={handleKeyDown} setup={setup}
                            bind:activeBlock={activeBlock} handlePaste={handlePaste} handleDrop={handleDrop} />
            {:else if item.type === "image"}
                <!-- Pointer events none prevents the raw image from stealing the drag target focus -->
                <div class="select-none flex justify-start w-full">
                    <Image reportId={reportId} imageId={item.data} content={content} blockId={item.id}
                           isEditing={isEditing} isMobile={isMobile} />
                </div>
            {/if}
        </div>
    {/each}
</div>