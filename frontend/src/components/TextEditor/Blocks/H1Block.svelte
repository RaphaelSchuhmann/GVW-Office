<script>
    let {
        item = $bindable(),
        isEditing,
        handleKeyDown,
        setup,
        activeBlock = $bindable(),
        handlePaste,
        handleDrop,
        ...restProps
    } = $props();
</script>

{#if isEditing}
    <div
        contenteditable="true"
        role="textbox"
        tabindex="0"
        aria-multiline="true"
        aria-label="Edit text content"
        class="w-full leading-none text-gv-dark-text outline-none whitespace-normal break-all overflow-wrap-anywhere text-dt-h1 font-bold"
        class:select-none={!isEditing}
        data-id={item.id}
        onkeydown={(e) => handleKeyDown(e)}
        use:setup={item}
        onfocus={() => activeBlock = item.id}
        onblur={() => activeBlock = null}
        onpaste={handlePaste}
        ondrop={handleDrop}
    ></div>
{:else}
    <div class="w-full leading-none text-gv-dark-text outline-none whitespace-normal break-all overflow-wrap-anywhere text-dt-h1 font-bold">
        {@html item.data}
    </div>
{/if}