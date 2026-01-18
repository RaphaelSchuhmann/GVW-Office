<script>
    import { marginMap } from "../lib/dynamicStyles";

    // Output value
    export let value = "";

    export let title = "Title";
    export let placeholder = "";
    export let marginTop = "";
    export let readonly = false;
    export let disabled = false;
    export let width = "w-full";
    export let height = "h-auto";
    export let resizable = false;
    export let onChange = () => {};

    let inputEl;

    /**
     * Focuses the input element
     */
    export function focus() {
        inputEl.focus();
    }
</script>

<div class={`flex flex-col items-start ${width} ${marginMap[marginTop]}`}>
    <p class="text-dt-6 font-medium">{title}</p>
    <textarea
        bind:value
        bind:this={inputEl}
        on:blur
        placeholder={placeholder}
        readonly={readonly}
        disabled={disabled}
        on:change={onChange}
        class={`rounded-1 w-full ${height} p-2 pl-3 pr-3 bg-gv-input-bg text-black outline-gv-primary mt-1 text-dt-6 ${resizable ? "resize" : "resize-none"}`}
    ></textarea>
</div>
