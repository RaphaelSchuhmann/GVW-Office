<script>
    export let open = false;
    export let x = 0;
    export let y = 0;

    const close = () => (open = false);
    const handleGlobalClick = () => close();
</script>

{#if open}
    <div class="fixed inset-0 z-40" on:click={handleGlobalClick}>
        <div class="absolute z-50 bg-white rounded-1 shadow-md min-w-[180px]" style="top:{y}px; left:{x}px" on:click|stopPropagation>
            <slot />
        </div>
    </div>
{/if}