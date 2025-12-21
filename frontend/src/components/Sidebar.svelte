<script>
    import { logout } from "../services/user";
    import { push } from "svelte-spa-router";
    import { user } from "../stores/user";
    import SidebarButton from "./SidebarButton.svelte";

    export let currentPage = "";
    export let onSettingsClick = () => {
    };

    // Needed role for each sidebar button
    let mitgliederAccess = ["admin", "vorstand"];
    let reportsAccess = ["admin", "schriftführer"];

    let role = $user.role;

    let minimized = false;
    let toggleIcon = "arrow_menu_close";

    let userOptionsIcon = "expand_all";
    let userOptionsVisible = false;

    function toggleSidebarState() {
        minimized = !minimized;
        toggleIcon = minimized ? "arrow_menu_open" : "arrow_menu_close";
    }

    function toggleUserOptions() {
        userOptionsVisible = !userOptionsVisible;
        userOptionsIcon = userOptionsVisible ? "collapse_all" : "expand_all";
    }

    async function handleLogout() {
        logout();
        await push("/");
    }

    async function handleDashboard() {
        await push("/dashboard");
    }

    async function handleMembers() {
        await push("/members");
    }

    async function handleEvents() {
        await push("/events");
    }

    async function handleReports() {
        await push("/reports");
    }

    async function handleMusicLibrary() {
        await push("/library");
    }
</script>

<div
    class="max-w-1/4 h-dvh flex flex-col items-center bg-gv-bg-bar border-r border-gv-border-bar">
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

    <!--  Content  -->
    <div class="w-full h-full flex flex-col items-center p-5 flex-1">
        <SidebarButton selected={currentPage === "dashboard"} minimized={minimized} on:click={handleDashboard}>
            <span class="material-symbols-rounded text-icon-dt-4">dashboard</span>
            {#if !minimized}
                <p class="ml-2">Dashboard</p>
            {/if}
        </SidebarButton>

        {#if mitgliederAccess.includes(role)}
            <SidebarButton selected={currentPage === "members"} marginTop="5" minimized={minimized}
                           on:click={handleMembers}>
                <span class="material-symbols-rounded text-icon-dt-4">group</span>
                {#if !minimized}
                    <p class="ml-2">Mitglieder</p>
                {/if}
            </SidebarButton>
        {/if}

        <SidebarButton selected={currentPage === "events"} marginTop="5" minimized={minimized} on:click={handleEvents}>
            <span class="material-symbols-rounded text-icon-dt-4">calendar_today</span>
            {#if !minimized}
                <p class="ml-2">Veranstaltungen</p>
            {/if}
        </SidebarButton>

        {#if reportsAccess.includes(role)}
            <SidebarButton selected={currentPage === "reports"} marginTop="5" minimized={minimized}
                           on:click={handleReports}>
                <span class="material-symbols-rounded text-icon-dt-4">docs</span>
                {#if !minimized}
                    <p class="ml-2">Berichte</p>
                {/if}
            </SidebarButton>
        {/if}

        <SidebarButton selected={currentPage === "musicLibrary"} marginTop="5" minimized={minimized}
                       on:click={handleMusicLibrary}>
            <span class="material-symbols-rounded text-icon-dt-4">music_note</span>
            {#if !minimized}
                <p class="ml-2">Notenbibliothek</p>
            {/if}
        </SidebarButton>
        <div class="flex flex-col items-center w-full mt-auto">
            {#if !minimized}
                <div class="relative inline-block text-left">
                    <button on:click={toggleUserOptions}
                            class="flex items-center bg-white border border-gv-border rounded-1 p-3 cursor-pointer hover:bg-gv-secondary-btn-hover duration-200 overflow-hidden">
                        <div class="flex flex-col items-start justify-around">
                            {#if $user.loaded}
                                <p class="text-dt-5 text-gv-dark-text text-nowrap truncate">{$user.name}</p>
                                <p class="text-dt-8 text-gv-light-text text-nowrap truncate">{$user.email}</p>
                            {:else}
                                <div class="animate-pulse h-5 w-40 bg-gray-200 rounded"></div>
                                <div class="animate-pulse h-5 w-24 bg-gray-200 rounded mt-2"></div>
                            {/if}
                        </div>
                        <span class="material-symbols-rounded text-icon-dt-2 ml-3">{userOptionsIcon}</span>
                    </button>
                    {#if userOptionsVisible}
                        <div
                            class="absolute bottom-22 w-full bg-white border border-gv-border rounded-1 p-2 flex flex-col items-center">
                            <button on:click={() => {toggleUserOptions(); onSettingsClick();}}
                                    class="w-full text-dt-3 flex items-center rounded-2 cursor-pointer hover:bg-gv-hover-effect p-2 pl-3 pr-3 duration-150">
                                <span class="material-symbols-rounded text-icon-dt-5 mr-2">settings</span>
                                Einstellungen
                            </button>
                            <button on:click={handleLogout}
                                    class="w-full text-dt-3 flex items-center rounded-2 cursor-pointer hover:bg-gv-hover-effect p-2 pl-3 pr-3 duration-150">
                                <span class="material-symbols-rounded text-icon-dt-5 mr-2">logout</span>
                                Abmelden
                            </button>
                        </div>
                    {/if}
                </div>
            {:else}
                <div class="flex flex-col items-center mb-5">
                    <SidebarButton marginTop="5" minimized={minimized} on:click={onSettingsClick}>
                        <span class="material-symbols-rounded text-icon-dt-3">settings</span>
                    </SidebarButton>
                    <SidebarButton marginTop="5" minimized={minimized} on:click={handleLogout}>
                        <span class="material-symbols-rounded text-icon-dt-3">logout</span>
                    </SidebarButton>
                </div>
            {/if}
        </div>
    </div>

    <!--  Credits  -->
    {#if !minimized}
        <div class="flex items-center justify-center p-5 border-t border-gv-border-bar w-full">
            <div class="flex flex-col items-start w-full bg-gv-secondary rounded-1 p-5">
                <p class="text-dt-5 text-gv-dark-text text-base/6">Gesangverein<br>Weppersdorf</p>
                <p class="text-dt-8 text-gv-light-text mt-3">© 2026 GVW</p>
            </div>
        </div>
    {/if}
</div>