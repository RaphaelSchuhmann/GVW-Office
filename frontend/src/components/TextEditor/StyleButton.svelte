<script>
    let {
        btnId = "",
        icon = "",
        disabled = false,
        isToggled = $bindable(false),
        onChange = (val) => {
        },
        ...restProps
    } = $props();

    function toggle() {
        isToggled = !isToggled;
        onChange?.(isToggled);
    }
</script>

<button
    class={`p-2 flex items-center justify-center cursor-pointer rounded-2 ${isToggled ? "bg-gv-secondary text-gv-secondary-text" : "hover:bg-gv-hover-effect text-gv-dark-text"} disabled:text-gv-dark-text/50 disabled:cursor-not-allowed`}
    onclick={toggle}
    disabled={disabled}
>
    <span class="material-symbols-rounded text-icon-dt-4">{icon}</span>
</button>