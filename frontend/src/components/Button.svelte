<script>
    import { marginMap, fontColorMap } from "../lib/dynamicStyles";

    // 1. Define Props & Snippets
    let {
        type = "primary",
        marginTop = "",
        width = "w-full",
        fontColor = "",
        disabled = false,
        isSubmit = false,
        isCancel = false,
        children,
        ...restProps
    } = $props();

    let buttonEl = $state(null);

    // Validate type (using a derived-like approach or just local variable)
    const validTypes = ["primary", "secondary", "contextMenu", "delete"];
    let activeType = $derived(validTypes.includes(type) ? type : "primary");

    /**
     * Keyboard shortcut logic
     */
    function handleKeyDown(event) {
        if (!isSubmit && !isCancel) return;
        if (activeType === "contextMenu" || activeType === "delete") return;

        if (isSubmit && event.key === "Enter") {
            event.preventDefault();
            buttonEl?.click();
        } else if (isCancel && event.key === "Escape") {
            event.preventDefault();
            buttonEl?.click();
        }
    }

    // 2. Lifecycle Replacement
    $effect(() => {
        if (isSubmit || isCancel) {
            window.addEventListener("keydown", handleKeyDown);
            // Cleanup function replaces onDestroy
            return () => window.removeEventListener("keydown", handleKeyDown);
        }
    });

    // 3. Class Logic simplified
    const baseClasses = "flex items-center justify-center rounded-1 min-[768px]:text-dt-4 min-[470px]:text-dt-5 text-dt-6 duration-200 disabled:opacity-50 disabled:cursor-not-allowed";

    const typeClasses = {
        primary: `bg-gv-primary p-2 pr-4 text-white hover:bg-gv-primary-hover ${width} ${marginMap[marginTop]}`,
        contextMenu: `bg-transparent w-full pl-4 p-1 pr-4 hover:bg-gv-hover-effect ${fontColorMap[fontColor]}`,
        delete: `bg-gv-delete p-2 pr-4 text-white hover:bg-gv-delete-hover disabled:hover:bg-gv-delete ${width} ${marginMap[marginTop]}`,
        secondary: `bg-white border-2 border-gv-border p-2 pr-4 hover:bg-gv-input-bg ${width} ${marginMap[marginTop]} ${fontColorMap[fontColor]}`
    };
</script>

<button
    bind:this={buttonEl}
    disabled={disabled}
    class="{baseClasses} {typeClasses[activeType] || typeClasses.primary} cursor-pointer"
    {...restProps}
>
    {#if children}
        {@render children()}
    {/if}
</button>