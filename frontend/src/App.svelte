<script>
    import "./app.css";
    import Viewport from "./components/Viewport.svelte";
    import Router from "svelte-spa-router";
    import Login from "./pages/Login/LoginPage.svelte";
    import Dashboard from "./pages/Dashboard/DashboardPage.svelte";
    import ChangePassword from "./pages/ChangePassword/ChangePasswordPage.svelte";
    import Members from "./pages/Members/MembersPage.svelte";
    import MemberViewer from "./pages/MembersViewer/MembersViewerPage.svelte";
    import MemberEditor from "./pages/MemberEditor/MemberEditorPage.svelte";
    import Events from "./pages/Events.svelte";
    import EventEditor from "./pages/EventEditor.svelte";
    import Reports from "./pages/Reports.svelte";
    import Library from "./pages/Library.svelte";
    import LibraryEditor from "./pages/LibraryEditor.svelte";
    
    import { onMount } from "svelte";
    import { startSyncService, stopSyncService } from "./services/appSettingsSyncService";

    const routes = {
        "/": Login,
        "/dashboard": Dashboard,
        "/changePassword": ChangePassword,
        "/members": Members,
        "/members/view": MemberViewer,
        "/members/edit": MemberEditor,
        "/events": Events,
        "/events/edit": EventEditor,
        "/reports": Reports,
        "/library": Library,
        "/library/edit": LibraryEditor,
    };

    onMount(() => {
        startSyncService();
        return () => stopSyncService();
    });
</script>
<Viewport />
<Router {routes}/>