<script>
    import "./app.css";
    import Router from "svelte-spa-router";

    import Login from "./pages/Login/LoginPage.svelte";
    import Dashboard from "./pages/Dashboard/DashboardPage.svelte";
    import ChangePassword from "./pages/ChangePassword/ChangePasswordPage.svelte";
    import Members from "./pages/Members/MembersPage.svelte";
    import MemberDetails from "./pages/MemberDetails/MemberDetailsPage.svelte";
    import Events from "./pages/Events/EventsPage.svelte";
    import EventDetails from "./pages/EventDetails/EventDetailsPage.svelte";
    import Library from "./pages/Library/LibraryPage.svelte";
    import LibraryDetails from "./pages/LibraryDetails/LibraryDetailsPage.svelte";

    import { startSyncService, stopSyncService } from "./services/appSettingsSyncService.svelte";
    import { user } from "./stores/user.svelte";
    import { getValue } from "./services/store";
    import { ensureUserData } from "./services/userService.svelte";

    const routes = {
        "/": Login,
        "/dashboard": Dashboard,
        "/changePassword": ChangePassword,
        "/members": Members,
        "/members/details": MemberDetails,
        "/events": Events,
        "/events/details": EventDetails,
        "/library": Library,
        "/library/details": LibraryDetails,
    };

    $effect(() => {
        startSyncService();

        if (!user.loaded && getValue("authToken")) {
            ensureUserData();
        }

        return () => {
            stopSyncService();
        };
    });
</script>

<Router {routes} />