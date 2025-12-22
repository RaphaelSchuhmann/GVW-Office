<script>
    import { onMount, onDestroy } from "svelte";
    import { marginMap } from "../dynamicStyles";

    7;

    export let type = "primary";
    export let marginTop = "";
    export let width = "w-full";
    export let isSubmit = false;

    let buttonEl;

    const validTypes = ["primary", "secondary"];
    if (!validTypes.includes(type)) {
        console.warn(`Type ${type} does not exist`);
        type = "primary";
    }

    function handleKeyDown(event) {
        if (!isSubmit) return;

        if (event.key === "Enter") {
            event.preventDefault();
            buttonEl?.click();
        }
    }

    onMount(() => {
        if (isSubmit) {
            window.addEventListener("keydown", handleKeyDown);
        }
    });

    onDestroy(() => {
        window.removeEventListener("keydown", handleKeyDown);
    })
</script>

{#if type === "primary"}
    <button
        class={`flex items-center justify-center bg-gv-primary rounded-1 text-dt-5 ${width} pt-2 pb-2 text-white ${marginMap[marginTop]} cursor-pointer hover:bg-gv-primary-hover duration-200`}
        on:click bind:this={buttonEl}>
        <slot />
    </button
    >
{:else}
    <button
        class={`flex items-center justify-center bg-white border-2 border-gv-border rounded-1 text-dt-5 ${width} pt-2 pb-2 text-gv-dark-text ${marginMap[marginTop]} cursor-pointer hover:bg-gv-input-bg duration-200`}
        on:click bind:this={buttonEl}>
        <slot />
    </button
    >
{/if}
