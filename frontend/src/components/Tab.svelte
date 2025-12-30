<script>
    export let selected = false;
</script>
<button on:click class={`w-full ${selected ? "bg-white" : "bg-transparent hover:bg-gv-hover-effect"} p-1 rounded-full flex items-center justify-center text-center text-dt-5 text-gv-dark cursor-pointer duration-150`}>
    <slot />
</button>