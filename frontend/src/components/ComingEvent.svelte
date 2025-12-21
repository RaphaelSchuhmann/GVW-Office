<script>
    import { marginMap } from "../dynamicStyles";
    import { capitalizeWords } from "../services/utils";
    import Chip from "./Chip.svelte";
    export let title = "";
    export let time = "";
    export let location = "";
    export let type = "konzert";
    export let margin = "";

    // Normalize type
    type = type.toLowerCase();

    const validTypes = ["probe", "konzert", "meeting"];
    if (!validTypes.includes(type)) {
        console.warn(`Type ${type} is not a valid type`);
        type = "Konzert";
    }
</script>

<div class={`flex items-center w-full ${marginMap[margin]}`}>
    <div class="flex flex-col items-start justify-around">
        <p class="text-dt-5 text-gv-dark-text text-nowrap truncate">{title}</p>
        <p class="text-dt-6 text-gv-light-text text-nowrap truncate">{time}</p>
        <p class="text-dt-6 text-gv-light-text text-nowrap truncate">{location}</p>
    </div>
    <div class="ml-auto">
        <Chip text={capitalizeWords(type)}/>
    </div>
</div>