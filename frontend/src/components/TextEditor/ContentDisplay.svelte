<script>
    import { apiGetReportImage } from "../../api/apiReports.svelte.js";
    import { getReportImage } from "../../services/reportService.svelte.js";
    import Image from "./Image.svelte";

    let {
        reportId,
        content = $bindable([]), // Using $bindable ensures the parent array updates too
        isEditing = false,
        ...restProps
    } = $props();

    let draggedIndex = $state(null);

    function handleDragStart(event, index) {
        if (!isEditing) return;
        draggedIndex = index;

        // This stops the browser from trying to drag the actual image file or text selection
        event.dataTransfer.effectAllowed = 'move';
    }

    function handleDragEnter(event, index) {
        if (!isEditing || draggedIndex === null || draggedIndex === index) return;

        // Swap the array positions
        const updatedItems = [...content];
        const [draggedItem] = updatedItems.splice(draggedIndex, 1);
        updatedItems.splice(index, 0, draggedItem);

        // Update tracking to the new home index immediately
        draggedIndex = index;
        content = updatedItems;
    }

    function handleDragEnd() {
        draggedIndex = null;
    }
</script>

<div class="h-full flex flex-col items-start justify-start gap-1 w-full overflow-y-auto overflow-x-hidden">
    {#each content as item, index (item.id)}
        <div
            class="group flex items-start justify-start gap-2 p-2 rounded transition-all duration-75 w-full"
            class:opacity-40={draggedIndex === index}
            ondragenter={(e) => handleDragEnter(e, index)}
            ondragover={(e) => e.preventDefault()}
            aria-label="Drag to reorder item"
        >
            {#if isEditing}
                <span
                    draggable={isEditing}
                    class="material-symbols-rounded text-gv-light-text cursor-grab active:cursor-grabbing select-none group-hover:opacity-100 opacity-0"
                    ondragstart={(e) => handleDragStart(e, index)}
                    ondragend={handleDragEnd}
                >
                    drag_indicator
                </span>
            {/if}

            {#if item.type === "text"}
                <div contenteditable={isEditing} class="select-none text-base break-all text-gv-dark-text outline-none whitespace-normal break-words [overflow-wrap:anywhere]">{item.data}</div>
            {:else if item.type === "image"}
                <!-- Pointer events none prevents the raw image from stealing the drag target focus -->
                <div class="pointer-events-none select-none flex justify-start w-full">
                    <Image reportId={reportId} imageId={item.data} />
                </div>
            {/if}
        </div>
    {/each}
</div>