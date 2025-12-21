<script>
    export let value = 0;
    export let max = 1;
</script>

<div class="w-full h-4 rounded-full bg-gv-secondary overflow-hidden">
    <div class="h-full bg-gv-primary rounded-tl-full rounded-bl-full transition-all duration-300" style={`width: ${Math.min((value / max) * 100, 100)}%`}></div>
</div>