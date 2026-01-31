<script>
    import ModalHeader from "./ModalHeader.svelte";
    import { widthMap, heightMap } from "../lib/dynamicStyles";

    export let title = "";
    export let subTitle = "";
    export let height = "auto";
    export let width = "1/3";
    export let isMobile = false;

    export let extraFunction = () => {};
    export let extraFunctionOnClose = true;

    let visible = false;

    /**
     * Shows the modal and optionally executes extra function
     * Executes extraFunction if extraFunctionOnClose is false
     */
    export function showModal() {
        visible = true;
        document.body.style.overflow = "hidden";
        if (!extraFunctionOnClose) extraFunction();
    }

    /**
     * Hides the modal and optionally executes extra function
     * Executes extraFunction if extraFunctionOnClose is true
     */
    export function hideModal() {
        visible = false;
        document.body.style.overflow = "";
        if (extraFunctionOnClose) extraFunction();
    }
</script>

{#if visible}
    {#if !isMobile}
        <div class="absolute z-999 top-0 left-0 w-dvw h-dvh flex items-center justify-center bg-gv-overlay">
            <div
                class={`${widthMap[width]} ${heightMap[height]} bg-white flex flex-col p-5 rounded-1 overflow-y-auto overflow-x-hidden`}>
                <ModalHeader title={title} subTitle={subTitle} on:click={hideModal} />
                <slot />
            </div>
        </div>
    {:else}
        <div class="fixed z-999 top-0 left-0 w-dvw h-dvh flex items-end bg-gv-overlay">
            <div
                class={`w-full h-8/9 bg-white flex flex-col p-5 rounded-t-1 overflow-y-auto overflow-x-hidden`}>
                <ModalHeader title={title} subTitle={subTitle} on:click={hideModal} />
                <slot />
            </div>
        </div>
    {/if}
{/if}
