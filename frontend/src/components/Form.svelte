<script>
    export let height = "3/5";
    export let padding = "5";
</script>
<div class="w-1/3 h-{height} rounded-1 bg-white border-2 border-gv-border flex flex-col items-center p-{padding}">
    <slot />
</div>