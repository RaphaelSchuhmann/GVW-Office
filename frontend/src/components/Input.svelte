<script> 
    export let title = "Title";
    export let type = "text";
    export let placeholder = "";
    export let marginTop = "";

    let passwordInput = false;
    let passwordVisible = false;

    // View password icon
    let icon;
    $: icon = passwordVisible ? "visibility_off" : "visibility";
    
    // Check if type is valid else default to "text"
    const validTypes = ["text", "email", "password"];
    if (!validTypes.includes(type)) {
        console.warn(`Type ${type} is not a valid input type`);
        type = "text";
    }

    // Check if original type is password to set a flag
    if (type === "password") {
        passwordInput = true;
    }

    // Toggle password visibility
    function togglePasswordView() {
        passwordVisible = !passwordVisible;
        type = passwordVisible ? "text" : "password";
    }
</script>

<div class="flex flex-col items-start w-full mt-{marginTop}">
    <p class="text-dt-6 font-medium">{title}</p>
    {#if !passwordInput}
        <input
            {type}
            {placeholder}
            class="rounded-1 w-full p-2 pl-3 pr-3 bg-gv-input-bg text-black outline-gv-primary mt-1 text-dt-6"
        />
    {:else}
        <div class="flex items-stretch w-full">
            <input
                {type}
                {placeholder}
                class="rounded-tl-1 rounded-bl-1 w-full p-2 pl-3 pr-3 bg-gv-input-bg text-black outline-gv-primary mt-1 text-dt-6"
            />
            <button
                class="flex items-center justify-center bg-gv-input-bg px-3 mt-1 rounded-tr-1 rounded-br-1 cursor-pointer"
                on:click={togglePasswordView}
            >
                <span class="material-symbols-rounded text-icon-dt-3"
                    >{icon}</span
                >
            </button>
        </div>
    {/if}
</div>
