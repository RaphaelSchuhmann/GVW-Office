<script>
    import { fly, fade } from "svelte/transition";
    import SidebarContent from "./SidebarContent.svelte";

    export let currentPage = "";
    export let onSettingsClick = () => {};
    export let isOpen = false;

    const closeSidebar = () => isOpen = false;
</script>

{#if isOpen}
    <!-- Overlay background -->
    <div class="fixed inset-0 bg-black/50 z-40" on:click={closeSidebar} transition:fade></div>

    <!-- Sidebar panel -->
    <div class="fixed inset-0 z-50 bg-gv-bg-bar flex flex-col" transition:fly="{{ x: -300, duration: 200 }}">
        <div class="w-full flex items-center border-b border-gv-border-bar p-5">
            <div class="flex flex-col items-start justify-around h-full">
                <p class="text-dt-3 font-semibold text-gv-dark-turquoise">GVW Office</p>
                <p class="text-dt-8 text-gv-light-text">Weppersdorf</p>
            </div>
            <button class="cursor-pointer ml-auto hover:bg-gv-hover-effect flex items-center justify-center rounded-2 pt-2 pb-2" on:click={closeSidebar}><span
                class="material-symbols-rounded text-icon-dt-1 text-gv-dark-text duration-150">arrow_menu_close</span>
            </button>
        </div>

        <SidebarContent {currentPage} {onSettingsClick} minimized={false} />
    </div>
{/if}
