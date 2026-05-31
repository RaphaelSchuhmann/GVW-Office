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
        class="w-full text-base text-gv-dark-text outline-none whitespace-normal break-all overflow-wrap-anywhere border-l-2 border-gv-border-bar pl-2"
        class:select-none={!isEditing}
        data-id={item.id}
        onkeydown={(e) => handleKeyDown(e)}
        use:setup={item}
        onfocus={() => activeBlock = item.id}
        onblur={() => activeBlock = null}
        oninput={(e) => item.data = e.currentTarget.innerHTML}
        onpaste={handlePaste}
        ondrop={handleDrop}
    ></div>
{:else}
    <div class="select-none border-l-2 border-gv-border-bar pl-2">
        {@html item.data}
    </div>
{/if}