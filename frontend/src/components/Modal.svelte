<script>
    import ModalHeader from "./ModalHeader.svelte";
    import { widthMap, heightMap } from "../lib/dynamicStyles";

    // 1. Define Props & Snippets
    let {
        title = "",
        subTitle = "",
        height = "auto",
        width = "1/3",
        isMobile = false,
        extraFunction = () => {},
        extraFunctionOnClose = true,
        children
    } = $props();

    // 2. Internal State
    let visible = $state(false);

    /**
     * Logic: Side effect for body scroll
     * This replaces the manual logic in show/hide and onDestroy.
     */
    $effect(() => {
        if (visible) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }

        // Cleanup: Ensures scroll is restored if component is unmounted
        return () => {
            document.body.style.overflow = "";
        };
    });

    /**
     * Methods exposed to the parent via bind:this
     */
    export function showModal() {
        visible = true;
        if (!extraFunctionOnClose) extraFunction();
    }

    export function hideModal() {
        visible = false;
        if (extraFunctionOnClose) extraFunction();
    }
</script>

{#if visible}
    <div
        class="z-999 top-0 left-0 w-dvw h-dvh flex bg-gv-overlay
               {isMobile ? 'fixed items-end' : 'fixed items-center justify-center'}"
    >
        <div
            class="bg-white flex flex-col p-5 overflow-hidden max-h-[90vh]
                   {isMobile ? 'w-full h-8/9 rounded-t-1' : `${widthMap[width]} ${heightMap[height]} rounded-1`}"
        >
            <ModalHeader {title} {subTitle} onclick={hideModal} />

            <div class="w-full flex-1 min-h-0 flex flex-col overflow-y-scroll overflow-x-hidden mt-2">
                {#if children}
                    {@render children()}
                {/if}
            </div>
        </div>
    </div>
{/if}