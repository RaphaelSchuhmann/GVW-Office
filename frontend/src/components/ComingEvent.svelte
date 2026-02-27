<script>
    import { marginMap } from "../lib/dynamicStyles";
    import { capitalizeWords } from "../services/utils";
    import Chip from "./Chip.svelte";

    let {
        title = "",
        time = "",
        location = "",
        type = "konzert",
        margin = "",
        isMobile = false,
        ...restProps
    } = $props();

    const displayType = $derived.by(() => {
        const normalized = typeof type === "string" ? type.trim().toLowerCase() : "";
        const validTypes = ["probe", "konzert", "meeting"];

        if (!validTypes.includes(normalized)) {
            console.warn(`Type ${String(type)} is not a valid type`);
            return "Konzert";
        }
        return capitalizeWords(normalized);
    });
</script>

<div
    class={`flex ${isMobile ? "flex-col items-start" : "items-center"} w-full ${marginMap[margin]}`}
    {...restProps}
>
    <div class="flex flex-col items-start justify-around">
        <p class="text-dt-5 text-gv-dark-text text-nowrap truncate">{title}</p>
        <p class="text-dt-6 text-gv-light-text text-nowrap truncate">{time}</p>
        <p class="text-dt-6 text-gv-light-text">{location}</p>
    </div>
    <div class={`${isMobile ? "mt-2" : "ml-auto"}`}>
        <Chip text={displayType}/>
    </div>
</div>