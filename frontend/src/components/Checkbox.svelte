<script>
    let {
        title = "",
        isChecked = $bindable(false),
        onChange = () => {},
        textWrap = true
    } = $props();

    /**
     * Handles the toggle and triggers the callback
     */
    function toggle() {
        isChecked = !isChecked;
        onChange(isChecked);
    }
</script>

<div class="flex items-center justify-start gap-2">
    <button
        type="button"
        class="h-6 w-6 flex items-center justify-center rounded cursor-pointer rounded-2 {isChecked ? 'bg-gv-primary' : 'bg-gv-input-bg'}"
        onclick={toggle}
    >
        {#if isChecked}
            <span class="material-symbols-rounded text-white text-icon-dt-6">check</span>
        {/if}
    </button>

    <p class="{textWrap ? 'text-wrap' : 'text-nowrap'} text-dt-5 text-gv-dark-text">
        {title}
    </p>
</div>