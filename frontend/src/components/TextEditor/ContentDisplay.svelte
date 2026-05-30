<script>
    import { addBlock } from "../../services/textEditorService.svelte";
    import Image from "./Image.svelte";
    import { tick } from "svelte";

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

    function setup(node, item) {
        node.innerHTML = item.data;
        const contentEntryIndex = content.findIndex(i => i.id === item.id);
        if (contentEntryIndex !== -1 && contentEntryIndex === 0) {
            node.focus();
        }

        return { update(newData) {}, destroy() {} };
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
            const hasMedia = currentBlock.querySelector('img') !== null;

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

        const index = content.findIndex(i => i.id === currentBlock.dataset.id);
        if (index === -1) return;
        content[index].data = currentBlock.innerHTML;
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
                        onkeydown={(e) => handleKeyDown(e)}
                        use:setup={item}
                    ></div>
                {:else}
                    <div class="select-none">
                        {@html item.data}
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