<script>
    import "./app.css";
    import Router from "svelte-spa-router";
    import Login from "./pages/Login/LoginPage.svelte";
    import Dashboard from "./pages/Dashboard/DashboardPage.svelte";
    import ChangePassword from "./pages/ChangePassword/ChangePasswordPage.svelte";
    import Members from "./pages/Members/MembersPage.svelte";
    import MemberViewer from "./pages/MemberViewer.svelte";
    import MemberEditor from "./pages/MemberEditor.svelte";
    import Events from "./pages/Events.svelte";
    import EventEditor from "./pages/EventEditor.svelte";
    import Reports from "./pages/Reports.svelte";
    import Library from "./pages/Library.svelte";
    import LibraryEditor from "./pages/LibraryEditor.svelte";

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
</script>
<Router {routes}/>