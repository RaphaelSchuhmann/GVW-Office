<script>
    import { paddingMap, justifyMap, marginMap } from "../lib/dynamicStyles";

    export let padding = "3";
    export let justify = "justify-start";
    export let marginTop = "";
</script>

<div class={`bg-white flex flex-col items-center min-h-0 ${justifyMap[justify]} rounded-1 border-2 border-gv-border w-full ${marginMap[marginTop]} ${paddingMap[padding]} overflow-hidden`}
     on:contextmenu>
    <slot />
</div>
