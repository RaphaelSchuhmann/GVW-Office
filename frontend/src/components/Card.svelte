<script>
    import { paddingMap, justifyMap } from "../dynamicStyles";

    export let padding = "3";
    export let justify = "justify-start";
</script>

<div
    class={`bg-white flex flex-col items-center min-h-0 ${justifyMap[justify]} rounded-1 border-2 border-gv-border w-full max-h-full ${paddingMap[padding]} overflow-hidden`}>
    <slot />
</div>
