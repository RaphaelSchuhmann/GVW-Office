<script>
    import "./app.css";
    import Router from "svelte-spa-router";
    import Login from "./pages/Login.svelte";

    const routes = {
        "/": Login,
    };
</script>
<Router {routes}/>