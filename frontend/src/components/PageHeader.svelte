<script>
    let {
        title = "",
        subTitle = "",
        showSlot = true,
        slotCentered = false,
        children = undefined,
        ...restProps
    } = $props();
</script>

<div class="w-full flex items-center">
    <div class={`flex flex-col items-start ${showSlot ? "max-w-1/2" : "w-full"}`}>
        <p class="min-[1000px]:text-dt-2 text-dt-3 text-gv-dark-text text-nowrap font-semibold">{title}</p>
        <p class="min-[1000px]:text-dt-5 text-dt-6 text-gv-light-text line-clamp-2">{subTitle}</p>
    </div>

    {#if showSlot && children}
        <div class={`flex ${slotCentered ? "items-center" : "items-start"} justify-start gap-2 h-full overflow-hidden ml-auto`}>
            {@render children()}
        </div>
    {/if}
</div>