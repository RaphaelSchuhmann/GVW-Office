<script>
    import Card from "./Card.svelte";
    import Chip from "./Chip.svelte";
    import { reportTypeMap, deleteReport } from "../services/reportService.svelte.js";

    let {
        id = "",
        title = "",
        date = "",
        author = "",
        type = "",
        additionalText = "",
        isMobile = false,
        deletable = true,
    } = $props();
</script>

<Card>
    <div class={`items-start w-full ${isMobile ? "flex-col" : "flex"}`}>
        <button class="flex flex-col items-start gap-4 cursor-pointer">
            <div class="flex items-center gap-2">
                <span class="material-symbols-rounded text-gv-primary text-icon-dt-4">docs</span>
                <span class="text-gv-dark-text text-dt-5 text-nowrap truncate">{title}</span>
            </div>
            <div class="flex items-center gap-4">
                <div class="flex items-center gap-2">
                    <span class="material-symbols-rounded text-gv-light-text text-icon-dt-6">calendar_today</span>
                    <span class="text-gv-light-text text-dt-6">{date}</span>
                </div>
                <div class="flex items-center gap-2">
                    <span class="material-symbols-rounded text-gv-light-text text-icon-dt-6">person</span>
                    <span class="text-gv-light-text text-dt-6">{author}</span>
                </div>
            </div>
            <span class="text-gv-light-text mt-2 text-dt-6 line-clamp-2 truncate">{additionalText}</span>
        </button>
        <div class={`flex items-center ${isMobile ? "justify-start mt-4" : "justify-end"} gap-4 ml-auto`}>
            <Chip text={reportTypeMap[type] || reportTypeMap["other"]} />

            <button
                class="flex items-center gap-2 p-1.5 pl-3 pr-3 border-2 border-gv-border rounded-2 cursor-pointer hover:bg-gv-input-bg">
                <span class="material-symbols-rounded text-gv-dark-text text-icon-dt-6">download</span>
                <span class="text-gv-dark-text text-dt-7 font-semibold">PDF</span>
            </button>

            {#if !isMobile}
                {#if deletable}
                    <button
                        class="flex items-center justify-center p-2 cursor-pointer hover:bg-gv-hover-effect rounded-2 hover:text-gv-delete-hover"
                        onclick={async () => await deleteReport(id)}>
                        <span class="material-symbols-rounded text-icon-dt-5">delete</span>
                    </button>
                {/if}
            {/if}
        </div>
    </div>
</Card>