<script>
    import { fontSizeMap } from "../lib/dynamicStyles";
    export let text = "";
    export let fontSize = "7";
</script>

<p class={`${fontSizeMap[fontSize]} text-gv-secondary-text bg-gv-secondary p-1 pl-3 pr-3 rounded-full text-center w-min text-nowrap`}>{text}</p>