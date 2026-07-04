<script>
    import Button from "../Button.svelte";
    import SearchBarButton from "./SearchBarButton.svelte";

    let {
        onClickAddCategory = () => {},
        onClickSearchBar = () => {},
        ...restProps
    } = $props();
</script>

<div class="w-dvw flex items-center p-4 justify-start gap-10 bg-gv-bg-bar border-b border-gv-border-bar">
    <div class="flex items-center justify-start gap-2">
        <span class="material-symbols-rounded text-icon-dt-2 text-gv-dark-text">menu_book</span>
        <p class="text-gv-dark-text text-dt-3">Hilfe-Center</p>
    </div>
    <SearchBarButton isHeader={true} onclick={() => onClickSearchBar?.()}/>
    <div class="flex items-center ml-auto justify-center">
        <Button onclick={() => onClickAddCategory?.()}>
            <span class="material-symbols-rounded text-icon-dt-6">splitscreen_add</span>
            <span class="text-dt-5 ml-2">Kategorie hinzufügen</span>
        </Button>
    </div>
</div>