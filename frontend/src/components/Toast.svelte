<script>
    import { marginMap } from "../lib/dynamicStyles";

    let {
        type = "info",
        marginTop = "",
        title = "Title",
        subTitle = "SubTitle",
        onClose = () => {},
        isMobile = false,
        ...restProps
    } = $props();

    const validTypes = ["info", "success", "warning", "error"];
    if (!validTypes.includes(type)) {
        console.warn(`Type ${type} does not exist`);
        type = "info";
    }

    let closeTimer;

    const styles = $derived.by(() => {
        let icon = "";
        let iconColor = "";
        let borderColor = "";

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
        return { icon, iconColor, borderColor };
    });

    /**
     * Closes the toast by calling the onClose callback
     */
    function closeToast() {
        if (closeTimer) {
            clearTimeout(closeTimer);
            closeTimer = null;
        }
        onClose();
    }

    $effect(() => {
        closeTimer = setTimeout(closeToast, 10000);
        return () => {
            if (closeTimer) clearTimeout(closeTimer);
            closeTimer = null;
        }
    });
</script>

{#if title}
    <div
        class={`flex bg-white ${subTitle ? "items-start" : "items-center"} justify-start gap-2 w-full rounded-2 border ${styles.borderColor} ${marginMap[marginTop]} p-2`}
        {...restProps}
    >
        <span class={`material-symbols-rounded ${!isMobile ? "text-icon-dt-4" : "text-icon-dt-3"} ${styles.iconColor}`}>
            {styles.icon}
        </span>

        <div class={`flex flex-col ${subTitle ? "items-start" : "items-center"} justify-around`}>
            <p class={`${!isMobile ? "text-dt-5" : "text-dt-6"} font-semibold`}>{title}</p>
            {#if subTitle}
                <p class={`${!isMobile ? "text-dt-6 line-clamp-5" : "text-dt-7 line-clamp-3"}`}>{subTitle}</p>
            {/if}
        </div>

        <button
            type="button"
            class="flex items-center justify-center bg-transparent border-0 ml-auto cursor-pointer"
            aria-label="Toast schließen"
            onclick={closeToast}
        >
            <span class={`material-symbols-rounded ${!isMobile ? "text-icon-dt-4" : "text-icon-dt-3"}`}>
                close
            </span>
        </button>
    </div>
{/if}