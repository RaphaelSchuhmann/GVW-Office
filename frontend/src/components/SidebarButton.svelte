<script>
    import { marginMap } from "../lib/dynamicStyles";

    export let selected = false;
    export let marginTop = "";
    export let minimized = false;
</script>

<button on:click
        class={`w-full ${marginMap[marginTop]} rounded-1 p-2
           text-black text-dt-3 cursor-pointer flex items-center
           ${minimized ? "justify-center aspect-square" : "justify-start"}
           ${selected ? "bg-gv-primary text-white" : "hover:bg-gv-secondary hover:text-gv-secondary-text"}`}>
    <slot />
</button>
