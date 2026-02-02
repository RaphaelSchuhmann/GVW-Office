<script>
    import { onMount } from "svelte";
    import { marginMap } from "../lib/dynamicStyles";

    export let type = "info";
    export let marginTop = "";
    export let title = "Title";
    export let subTitle = "SubTitle";
    export let onClose = () => {};
    export let isMobile = false;

    const validTypes = ["info", "success", "warning", "error"];
    if (!validTypes.includes(type)) {
        console.warn(`Type ${type} does not exist`);
        type = "info";
    }

    let icon = "";
    let iconColor = "";
    let borderColor = "";

    /**
     * Closes the toast by calling the onClose callback
     */
    function closeToast() {
        onClose();
    }

    onMount(() => {
        switch (type) {
            case "info":
                icon = "info";
                borderColor = "border-gv-toast-info";
                iconColor = "text-gv-toast-info";
                break;
            case "success":
                icon = "check_circle";
                borderColor = "border-gv-toast-success";
                iconColor = "text-gv-toast-success";
                break;
            case "warning":
                icon = "warning";
                borderColor = "border-gv-toast-warning";
                iconColor = "text-gv-toast-warning";
                break;
            case "error":
                icon = "cancel";
                borderColor = "border-gv-toast-error";
                iconColor = "text-gv-toast-error";
                break;
            default:
                icon = "info";
                borderColor = "border-gv-toast-info";
                iconColor = "text-gv-toast-info";
                break;
        }
        const timer = setTimeout(closeToast, 10000);

        return () => clearTimeout(timer);
    });
</script>

{#if title}
    <div class={`flex bg-white ${subTitle ? "items-start" : "items-center"} justify-start gap-2 w-full rounded-2 border ${borderColor} ${marginMap[marginTop]} p-2`}>
        <span class={`material-symbols-rounded ${!isMobile ? "text-icon-dt-4" : "text-icon-dt-3"} ${iconColor}`}>{icon}</span>
        <div class={`flex flex-col ${subTitle ? "items-start" : "items-center"} justify-around`}>
            <p class={`${!isMobile ? "text-dt-5" : "text-dt-6"} font-semibold`}>{title}</p>
            {#if subTitle}
                <p class={`${!isMobile ? "text-dt-6 line-clamp-5" : "text-dt-7 line-clamp-3"}`}>{subTitle}</p>
            {/if}
        </div>
        <button class="flex items-center justify-center bg-transparent border-0 ml-auto cursor-pointer"
                on:click={closeToast}><span
            class={`material-symbols-rounded ${!isMobile ? "text-icon-dt-4" : "text-icon-dt-3"}`}>close</span></button>
    </div>
{/if}
