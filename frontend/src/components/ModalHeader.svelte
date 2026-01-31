<script>
    import { onMount, onDestroy } from "svelte";

    export let title = "";
    export let subTitle = "";

    let closeBtn;

    /**
     * Handles keyboard events, specifically closing modal on Escape key
     * @param {KeyboardEvent} event - The keyboard event
     */
    function handleKeyDown(event) {
        if (event.key === "Escape") {
            closeBtn?.click();
        }
    }

    onMount(() => {
        window.addEventListener("keydown", handleKeyDown);
    });

    onDestroy(() => {
        window.removeEventListener("keydown", handleKeyDown);
    });
</script>

<div class="w-full flex items-start">
    <div class="flex flex-col items-start justify-around">
        <p class="min-[1500px]:text-dt-3 text-dt-4 max-[470px]:text-dt-5 text-gv-dark-text">{title}</p>
        <p class="min-[1500px]:text-dt-6 text-dt-7 text-gv-light-text">{subTitle}</p>
    </div>
    <button class="cursor-pointer ml-auto hover:bg-gv-hover-effect flex items-center justify-center p-2 rounded-2"
            bind:this={closeBtn} on:click><span class="material-symbols-rounded text-icon-dt-2">close</span></button>
</div>