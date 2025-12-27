<script>
    import { onMount, onDestroy } from "svelte";
    import { marginMap, fontColorMap } from "../lib/dynamicStyles";

    export let type = "primary";
    export let marginTop = "";
    export let width = "w-full";
    export let fontColor = "";
    export let disabled = false;
    export let isSubmit = false;
    export let isCancel = false;

    let buttonEl;

    const validTypes = ["primary", "secondary", "contextMenu", "delete"];
    if (!validTypes.includes(type)) {
        console.warn(`Type ${type} does not exist`);
        type = "primary";
    }

    function handleKeyDown(event) {
        if ((!isSubmit && !isCancel) && type !== "contextMenu" && type !== "delete") return;

        if (isSubmit && event.key === "Enter") {
            event.preventDefault();
            buttonEl?.click();
        } else if (isCancel && event.key === "Escape") {
            event.preventDefault();
            buttonEl?.click();
        }
    }

    onMount(() => {
        if (isSubmit || isCancel) {
            window.addEventListener("keydown", handleKeyDown);
        }
    });

    onDestroy(() => {
        window.removeEventListener("keydown", handleKeyDown);
    })
</script>

{#if type === "primary"}
    <button
        class={`flex items-center justify-center bg-gv-primary rounded-1 text-dt-5 ${width} p-2 pr-4 text-white ${marginMap[marginTop]} cursor-pointer hover:bg-gv-primary-hover duration-200 disabled:opacity-50 disabled:cursor-not-allowed`}
        on:click bind:this={buttonEl} disabled={disabled}>
        <slot />
    </button>
{:else if type === "contextMenu"}
    <button
        class={`flex items-center justify-center bg-transparent rounded-1 text-dt-5 w-full pl-4 p-1 pr-4 ${fontColorMap[fontColor]} cursor-pointer hover:bg-gv-hover-effect duration-200 disabled:opacity-50 disabled:cursor-not-allowed`}
        on:click disabled={disabled}>
        <slot />
    </button>
{:else if type === "delete"}
    <button
        class={`flex items-center justify-center bg-gv-delete rounded-1 text-dt-5 ${width} p-2 pr-4 text-white ${marginMap[marginTop]} cursor-pointer hover:bg-gv-delete-hover duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-gv-delete`}
        on:click disabled={disabled}>
        <slot />
    </button>
{:else}
    <button
        class={`flex items-center justify-center bg-white border-2 border-gv-border rounded-1 text-dt-5 ${width} p-2 pr-4 ${fontColorMap[fontColor]} ${marginMap[marginTop]} cursor-pointer hover:bg-gv-input-bg duration-200 disabled:opacity-50 disabled:cursor-not-allowed`}
        on:click bind:this={buttonEl} disabled={disabled}>
        <slot />
    </button>
{/if}
