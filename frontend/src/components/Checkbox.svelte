<script>
    export let title = "";
    export let isChecked = false;
    export let onChange = () => {};

    $: if (isChecked) {
        onChange(isChecked);
    }
</script>
<div class="flex items-center justify-start gap-2">
    <button
        class={`h-6 w-6 flex items-center justify-center rounded ${isChecked ? "bg-gv-primary" : "bg-gv-input-bg"} cursor-pointer rounded-2`}
        on:click={() => isChecked = !isChecked}>
        {#if isChecked}
            <span class="material-symbols-rounded text-white text-icon-dt-6">check</span>
        {/if}
    </button>
    <p class="text-dt-5 text-gv-dark-text">{title}</p>
</div>