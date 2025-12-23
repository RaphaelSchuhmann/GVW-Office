<script>
    export let title = "";
    export let subTitle = "";
</script>

<div class="w-full flex items-center w-full">
    <div class="flex flex-col items-start max-w-1/2">
        <p class="text-dt-2 text-gv-dark-text font-semibold">{title}</p>
        <p class="text-dt-5 text-gv-light-text line-clamp-2">{subTitle}</p>
    </div>
    <div class="flex items-center justify-start gap-2 h-full overflow-hidden ml-auto">
        <slot />
    </div>
</div>