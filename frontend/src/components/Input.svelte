<script>
    import { marginMap } from "../lib/dynamicStyles";

    let {
        value = $bindable(""),
        title = "Title",
        type = "text",
        placeholder = "",
        marginTop = "",
        readonly = false,
        disabled = false,
        width = "w-full",
        onChange = () => {},
        onblur = undefined, // Forwarding onblur
        ...restProps
    } = $props();

    let inputEl = $state(null);
    let passwordVisible = $state(false);

    const isOriginallyPassword = type === "password";

    let currentType = $state(type);

    const validTypes = ["text", "email", "password"];
    if (!validTypes.includes(type)) {
        console.warn(`Type ${type} is not a valid input type`);
        currentType = "text";
    }

    let icon = $derived(passwordVisible ? "visibility_off" : "visibility");

    /**
     * Toggles password visibility
     */
    function togglePasswordView() {
        passwordVisible = !passwordVisible;
        currentType = passwordVisible ? "text" : "password";
    }

    /**
     * Focuses the input element (Exposed via bind:this)
     */
    export function focus() {
        inputEl?.focus();
    }
</script>

<div class={`flex flex-col items-start ${width} ${marginMap[marginTop]}`}>
    <p class="text-dt-6 font-medium">{title}</p>

    {#if !isOriginallyPassword}
        <input
            bind:value
            bind:this={inputEl}
            type={currentType}
            {placeholder}
            {readonly}
            {disabled}
            {onblur}
            onchange={(e) => onChange?.(e)}
            class="rounded-1 w-full p-2 pl-3 pr-3 bg-gv-input-bg text-black outline-gv-primary mt-1 text-dt-6 max-[470px]:text-dt-7"
            {...restProps}
        />
    {:else}
        <div class={`flex items-stretch ${width}`}>
            <input
                bind:value
                bind:this={inputEl}
                type={currentType}
                {placeholder}
                {readonly}
                {disabled}
                {onblur}
                onchange={(e) => onChange?.(e)}
                class="rounded-tl-1 rounded-bl-1 w-full p-2 pl-3 pr-3 bg-gv-input-bg text-black outline-gv-primary mt-1 text-dt-6 max-[470px]:text-dt-7"
                {...restProps}
            />
            <button
                type="button"
                class="flex items-center justify-center bg-gv-input-bg px-3 mt-1 rounded-tr-1 rounded-br-1 cursor-pointer"
                onclick={togglePasswordView}
            >
                <span class="material-symbols-rounded text-icon-dt-3 max-[470px]:text-icon-dt-5">
                    {icon}
                </span>
            </button>
        </div>
    {/if}
</div>