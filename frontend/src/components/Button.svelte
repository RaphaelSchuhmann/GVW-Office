<script>
    import { marginMap } from "../dynamicStyles";

    export let type = "primary";
    export let marginTop = "";

    const validTypes = ["primary", "secondary"];
    if (!validTypes.includes(type)) {
        console.warn(`Type ${type} does not exist`);
        type = "primary";
    }
</script>

{#if type === "primary"}
    <button
        class={`flex items-center justify-center bg-gv-primary rounded-1 text-dt-5 w-full pt-2 pb-2 text-white ${marginMap[marginTop]} cursor-pointer hover:bg-gv-primary-hover duration-200`}
        on:click><slot /></button
    >
{:else}
    <button
        class={`flex items-center justify-center bg-white border-2 border-gv-border rounded-1 text-dt-5 w-full pt-2 pb-2 text-gv-dark-text ${marginMap[marginTop]} cursor-pointer hover:bg-gv-input-bg duration-200`}
        on:click><slot /></button
    >
{/if}
