<script>
    import { paddingMap } from "../lib/dynamicStyles";
    import { widthMap, heightMap } from "../lib/dynamicStyles";

    export let height = "3/5";
    export let width = "1/3";
    export let padding = "5";
</script>
<div class={`${widthMap[width]} ${heightMap[height]} rounded-1 bg-white border-2 border-gv-border flex flex-col items-center ${paddingMap[padding]}`}>
    <slot />
</div>