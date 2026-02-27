<script>
    import { marginMap } from "../lib/dynamicStyles";

    let {
        selected = false,
        marginTop = "",
        minimized = false,
        children, // 1. Catch the snippet here
        ...restProps // 2. onclick is inside here
    } = $props();
</script>

<button
    class={`w-full ${marginMap[marginTop]} rounded-1 p-2
           text-black text-dt-3 cursor-pointer flex items-center
           ${minimized ? "justify-center aspect-square" : "justify-start gap-2"}
           ${selected ? "bg-gv-primary text-white" : "hover:bg-gv-secondary hover:text-gv-secondary-text"}`}
    {...restProps}
>
    {#if children}
        {@render children()}
    {/if}
</button>