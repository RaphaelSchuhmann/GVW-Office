<script>
    import { viewport } from "../stores/viewport.svelte";

    let {
        title = "",
        isChecked = $bindable(false),
        onChange = () => {},
        disabled = false,
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
        disabled={disabled}
        class="h-6 w-6 flex items-center justify-center aspect-square cursor-pointer rounded-2 {isChecked ? 'bg-gv-primary' : 'bg-gv-input-bg'}"
        onclick={toggle}
    >
        {#if isChecked}
            <span class="material-symbols-rounded text-white text-icon-dt-6">check</span>
        {/if}
    </button>

    <p class="{textWrap ? 'text-wrap' : 'text-nowrap'} {viewport.isMobile ? 'text-dt-6' : 'text-dt-5'} text-gv-dark-text">
        {title}
    </p>
</div>