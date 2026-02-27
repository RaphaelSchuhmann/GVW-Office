<script>
    let {
        open = $bindable(false),
        x = 0,
        y = 0,
        children
    } = $props();

    const close = () => (open = false);

    const preventClose = (e) => e.stopPropagation();
</script>

{#if open}
    <div class="fixed inset-0 z-40" onclick={close}>
        <div
            class="absolute z-50 bg-white rounded-1 shadow-md min-w-45"
            style="top:{y}px; left:{x}px"
            onclick={preventClose}
        >
            {#if children}
                {@render children()}
            {/if}
        </div>
    </div>
{/if}