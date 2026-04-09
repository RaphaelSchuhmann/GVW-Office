<script>
    import Logo from "../../assets/logo.svg";
    import Button from "../../components/Button.svelte";
    import { push } from "svelte-spa-router";
</script>

<main class="bg-gv-bg-bar w-dvw h-dvh flex items-center justify-center">
    <div class="p-10 h-full w-full bg-white flex flex-col items-center justify-center">
        <img
            src={Logo}
            alt="Logo"
            class="min-[530px]:w-1/5 max-[530px]:w-2/5 rounded-full border-2 border-gv-border"
        />
        <p class="font-semibold text-dt-1 mt-5 text-center">404</p>
        <p class="text-gv-dark-text text-dt-3 text-center">
            Seite nicht gefunden
        </p>

        <Button
            type="primary"
            marginTop="5"
            onclick={async () => await push("/dashboard")}
            isSubmit={true}
        >
            <span class="material-symbols-rounded text-icon-dt-5">arrow_back</span>
            <p class="ml-3 text-dt-3">Zurück zum Dashboard</p>
        </Button>
    </div>
</main>