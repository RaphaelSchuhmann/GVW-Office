<script>
    import Chip from "./Chip.svelte";

    let {
        id = "",
        title = "",
        chipText = "",
        showDelete = true,
        isMobile = false,
        isLastItem = false,
        asyncDeleteFunction = () => {},
        onclick = () => {},
        ...restProps
    } = $props();
</script>

<div class={`w-full p-3 pl-4 flex items-center justify-start gap-2 hover:bg-gv-border ${isLastItem ? "" : "border-b-2 border-gv-border"}`}>
    <button class="w-full flex items-center justify-between cursor-pointer" onclick={() => onclick(id)}>
        <span class="text-dt-6 text-gv-dark-text">{title}</span>
        <Chip text={chipText} />
    </button>
    <button
        aria-label="Eintrag entfernen"
        title="Eintrag entfernen"
        type="button"
        onclick={async (e) => { e.stopPropagation(); await asyncDeleteFunction() }}
        class="flex items-center justify-center p-2 cursor-pointer hover:bg-gv-hover-effect rounded-2 hover:text-gv-delete-hover duration-100"
    >
        <span class="material-symbols-rounded text-icon-dt-5">delete</span>
    </button>
</div>