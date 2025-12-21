<script>
    import { onMount } from "svelte";
    import { marginMap } from "../dynamicStyles";

    export let type = "info";
    export let marginTop = "";
    export let title = "Title";
    export let subTitle = "SubTitle";
    export let onClose = () => {
    };

    const validTypes = ["info", "success", "warning", "error"];
    if (!validTypes.includes(type)) {
        console.warn(`Type ${type} does not exist`);
        type = "info";
    }

    let icon = "";
    let iconColor = "";
    let borderColor = "";

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

{#if title && subTitle}
    <div class={`flex bg-white items-start justify-around w-full rounded-2 border ${borderColor} ${marginMap[marginTop]} p-2`}>
        <span class={`material-symbols-rounded text-icon-dt-4 ${iconColor}`}>{icon}</span>
        <div class="flex flex-col items-start justify-around ml-2">
            <p class="text-dt-5 font-semibold">{title}</p>
            <p class="text-dt-6 line-clamp-3">{subTitle}</p>
        </div>
        <button class="flex items-center justify-center bg-transparent border-0 ml-2 cursor-pointer"
                on:click={closeToast}><span
            class="material-symbols-rounded text-icon-dt-4">close</span></button>
    </div>
{/if}
