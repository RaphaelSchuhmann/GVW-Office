<script>
    let {
        isHeader = false,
        ...restProps
    } = $props();
</script>

<button
    class="flex items-center justify-start gap-2 bg-gv-input-bg border border-gv-separator rounded-1 cursor-text p-2 {isHeader ? 'w-82.5' : ''} pr-10 hover:opacity-75 duration-75"
    {...restProps}>
    <span class="material-symbols-rounded text-icon-dt-6 text-gv-input-placeholder">search</span>
    <span class="text-dt-5 text-gv-input-placeholder">{isHeader ? "Artikel suchen..." : "Nach Artikeln, Funktionen oder Stichwörter suchen..."}</span>
</button>