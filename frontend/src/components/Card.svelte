<script>
    import { paddingMap, justifyMap, marginMap, roundedMap } from "../lib/dynamicStyles";

    export let padding = "3";
    export let justify = "justify-start";
    export let marginTop = "";
    export let rounded = "1";
    export let borderThickness = "2";
</script>

<!-- Note: only valid border thicknesses are 2 and 1 -->
<div class={`bg-white flex flex-col items-center min-h-0 ${justifyMap[justify]} ${roundedMap[rounded]} ${borderThickness === "2" ? "border-2" : "border"} border-gv-border w-full ${marginMap[marginTop]} ${paddingMap[padding]} overflow-hidden`}
     on:contextmenu>
    <slot />
</div>
