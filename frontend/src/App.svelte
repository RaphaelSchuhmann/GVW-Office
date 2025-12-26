<script>
    import "./app.css";
    import Router from "svelte-spa-router";
    import Login from "./pages/Login.svelte";
    import Dashboard from "./pages/Dashboard.svelte";
    import ChangePassword from "./pages/ChangePassword.svelte";
    import Members from "./pages/Members.svelte";
    import MemberViewer from "./pages/MemberViewer.svelte";
    import MemberEditor from "./pages/MemberEditor.svelte";

    const routes = {
        "/": Login,
        "/dashboard": Dashboard,
        "/changePassword": ChangePassword,
        "/members": Members,
        "/members/view": MemberViewer,
        "/members/edit": MemberEditor,
    };
</script>
<Router {routes}/>