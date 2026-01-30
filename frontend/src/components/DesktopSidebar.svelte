<script>
    import { logout } from "../services/user";
    import { push } from "svelte-spa-router";
    import SidebarContent from "./SidebarContent.svelte";

    export let currentPage = "";
    export let onSettingsClick = () => {};
    export let isMobile = false;

    // Needed role for each sidebar button
    let mitgliederAccess = ["admin", "vorstand"];
    let reportsAccess = ["admin", "schriftführer"];

    let minimized = false;
    let toggleIcon = "arrow_menu_close";

    let userOptionsIcon = "expand_all";
    let userOptionsVisible = false;

    /**
     * Toggles the sidebar between minimized and expanded states
     * Updates the toggle icon accordingly
     */
    function toggleSidebarState() {
        minimized = !minimized;
        toggleIcon = minimized ? "arrow_menu_open" : "arrow_menu_close";
    }

    /**
     * Toggles the visibility of user options dropdown
     * Updates the expand/collapse icon
     */
    function toggleUserOptions() {
        userOptionsVisible = !userOptionsVisible;
        userOptionsIcon = userOptionsVisible ? "collapse_all" : "expand_all";
    }

    /**
     * Logs out the user and redirects to login page
     */
    async function handleLogout() {
        logout();
        await push("/");
    }
</script>

<div class="min-[1230px]:max-w-1/4 max-[1230px]:max-w-2/5 h-dvh flex flex-col items-center bg-gv-bg-bar border-r border-gv-border-bar">
    <div class="w-full flex items-center border-b border-gv-border-bar p-5">
        {#if !minimized}
            <div class="flex flex-col items-start justify-around h-full">
                <p class="text-dt-3 font-semibold text-gv-dark-turquoise">GVW Office</p>
                <p class="text-dt-8 text-gv-light-text">Weppersdorf</p>
            </div>
        {/if}
        <button class="cursor-pointer ml-auto hover:bg-gv-hover-effect flex items-center justify-center rounded-2 pt-2 pb-2" on:click={toggleSidebarState}><span
            class="material-symbols-rounded text-icon-dt-1 text-gv-dark-text duration-150">{toggleIcon}</span>
        </button>
    </div>

    <SidebarContent {currentPage} {onSettingsClick} minimized={false} />
</div>