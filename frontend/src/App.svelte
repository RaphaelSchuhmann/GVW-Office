<script>
    import "./app.css";
    import Router from "svelte-spa-router";
    import Login from "./pages/Login.svelte";
    import Dashboard from "./pages/Dashboard.svelte";
    import ChangePassword from "./pages/ChangePassword.svelte";

    const routes = {
        "/": Login,
        "/dashboard": Dashboard,
        "/changePassword": ChangePassword,
    };
</script>
<Router {routes}/>