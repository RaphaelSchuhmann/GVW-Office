<script>
    import { marginMap } from "../lib/dynamicStyles";
    import Chip from "./Chip.svelte";
    import { typeMap } from "../services/eventsService.svelte.js";

    let {
        title = "",
        time = "",
        location = "",
        type = "other",
        margin = "",
        isMobile = false,
        ...restProps
    } = $props();

    const displayType = $derived.by(() => {
        const raw = String(type ?? "").trim();
        const canonical = ["all", "practice", "meeting", "concert", "other"].includes(raw)
            ? raw
            : (typeMap[raw] ?? "other");

        if (!["all", "practice", "meeting", "concert", "other"].includes(canonical)) {
            console.warn(`Type ${type} is not a valid type`);
            return typeMap["other"];
        }

        return typeMap[canonical];
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
        <Chip text={displayType} />
    </div>
</div>