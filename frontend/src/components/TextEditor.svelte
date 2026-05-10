<script>
    let {
        title = "",
        author = "",
        readingTime = "",
        content = $bindable([]),
        isEditing = $bindable(false),
        ...restProps
    } = $props();
</script>

<div class="w-full h-full flex flex-col items-start justify-start rounded-1 bg-white drop-shadow-md">
    {#if isEditing}
        <div class="w-full flex items-center justify-start gap-2 border-b-2 border-gv-border">
            
        </div>
    {/if}
    <div class="flex flex-col items-start justify-start p-5 pl-8 pr-8 gap-4">
        <p class="text-dt-3 text-gv-dark-text">Document Title</p>
        {#if !isEditing}
            <div class="flex w-full items-center justify-start gap-4">
                <div class="flex items-center justify-start gap-2">
                    <span class="material-symbols-rounded text-icon-dt-5 text-gv-dark-text">person</span>
                    <p class="text-dt-6 text-gv-dark-text">{author}</p>
                </div>
                <div class="flex items-center justify-start gap-2">
                    <span class="material-symbols-rounded text-icon-dt-5 text-gv-dark-text">overview</span>
                    <p class="text-dt-6 text-gv-dark-text">{readingTime} Minuten</p>
                </div>
            </div>
        {/if}
    </div>
</div>