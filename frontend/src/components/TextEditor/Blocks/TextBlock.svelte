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

    function handleLinkPaste(e) {
        const items = Array.from(e.clipboardData.items);

    }
</script>

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
        onfocus={() => activeBlock = item.id}
        onblur={() => activeBlock = null}
        oninput={(e) => item.data = e.currentTarget.innerHTML}
        onpaste={handlePaste}
        ondrop={handleDrop}
    ></div>
{:else}
    <div class="select-none">
        {@html item.data}
    </div>
{/if}