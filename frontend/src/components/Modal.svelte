<script>
    import ModalHeader from "./ModalHeader.svelte";
    import { widthMap, heightMap } from "../lib/dynamicStyles";

    export let title = "";
    export let subTitle = "";
    export let height = "auto";
    export let width = "1/3";

    export let extraFunction = () => {};
    export let extraFunctionOnClose = true;

    let visible = false;

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
    <div class="absolute z-999 top-0 left-0 w-dvw h-dvh flex items-center justify-center bg-gv-overlay">
        <div
            class={`${widthMap[width]} ${heightMap[height]} bg-white flex flex-col p-5 rounded-1 overflow-y-auto overflow-x-hidden`}>
            <ModalHeader title={title} subTitle={subTitle} on:click={hideModal} />
            <slot />
        </div>
    </div>
{/if}
