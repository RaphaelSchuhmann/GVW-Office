<script>
    export let title = "";
    export let subTitle = "";
</script>

<div class="w-full flex items-center">
    <div class="flex flex-col items-start justify-around">
        <p class="text-dt-3 text-gv-dark-text text-nowrap truncate">{title}</p>
        <p class="text-dt-6 text-gv-light-text text-nowrap truncate">{subTitle}</p>
    </div>
    <button class="cursor-pointer ml-auto hover:bg-gv-hover-effect flex items-center justify-center p-2 rounded-2" on:click><span class="material-symbols-rounded text-icon-dt-2">close</span></button>
</div>